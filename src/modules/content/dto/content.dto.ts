import { z } from '@hono/zod-openapi';
import { ACTIVITY_TEMPLATES, AGE_BANDS, CONTENT_STATUSES, RIWAYAT, SECTIONS } from '@/common/constants/domain';

const Slug = z
  .string()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by hyphens')
  .openapi({ example: 'al-ikhlas-listen-along' });

export const CreateContentDto = z
  .object({
    slug: Slug,
    title: z.string().trim().min(1).max(120),
    section: z.enum(SECTIONS),
    template: z.enum(ACTIVITY_TEMPLATES),
    ageBands: z.array(z.enum(AGE_BANDS)).min(1),
    skills: z.array(z.string().min(1).max(100)).max(20).default([]),
    riwayah: z.enum(RIWAYAT).nullable().optional(),
    isIslamic: z.boolean(),
    source: z.string().trim().max(500).nullable().optional().openapi({ example: "Qur'an 112:1-4" }),
    data: z.record(z.string(), z.unknown()).default({}),
    mediaIds: z.array(z.uuid()).default([]),
  })
  .openapi('CreateContent');
export type CreateContentDto = z.infer<typeof CreateContentDto>;

export const UpdateContentDto = z
  .object({
    title: z.string().trim().min(1).max(120),
    section: z.enum(SECTIONS),
    template: z.enum(ACTIVITY_TEMPLATES),
    ageBands: z.array(z.enum(AGE_BANDS)).min(1),
    skills: z.array(z.string().min(1).max(100)).max(20),
    riwayah: z.enum(RIWAYAT).nullable(),
    isIslamic: z.boolean(),
    source: z.string().trim().max(500).nullable(),
    data: z.record(z.string(), z.unknown()),
    mediaIds: z.array(z.uuid()),
  })
  .partial()
  .openapi('UpdateContent');
export type UpdateContentDto = z.infer<typeof UpdateContentDto>;

export const ContentItemSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    section: z.enum(SECTIONS),
    template: z.enum(ACTIVITY_TEMPLATES),
    ageBands: z.array(z.enum(AGE_BANDS)),
    skills: z.array(z.string()),
    riwayah: z.enum(RIWAYAT).nullable(),
    isIslamic: z.boolean(),
    source: z.string().nullable(),
    data: z.record(z.string(), z.unknown()),
    mediaIds: z.array(z.string()),
    status: z.enum(CONTENT_STATUSES),
    revision: z.number().int(),
    lastPublishedPackVersion: z.number().int().nullable(),
    createdBy: z.string(),
    updatedBy: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi('ContentItem');
export type ContentItemDto = z.infer<typeof ContentItemSchema>;

export const ListContentQuery = z.object({
  status: z.enum(CONTENT_STATUSES).optional(),
  section: z.enum(SECTIONS).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
