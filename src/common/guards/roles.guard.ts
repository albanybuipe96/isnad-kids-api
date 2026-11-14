import { createMiddleware } from 'hono/factory';
import type { AdminRole } from '@/common/constants/domain';
import { ForbiddenException, UnauthorizedException } from '@/common/exceptions/http.exception';
import type { AppEnv } from '@/common/types';

/**
 * Restricts a route to the given admin roles (like NestJS's @Roles() with a RolesGuard).
 * The `admin` role can do everything. Use after AdminGuard.
 */
export const Roles = (...roles: AdminRole[]) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const admin = c.get('admin');
    if (!admin) throw new UnauthorizedException();
    if (admin.role !== 'admin' && !roles.includes(admin.role)) {
      throw new ForbiddenException(`Requires one of these roles: ${roles.join(', ')}`);
    }
    await next();
  });
