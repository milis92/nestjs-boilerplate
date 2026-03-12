import {
  pgSchema,
  uuid,
  UpdateDeleteAction,
} from 'drizzle-orm/pg-core';
import { AUTH_SCHEMA_NAME } from '@/infra/auth/auth.factory';

// ── Schema namespace ────────────────────────────────────────────────
const authSchema = pgSchema(AUTH_SCHEMA_NAME);

const users = authSchema.table('user', {
  id: uuid('id').primaryKey(),
});

export const withUserId = (onDelete: UpdateDeleteAction = 'cascade') =>
  uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete });

export type UserId = (typeof users.$inferSelect)['id'];
