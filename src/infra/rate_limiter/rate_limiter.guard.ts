import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';

/**
 * Custom rate limiter guard that extends the default NestJS ThrottlerGuard.
 * It provides support for both REST and GraphQL contexts and includes
 * advanced IP tracking logic to handle proxy headers.
 */
@Injectable()
export class RateLimiterGuard extends ThrottlerGuard {
  /**
   * Intercepts the request and response objects from the execution context.
   * Handles GraphQL specifically by extracting the request from the GraphQL context.
   *
   * @param context - The execution context of the current request.
   * @returns An object containing the request and response.
   */
  getRequestResponse(context: ExecutionContext) {
    const contextType = context.getType<'http' | 'graphql'>();
    if (contextType === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      return gqlCtx.getContext<{
        req: ExpressRequest;
        res: ExpressResponse;
      }>();
    }
    return super.getRequestResponse(context);
  }

  /**
   * Resolves the tracker (unique identifier) for the rate limiter, typically the client IP.
   * It attempts to extract the real IP address by checking various proxy headers
   * and the request's IP properties.
   *
   * @param req - The incoming request object.
   * @returns A promise that resolves to the tracker string.
   */
  protected getTracker(req: Record<string, any>): Promise<string> {
    const headers = req.headers as Record<
      string,
      string | string[] | undefined
    >;

    // Check for common proxy headers to identify if the request went through a load balancer or proxy
    const proxyIp =
      headers['X-Forwarded'] ??
      headers['x-forwarded'] ??
      headers['X-Forwarded-For'] ??
      headers['x-forwarded-for'] ??
      headers['X-Real-IP'] ??
      headers['x-real-ip'];

    const ips = req.ips as string[] | undefined;
    const ip = req.ip as string | undefined;

    // Use the first IP from the proxy list if proxy headers are present, otherwise fallback to the direct IP
    const tracker = (proxyIp ?? ips?.length) ? ips?.[0] : ip;
    return Promise.resolve(tracker ?? '');
  }
}
