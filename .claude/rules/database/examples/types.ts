// Example: additions to src/infra/drizzle/types.ts for a "widgets" feature

import { widgets } from './schema';

export type WidgetRow = typeof widgets.$inferSelect;
export type NewWidgetRow = typeof widgets.$inferInsert;
