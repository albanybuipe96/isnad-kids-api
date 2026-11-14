import { z } from '@hono/zod-openapi';

export const ErrorSchema = z
  .object({
    statusCode: z.number().int(),
    error: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  })
  .openapi('Error');

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: ErrorSchema } },
});

/** Standard error responses to spread into a route's `responses`. */
export const errorResponses = {
  400: errorResponse('Validation failed'),
  401: errorResponse('Not signed in'),
  403: errorResponse('Not allowed'),
  404: errorResponse('Not found'),
} as const;

export const IdParamSchema = z.object({
  id: z.uuid().openapi({ param: { name: 'id', in: 'path' } }),
});

export const OkSchema = z.object({ ok: z.literal(true) }).openapi('Ok');

export const jsonBody = <T extends z.ZodType>(schema: T) => ({
  required: true,
  content: { 'application/json': { schema } },
});

export const jsonResponse = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { 'application/json': { schema } },
});

/** OpenAPI security requirement names, registered in app.module.ts. */
export const PARENT_SECURITY = [{ ParentBearer: [] }];
export const ADMIN_SECURITY = [{ CloudflareAccess: [] }];
