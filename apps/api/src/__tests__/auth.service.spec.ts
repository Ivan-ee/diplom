import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from '../auth/auth.service';
import { DRIZZLE } from '../database/drizzle.token';
import { RegisterDto } from '../auth/dto/register.dto';
import { LoginDto } from '../auth/dto/login.dto';
import { SafeUser } from '../common/types/user.type';

// ---------------------------------------------------------------------------
// bcrypt mock — must be hoisted above imports in vitest
// ---------------------------------------------------------------------------
vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

import * as bcrypt from 'bcrypt';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXED_DATE = new Date('2024-01-01T00:00:00.000Z');

const DB_USER = {
  id: 'uuid-1',
  name: 'Anna',
  email: 'anna@example.com',
  phone: '+79991234567',
  passwordHash: 'hashed_pw',
  role: 'user' as const,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

const SAFE_USER: SafeUser = {
  id: DB_USER.id,
  name: DB_USER.name,
  email: DB_USER.email,
  phone: DB_USER.phone,
  role: DB_USER.role,
  createdAt: DB_USER.createdAt,
};

const REGISTER_DTO: RegisterDto = {
  name: 'Anna',
  email: 'anna@example.com',
  phone: '+79991234567',
  password: 'Password1',
};

const LOGIN_DTO: LoginDto = {
  email: 'anna@example.com',
  password: 'Password1',
};

// ---------------------------------------------------------------------------
// Drizzle chain builder
//
// The service uses two query patterns:
//
//   1. select({ id }).from().where().limit()          — existence check
//   2. select().from().where().limit()                — full row fetch
//   3. insert().values().returning()                  — insert
//
// We build a minimal fluent mock that resolves to `resolveWith` at the
// terminal call (.limit() or .returning()).
// ---------------------------------------------------------------------------

function makeDb(options: {
  selectResult?: unknown[];
  insertResult?: unknown[];
  insertError?: unknown;
}) {
  const { selectResult = [], insertResult = [], insertError } = options;

  const selectChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(selectResult),
  };

  const insertChain = {
    values: vi.fn().mockReturnThis(),
    returning: insertError
      ? vi.fn().mockRejectedValue(insertError)
      : vi.fn().mockResolvedValue(insertResult),
  };

  return {
    select: vi.fn().mockReturnValue(selectChain),
    insert: vi.fn().mockReturnValue(insertChain),
    _selectChain: selectChain,
    _insertChain: insertChain,
  };
}

// ---------------------------------------------------------------------------
// Factory — builds AuthService with the provided db mock
// ---------------------------------------------------------------------------

async function buildService(db: ReturnType<typeof makeDb>) {
  const module = await Test.createTestingModule({
    providers: [
      AuthService,
      {
        provide: DRIZZLE,
        useValue: db,
      },
      {
        provide: JwtService,
        useValue: { sign: vi.fn().mockReturnValue('mock.jwt.token') },
      },
    ],
  }).compile();

  return module.get<AuthService>(AuthService);
}

// ---------------------------------------------------------------------------
// register()
// ---------------------------------------------------------------------------

describe('AuthService.register()', () => {
  beforeEach(() => {
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed_pw' as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
  });

  it('creates user and returns AuthResult with SafeUser (no passwordHash)', async () => {
    const db = makeDb({
      selectResult: [],            // email not taken
      insertResult: [DB_USER],
    });
    const service = await buildService(db);

    const result = await service.register(REGISTER_DTO);

    expect(result.user).toMatchObject(SAFE_USER);
    expect(result.token).toBe('mock.jwt.token');
    expect((result.user as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it('calls bcrypt.hash with the plain password', async () => {
    const db = makeDb({ selectResult: [], insertResult: [DB_USER] });
    const service = await buildService(db);

    await service.register(REGISTER_DTO);

    expect(bcrypt.hash).toHaveBeenCalledWith(REGISTER_DTO.password, 10);
  });

  it('throws ConflictException when email already exists (pre-check)', async () => {
    const db = makeDb({
      selectResult: [{ id: DB_USER.id }],  // pre-check finds a row
    });
    const service = await buildService(db);

    await expect(service.register(REGISTER_DTO)).rejects.toThrow(
      ConflictException,
    );
  });

  it('ConflictException message is "Email already registered" on pre-check', async () => {
    const db = makeDb({ selectResult: [{ id: DB_USER.id }] });
    const service = await buildService(db);

    await expect(service.register(REGISTER_DTO)).rejects.toThrowError(
      'Email already registered',
    );
  });

  it('throws ConflictException on DB unique constraint violation (code 23505)', async () => {
    const pgError = { code: '23505', message: 'unique_violation' };
    const db = makeDb({
      selectResult: [],          // pre-check passes
      insertError: pgError,      // insert throws unique violation
    });
    const service = await buildService(db);

    await expect(service.register(REGISTER_DTO)).rejects.toThrow(
      ConflictException,
    );
  });

  it('re-throws unknown DB errors that are not code 23505', async () => {
    const unknownError = new Error('connection reset');
    const db = makeDb({
      selectResult: [],
      insertError: unknownError,
    });
    const service = await buildService(db);

    await expect(service.register(REGISTER_DTO)).rejects.toThrow(
      'connection reset',
    );
  });
});

// ---------------------------------------------------------------------------
// login()
// ---------------------------------------------------------------------------

describe('AuthService.login()', () => {
  beforeEach(() => {
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
  });

  it('returns AuthResult with SafeUser on correct credentials', async () => {
    const db = makeDb({ selectResult: [DB_USER] });
    const service = await buildService(db);

    const result = await service.login(LOGIN_DTO);

    expect(result.user).toMatchObject(SAFE_USER);
    expect(result.token).toBe('mock.jwt.token');
  });

  it('throws UnauthorizedException when email does not exist', async () => {
    const db = makeDb({ selectResult: [] });  // no user found
    const service = await buildService(db);

    await expect(service.login(LOGIN_DTO)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException on wrong password', async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const db = makeDb({ selectResult: [DB_USER] });
    const service = await buildService(db);

    await expect(service.login(LOGIN_DTO)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('UnauthorizedException message is "Invalid email or password"', async () => {
    const db = makeDb({ selectResult: [] });
    const service = await buildService(db);

    await expect(service.login(LOGIN_DTO)).rejects.toThrowError(
      'Invalid email or password',
    );
  });

  it('calls bcrypt.compare with plain password and stored hash', async () => {
    const db = makeDb({ selectResult: [DB_USER] });
    const service = await buildService(db);

    await service.login(LOGIN_DTO);

    expect(bcrypt.compare).toHaveBeenCalledWith(
      LOGIN_DTO.password,
      DB_USER.passwordHash,
    );
  });
});

// ---------------------------------------------------------------------------
// toSafeUser() — tested indirectly through register/login, plus explicit check
// ---------------------------------------------------------------------------

describe('AuthService — safe user projection', () => {
  beforeEach(() => {
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed_pw' as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
  });

  it('strips passwordHash and updatedAt from the returned user', async () => {
    const db = makeDb({ selectResult: [DB_USER] });
    const service = await buildService(db);

    const { user } = await service.login(LOGIN_DTO);
    const keys = Object.keys(user);

    expect(keys).not.toContain('passwordHash');
    expect(keys).not.toContain('updatedAt');
  });

  it('returned user contains all SafeUser fields', async () => {
    const db = makeDb({ selectResult: [DB_USER] });
    const service = await buildService(db);

    const { user } = await service.login(LOGIN_DTO);

    expect(user).toEqual<SafeUser>({
      id: DB_USER.id,
      name: DB_USER.name,
      email: DB_USER.email,
      phone: DB_USER.phone,
      role: DB_USER.role,
      createdAt: DB_USER.createdAt,
    });
  });

  it('phone is null when not provided', async () => {
    const userWithoutPhone = { ...DB_USER, phone: null };
    const db = makeDb({ selectResult: [userWithoutPhone] });
    const service = await buildService(db);

    const { user } = await service.login(LOGIN_DTO);

    expect(user.phone).toBeNull();
  });
});
