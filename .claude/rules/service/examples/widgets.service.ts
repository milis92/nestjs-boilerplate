// Example: src/domain/widgets/widgets.service.ts

import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { omitUndefined } from '@/domain/shared/helpers/omit-undefined';
import { ServiceError } from '@/domain/shared/errors/service.error';
import { widgets } from '@/infra/drizzle/schema';
import {
  InjectDrizzle,
  type DrizzleDatabase,
} from '@/infra/drizzle/drizzle.module';
import type { UserId } from '@/infra/auth/auth.schema';

import {
  Widget,
  type WidgetId,
  type CreateWidget,
  type UpdateWidget,
} from './widget.model';

/** Service providing CRUD operations for user-owned widgets. */
@Injectable()
export class WidgetsService {
  constructor(@InjectDrizzle() private readonly database: DrizzleDatabase) {}

  /** Returns all widgets for the given owner, ordered by name. */
  async all(ownerId: UserId): Promise<Widget[]> {
    try {
      const rows = await this.database.query.widgets.findMany({
        where: { ownerId },
        orderBy: { name: 'asc' },
      });
      // No ServiceError thrown in this try body, so no re-throw guard needed.
      return Widget.fromRowset(rows);
    } catch (error) {
      throw ServiceError.database('fetching widgets', error);
    }
  }

  /** Returns a single widget by ID, or null if not found. */
  async single(ownerId: UserId, widgetId: WidgetId): Promise<Widget | null> {
    try {
      const row = await this.database.query.widgets.findFirst({
        where: { ownerId, id: widgetId },
      });
      return row ? new Widget(row) : null;
    } catch (error) {
      throw ServiceError.database('fetching widget', error);
    }
  }

  /** Checks whether a widget exists and belongs to the given owner. */
  async exists(ownerId: UserId, widgetId: WidgetId): Promise<boolean> {
    try {
      const [row] = await this.database
        .select({ id: widgets.id })
        .from(widgets)
        .where(and(eq(widgets.ownerId, ownerId), eq(widgets.id, widgetId)))
        .limit(1);
      return !!row;
    } catch (error) {
      throw ServiceError.database('checking widget existence', error);
    }
  }

  /** Creates a new widget. */
  async create(ownerId: UserId, data: CreateWidget): Promise<Widget> {
    try {
      const [row] = await this.database
        .insert(widgets)
        .values({
          ownerId,
          name: data.name,
          description: data.description,
          status: data.status,
          priority: data.priority,
        })
        .returning();
      return new Widget(row);
    } catch (error) {
      throw ServiceError.database('creating widget', error);
    }
  }

  /** Updates an existing widget. Throws NOT_FOUND if it doesn't exist. */
  async update(
    ownerId: UserId,
    widgetId: WidgetId,
    data: UpdateWidget,
  ): Promise<Widget> {
    try {
      const [row] = await this.database
        .update(widgets)
        .set(omitUndefined({ name: data.name, description: data.description, status: data.status, priority: data.priority }))
        .where(and(eq(widgets.ownerId, ownerId), eq(widgets.id, widgetId)))
        .returning();

      // Empty returning() means the row didn't exist (or wrong owner).
      if (!row) {
        throw ServiceError.notFound('Widget', widgetId);
      }
      return new Widget(row);
    } catch (error) {
      // Re-throw guard: ServiceError.notFound may have been thrown above.
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('updating widget', error);
    }
  }

  /** Deletes a widget. Throws NOT_FOUND if it doesn't exist. */
  async delete(ownerId: UserId, widgetId: WidgetId): Promise<void> {
    try {
      const result = await this.database
        .delete(widgets)
        .where(and(eq(widgets.ownerId, ownerId), eq(widgets.id, widgetId)));

      if (result.rowCount === 0) {
        throw ServiceError.notFound('Widget', widgetId);
      }
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('deleting widget', error);
    }
  }

  /**
   * Soft-deletes a widget by setting archivedAt.
   * Throws NOT_FOUND if it doesn't exist.
   */
  async archive(ownerId: UserId, widgetId: WidgetId): Promise<Widget> {
    try {
      const [row] = await this.database
        .update(widgets)
        .set({ archivedAt: new Date() })
        .where(and(eq(widgets.ownerId, ownerId), eq(widgets.id, widgetId)))
        .returning();

      if (!row) {
        throw ServiceError.notFound('Widget', widgetId);
      }

      // Re-fetch to hydrate relations after the update.
      const result = await this.single(ownerId, widgetId);
      if (!result) {
        // Update succeeded but the row vanished — data consistency issue.
        throw ServiceError.consistency('archiving widget', widgetId);
      }
      return result;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('archiving widget', error);
    }
  }

  /** Restores a soft-deleted widget by clearing archivedAt. Throws NOT_FOUND if it doesn't exist. */
  async restore(ownerId: UserId, widgetId: WidgetId): Promise<Widget> {
    try {
      const [row] = await this.database
        .update(widgets)
        .set({ archivedAt: null })
        .where(and(eq(widgets.ownerId, ownerId), eq(widgets.id, widgetId)))
        .returning();

      if (!row) {
        throw ServiceError.notFound('Widget', widgetId);
      }
      return new Widget(row);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw ServiceError.database('restoring widget', error);
    }
  }
}
