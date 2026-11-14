import { Hono } from 'hono';
import { ZodError } from 'zod';
import health from './features/health/health.routes';
import { ErrorMessages } from './common/messages';

const app = new Hono();

app.route('/health', health);

app.notFound((c) => {
  return c.json({ error: { message: ErrorMessages.NOT_FOUND, status: 404 } }, 404);
});

app.onError((err, c) => {
  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          message: ErrorMessages.VALIDATION_FAILED,
          status: 400,
          details: err.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
      },
      400
    );
  }

  const status = 500;
  return c.json(
    { error: { message: ErrorMessages.INTERNAL_ERROR, status } },
    status
  );
});

export default app;
