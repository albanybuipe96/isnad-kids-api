import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { HttpException } from '@/common/exceptions/http.exception';
import type { AppEnv } from '@/common/types';

/** Global exception filter: every error leaves the API in the same JSON shape. */
export const httpExceptionFilter: ErrorHandler<AppEnv> = (err, c) => {
  if (err instanceof HttpException) {
    return c.json(
      { statusCode: err.status, error: err.error, message: err.message, details: err.details },
      err.status,
    );
  }
  if (err instanceof HTTPException) {
    return c.json({ statusCode: err.status, error: 'Error', message: err.message }, err.status);
  }
  console.error('Unhandled error', err);
  return c.json({ statusCode: 500, error: 'Internal Server Error', message: 'Something went wrong' }, 500);
};
