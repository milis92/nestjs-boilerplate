import { generateText, Output, type LanguageModel } from 'ai';
import type { z } from 'zod';

export interface GenerateObjectOptions<T extends z.ZodType> {
  schema: T;
  prompt: string;
  schemaName?: string;
  schemaDescription?: string;
}

/** Provider-agnostic abstract base for LLM structured object generation. */
export abstract class LlmModel {
  /** The underlying AI SDK language model instance. */
  protected abstract readonly model: LanguageModel;

  /** Generates a typed object from a prompt using the underlying LLM provider. */
  async generateObject<T extends z.ZodType>(
    options: GenerateObjectOptions<T>,
  ): Promise<z.infer<T>> {
    const { schema, prompt, schemaName, schemaDescription } = options;

    const { output } = await generateText({
      model: this.model,
      output: Output.object({
        schema,
        name: schemaName,
        description: schemaDescription,
      }),
      prompt,
    });

    return output as z.infer<T>;
  }
}
