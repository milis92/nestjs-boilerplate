import { Field, ID, ObjectType } from '@nestjs/graphql';

import { Todo } from '../todo.model';

@ObjectType({ description: 'A todo item' })
export class TodoObject {
  @Field(() => ID, { description: 'Unique identifier (UUIDv7)' })
  id!: string;

  @Field(() => String, { description: 'Title of the todo' })
  title!: string;

  @Field(() => Date, { description: 'Creation timestamp' })
  createdAt!: Date;

  @Field(() => Date, {
    description: 'Last update timestamp',
    nullable: true,
  })
  updatedAt!: Date | null;

  static fromDomain(todo: Todo): TodoObject {
    const obj = new TodoObject();
    obj.id = todo.id;
    obj.title = todo.title;
    obj.createdAt = todo.createdAt;
    obj.updatedAt = todo.updatedAt;
    return obj;
  }

  static fromDomainList(todos: Todo[]): TodoObject[] {
    return todos.map((t) => TodoObject.fromDomain(t));
  }
}
