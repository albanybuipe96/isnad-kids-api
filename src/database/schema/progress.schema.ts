import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { PROGRESS_KINDS } from '../../common/constants/domain';
import { children } from './profiles.schema';

/**
 * Append-only learning events synced from the app.
 * `id` is generated on the device so retries are idempotent; `seq` is the server's sync cursor.
 */
export const progressEvents = sqliteTable(
  'progress_events',
  {
    seq: integer('seq').primaryKey({ autoIncrement: true }),
    id: text('id').notNull().unique(),
    childId: text('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    skill: text('skill').notNull(), // e.g. "surah:al-ikhlas", "letter:ba"
    contentId: text('content_id'),
    kind: text('kind', { enum: PROGRESS_KINDS }).notNull(),
    value: text('value', { mode: 'json' }).$type<Record<string, unknown> | null>(),
    occurredAt: integer('occurred_at', { mode: 'timestamp_ms' }).notNull(),
    receivedAt: integer('received_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('progress_child_seq_idx').on(t.childId, t.seq)],
);
