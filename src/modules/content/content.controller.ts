import { createRoute, z } from '@hono/zod-openapi';
import { AdminGuard } from '@/common/guards/admin.guard';
import { Roles } from '@/common/guards/roles.guard';
import { createRouter } from '@/common/http/create-router';
import { ADMIN_SECURITY, errorResponses, IdParamSchema, jsonBody, jsonResponse, OkSchema } from '@/common/http/schemas';
import { ContentService } from './content.service';
import { ContentItemSchema, CreateContentDto, ListContentQuery, UpdateContentDto } from './dto/content.dto';

const tags = ['Admin: content'];
const security = ADMIN_SECURITY;
const conflict = jsonResponse(z.object({ message: z.string() }), 'Not allowed in the current state');

const listContent = createRoute({
  method: 'get',
  path: '/',
  tags,
  security,
  summary: 'List content items, most recently changed first',
  request: { query: ListContentQuery },
  responses: { 200: jsonResponse(z.array(ContentItemSchema), 'Content items') },
});

const createContent = createRoute({
  method: 'post',
  path: '/',
  tags,
  security,
  summary: 'Create a draft content item',
  middleware: [Roles('editor')] as const,
  request: { body: jsonBody(CreateContentDto) },
  responses: { 201: jsonResponse(ContentItemSchema, 'Created'), 400: errorResponses[400], 409: conflict },
});

const getContent = createRoute({
  method: 'get',
  path: '/{id}',
  tags,
  security,
  summary: 'Get one content item',
  request: { params: IdParamSchema },
  responses: { 200: jsonResponse(ContentItemSchema, 'Content item'), 404: errorResponses[404] },
});

const updateContent = createRoute({
  method: 'patch',
  path: '/{id}',
  tags,
  security,
  summary: 'Edit a content item (approved items go back to draft)',
  middleware: [Roles('editor')] as const,
  request: { params: IdParamSchema, body: jsonBody(UpdateContentDto) },
  responses: { 200: jsonResponse(ContentItemSchema, 'Updated'), 400: errorResponses[400], 409: conflict },
});

const submitContent = createRoute({
  method: 'post',
  path: '/{id}/submit',
  tags,
  security,
  summary: 'Check the item and send it to the review queue',
  middleware: [Roles('editor')] as const,
  request: { params: IdParamSchema },
  responses: { 200: jsonResponse(ContentItemSchema, 'Waiting for review'), 400: errorResponses[400], 409: conflict },
});

const withdrawContent = createRoute({
  method: 'post',
  path: '/{id}/withdraw',
  tags,
  security,
  summary: 'Take an item out of the review queue so it can be edited',
  middleware: [Roles('editor')] as const,
  request: { params: IdParamSchema },
  responses: { 200: jsonResponse(ContentItemSchema, 'Back to draft'), 409: conflict },
});

const deleteContent = createRoute({
  method: 'delete',
  path: '/{id}',
  tags,
  security,
  summary: 'Delete a draft that was never published',
  middleware: [Roles('editor')] as const,
  request: { params: IdParamSchema },
  responses: { 200: jsonResponse(OkSchema, 'Deleted'), 404: errorResponses[404], 409: conflict },
});

export const contentController = createRouter();
contentController.use('*', AdminGuard);

contentController
  .openapi(listContent, async (c) => c.json(await c.var.container.get(ContentService).list(c.req.valid('query')), 200))
  .openapi(createContent, async (c) => {
    const result = await c.var.container.get(ContentService).create(c.req.valid('json'), c.var.admin.email);
    return c.json(result, 201);
  })
  .openapi(getContent, async (c) => {
    const row = await c.var.container.get(ContentService).get(c.req.valid('param').id);
    return c.json(ContentService.toDto(row), 200);
  })
  .openapi(updateContent, async (c) => {
    const { id } = c.req.valid('param');
    const result = await c.var.container.get(ContentService).update(id, c.req.valid('json'), c.var.admin.email);
    return c.json(result, 200);
  })
  .openapi(submitContent, async (c) => {
    const result = await c.var.container.get(ContentService).submitForReview(c.req.valid('param').id, c.var.admin.email);
    return c.json(result, 200);
  })
  .openapi(withdrawContent, async (c) => {
    const result = await c.var.container.get(ContentService).withdraw(c.req.valid('param').id, c.var.admin.email);
    return c.json(result, 200);
  })
  .openapi(deleteContent, async (c) => {
    await c.var.container.get(ContentService).remove(c.req.valid('param').id);
    return c.json({ ok: true as const }, 200);
  });
