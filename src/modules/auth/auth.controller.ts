import { createRouter } from '@/common/http/create-router';
import { AuthService } from './auth.service';

/**
 * Hands every /v1/auth/* request to Better Auth. Main endpoints:
 *   POST /v1/auth/sign-up/email   { name, email, password }
 *   POST /v1/auth/sign-in/email   { email, password }  -> returns a token in the `set-auth-token` header
 *   POST /v1/auth/sign-out
 *   GET  /v1/auth/get-session
 */
export const authController = createRouter();

authController.on(['GET', 'POST'], '/*', (c) => c.var.container.get(AuthService).auth.handler(c.req.raw));
