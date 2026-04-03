import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as bcrypt from 'bcrypt';
import * as schema from '@bakery/db/schema';

import { DRIZZLE } from '../database/drizzle.token';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SafeUser } from '../common/types/user.type';

/** Authentication result with safe user data. Token is set via httpOnly cookie. */
export interface AuthResult {
  user: SafeUser;
  token: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, dto.email))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    let user: typeof schema.users.$inferSelect;
    try {
      const [inserted] = await this.db
        .insert(schema.users)
        .values({
          name: dto.name,
          email: dto.email,
          phone: dto.phone ?? null,
          passwordHash,
          role: 'user',
        })
        .returning();
      user = inserted;
    } catch (error: unknown) {
      const pgError = error as { code?: string };
      if (pgError?.code === '23505') {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }

    const token = this.signToken(user);
    this.logger.log('User registered', { email: dto.email });
    return { user: this.toSafeUser(user), token };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, dto.email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      this.logger.warn('Login failed: invalid password', { email: dto.email });
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.signToken(user);
    this.logger.log('User logged in', { email: dto.email });
    return { user: this.toSafeUser(user), token };
  }

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.toSafeUser(user);
  }

  async getUserById(id: string): Promise<typeof schema.users.$inferSelect | null> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    return user ?? null;
  }

  private signToken(user: SafeUser): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  private toSafeUser(user: typeof schema.users.$inferSelect): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
