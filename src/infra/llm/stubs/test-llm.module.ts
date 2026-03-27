import { Global, Module } from '@nestjs/common';

import { LlmModel } from '../llm.model';
import { LlmService } from '../llm.service';
import { StubLlmModel } from '@/infra/llm/stubs/test-llm.service';

@Global()
@Module({
  providers: [
    {
      provide: LlmModel,
      useClass: StubLlmModel,
    },
    LlmService,
  ],
  exports: [LlmService, LlmModel],
})
export class TestLlmModule {}
