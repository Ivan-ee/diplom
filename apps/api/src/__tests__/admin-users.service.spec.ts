import { describe, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from '../admin/admin.service';
import { DRIZZLE } from '../database/drizzle.token';
import { SearchService } from '../search/search.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = 'eeeeeeee-0000-0000-0000-000000000001';

function makeUserRow(overrides: Record<string, unknown> = {}) {
  return {
    id: USER_ID,
    name: 'Иван Петров',
    email: 'ivan@example.com',
    phone: '+79991234567',
    role: 'user',
    createdAt: new Date('2026-01-15T10:00:00.000Z'),
    updatedAt: new Date('2026-01-15T10:00:00.000Z'),
    ...overrides,
  };
}

function makePaginationQuery(overrides: Record<string, unknown> = {}) {
  return {
    page: 1,
    limit: 20,
    order: 'desc' as const,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// DB mock helpers
// ---------------------------------------------------------------------------

/** Creates a thenable Drizzle-like fluent chain that resolves to `result`. */
function terminal(result: unknown[]) {
  const chain: Record<string, unknown> = {};
  for (const method of [
    'from', 'where', 'limit', 'offset', 'orderBy',
    'leftJoin', 'innerJoin', 'groupBy',
  ]) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  chain['then'] = (
    resolve: (v: unknown) => unknown,
    reject: unknown,
  ) => Promise.resolve(result).then(resolve as never, reject as never);
  return chain;
}

/**
 * Build a db mock for getAllUsers.
 * 2 successive .select() calls: paginated user rows + count.
 */
function buildGetAllUsersDb(options: {
  rows?: unknown[];
  count?: number;
} = {}) {
  const {
    rows = [makeUserRow()],
    count = 1,
  } = options;

  const selectMock = vi.fn()
    .mockReturnValueOnce(terminal(rows))
    .mockReturnValueOnce(terminal([{ count }]));

  return { select: selectMock };
}

/**
 * Build a db mock for getUserById.
 * 1 select() call for user row + 1 select() for orders count.
 */
function buildGetUserByIdDb(options: {
  userRow?: unknown | null;
  ordersCount?: number;
} = {}) {
  const {
    userRow = makeUserRow(),
    ordersCount = 3,
  } = options;

  const userRows = userRow ? [userRow] : [];

  const selectMock = vi.fn()
    .mockReturnValueOnce(terminal(userRows))
    .mockReturnValueOnce(terminal([{ count: ordersCount }]));

  return { select: selectMock };
}

/**
 * Build a db mock for updateUser.
 * 1 select() (existence check) + update chain.
 */
function buildUpdateUserDb(options: {
  existingUser?: unknown | null;
  updatedUser?: unknown;
} = {}) {
  const {
    existingUser = makeUserRow(),
    updatedUser = makeUserRow({ role: 'admin' }),
  } = options;

  const existingRows = existingUser ? [existingUser] : [];

  const updateChain: Record<string, unknown> = {};
  updateChain['set'] = vi.fn().mockReturnValue(updateChain);
  updateChain['where'] = vi.fn().mockReturnValue(updateChain);
  updateChain['returning'] = vi.fn().mockResolvedValue([updatedUser]);

  const selectMock = vi.fn()
    .mockReturnValueOnce(terminal(existingRows));

  return {
    select: selectMock,
    update: vi.fn().mockReturnValue(updateChain),
  };
}

// ---------------------------------------------------------------------------
// Service factory
// ---------------------------------------------------------------------------

async function buildService(db: unknown): Promise<AdminService> {
  const module = await Test.createTestingModule({
    providers: [
      AdminService,
      { provide: DRIZZLE, useValue: db },
      { provide: SearchService, useValue: { indexProduct: vi.fn(), removeProduct: vi.fn() } },
    ],
  }).compile();
  return module.get<AdminService>(AdminService);
}

// ---------------------------------------------------------------------------
// AdminService.getAllUsers
// ---------------------------------------------------------------------------

describe('AdminService.getAllUsers', () => {
  it('returns object with data and meta fields', async () => {
    const db = buildGetAllUsersDb();
    const service = await buildService(db);

    const result = await service.getAllUsers(makePaginationQuery() as never);

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('meta');
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('data items do not contain passwordHash', async () => {
    const rowWithHash = { ...makeUserRow(), passwordHash: 'secret_hash' };
    const db = buildGetAllUsersDb({ rows: [rowWithHash] });
    const service = await buildService(db);

    const result = await service.getAllUsers(makePaginationQuery() as never);

    expect(result.data[0]).not.toHaveProperty('passwordHash');
  });

  it('filters by role when provided', async () => {
    const adminUser = makeUserRow({ role: 'admin' });
    const db = buildGetAllUsersDb({ rows: [adminUser], count: 1 });
    const service = await buildService(db);

    const result = await service.getAllUsers(
      { ...makePaginationQuery(), role: 'admin' } as never,
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({ role: 'admin' });
  });

  it('meta contains correct page, limit, total', async () => {
    const db = buildGetAllUsersDb({ count: 55 });
    const service = await buildService(db);

    const result = await service.getAllUsers(
      { ...makePaginationQuery(), page: 3, limit: 10 } as never,
    );

    expect(result.meta.page).toBe(3);
    expect(result.meta.limit).toBe(10);
    expect(result.meta.total).toBe(55);
  });

  it('returns empty data when no users match', async () => {
    const db = buildGetAllUsersDb({ rows: [], count: 0 });
    const service = await buildService(db);

    const result = await service.getAllUsers(makePaginationQuery() as never);

    expect(result.data).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('executes exactly 2 select calls in parallel via Promise.all', async () => {
    const db = buildGetAllUsersDb();
    const service = await buildService(db);

    await service.getAllUsers(makePaginationQuery() as never);

    expect((db.select as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// AdminService.getUserById
// ---------------------------------------------------------------------------

describe('AdminService.getUserById', () => {
  it('returns user without passwordHash', async () => {
    const db = buildGetUserByIdDb();
    const service = await buildService(db);

    const result = await service.getUserById(USER_ID);

    expect(result).toHaveProperty('id', USER_ID);
    expect(result).toHaveProperty('name', 'Иван Петров');
    expect(result).toHaveProperty('email', 'ivan@example.com');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('includes ordersCount in response', async () => {
    const db = buildGetUserByIdDb({ ordersCount: 5 });
    const service = await buildService(db);

    const result = await service.getUserById(USER_ID);

    expect(result).toHaveProperty('ordersCount', 5);
  });

  it('throws NotFoundException for non-existent id', async () => {
    const db = buildGetUserByIdDb({ userRow: null });
    const service = await buildService(db);

    await expect(service.getUserById('non-existent-id')).rejects.toThrow(NotFoundException);
  });
});

// ---------------------------------------------------------------------------
// AdminService.updateUser
// ---------------------------------------------------------------------------

describe('AdminService.updateUser', () => {
  it('updates role and returns updated user', async () => {
    const updatedUser = makeUserRow({ role: 'admin' });
    const db = buildUpdateUserDb({ updatedUser });
    const service = await buildService(db);

    const result = await service.updateUser(USER_ID, { role: 'admin' });

    expect(result).toMatchObject({ id: USER_ID, role: 'admin' });
  });

  it('throws NotFoundException for non-existent id', async () => {
    const db = buildUpdateUserDb({ existingUser: null });
    const service = await buildService(db);

    await expect(service.updateUser('non-existent-id', { role: 'admin' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('calls update with updatedAt timestamp', async () => {
    const db = buildUpdateUserDb();
    const service = await buildService(db);

    await service.updateUser(USER_ID, { name: 'Новое Имя' });

    const updateFn = db.update as ReturnType<typeof vi.fn>;
    expect(updateFn).toHaveBeenCalledOnce();
    const setCall = updateFn.mock.results[0].value.set as ReturnType<typeof vi.fn>;
    const setArg = setCall.mock.calls[0][0] as Record<string, unknown>;
    expect(setArg).toHaveProperty('updatedAt');
    expect(setArg.updatedAt).toBeInstanceOf(Date);
  });
});
