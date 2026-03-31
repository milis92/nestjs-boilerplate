// Example: src/domain/widget/rest/requests/create-widget.request.ts

import { ApiSchema, ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  Length,
  Min,
  ValidateIf,
} from 'class-validator';

import {
  WidgetStatus,
  type CreateWidget,
  type WidgetStatus as WidgetStatusType,
} from '../../widget.model';

@ApiSchema({ name: 'CreateWidgetRequest' })
export class CreateWidgetRequest {
  @ApiProperty({ description: 'Display name of the widget' })
  @IsString()
  @Length(1, 255)
  name!: string;

  @ApiProperty({
    description: 'Optional description',
    required: false,
    nullable: true,
  })
  @ValidateIf((o: CreateWidgetRequest) => o.description !== null)
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    description: 'Widget status',
    required: false,
    enum: Object.values(WidgetStatus),
  })
  @IsOptional()
  @IsIn(Object.values(WidgetStatus))
  status?: WidgetStatusType;

  @ApiProperty({
    description: 'Priority level',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  toDomain(): CreateWidget {
    return {
      name: this.name,
      description: this.description ?? null,
      status: this.status ?? 'active',
      priority: this.priority ?? 0,
    };
  }
}
