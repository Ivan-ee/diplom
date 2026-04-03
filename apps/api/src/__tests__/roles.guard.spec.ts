import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../common/guards/roles.guard';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { SafeUser } from '../common/types/user.type';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(role: string): SafeUser {
  return {
    id: 'user-uuid-1',
    name: 'Test User',
    email: 'test@example.com',
    phone: null,
    role,
    createdAt: new Date(),
  };
}

function makeContext(user: SafeUser | undefined): ExecutionContext {
  const mockHandler = vi.fn();
  const mockClass = vi.fn();

  return {
    getHandler: () => mockHandler,
    getClass: () => mockClass,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no @Roles() decorator is set', () => {
    // Reflector returns undefined — no metadata on handler or class
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = makeContext(undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when @Roles() decorator is set to an empty array', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

    const context = makeContext(undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when user has the required role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = makeContext(makeUser('admin'));
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when one of multiple required roles matches', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'user']);

    const context = makeContext(makeUser('user'));
    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException when user role does not match required role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = makeContext(makeUser('user'));
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('ForbiddenException message lists the required roles on mismatch', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = makeContext(makeUser('user'));
    expect(() => guard.canActivate(context)).toThrowError(
      'Access denied. Required role(s): admin',
    );
  });

  it('throws ForbiddenException when there is no user on the request', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = makeContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('ForbiddenException message is "Authentication required" when user is missing', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = makeContext(undefined);
    expect(() => guard.canActivate(context)).toThrowError(
      'Authentication required',
    );
  });

  it('passes the correct metadata key and handler/class tuple to Reflector', () => {
    const spy = vi
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(undefined);

    const context = makeContext(makeUser('user'));
    guard.canActivate(context);

    expect(spy).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});
