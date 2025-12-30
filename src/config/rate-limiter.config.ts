import { IsNumber, IsOptional, Min } from 'class-validator';
import { registerAs } from '@nestjs/config';
import { Expose } from 'class-transformer';
import validatedConfig from '@/config/utils/validate-config';

export class RateLimiterConfig {
  @Expose({ name: 'RATE_LIMIT_TTL' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  ttl: number = 60000;

  @Expose({ name: 'RATE_LIMIT_MAX' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit: number = 100;

  @Expose({ name: 'RATE_LIMIT_BLOCK_DURATION' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  blockDuration: number = 60000;
}

export function rateLimiterConfig() {
  return validatedConfig(process.env, RateLimiterConfig);
}

export default registerAs<RateLimiterConfig>('rateLimiter', () =>
  rateLimiterConfig(),
);
