import { Injectable } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';

import { ServiceError } from '@/domain/shared/errors/service.error';
import { omitUndefined } from '@/domain/shared/helpers/omit-undefined';

import {
  InjectDrizzle,
  type DrizzleDatabase,
} from '@/infra/drizzle/drizzle.module';
import { todos } from '@/infra/drizzle/schema';
import type { UserId } from '@/infra/auth/auth.schema';

import {
  Todo,
  type TodoId,
  type CreateTodo,
  type UpdateTodo,
} from './todo.model';

@Injectable()
export class TodosService {
  constructor(
    @InjectDrizzle() private readonly db: DrizzleDatabase,
  ) {}

  /** Returns all todos for the given owner, ordered by createdAt descending. */
  async all(ownerId: UserId): Promise<Todo[]> {
    try {
      const rows = await this.db
        .select()
        .from(todos)
        .where(eq(todos.ownerId, ownerId))
        .orderBy(desc(todos.createdAt));
      return Todo.fromRowset(rows);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('all todos', error);
    }
  }

  /** Returns a single todo by id and owner, or null if not found. */
  async single(ownerId: UserId, id: TodoId): Promise<Todo | null> {
    try {
      const [row] = await this.db
        .select()
        .from(todos)
        .where(and(eq(todos.id, id), eq(todos.ownerId, ownerId)));
      return row ? new Todo(row) : null;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('single todo', error);
    }
  }

  /** Creates a new todo and returns the persisted domain model. */
  async create(ownerId: UserId, data: CreateTodo): Promise<Todo> {
    try {
      const [row] = await this.db
        .insert(todos)
        .values({
          ownerId,
          title: data.title,
        })
        .returning();

      if (!row) {
        throw ServiceError.consistency('create todo', 'unknown');
      }

      return new Todo(row);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('create todo', error);
    }
  }

  /** Updates an existing todo. Throws NOT_FOUND if it does not exist. */
  async update(
    ownerId: UserId,
    id: TodoId,
    data: UpdateTodo,
  ): Promise<Todo> {
    try {
      const [row] = await this.db
        .update(todos)
        .set(omitUndefined(data))
        .where(and(eq(todos.id, id), eq(todos.ownerId, ownerId)))
        .returning();

      if (!row) {
        throw ServiceError.notFound('Todo', id);
      }

      return new Todo(row);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('update todo', error);
    }
  }

  /** Hard-deletes a todo. Throws NOT_FOUND if it does not exist. */
  async delete(ownerId: UserId, id: TodoId): Promise<void> {
    try {
      const result = await this.db
        .delete(todos)
        .where(and(eq(todos.id, id), eq(todos.ownerId, ownerId)));

      if (!result.rowCount) {
        throw ServiceError.notFound('Todo', id);
      }
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('delete todo', error);
    }
  }
}
