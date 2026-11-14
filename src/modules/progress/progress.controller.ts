import { createRoute } from '@hono/zod-openapi';
import { ParentGuard } from '@/common/guards/parent.guard';
import { createRouter } from '@/common/http/create-router';
import { errorResponses, jsonBody, jsonResponse, PARENT_SECURITY } from '@/common/http/schemas';
import { ChildParamSchema } from '@/modules/profiles/dto/profile.dto';
import { ListProgressQuery, ProgressPageSchema, SyncProgressDto, SyncProgressResultSchema } from './dto/progress.dto';
import { ProgressService } from './progress.service';

const tags = ['Progress sync'];
const security = PARENT_SECURITY;

const uploadProgress = createRoute({
  method: 'post',
  path: '/{childId}',
  tags,
  security,
  summary: 'Upload progress events recorded on the device (safe to retry)',
  request: { params: ChildParamSchema, body: jsonBody(SyncProgressDto) },
  responses: {
    200: jsonResponse(SyncProgressResultSchema, 'Events stored'),
    400: errorResponses[400],
    404: errorResponses[404],
  },
});

const listProgress = createRoute({
  method: 'get',
  path: '/{childId}',
  tags,
  security,
  summary: 'Download progress events after a cursor (for a second device)',
  request: { params: ChildParamSchema, query: ListProgressQuery },
  responses: { 200: jsonResponse(ProgressPageSchema, 'A page of events'), 404: errorResponses[404] },
});

export const progressController = createRouter();
progressController.use('*', ParentGuard);

progressController
  .openapi(uploadProgress, async (c) => {
    const { childId } = c.req.valid('param');
    const result = await c.var.container.get(ProgressService).upload(c.var.parent.id, childId, c.req.valid('json'));
    return c.json(result, 200);
  })
  .openapi(listProgress, async (c) => {
    const { childId } = c.req.valid('param');
    const { since, limit } = c.req.valid('query');
    const result = await c.var.container.get(ProgressService).list(c.var.parent.id, childId, since, limit);
    return c.json(result, 200);
  });
