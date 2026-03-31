import { ApiSchema, ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

import { type CreateTodo } from '../../todo.model';

@ApiSchema({ name: 'CreateTodoRequest' })
export class CreateTodoRequest {
  @ApiProperty({ description: 'Title of the todo' })
  @IsString()
  @Length(1, 255)
  title!: string;

  toDomain(): CreateTodo {
    return {
      title: this.title,
    };
  }
}
