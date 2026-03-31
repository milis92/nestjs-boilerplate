// Example: additions to src/infra/drizzle/schema.ts for a "widgets" feature

import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  varchar,
} from 'drizzle-orm/pg-core';

import { primaryId, timestamps } from '@/infra/drizzle/schema';
import { withUserId } from '@/infra/auth/auth.schema';

// ── Widget Enums ───────────────────────────────────────────────────
export const widgetStatus = pgEnum('widget_status', [
  'active',
  'archived',
]);

// ── Widget Tables ──────────────────────────────────────────────────
export const widgets = pgTable(
  'widgets',
  {
    id: primaryId,
    ownerId: withUserId('cascade'),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    status: widgetStatus('status').notNull().default('active'),
    priority: integer('priority').notNull().default(0),
    ...timestamps,
  },
  (t) => [index('widgets_owner_id_idx').on(t.ownerId)],
);
