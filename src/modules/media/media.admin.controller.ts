import { createRoute, z } from '@hono/zod-openapi';
import { AdminGuard } from '@/common/guards/admin.guard';
import { Roles } from '@/common/guards/roles.guard';
import { createRouter } from '@/common/http/create-router';
import { ADMIN_SECURITY, errorResponses, IdParamSchema, jsonResponse, OkSchema } from '@/common/http/schemas';
import { ListMediaQuery, MediaAssetSchema, UploadMediaQuery } from './dto/media.dto';
import { MediaService } from './media.service';

const tags = ['Admin: media'];
const security = ADMIN_SECURITY;

const uploadMedia = createRoute({
  method: 'post',
  path: '/',
  tags,
  security,
  summary: 'Upload a file to R2. Send the raw file as the body with its Content-Type.',
  middleware: [Roles('editor')] as const,
  request: {
    query: UploadMediaQuery,
    body: {
      required: true,
      content: { 'application/octet-stream': { schema: z.string().openapi({ format: 'binary' }) } },
    },
  },
  responses: {
    201: jsonResponse(MediaAssetSchema, 'Uploaded'),
    400: errorResponses[400],
    403: errorResponses[403],
    413: jsonResponse(z.object({ message: z.string() }), 'File too large'),
  },
});

const listMedia = createRoute({
  method: 'get',
  path: '/',
  tags,
  security,
  summary: 'List uploaded files, newest first',
  request: { query: ListMediaQuery },
  responses: { 200: jsonResponse(z.array(MediaAssetSchema), 'Files') },
});

const getMedia = createRoute({
  method: 'get',
  path: '/{id}',
  tags,
  security,
  summary: 'Get one file record',
  request: { params: IdParamSchema },
  responses: { 200: jsonResponse(MediaAssetSchema, 'File'), 404: errorResponses[404] },
});

const deleteMedia = createRoute({
  method: 'delete',
  path: '/{id}',
  tags,
  security,
  summary: 'Delete a file that no content item uses',
  middleware: [Roles('admin')] as const,
  request: { params: IdParamSchema },
  responses: {
    200: jsonResponse(OkSchema, 'Deleted'),
    404: errorResponses[404],
    409: jsonResponse(z.object({ message: z.string() }), 'Still in use'),
  },
});

export const mediaAdminController = createRouter();
mediaAdminController.use('*', AdminGuard);

mediaAdminController
  .openapi(uploadMedia, async (c) => {
    const { kind, filename } = c.req.valid('query');
    const length = c.req.header('content-length');
    const result = await c.var.container.get(MediaService).upload({
      kind,
      filename,
      contentType: c.req.header('content-type') ?? '',
      contentLength: length ? Number(length) : null,
      body: () => c.req.arrayBuffer(),
      uploadedBy: c.var.admin.email,
    });
    return c.json(result, 201);
  })
  .openapi(listMedia, async (c) => {
    const { kind, limit } = c.req.valid('query');
    return c.json(await c.var.container.get(MediaService).list(kind, limit), 200);
  })
  .openapi(getMedia, async (c) => {
    const service = c.var.container.get(MediaService);
    return c.json(service.toDto(await service.get(c.req.valid('param').id)), 200);
  })
  .openapi(deleteMedia, async (c) => {
    await c.var.container.get(MediaService).remove(c.req.valid('param').id);
    return c.json({ ok: true as const }, 200);
  });
