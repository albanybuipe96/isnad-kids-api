import { createMiddleware } from 'hono/factory';
import { UnauthorizedException } from '@/common/exceptions/http.exception';
import type { AppEnv } from '@/common/types';
import { AuthService } from '@/modules/auth/auth.service';

/**
 * Guard for parent-facing routes. Accepts a Better Auth session cookie or
 * `Authorization: Bearer <token>` (what the Flutter app sends).
 */
export const ParentGuard = createMiddleware<AppEnv>(async (c, next) => {
  const session = await c.var.container.get(AuthService).getSession(c.req.raw.headers);
  if (!session) throw new UnauthorizedException('Sign in as a parent');
  c.set('parent', { id: session.user.id, email: session.user.email, name: session.user.name });
  await next();
});
