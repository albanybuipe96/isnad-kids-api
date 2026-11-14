import { z } from '@hono/zod-openapi';
import type { ActivityTemplate } from '@/common/constants/domain';

/**
 * Template-specific payloads. Drafts may be incomplete; these schemas are enforced when an
 * item is submitted for review. Any key ending in "MediaId" is treated as a media reference.
 */
const mediaId = z.uuid();

const ListenAlongData = z.object({
  surah: z.object({
    number: z.number().int().min(1).max(114),
    nameArabic: z.string().min(1),
    nameEnglish: z.string().min(1),
  }),
  ayat: z
    .array(
      z.object({
        number: z.number().int().min(1),
        /** Verified Qur'an text for display. Never retype it by hand; import it from a checked source. */
        text: z.string().min(1),
        audioMediaId: mediaId,
        /** Optional word timings for highlighting, in milliseconds from the start of the ayah audio. */
        words: z
          .array(z.object({ text: z.string(), startMs: z.number().int().min(0), endMs: z.number().int().min(0) }))
          .optional(),
      }),
    )
    .min(1),
});

const RepeatAfterMeData = z.object({
  promptAudioMediaId: mediaId,
  text: z.string().optional(),
  translation: z.string().optional(),
});

const SurahMatchData = z.object({
  rounds: z
    .array(
      z
        .object({
          clipMediaId: mediaId,
          options: z.array(z.object({ label: z.string().min(1), imageMediaId: mediaId })).min(2).max(4),
          answerIndex: z.number().int().min(0),
        })
        .refine((round) => round.answerIndex < round.options.length, {
          message: 'answerIndex must point at one of the options',
          path: ['answerIndex'],
        }),
    )
    .min(1),
});

/** Templates without a strict schema yet accept any object; add schemas as each template is built. */
const TEMPLATE_SCHEMAS: Partial<Record<ActivityTemplate, z.ZodType>> = {
  listen_along: ListenAlongData,
  repeat_after_me: RepeatAfterMeData,
  surah_match: SurahMatchData,
};

export function validateTemplateData(template: ActivityTemplate, data: unknown) {
  const schema = TEMPLATE_SCHEMAS[template];
  if (!schema) return [];
  const result = schema.safeParse(data);
  return result.success
    ? []
    : result.error.issues.map((issue) => ({ path: ['data', ...issue.path].join('.'), message: issue.message }));
}

/** Finds every media id referenced by keys ending in "MediaId", at any depth. */
export function collectMediaRefs(data: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(data)) {
    for (const value of data) collectMediaRefs(value, found);
  } else if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      if (key.endsWith('MediaId') && typeof value === 'string') found.add(value);
      else collectMediaRefs(value, found);
    }
  }
  return found;
}
