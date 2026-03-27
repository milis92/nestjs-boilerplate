import { Injectable } from '@nestjs/common';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';

import { LlmModel } from '@/infra/llm/llm.model';

@Injectable()
export class AnthropicProvider extends LlmModel {
  protected readonly model: LanguageModel;

  constructor(apiKey: string, modelId: string) {
    super();
    this.model = createAnthropic({ apiKey })(modelId);
  }
}
