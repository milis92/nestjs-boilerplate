// Example: src/domain/widget/graphql/widget.input.ts

import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsInt,
  Length,
  Min,
  ValidateIf,
} from 'class-validator';

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
}

@InputType({ description: 'Input for updating an existing widget' })
export class UpdateWidgetInput extends PartialType(
  CreateWidgetInput,
) {}
