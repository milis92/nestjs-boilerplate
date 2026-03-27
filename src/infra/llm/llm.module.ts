import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import llmConfig, {
  LlmConfig,
  LlmProvider,
} from '@/config/llm.config';

import { LlmService } from './llm.service';
import { LlmModel } from './llm.model';
import { OpenAiProvider } from './providers/openai.provider';
import { OpenAiCompatibleProvider } from './providers/openai-compatible.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GoogleProvider } from './providers/google.provider';

function createLlmModel(config: LlmConfig): LlmModel {
  switch (config.provider) {
    case LlmProvider.OPENAI:
      return new OpenAiProvider(config.apiKey, config.model);
    case LlmProvider.OPENAI_COMPATIBLE:
      if (!config.baseUrl) {
        throw new Error(
          'LLM_BASE_URL is required for openai-compatible provider',
        );
      }
      return new OpenAiCompatibleProvider(
        config.apiKey,
        config.baseUrl,
        config.model,
      );
    case LlmProvider.ANTHROPIC:
      return new AnthropicProvider(config.apiKey, config.model);
    case LlmProvider.GOOGLE:
      return new GoogleProvider(config.apiKey, config.model);
  }
}

/**
 * Module that provides LLM-based structured object generation via the Vercel AI SDK.
 *
 * ### How It Works
 *
 * The module wraps the Vercel AI SDK's `generateObject` function behind
 * {@link LlmService}, providing a provider-agnostic interface for generating
 * typed objects from natural language prompts. The LLM provider and model
 * are selected at startup via environment configuration.
 *
 * ### Supported Providers
 *
 * - **OpenAI** — GPT models (default: `gpt-4o-mini`)
 * - **Anthropic** — Claude models
 * - **Google** — Gemini models
 * - **OpenAI-compatible** — any provider exposing an OpenAI-compatible API
 *
 * ### Configuration
 *
 * Set `LLM_PROVIDER`, `LLM_MODEL`, and `LLM_API_KEY` environment variables.
 * If `LLM_API_KEY` is not set, the service initialises without a model and
 * throws at runtime when `generateObject` is called.
 *
 * ### Exports
 *
 * - **LlmService** — inject to generate structured objects from prompts
 */
@Global()
@Module({
  imports: [ConfigModule.forFeature(llmConfig)],
  providers: [
    {
      provide: LlmModel,
      useFactory: (config: LlmConfig) => createLlmModel(config),
      inject: [llmConfig.KEY],
    },
    LlmService,
  ],
  exports: [LlmService],
})
export class LlmModule {}
