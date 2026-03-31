import {
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { withUserId } from '@/infra/auth/auth.schema';

/** Shared timestamp columns: `created_at` (auto-set on insert) and `updated_at` (auto-set on update). */
export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  }).$onUpdate(() => new Date()),
};

/** UUIDv7 primary key column, auto-generated via the `uuidv7()` PostgreSQL function. */
export const primaryId = uuid('id')
  .primaryKey()
  .default(sql`uuidv7()`);

// ── Todo Tables ───────────────────────────────────────────────────
export const todos = pgTable(
  'todos',
  {
    id: primaryId,
    ownerId: withUserId('cascade'),
    title: varchar('title', { length: 255 }).notNull(),
    ...timestamps,
  },
  (t) => [index('todos_owner_id_idx').on(t.ownerId)],
);
