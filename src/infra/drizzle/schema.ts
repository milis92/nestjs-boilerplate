import {
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/** Shared timestamp columns: `created_at` (auto-set on insert) and `updated_at` (auto-set on update). */
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  }).$onUpdate(() => new Date()),
};

/** UUIDv7 primary key column, auto-generated via the `uuidv7()` PostgreSQL function. */
const primaryId = uuid('id')
  .primaryKey()
  .default(sql`uuidv7()`);