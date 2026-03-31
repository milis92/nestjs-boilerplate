import { Module } from '@nestjs/common';

import { TodosService } from './todos.service';
import { TodosController } from './rest/todos.controller';
import { TodosResolver } from './graphql/todos.resolver';

@Module({
  controllers: [TodosController],
  providers: [TodosService, TodosResolver],
  exports: [TodosService],
})
export class TodosModule {}
