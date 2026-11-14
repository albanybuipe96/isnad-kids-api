import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { ADMIN_ROLES } from '../../common/constants/domain';

/** People allowed into the admin portal. Login itself is handled by Cloudflare Access. */
export const adminUsers = sqliteTable('admin_users', {
  email: text('email').primaryKey(), // stored lower-case
  name: text('name'),
  role: text('role', { enum: ADMIN_ROLES }).notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});
