/** Shared domain vocabulary. Used by the database schema, DTOs and the OpenAPI spec. */

export const AGE_BANDS = ['little', 'explorer', 'junior', 'senior'] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const SECTIONS = ['quran_garden', 'alif_ba_house', 'dua_time', 'discovery_lab', 'calm_corner'] as const;
export type Section = (typeof SECTIONS)[number];

export const ACTIVITY_TEMPLATES = [
  'listen_along',
  'repeat_after_me',
  'surah_match',
  'listen_tap',
  'drag_match',
  'trace',
  'sequence',
  'find_it',
  'sandbox',
  'interactive_video',
] as const;
export type ActivityTemplate = (typeof ACTIVITY_TEMPLATES)[number];

export const RIWAYAT = ['hafs', 'warsh'] as const;
export type Riwayah = (typeof RIWAYAT)[number];

export const NARRATION_LANGUAGES = ['en', 'ha', 'dag', 'tw'] as const;
export type NarrationLanguage = (typeof NARRATION_LANGUAGES)[number];

export const MUSIC_LEVELS = ['none', 'voice_and_drums', 'full_nasheed'] as const;
export type MusicLevel = (typeof MUSIC_LEVELS)[number];

/**
 * draft -> in_review -> approved
 *             \-> changes_requested -> in_review ...
 * Editing an approved item sends it back to draft, so it must be reviewed again.
 */
export const CONTENT_STATUSES = ['draft', 'in_review', 'changes_requested', 'approved'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const REVIEW_DECISIONS = ['approve', 'request_changes'] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

export const MEDIA_KINDS = ['audio', 'image', 'animation', 'video'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const ADMIN_ROLES = ['admin', 'editor', 'reviewer'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const PROGRESS_KINDS = ['listened', 'repeated', 'completed', 'memorised', 'checked_by_adult'] as const;
export type ProgressKind = (typeof PROGRESS_KINDS)[number];

export const PACK_STATUSES = ['building', 'published', 'failed'] as const;
export type PackStatus = (typeof PACK_STATUSES)[number];
