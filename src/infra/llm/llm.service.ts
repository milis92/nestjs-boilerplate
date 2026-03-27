import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { LlmModel } from './llm.model';

@Injectable()
export class LlmService {
  constructor(private readonly llmModel: LlmModel) {}

  /** Generates a typed object from a prompt using the configured LLM provider. */
  async generateObject<T extends z.ZodType>(options: {
    schema: T;
    prompt: string;
    schemaName?: string;
    schemaDescription?: string;
  }): Promise<z.infer<T>> {
    return this.llmModel.generateObject(options);
  }
}
