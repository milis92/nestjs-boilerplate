// Example: src/domain/widget/graphql/widget.object.ts

import {
  Field,
  ID,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

import { Widget } from '../widget.model';

export enum WidgetStatusEnum {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

registerEnumType(WidgetStatusEnum, {
  name: 'WidgetStatus',
  description: 'Status of a widget',
});

@ObjectType({ description: 'A widget entity' })
export class WidgetObject {
  @Field(() => ID, { description: 'Unique identifier (UUIDv7)' })
  id!: string;

  @Field(() => String, { description: 'Display name' })
  name!: string;

  @Field(() => String, {
    description: 'Optional description',
    nullable: true,
  })
  description!: string | null;

  @Field(() => WidgetStatusEnum, { description: 'Widget status' })
  status!: WidgetStatusEnum;

  @Field(() => Int, { description: 'Priority level' })
  priority!: number;

  @Field(() => Date, { description: 'Creation timestamp' })
  createdAt!: Date;

  @Field(() => Date, {
    description: 'Last update timestamp',
    nullable: true,
  })
  updatedAt!: Date | null;

  static fromDomain(widget: Widget): WidgetObject {
    const obj = new WidgetObject();
    obj.id = widget.id;
    obj.name = widget.name;
    obj.description = widget.description;
    obj.status = widget.status as WidgetStatusEnum;
    obj.priority = widget.priority;
    obj.createdAt = widget.createdAt;
    obj.updatedAt = widget.updatedAt;
    return obj;
  }

  static fromDomainList(widgets: Widget[]): WidgetObject[] {
    return widgets.map((w) => WidgetObject.fromDomain(w));
  }
}
