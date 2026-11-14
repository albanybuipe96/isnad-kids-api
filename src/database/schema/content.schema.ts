import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import {
  ACTIVITY_TEMPLATES,
  CONTENT_STATUSES,
  MEDIA_KINDS,
  REVIEW_DECISIONS,
  RIWAYAT,
  SECTIONS,
  type AgeBand,
} from '../../common/constants/domain';

/** A file in R2: audio, image, Rive/Lottie animation or video. */
export const mediaAssets = sqliteTable('media_assets', {
  id: text('id').primaryKey(),
  kind: text('kind', { enum: MEDIA_KINDS }).notNull(),
  r2Key: text('r2_key').notNull().unique(),
  filename: text('filename').notNull(),
  contentType: text('content_type').notNull(),
  bytes: integer('bytes').notNull(),
  sha256: text('sha256').notNull(),
  uploadedBy: text('uploaded_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * One activity the app can show. `data` is the template-specific payload
 * (e.g. ayah timings for listen_along); `mediaIds` lists every file it needs.
 */
export const contentItems = sqliteTable(
  'content_items',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    section: text('section', { enum: SECTIONS }).notNull(),
    template: text('template', { enum: ACTIVITY_TEMPLATES }).notNull(),
    ageBands: text('age_bands', { mode: 'json' }).$type<AgeBand[]>().notNull(),
    skills: text('skills', { mode: 'json' }).$type<string[]>().notNull(),
    riwayah: text('riwayah', { enum: RIWAYAT }),
    isIslamic: integer('is_islamic', { mode: 'boolean' }).notNull(),
    /** Qur'an reference or hadith source. Required before an Islamic item can be reviewed. */
    source: text('source'),
    data: text('data', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
    mediaIds: text('media_ids', { mode: 'json' }).$type<string[]>().notNull(),
    status: text('status', { enum: CONTENT_STATUSES }).notNull().default('draft'),
    revision: integer('revision').notNull().default(1),
    lastPublishedPackVersion: integer('last_published_pack_version'),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('content_status_idx').on(t.status), index('content_section_idx').on(t.section)],
);

/** Every review decision, kept as an audit trail. */
export const contentReviews = sqliteTable(
  'content_reviews',
  {
    id: text('id').primaryKey(),
    contentId: text('content_id')
      .notNull()
      .references(() => contentItems.id, { onDelete: 'cascade' }),
    revision: integer('revision').notNull(),
    reviewerEmail: text('reviewer_email').notNull(),
    decision: text('decision', { enum: REVIEW_DECISIONS }).notNull(),
    comment: text('comment'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('reviews_content_idx').on(t.contentId)],
);
