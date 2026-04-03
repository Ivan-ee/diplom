import {
  ConflictException,
  Inject,
  Injectable,
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

export interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  token: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    // Check email uniqueness
    const existing = await this.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, dto.email))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const [user] = await this.db
      .insert(schema.users)
      .values({
        name: dto.name,
        email: dto.email,
        phone: dto.phone ?? null,
        passwordHash,
        role: 'user',
      })
      .returning();

    const token = this.signToken(user);
    return { user: this.sanitize(user), token };
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
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.signToken(user);
    return { user: this.sanitize(user), token };
  }

  async getProfile(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.sanitize(user);
  }

  async getUserById(id: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    return user ?? null;
  }

  private signToken(user: any): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  private sanitize(user: any): Omit<User, 'passwordHash'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _ph, ...safe } = user;
    return safe;
  }
}
