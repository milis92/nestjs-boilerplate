import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { registerAs } from '@nestjs/config';
import { Expose } from 'class-transformer';
import validatedConfig from '@/config/utils/validate-config';

export class CacheConfig {
  @Expose({ name: 'CACHE_TTL' })
  @IsString()
  @IsOptional()
  ttl: string = '5m';

  @Expose({ name: 'CACHE_LRU_SIZE' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  lruSize: number = 5000;
}

export function cacheConfig() {
  return validatedConfig(process.env, CacheConfig);
}

export default registerAs<CacheConfig>('cache', () => cacheConfig());
