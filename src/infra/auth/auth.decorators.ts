import {
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { getSession } from 'better-auth/api';
import type { Request as ExpressRequest } from 'express';
import { GqlExecutionContext } from '@nestjs/graphql';

/** Metadata key used by AuthGuard to allow unauthenticated access to a route. */
export const ALLOW_ANONYMOUS = 'allow-anonymous';

/**
 * Marks a route or controller as publicly accessible.
 * The AuthGuard skips session validation entirely for decorated handlers.
 *
 * @example
 * ```typescript
 * @AuthAllowAnonymous()
 * @Get('public')
 * getPublicData() { ... }
 * ```
 */
export const AuthAllowAnonymous = () =>
  SetMetadata(ALLOW_ANONYMOUS, true);

/** Metadata key used by AuthGuard to allow access with or without a session. */
export const OPTIONAL_AUTH = 'optional-betterAuth';

/**
 * Marks a route as accessible with or without authentication.
 * The AuthGuard attaches the session if one is present, but does not throw
 * when no session exists.
 *
 * @example
 * ```typescript
 * @AuthOptional()
 * @Get('content')
 * getContent(@AuthSession() session: UserSession | null) { ... }
 * ```
 */
export const AuthOptional = () => SetMetadata(OPTIONAL_AUTH, true);

type UserSessionType = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getSession>>>
>;

/** Session and user data returned by BetterAuth for the current authenticated request. */
export type UserSession = UserSessionType;

/** The authenticated user's data extracted from the BetterAuth session. */
export type AuthUser = UserSessionType['user'];

/**
 * Parameter decorator that extracts the full BetterAuth session from the request.
 * Works with both HTTP (REST) and GraphQL execution contexts.
 * Returns `null` when the route is unauthenticated (e.g. decorated with `@AuthOptional()`).
 *
 * @example
 * ```typescript
 * @Get('me')
 * getMe(@AuthSession() session: UserSession) {
 *   return session.user.id;
 * }
 * ```
 */
export const AuthSession = createParamDecorator(
  (_: unknown, context: ExecutionContext): UserSession | null =>
    getRequest(context)?.session ?? null,
);

/**
 * Parameter decorator that extracts the authenticated user from the request session.
 * Shorthand for reading `session.user`. Works with both HTTP and GraphQL contexts.
 * Returns `null` when the route is unauthenticated.
 *
 * @example
 * ```typescript
 * @Get()
 * findAll(@CurrentUser() user: AuthUser) {
 *   return this.service.findAll(user.id);
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthUser | null =>
    getRequest(context)?.session?.user ?? null,
);

type ReqWithSession = ExpressRequest & { session?: UserSessionType };

/** Extracts the Express request from either an HTTP or GraphQL execution context. */
function getRequest(
  context: ExecutionContext,
): ReqWithSession | undefined {
  if (context.getType<'http' | 'graphql'>() === 'graphql') {
    return GqlExecutionContext.create(context).getContext<{
      req: ReqWithSession;
    }>()?.req;
  }
  return context.switchToHttp().getRequest<ReqWithSession>();
}