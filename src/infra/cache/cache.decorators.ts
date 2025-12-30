import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used to mark routes that should bypass caching.
 * Used internally by `HttpCacheInterceptor` to check if caching should be skipped.
 */
export const IS_SKIP_CACHE = 'no-cache';

/**
 * Decorator to disable caching for a specific route or controller.
 *
 * By default, GET requests are automatically cached by `HttpCacheInterceptor`.
 * Use this decorator when you need fresh data on every request, such as:
 * - Real-time data endpoints
 * - Authentication-related routes
 * - User-specific dynamic content
 *
 * @example
 * ```typescript
 * // Disable caching for a single route
 * @Get('live-stats')
 * @NoCache()
 * getLiveStats() {
 *   return this.statsService.getCurrentStats();
 * }
 *
 * // Disable caching for an entire controller
 * @Controller('realtime')
 * @NoCache()
 * export class RealtimeController {
 *   // All routes in this controller will bypass cache
 * }
 * ```
 */
export const NoCache = () => SetMetadata(IS_SKIP_CACHE, true);
