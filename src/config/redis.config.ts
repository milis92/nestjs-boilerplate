import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { registerAs } from '@nestjs/config';
import { Expose } from 'class-transformer';
import validatedConfig from '@/config/utils/validate-config';
import { AsBoolean } from '@/config/utils/as-boolean.transformer';

export class RedisConfig {
  @Expose({ name: 'REDIS_HOST' })
  @IsString()
  @IsOptional()
  host: string = 'localhost';

  @Expose({ name: 'REDIS_PORT' })
  @IsNumber()
  @IsOptional()
  port: number = 6379;

  @Expose({ name: 'REDIS_PASSWORD' })
  @IsString()
  @IsOptional()
  password?: string;

  @Expose({ name: 'REDIS_TLS' })
  @IsBoolean()
  @IsOptional()
  @AsBoolean()
  tls: boolean = false;

  @Expose({ name: 'REDIS_REJECT_UNAUTHORIZED' })
  @IsBoolean()
  @IsOptional()
  @AsBoolean()
  rejectUnauthorized: boolean = false;

  @Expose({ name: 'REDIS_CA' })
  @IsString()
  @IsOptional()
  ca?: string;

  @Expose({ name: 'REDIS_KEY' })
  @IsString()
  @IsOptional()
  key?: string;

  @Expose({ name: 'REDIS_CERT' })
  @IsString()
  @IsOptional()
  cert?: string;

  @Expose({ name: 'REDIS_CACHE_DB' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(15)
  cacheDatabase: number = 0;

  @Expose({ name: 'REDIS_RATE_LIMITER_DB' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(15)
  rateLimiterDatabase: number = 1;

  @Expose({ name: 'REDIS_QUEUE_DB' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(15)
  queueDatabase: number = 2;

  @Expose({ name: 'REDIS_CONNECT_TIMEOUT' })
  @IsNumber()
  @IsOptional()
  @Min(1000)
  connectTimeout: number = 10000;
}

export function redisConfig() {
  return validatedConfig(process.env, RedisConfig);
}

export default registerAs<RedisConfig>('redis', () => redisConfig());
