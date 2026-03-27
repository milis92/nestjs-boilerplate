import { Injectable } from '@nestjs/common';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

import { LlmModel } from '@/infra/llm/llm.model';

@Injectable()
export class OpenAiProvider extends LlmModel {
  protected readonly model: LanguageModel;

  constructor(apiKey: string, modelId: string) {
    super();
    this.model = createOpenAI({ apiKey })(modelId);
  }
}
