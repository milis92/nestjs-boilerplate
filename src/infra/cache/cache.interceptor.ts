import { ExecutionContext, Injectable } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Request } from 'express';
import { IS_HTTP_CACHE } from '@/infra/cache/cache.decorators';

/**
 * HTTP cache interceptor with opt-in caching for public routes only.
 *
 * ### Caching Rules
 *
 * A response is cached when ALL of the following are true:
 * - The route is decorated with `@HttpCache()`
 * - The request is an HTTP GET (default NestJS behavior)
 * - The request is unauthenticated (no user session)
 *
 * Authenticated requests are never cached at the HTTP level
 */
@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  /** Returns true for GET and HEAD requests — only read operations are cacheable. */
  protected isRequestCacheable(context: ExecutionContext): boolean {
    if (context.getType<string>() !== 'http') {
      return false;
    }

    // Only cache routes explicitly decorated with @HttpCache()
    const httpCacheEnabled: boolean = this.reflector.get(
      IS_HTTP_CACHE,
      context.getHandler(),
    );
    if (!httpCacheEnabled) {
      return false;
    }

    // Never cache authenticated requests
    const request = context
      .switchToHttp()
      .getRequest<
        Request & { session?: { user?: { id?: string } } }
      >();
    if (request?.session?.user?.id) {
      return false;
    }

    return super.isRequestCacheable(context);
  }
}
