import { Global, Module } from '@nestjs/common';
import { TodosModule } from '@/domain/todos/todos.module';

@Global()
@Module({
  imports: [TodosModule],
})
export class FeaturesModule {}
