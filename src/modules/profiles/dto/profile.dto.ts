import { z } from '@hono/zod-openapi';
import { AGE_BANDS, MUSIC_LEVELS, NARRATION_LANGUAGES, RIWAYAT } from '@/common/constants/domain';

const TimeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM (24-hour)');

export const ChildSettingsSchema = z
  .object({
    riwayah: z.enum(RIWAYAT),
    reciter: z.string().max(100).nullable(),
    music: z.enum(MUSIC_LEVELS),
    showFaces: z.boolean(),
    dailyLimitMinutes: z.number().int().min(5).max(240),
    quietHours: z.object({ start: TimeOfDay, end: TimeOfDay }).nullable(),
  })
  .openapi('ChildSettings');

export const CreateChildDto = z
  .object({
    name: z.string().trim().min(1).max(40),
    avatar: z.string().min(1).max(64).openapi({ example: 'boy-fugu-1' }),
    ageBand: z.enum(AGE_BANDS),
    narrationLanguage: z.enum(NARRATION_LANGUAGES).optional(),
    settings: ChildSettingsSchema.partial().optional(),
  })
  .openapi('CreateChild');
export type CreateChildDto = z.infer<typeof CreateChildDto>;

export const UpdateChildDto = CreateChildDto.partial().openapi('UpdateChild');
export type UpdateChildDto = z.infer<typeof UpdateChildDto>;

export const ChildSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    avatar: z.string(),
    ageBand: z.enum(AGE_BANDS),
    narrationLanguage: z.enum(NARRATION_LANGUAGES),
    settings: ChildSettingsSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi('Child');
export type ChildDto = z.infer<typeof ChildSchema>;

export const ChildParamSchema = z.object({
  childId: z.uuid().openapi({ param: { name: 'childId', in: 'path' } }),
});
