import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseFilters, NotFoundException } from '@nestjs/common';

import { ServiceErrorFilter } from '@/domain/shared/errors/error.filter';
import {
  CurrentUser,
  type AuthUser,
} from '@/infra/auth/auth.decorators';

import type { TodoId, CreateTodo, UpdateTodo } from '../todo.model';
import { TodosService } from '../todos.service';
import { TodoObject } from './todo.object';
import { CreateTodoInput, UpdateTodoInput } from './todo.input';

@Resolver(() => TodoObject)
@UseFilters(ServiceErrorFilter)
export class TodosResolver {
  constructor(private readonly todosService: TodosService) {}

  @Query(() => [TodoObject], { name: 'todos' })
  async todos(@CurrentUser() user: AuthUser): Promise<TodoObject[]> {
    const todos = await this.todosService.all(user.id);
    return TodoObject.fromDomainList(todos);
  }

  @Query(() => TodoObject, { name: 'todo' })
  async todo(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: TodoId,
  ): Promise<TodoObject> {
    const todo = await this.todosService.single(user.id, id);
    if (!todo)
      throw new NotFoundException(`Todo with id '${id}' not found`);
    return TodoObject.fromDomain(todo);
  }

  @Mutation(() => TodoObject, {
    description: 'Create a new todo',
  })
  async createTodo(
    @CurrentUser() user: AuthUser,
    @Args('input') input: CreateTodoInput,
  ): Promise<TodoObject> {
    const domain: CreateTodo = {
      title: input.title,
    };
    const todo = await this.todosService.create(user.id, domain);
    return TodoObject.fromDomain(todo);
  }

  @Mutation(() => TodoObject, {
    description: 'Update an existing todo',
  })
  async updateTodo(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: TodoId,
    @Args('input') input: UpdateTodoInput,
  ): Promise<TodoObject> {
    const domain: UpdateTodo = {
      ...(input.title !== undefined && { title: input.title }),
    };
    const todo = await this.todosService.update(user.id, id, domain);
    return TodoObject.fromDomain(todo);
  }

  @Mutation(() => Boolean, { description: 'Delete a todo' })
  async deleteTodo(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: TodoId,
  ): Promise<boolean> {
    await this.todosService.delete(user.id, id);
    return true;
  }
}
