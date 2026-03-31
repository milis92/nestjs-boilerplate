import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';

@InputType({ description: 'Input for creating a new todo' })
export class CreateTodoInput {
  @Field(() => String, { description: 'Title of the todo' })
  @IsString()
  @Length(1, 255)
  title!: string;
}

@InputType({ description: 'Input for updating an existing todo' })
export class UpdateTodoInput extends PartialType(CreateTodoInput) {}
