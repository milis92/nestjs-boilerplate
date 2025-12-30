import { ExecutionContext, Injectable } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { IS_SKIP_CACHE } from '@/infra/cache/cache.decorators';

/**
 * Cache interceptor that automatically caches responses for eligible
 * requests using the two-level cache (in-memory + Redis) configured in `CacheModule`.
 *
 * ### Caching Rules
 *
 * A request is cached when:
 * - It is an HTTP request (not GraphQL)
 * - It is a GET request (default NestJS behavior)
 * - The route is not decorated with `@NoCache()`
 *
 * ### GraphQL Handling
 *
 * GraphQL requests are excluded from HTTP-level caching because GraphQL
 * has its own caching mechanisms and a single endpoint handles multiple
 * query types.
 */
@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  protected isRequestCacheable(context: ExecutionContext): boolean {
    if (context.getType<string>() === 'graphql') {
      return false;
    }

    // Check for the custom @NoCache() metadata on the route handler
    const ignoreCaching: boolean = this.reflector.get(
      IS_SKIP_CACHE,
      context.getHandler(),
    );

    // If @NoCache() is present, disable caching for this request
    if (ignoreCaching) {
      return false;
    }
    // Otherwise, follow the default logic (usually allows only GET requests)
    return super.isRequestCacheable(context);
  }
}
