import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer } from 'better-auth/plugins/bearer';
import type { Container } from '@/common/di/container';
import { hashPassword, verifyPassword } from '@/common/security/password';
import type { Env } from '@/config/env';
import { DatabaseService, type Database } from '@/database/database.service';
import { account, session, user, verification } from '@/database/schema';

export const AUTH_BASE_PATH = '/v1/auth';

export function createAuth(env: Env, db: Database) {
  return betterAuth({
    appName: 'Isnād Kids',
    baseURL: env.BETTER_AUTH_URL,
    basePath: AUTH_BASE_PATH,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: { user, session, account, verification },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      password: { hash: hashPassword, verify: verifyPassword },
    },
    // Lets the Flutter app send `Authorization: Bearer <token>` instead of cookies.
    plugins: [bearer()],
    trustedOrigins: [env.ADMIN_ORIGIN],
  });
}

export type Auth = ReturnType<typeof createAuth>;

/** Parent accounts via Better Auth (sign up, sign in, sessions). */
export class AuthService {
  readonly auth: Auth;

  constructor(container: Container) {
    this.auth = createAuth(container.env, container.get(DatabaseService).db);
  }

  getSession(headers: Headers) {
    return this.auth.api.getSession({ headers });
  }
}
