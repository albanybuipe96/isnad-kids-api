import { z } from '@hono/zod-openapi';
import { PROGRESS_KINDS } from '@/common/constants/domain';

export const ProgressEventInput = z
  .object({
    id: z.uuid().openapi({ description: 'Generated on the device; makes retries safe' }),
    skill: z.string().min(1).max(100).openapi({ example: 'surah:al-ikhlas' }),
    contentId: z.string().max(64).nullable().optional(),
    kind: z.enum(PROGRESS_KINDS),
    value: z.record(z.string(), z.unknown()).nullable().optional(),
    occurredAt: z.iso.datetime(),
  })
  .openapi('ProgressEventInput');

export const SyncProgressDto = z
  .object({ events: z.array(ProgressEventInput).min(1).max(500) })
  .openapi('SyncProgress');
export type SyncProgressDto = z.infer<typeof SyncProgressDto>;

export const SyncProgressResultSchema = z
  .object({
    accepted: z.number().int(),
    duplicates: z.number().int(),
  })
  .openapi('SyncProgressResult');

export const ProgressEventSchema = z
  .object({
    seq: z.number().int(),
    id: z.string(),
    skill: z.string(),
    contentId: z.string().nullable(),
    kind: z.enum(PROGRESS_KINDS),
    value: z.record(z.string(), z.unknown()).nullable(),
    occurredAt: z.string(),
  })
  .openapi('ProgressEvent');

export const ListProgressQuery = z.object({
  since: z.coerce.number().int().min(0).default(0).openapi({ description: 'Return events with seq greater than this' }),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
});

export const ProgressPageSchema = z
  .object({
    events: z.array(ProgressEventSchema),
    cursor: z.number().int().openapi({ description: 'Pass as `since` on the next call' }),
    hasMore: z.boolean(),
  })
  .openapi('ProgressPage');
