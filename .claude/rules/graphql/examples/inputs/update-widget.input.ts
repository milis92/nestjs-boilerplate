// Example: src/domain/widget/graphql/inputs/update-widget.input.ts

import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsInt,
  Length,
  Min,
} from 'class-validator';

import type { UpdateWidget } from '../../widget.model';

/** Input for updating an existing widget. */
@InputType({ description: 'Input for updating an existing widget' })
export class UpdateWidgetInput {
  @Field(() => String, {
    nullable: true,
    description: 'Display name',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Optional description',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @Field(() => Int, { nullable: true, description: 'Priority level' })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  /** Converts the input to the service-layer {@link UpdateWidget} type. */
  toDomain(): UpdateWidget {
    return {
      name: this.name,
      description: this.description,
      priority: this.priority,
    };
  }
}
