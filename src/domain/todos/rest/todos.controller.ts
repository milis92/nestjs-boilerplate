import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
  NotFoundException,
} from '@nestjs/common';

import { ServiceErrorFilter } from '@/domain/shared/errors/error.filter';
import { UUIDv7Param } from '@/domain/shared/decorators/UUIDv7-param.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '@/infra/auth/auth.decorators';
import { OpenApiController } from '@/tools/openapi/openapi-controller.decorator';
import { OpenApiEndpoint } from '@/tools/openapi/openapi-endpoint.decorator';

import type { TodoId } from '../todo.model';
import { TodosService } from '../todos.service';
import { CreateTodoRequest } from './requests/create-todo.request';
import { UpdateTodoRequest } from './requests/update-todo.request';
import { TodoResponse } from './responses/todo.response';

@Controller('todos')
@UseFilters(ServiceErrorFilter)
@OpenApiController('Todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  @OpenApiEndpoint({
    summary: 'List all todos',
    type: [TodoResponse],
  })
  async all(@CurrentUser() user: AuthUser): Promise<TodoResponse[]> {
    const todos = await this.todosService.all(user.id);
    return TodoResponse.fromDomainList(todos);
  }

  @Get(':id')
  @OpenApiEndpoint({
    summary: 'Get a todo by ID',
    type: TodoResponse,
  })
  async single(
    @CurrentUser() user: AuthUser,
    @UUIDv7Param('id') id: TodoId,
  ): Promise<TodoResponse> {
    const todo = await this.todosService.single(user.id, id);
    if (!todo)
      throw new NotFoundException(`Todo with id '${id}' not found`);
    return TodoResponse.fromDomain(todo);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @OpenApiEndpoint({
    summary: 'Create a new todo',
    status: HttpStatus.CREATED,
    type: TodoResponse,
  })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() request: CreateTodoRequest,
  ): Promise<TodoResponse> {
    const todo = await this.todosService.create(
      user.id,
      request.toDomain(),
    );
    return TodoResponse.fromDomain(todo);
  }

  @Patch(':id')
  @OpenApiEndpoint({
    summary: 'Update a todo',
    type: TodoResponse,
  })
  async update(
    @CurrentUser() user: AuthUser,
    @UUIDv7Param('id') id: TodoId,
    @Body() request: UpdateTodoRequest,
  ): Promise<TodoResponse> {
    const todo = await this.todosService.update(
      user.id,
      id,
      request.toDomain(),
    );
    return TodoResponse.fromDomain(todo);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @OpenApiEndpoint({
    summary: 'Delete a todo',
    status: HttpStatus.NO_CONTENT,
  })
  async remove(
    @CurrentUser() user: AuthUser,
    @UUIDv7Param('id') id: TodoId,
  ): Promise<void> {
    await this.todosService.delete(user.id, id);
  }
}
