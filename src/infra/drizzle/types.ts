/**
 * Typed row definitions for Drizzle ORM queries.
 *
 * `*Row` types extend `$inferSelect` with optional relation properties — these are
 * only populated when the query uses `with:` to eagerly load relations.
 * `New*Row` types use `$inferInsert` for insert operations.
 */
import * as schema from './schema';