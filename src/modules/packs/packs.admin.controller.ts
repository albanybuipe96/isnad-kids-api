import { createRoute, z } from '@hono/zod-openapi';
import { AdminGuard } from '@/common/guards/admin.guard';
import { Roles } from '@/common/guards/roles.guard';
import { createRouter } from '@/common/http/create-router';
import { ADMIN_SECURITY, errorResponses, jsonBody, jsonResponse } from '@/common/http/schemas';
import { CreatePackDto, PackSchema, VersionParamSchema } from './dto/pack.dto';
import { PacksService } from './packs.service';

const tags = ['Admin: packs'];
const security = ADMIN_SECURITY;

const createPack = createRoute({
  method: 'post',
  path: '/',
  tags,
  security,
  summary: 'Publish a new content pack from every approved item (built in the background)',
  middleware: [Roles('admin')] as const,
  request: { body: jsonBody(CreatePackDto) },
  responses: {
    202: jsonResponse(PackSchema, 'Queued for building'),
    403: errorResponses[403],
    409: jsonResponse(z.object({ message: z.string() }), 'A pack is already building'),
  },
});

const listPacks = createRoute({
  method: 'get',
  path: '/',
  tags,
  security,
  summary: 'Recent packs, newest first',
  responses: { 200: jsonResponse(z.array(PackSchema), 'Packs') },
});

const getPack = createRoute({
  method: 'get',
  path: '/{version}',
  tags,
  security,
  summary: 'Get one pack and its build status',
  request: { params: VersionParamSchema },
  responses: { 200: jsonResponse(PackSchema, 'Pack'), 404: errorResponses[404] },
});

export const packsAdminController = createRouter();
packsAdminController.use('*', AdminGuard);

packsAdminController
  .openapi(createPack, async (c) => {
    const result = await c.var.container.get(PacksService).requestBuild(c.req.valid('json'), c.var.admin.email);
    return c.json(result, 202);
  })
  .openapi(listPacks, async (c) => c.json(await c.var.container.get(PacksService).list(), 200))
  .openapi(getPack, async (c) => {
    const service = c.var.container.get(PacksService);
    return c.json(service.toDto(await service.getByVersion(c.req.valid('param').version)), 200);
  });
