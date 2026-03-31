/**
 * Typed row definitions for Drizzle ORM queries.
 *
 * `*Row` types extend `$inferSelect` with optional relation properties — these are
 * only populated when the query uses `with:` to eagerly load relations.
 * `New*Row` types use `$inferInsert` for insert operations.
 */

import { todos } from './schema';

/** A todo row as returned by SELECT queries. */
export type TodoRow = typeof todos.$inferSelect;
/** A todo row shape for INSERT operations. */
export type NewTodoRow = typeof todos.$inferInsert;
