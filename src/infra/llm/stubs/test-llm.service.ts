import { LlmModel } from '../llm.model';
import { z } from 'zod';

/**
 * Stub LLM model that returns a configurable response without calling any external API.
 *
 * Use {@link StubLlmModel.respondWith} to set the value returned by the next
 * `generateObject` call, or leave the default (empty object) for tests that
 * don't care about the LLM output.
 */
export class StubLlmModel extends LlmModel {
  protected readonly model = null as never;

  private nextResponse: unknown = {};

  /** Set the value that will be returned by the next `generateObject` call. */
  respondWith(value: unknown): void {
    this.nextResponse = value;
  }

  override generateObject<T extends z.ZodType>(): Promise<
    z.infer<T>
  > {
    return Promise.resolve(this.nextResponse as z.infer<T>);
  }
}
