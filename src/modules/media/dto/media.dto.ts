import { z } from '@hono/zod-openapi';
import { MEDIA_KINDS, type MediaKind } from '@/common/constants/domain';

/** What each kind of file may be, and how big. Video should normally go to Cloudflare Stream. */
export const MEDIA_RULES: Record<MediaKind, { contentTypes: string[]; maxBytes: number }> = {
  audio: {
    contentTypes: ['audio/ogg', 'audio/opus', 'audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav'],
    maxBytes: 20 * 1024 * 1024,
  },
  image: {
    contentTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    maxBytes: 5 * 1024 * 1024,
  },
  animation: {
    // .riv (Rive) uploads as octet-stream, Lottie as JSON or .lottie (zip)
    contentTypes: ['application/octet-stream', 'application/json', 'application/zip'],
    maxBytes: 5 * 1024 * 1024,
  },
  video: {
    contentTypes: ['video/mp4', 'video/webm'],
    maxBytes: 50 * 1024 * 1024,
  },
};

export const UploadMediaQuery = z.object({
  kind: z.enum(MEDIA_KINDS),
  filename: z
    .string()
    .min(1)
    .max(200)
    .openapi({ example: 'al-ikhlas-ayah-1.opus', description: 'Original file name, used for its extension' }),
});

export const ListMediaQuery = z.object({
  kind: z.enum(MEDIA_KINDS).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const MediaAssetSchema = z
  .object({
    id: z.string(),
    kind: z.enum(MEDIA_KINDS),
    key: z.string(),
    url: z.string(),
    filename: z.string(),
    contentType: z.string(),
    bytes: z.number().int(),
    sha256: z.string(),
    uploadedBy: z.string(),
    createdAt: z.string(),
  })
  .openapi('MediaAsset');
export type MediaAssetDto = z.infer<typeof MediaAssetSchema>;
