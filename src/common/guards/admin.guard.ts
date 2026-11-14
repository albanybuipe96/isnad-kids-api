import { eq } from 'drizzle-orm';
import { createMiddleware } from 'hono/factory';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { isDevelopment, type Env } from '@/config/env';
import { ForbiddenException, UnauthorizedException } from '@/common/exceptions/http.exception';
import type { AppEnv } from '@/common/types';
import { DatabaseService } from '@/database/database.service';
import { adminUsers } from '@/database/schema';

const jwksByTeam = new Map<string, JWTVerifyGetKey>();

/**
 * Verifies the Cloudflare Access token that Access adds to every request it lets through,
 * and returns the signed-in person's email.
 */
async function verifyAccessToken(env: Env, token: string): Promise<string> {
  const issuer = `https://${env.ACCESS_TEAM_DOMAIN}`;
  let jwks = jwksByTeam.get(issuer);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    jwksByTeam.set(issuer, jwks);
  }
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer, audience: env.ACCESS_AUD });
    if (typeof payload.email !== 'string') throw new Error('token has no email');
    return payload.email;
  } catch {
    throw new UnauthorizedException('Invalid Cloudflare Access token');
  }
}

/**
 * Guard for every /admin route (like a NestJS AuthGuard).
 * Production: requires a valid Cloudflare Access token, then an active row in admin_users.
 * Development only: the `x-dev-admin-email` header or DEV_ADMIN_EMAIL stands in for Access.
 */
export const AdminGuard = createMiddleware<AppEnv>(async (c, next) => {
  let email: string | undefined;

  if (isDevelopment(c.env)) {
    email = c.req.header('x-dev-admin-email') ?? c.env.DEV_ADMIN_EMAIL;
  }
  if (!email) {
    const token = c.req.header('cf-access-jwt-assertion');
    if (!token) throw new UnauthorizedException('Sign in through Cloudflare Access');
    email = await verifyAccessToken(c.env, token);
  }

  const { db } = c.var.container.get(DatabaseService);
  const user = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.email, email.toLowerCase()),
  });
  if (!user || !user.active) throw new ForbiddenException('This account is not an Isnād Kids admin user');

  c.set('admin', { email: user.email, name: user.name, role: user.role });
  await next();
});
