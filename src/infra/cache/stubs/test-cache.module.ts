import { Global, Module } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { createCache } from 'cache-manager';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HttpCacheInterceptor } from '@/infra/cache/cache.interceptor';

@Global()
@Module({
  providers: [
    {
      provide: CACHE_MANAGER,
      useFactory: () => {
        const store = new CacheableMemory({
          ttl: '1h',
          lruSize: 100,
        });
        const keyv = new Keyv({ store });
        return createCache({ stores: [keyv] });
      },
    },
    {
      provide: Cache,
      useExisting: CACHE_MANAGER,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
  ],
  exports: [CACHE_MANAGER, Cache],
})
export class TestCacheModule {}
