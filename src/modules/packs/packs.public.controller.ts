import { createRoute } from '@hono/zod-openapi';
import { createRouter } from '@/common/http/create-router';
import { errorResponses, jsonResponse } from '@/common/http/schemas';
import { LatestPackSchema } from './dto/pack.dto';
import { PacksService } from './packs.service';

const latestPack = createRoute({
  method: 'get',
  path: '/latest',
  tags: ['Content packs'],
  summary: 'The newest published pack. The app compares its version with what it has downloaded.',
  responses: { 200: jsonResponse(LatestPackSchema, 'Latest pack'), 404: errorResponses[404] },
});

/** Public: the app checks for new content before signing in, so this needs no auth. */
export const packsPublicController = createRouter().openapi(latestPack, async (c) => {
  const service = c.var.container.get(PacksService);
  const pack = service.toDto(await service.latestPublished());
  c.header('cache-control', 'public, max-age=60');
  return c.json(
    {
      version: pack.version,
      manifestUrl: pack.manifestUrl!,
      itemCount: pack.itemCount ?? 0,
      totalBytes: pack.totalBytes ?? 0,
      publishedAt: pack.publishedAt!,
    },
    200,
  );
});
