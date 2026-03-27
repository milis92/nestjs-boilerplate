import { IsEnum, IsOptional, IsString } from 'class-validator';
import { registerAs } from '@nestjs/config';
import { Expose } from 'class-transformer';
import validatedConfig from '@/config/utils/validate-config';

export enum LlmProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  OPENAI_COMPATIBLE = 'openai-compatible',
}

export class LlmConfig {
  @Expose({ name: 'LLM_PROVIDER' })
  @IsEnum(LlmProvider)
  @IsOptional()
  provider: LlmProvider = LlmProvider.OPENAI;

  @Expose({ name: 'LLM_MODEL' })
  @IsString()
  @IsOptional()
  model: string = 'gpt-4o-mini';

  @Expose({ name: 'LLM_API_KEY' })
  @IsString()
  @IsOptional()
  apiKey: string = '';

  @Expose({ name: 'LLM_BASE_URL' })
  @IsString()
  @IsOptional()
  baseUrl?: string;
}

export function llmConfig() {
  return validatedConfig(process.env, LlmConfig);
}

export default registerAs<LlmConfig>('llm', () => llmConfig());
