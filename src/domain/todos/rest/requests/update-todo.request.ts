import { ApiSchema, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Length } from 'class-validator';

import { type UpdateTodo } from '../../todo.model';

@ApiSchema({ name: 'UpdateTodoRequest' })
export class UpdateTodoRequest {
  @ApiPropertyOptional({ description: 'Title of the todo' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  toDomain(): UpdateTodo {
    return {
      title: this.title,
    };
  }
}
