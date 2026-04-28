// Example: src/domain/widget/widget.model.ts

import { widgetStatus } from '@/infra/drizzle/schema';
import type { WidgetRow } from '@/infra/drizzle/types';
import type { UserId } from '@/infra/auth/auth.schema';
import { createEnumObject } from '@/domain/shared/helpers/enum-object';

// ── Enum ─────────────────────────────────────────────────────────────

export const WidgetStatus = createEnumObject(widgetStatus.enumValues);

/** Status of a widget: active or archived. */
export type WidgetStatus = keyof typeof WidgetStatus;

// ── Types ────────────────────────────────────────────────────────────

/** Unique identifier of a widget. */
export type WidgetId = string;

/**
 * A configurable widget owned by a specific user.
 */
export class Widget {
  /** Unique identifier. */
  id!: WidgetId;
  /** Owner of the widget. */
  owner!: UserId;
  /** Display name. */
  name!: string;
  /** Optional description. */
  description: string | null = null;
  /** Widget status. */
  status!: WidgetStatus;
  /** Priority level. */
  priority!: number;
  /** When this record was created. */
  createdAt: Date = new Date();
  /** When this record was last updated (null until first update). */
  updatedAt: Date | null = null;

  constructor(row: WidgetRow) {
    this.id = row.id;
    this.owner = row.ownerId;
    this.name = row.name;
    this.description = row.description;
    this.status = row.status;
    this.priority = row.priority;
    this.createdAt = row.createdAt;
    this.updatedAt = row.updatedAt;
  }

  /** Creates an array of domain entities from database rows. */
  static fromRowset(rows: WidgetRow[]): Widget[] {
    return rows.map((row) => new Widget(row));
  }
}

// ── Create / Update Types ────────────────────────────────────────────

/** Data required to create a new widget. */
export type CreateWidget = Omit<
  Widget,
  'id' | 'owner' | 'createdAt' | 'updatedAt'
>;

/** Partial updates to an existing widget. */
export type UpdateWidget = Partial<CreateWidget>;
