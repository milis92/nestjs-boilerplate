// Example: src/domain/widget/rest/requests/update-widget.request.ts

import { ApiSchema, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Length,
  Min,
  ValidateIf,
} from 'class-validator';

import { type UpdateWidget } from '../../widget.model';

@ApiSchema({ name: 'UpdateWidgetRequest' })
export class UpdateWidgetRequest {
  @ApiPropertyOptional({ description: 'Display name of the widget' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Optional description',
    nullable: true,
  })
  @ValidateIf((o: UpdateWidgetRequest) => o.description !== null)
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: 'Priority level' })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  toDomain(): UpdateWidget {
    return {
      name: this.name,
      description: this.description,
      priority: this.priority,
    };
  }
}
