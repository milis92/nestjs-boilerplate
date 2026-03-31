// Example: src/domain/widget/rest/responses/widget.response.ts

import { ApiSchema, ApiProperty } from '@nestjs/swagger';

import { Widget, type WidgetStatus } from '../../widget.model';

@ApiSchema({ name: 'WidgetResponse' })
export class WidgetResponse {
  @ApiProperty({ description: 'Unique identifier (UUIDv7)' })
  id!: string;

  @ApiProperty({ description: 'Display name' })
  name!: string;

  @ApiProperty({
    description: 'Optional description',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ description: 'Widget status' })
  status!: WidgetStatus;

  @ApiProperty({ description: 'Priority level' })
  priority!: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    nullable: true,
  })
  updatedAt!: Date | null;

  static fromDomain(entity: Widget): WidgetResponse {
    const response = new WidgetResponse();
    response.id = entity.id;
    response.name = entity.name;
    response.description = entity.description;
    response.status = entity.status;
    response.priority = entity.priority;
    response.createdAt = entity.createdAt;
    response.updatedAt = entity.updatedAt;
    return response;
  }

  static fromDomainList(entities: Widget[]): WidgetResponse[] {
    return entities.map((e) => WidgetResponse.fromDomain(e));
  }
}
