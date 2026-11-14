import { createRoute, z } from '@hono/zod-openapi';
import { ParentGuard } from '@/common/guards/parent.guard';
import { createRouter } from '@/common/http/create-router';
import { errorResponses, jsonBody, jsonResponse, OkSchema, PARENT_SECURITY } from '@/common/http/schemas';
import { ChildParamSchema, ChildSchema, CreateChildDto, UpdateChildDto } from './dto/profile.dto';
import { ProfilesService } from './profiles.service';

const tags = ['Child profiles'];
const security = PARENT_SECURITY;

const listChildren = createRoute({
  method: 'get',
  path: '/',
  tags,
  security,
  summary: "List the signed-in parent's children",
  responses: { 200: jsonResponse(z.array(ChildSchema), 'Child profiles'), 401: errorResponses[401] },
});

const createChild = createRoute({
  method: 'post',
  path: '/',
  tags,
  security,
  summary: 'Add a child profile',
  request: { body: jsonBody(CreateChildDto) },
  responses: {
    201: jsonResponse(ChildSchema, 'Created'),
    400: errorResponses[400],
    401: errorResponses[401],
  },
});

const getChild = createRoute({
  method: 'get',
  path: '/{childId}',
  tags,
  security,
  summary: 'Get one child profile',
  request: { params: ChildParamSchema },
  responses: { 200: jsonResponse(ChildSchema, 'Child profile'), 404: errorResponses[404] },
});

const updateChild = createRoute({
  method: 'patch',
  path: '/{childId}',
  tags,
  security,
  summary: "Update a child's profile or settings",
  request: { params: ChildParamSchema, body: jsonBody(UpdateChildDto) },
  responses: { 200: jsonResponse(ChildSchema, 'Updated'), 400: errorResponses[400], 404: errorResponses[404] },
});

const deleteChild = createRoute({
  method: 'delete',
  path: '/{childId}',
  tags,
  security,
  summary: 'Delete a child profile and its progress',
  request: { params: ChildParamSchema },
  responses: { 200: jsonResponse(OkSchema, 'Deleted'), 404: errorResponses[404] },
});

export const profilesController = createRouter();
profilesController.use('*', ParentGuard);

profilesController
  .openapi(listChildren, async (c) => {
    const result = await c.var.container.get(ProfilesService).list(c.var.parent.id);
    return c.json(result, 200);
  })
  .openapi(createChild, async (c) => {
    const result = await c.var.container.get(ProfilesService).create(c.var.parent.id, c.req.valid('json'));
    return c.json(result, 201);
  })
  .openapi(getChild, async (c) => {
    const row = await c.var.container.get(ProfilesService).getOwned(c.var.parent.id, c.req.valid('param').childId);
    return c.json(ProfilesService.toDto(row), 200);
  })
  .openapi(updateChild, async (c) => {
    const { childId } = c.req.valid('param');
    const result = await c.var.container.get(ProfilesService).update(c.var.parent.id, childId, c.req.valid('json'));
    return c.json(result, 200);
  })
  .openapi(deleteChild, async (c) => {
    await c.var.container.get(ProfilesService).remove(c.var.parent.id, c.req.valid('param').childId);
    return c.json({ ok: true as const }, 200);
  });
