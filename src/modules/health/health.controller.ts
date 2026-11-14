import { createRoute, z } from '@hono/zod-openapi';
import { sql } from 'drizzle-orm';
import { createRouter } from '@/common/http/create-router';
import { jsonResponse } from '@/common/http/schemas';
import { DatabaseService } from '@/database/database.service';

const HealthSchema = z
  .object({ status: z.literal('ok'), database: z.enum(['ok', 'error']), time: z.string() })
  .openapi('Health');

const getHealth = createRoute({
  method: 'get',
  path: '/',
  tags: ['Health'],
  summary: 'Check that the API and database are up',
  responses: { 200: jsonResponse(HealthSchema, 'Service is up') },
});

export const healthController = createRouter().openapi(getHealth, async (c) => {
  let database: 'ok' | 'error' = 'ok';
  try {
    await c.var.container.get(DatabaseService).db.run(sql`select 1`);
  } catch {
    database = 'error';
  }
  return c.json({ status: 'ok' as const, database, time: new Date().toISOString() }, 200);
});
