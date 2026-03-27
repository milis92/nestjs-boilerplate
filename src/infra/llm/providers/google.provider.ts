import { Injectable } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

import { LlmModel } from '@/infra/llm/llm.model';

@Injectable()
export class GoogleProvider extends LlmModel {
  protected readonly model: LanguageModel;

  constructor(apiKey: string, modelId: string) {
    super();
    this.model = createGoogleGenerativeAI({ apiKey })(modelId);
  }
}
