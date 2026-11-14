import { z } from '@hono/zod-openapi';
import { PACK_STATUSES } from '@/common/constants/domain';

export const CreatePackDto = z
  .object({ notes: z.string().trim().max(500).optional().openapi({ example: 'Adds Al-Asr and An-Nas' }) })
  .openapi('CreatePack');
export type CreatePackDto = z.infer<typeof CreatePackDto>;

export const PackSchema = z
  .object({
    id: z.string(),
    version: z.number().int(),
    status: z.enum(PACK_STATUSES),
    manifestUrl: z.string().nullable(),
    itemCount: z.number().int().nullable(),
    totalBytes: z.number().int().nullable(),
    notes: z.string().nullable(),
    error: z.string().nullable(),
    createdBy: z.string(),
    createdAt: z.string(),
    publishedAt: z.string().nullable(),
  })
  .openapi('Pack');
export type PackDto = z.infer<typeof PackSchema>;

export const LatestPackSchema = z
  .object({
    version: z.number().int(),
    manifestUrl: z.string(),
    itemCount: z.number().int(),
    totalBytes: z.number().int(),
    publishedAt: z.string(),
  })
  .openapi('LatestPack');

export const VersionParamSchema = z.object({
  version: z.coerce.number().int().min(1).openapi({ param: { name: 'version', in: 'path' } }),
});
