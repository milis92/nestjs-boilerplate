import type { DrizzleDatabase } from '@/infra/drizzle/drizzle.module';
import type { UserId } from '@/infra/auth/auth.schema';
import type { NewTodoRow } from '@/infra/drizzle/types';
import { todos } from '@/infra/drizzle/schema';

export async function createTestTodo(
  db: DrizzleDatabase,
  ownerId: UserId,
  overrides: Partial<NewTodoRow> = {},
) {
  const [row] = await db
    .insert(todos)
    .values({
      ownerId,
      title: 'Test Todo',
      ...overrides,
    })
    .returning();
  return row;
}
