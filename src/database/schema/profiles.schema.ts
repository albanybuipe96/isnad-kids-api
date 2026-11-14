import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { AGE_BANDS, NARRATION_LANGUAGES, type MusicLevel, type Riwayah } from '../../common/constants/domain';
import { user } from './auth.schema';

export interface ChildSettings {
  riwayah: Riwayah;
  reciter: string | null;
  music: MusicLevel;
  showFaces: boolean;
  dailyLimitMinutes: number;
  quietHours: { start: string; end: string } | null; // "HH:MM" local time
}

export const DEFAULT_CHILD_SETTINGS: ChildSettings = {
  riwayah: 'hafs',
  reciter: null,
  music: 'none',
  showFaces: false,
  dailyLimitMinutes: 30,
  quietHours: null,
};

/** A child profile. Children never have accounts of their own; they belong to a parent. */
export const children = sqliteTable(
  'children',
  {
    id: text('id').primaryKey(),
    parentUserId: text('parent_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    avatar: text('avatar').notNull(),
    ageBand: text('age_band', { enum: AGE_BANDS }).notNull(),
    narrationLanguage: text('narration_language', { enum: NARRATION_LANGUAGES }).notNull().default('en'),
    settings: text('settings', { mode: 'json' }).$type<ChildSettings>().notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('children_parent_idx').on(t.parentUserId)],
);
