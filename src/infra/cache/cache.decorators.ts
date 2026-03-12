import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used to mark routes that should be cached at the HTTP level.
 * Used internally by `HttpCacheInterceptor` to check if caching is enabled.
 */
export const IS_HTTP_CACHE = 'http-cache';

/**
 * Decorator to enable HTTP-level response caching for a specific route.
 *
 * By default, no routes are cached at the HTTP level. Use this decorator
 * on unauthenticated public endpoints where response caching is beneficial.
 *
 * Authenticated requests are never cached at the HTTP level — query-level
 * caching via Drizzle handles that with proper user isolation and auto-invalidation.
 *
 * @example
 * ```typescript
 * @Get('public-stats')
 * @HttpCache()
 * getPublicStats() {
 *   return this.statsService.getPublicStats();
 * }
 * ```
 */
export const HttpCache = () => SetMetadata(IS_HTTP_CACHE, true);
