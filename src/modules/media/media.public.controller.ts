import { createRouter } from '@/common/http/create-router';

const PUBLIC_PREFIXES = ['media/', 'packs/'];

/**
 * Serves files from R2 at /v1/media/<key>.
 * In production, point MEDIA_PUBLIC_BASE_URL at a custom domain on the R2 bucket instead:
 * it is cached at Cloudflare's edge (including Accra) and supports resumable range requests.
 * This route keeps local development and small deployments working without that setup.
 */
export const mediaPublicController = createRouter();

mediaPublicController.get('/*', async (c) => {
  const key = decodeURIComponent(c.req.path.replace(/^\/v1\/media\//, ''));
  if (!PUBLIC_PREFIXES.some((prefix) => key.startsWith(prefix)) || key.includes('..')) {
    return c.json({ statusCode: 404, error: 'Not Found', message: 'File not found' }, 404);
  }

  const object = await c.env.MEDIA.get(key, { onlyIf: c.req.raw.headers });
  if (!object) return c.json({ statusCode: 404, error: 'Not Found', message: 'File not found' }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  if (!('body' in object)) return new Response(null, { status: 304, headers });

  // Manifests change on every publish; media files never change once uploaded.
  if (key.endsWith('latest.json')) headers.set('cache-control', 'public, max-age=60');
  return new Response(object.body, { headers });
});
