import { ApiSchema, ApiProperty } from '@nestjs/swagger';

import { Todo } from '../../todo.model';

@ApiSchema({ name: 'TodoResponse' })
export class TodoResponse {
  @ApiProperty({ description: 'Unique identifier (UUIDv7)' })
  id!: string;

  @ApiProperty({ description: 'Title of the todo' })
  title!: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    nullable: true,
  })
  updatedAt!: Date | null;

  static fromDomain(entity: Todo): TodoResponse {
    const response = new TodoResponse();
    response.id = entity.id;
    response.title = entity.title;
    response.createdAt = entity.createdAt;
    response.updatedAt = entity.updatedAt;
    return response;
  }

  static fromDomainList(entities: Todo[]): TodoResponse[] {
    return entities.map((e) => TodoResponse.fromDomain(e));
  }
}
