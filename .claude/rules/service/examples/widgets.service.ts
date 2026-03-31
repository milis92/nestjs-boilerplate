// Example: src/domain/widget/widgets.service.ts

import { Injectable } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';

import { ServiceError } from '@/domain/shared/errors/service.error';
import { omitUndefined } from '@/domain/shared/helpers/omit-undefined';

import {
  InjectDrizzle,
  type DrizzleDatabase,
} from '@/infra/drizzle/drizzle.module';
import { widgets } from '@/infra/drizzle/schema';
import type { UserId } from '@/infra/auth/auth.schema';

import {
  Widget,
  type WidgetId,
  type CreateWidget,
  type UpdateWidget,
} from './widget.model';

@Injectable()
export class WidgetsService {
  constructor(
    @InjectDrizzle() private readonly db: DrizzleDatabase,
  ) {}

  /** Returns all widgets for the given owner, ordered by createdAt descending. */
  async all(ownerId: UserId): Promise<Widget[]> {
    try {
      const rows = await this.db
        .select()
        .from(widgets)
        .where(eq(widgets.ownerId, ownerId))
        .orderBy(desc(widgets.createdAt));
      return Widget.fromRowset(rows);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('all widgets', error);
    }
  }

  /** Returns a single widget by id and owner, or null if not found. */
  async single(
    ownerId: UserId,
    id: WidgetId,
  ): Promise<Widget | null> {
    try {
      const [row] = await this.db
        .select()
        .from(widgets)
        .where(and(eq(widgets.id, id), eq(widgets.ownerId, ownerId)));
      return row ? new Widget(row) : null;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('single widget', error);
    }
  }

  /** Creates a new widget and returns the persisted domain model. */
  async create(ownerId: UserId, data: CreateWidget): Promise<Widget> {
    try {
      const [row] = await this.db
        .insert(widgets)
        .values({
          ownerId,
          name: data.name,
          description: data.description,
          status: data.status,
          priority: data.priority,
        })
        .returning();

      if (!row) {
        throw ServiceError.consistency('create widget', 'unknown');
      }

      return new Widget(row);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('create widget', error);
    }
  }

  /** Updates an existing widget. Throws NOT_FOUND if it does not exist. */
  async update(
    ownerId: UserId,
    id: WidgetId,
    data: UpdateWidget,
  ): Promise<Widget> {
    try {
      const [row] = await this.db
        .update(widgets)
        .set(omitUndefined(data))
        .where(and(eq(widgets.id, id), eq(widgets.ownerId, ownerId)))
        .returning();

      if (!row) {
        throw ServiceError.notFound('Widget', id);
      }

      return new Widget(row);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('update widget', error);
    }
  }

  /** Hard-deletes a widget. Throws NOT_FOUND if it does not exist. */
  async delete(ownerId: UserId, id: WidgetId): Promise<void> {
    try {
      const result = await this.db
        .delete(widgets)
        .where(and(eq(widgets.id, id), eq(widgets.ownerId, ownerId)));

      if (!result.rowCount) {
        throw ServiceError.notFound('Widget', id);
      }
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('delete widget', error);
    }
  }
}
