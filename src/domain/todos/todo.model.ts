import type { TodoRow } from '@/infra/drizzle/types';
import type { UserId } from '@/infra/auth/auth.schema';

// ── Types ────────────────────────────────────────────────────────

/** Unique identifier of a todo. */
export type TodoId = string;

/**
 * A todo item owned by a specific user.
 */
export class Todo {
  /** Unique identifier. */
  id!: TodoId;
  /** Owner of the todo. */
  owner!: UserId;
  /** Title of the todo. */
  title!: string;
  /** When this record was created. */
  createdAt: Date = new Date();
  /** When this record was last updated (null until first update). */
  updatedAt: Date | null = null;

  constructor(row: TodoRow) {
    this.id = row.id;
    this.owner = row.ownerId;
    this.title = row.title;
    this.createdAt = row.createdAt;
    this.updatedAt = row.updatedAt;
  }

  /** Creates an array of domain entities from database rows. */
  static fromRowset(rows: TodoRow[]): Todo[] {
    return rows.map((row) => new Todo(row));
  }
}

// ── Create / Update Types ────────────────────────────────────────

/** Data required to create a new todo. */
export type CreateTodo = Omit<
  Todo,
  'id' | 'owner' | 'createdAt' | 'updatedAt'
>;

/** Partial updates to an existing todo. */
export type UpdateTodo = Partial<CreateTodo>;
