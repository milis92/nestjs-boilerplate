// Example: src/domain/widget/graphql/inputs/create-widget.input.ts

import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsInt,
  Length,
  Min,
  ValidateIf,
} from 'class-validator';

import type { CreateWidget } from '../../widget.model';

/** Input for creating a new widget. */
@InputType({ description: 'Input for creating a new widget' })
export class CreateWidgetInput {
  @Field(() => String, { description: 'Display name' })
  @IsString()
  @Length(1, 255)
  name!: string;

  @Field(() => String, {
    description: 'Optional description',
    nullable: true,
  })
  @ValidateIf((o) => o.description !== null)
  @IsOptional()
  @IsString()
  description?: string | null;

  @Field(() => Int, {
    description: 'Priority level',
    defaultValue: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  /** Converts the input to the service-layer {@link CreateWidget} type. */
  toDomain(): CreateWidget {
    return {
      name: this.name,
      description: this.description ?? null,
      status: 'active',
      priority: this.priority ?? 0,
    };
  }
}
