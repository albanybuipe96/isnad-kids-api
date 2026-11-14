import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@/common/types';

/**
 * Creates a router ("controller") with request validation wired to the global error format.
 * Invalid input returns 400 with a list of issues, like NestJS's ValidationPipe.
 */
export function createRouter() {
  return new OpenAPIHono<AppEnv>({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          {
            statusCode: 400,
            error: 'Bad Request',
            message: 'Validation failed',
            details: result.error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
          400,
        );
      }
    },
  });
}

export type Router = ReturnType<typeof createRouter>;
