import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { PACK_STATUSES } from '../../common/constants/domain';

/** A published, versioned snapshot of all approved content: a manifest JSON in R2. */
export const contentPacks = sqliteTable('content_packs', {
  id: text('id').primaryKey(),
  version: integer('version').notNull().unique(),
  status: text('status', { enum: PACK_STATUSES }).notNull().default('building'),
  manifestKey: text('manifest_key'),
  itemCount: integer('item_count'),
  totalBytes: integer('total_bytes'),
  notes: text('notes'),
  error: text('error'),
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
});
