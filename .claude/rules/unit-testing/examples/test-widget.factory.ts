// Example: src/domain/widget/stubs/test-widget.factory.ts

import type { DrizzleDatabase } from '@/infra/drizzle/drizzle.module';
import type { UserId } from '@/infra/auth/auth.schema';
import type { NewWidgetRow } from '@/infra/drizzle/types';
import { widgets } from '@/infra/drizzle/schema';

export async function createTestWidget(
  db: DrizzleDatabase,
  ownerId: UserId,
  overrides: Partial<NewWidgetRow> = {},
) {
  const [row] = await db
    .insert(widgets)
    .values({
      ownerId,
      name: 'Test Widget',
      status: 'active',
      ...overrides,
    })
    .returning();
  return row;
}
