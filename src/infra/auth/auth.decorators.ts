import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { getSession } from 'better-auth/api';
import { Request as ExpressRequest } from 'express';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Decorator to allow anonymous access to a route.
 * Bypasses authentication requirements for the decorated route or controller.
 *
 * @example
 * ```typescript
 * @AuthAllowAnonymous()
 * @Get('public')
 * getPublicData() {
 *   return { message: 'This is public' };
 * }
 * ```
 */
export const ALLOW_ANONYMOUS = 'allow-anonymous';
export const AuthAllowAnonymous = () =>
  SetMetadata(ALLOW_ANONYMOUS, true);

/**
 * Decorator to make authentication optional for a route.
 * The route will work with or without authentication, allowing conditional logic based on user session.
 *
 * @example
 * ```typescript
 * @AuthOptionalAuth()
 * @Get('content')
 * getContent(@AuthSession() session?: UserSession) {
 *   if (session) {
 *     return { message: 'Personalized content' };
 *   }
 *   return { message: 'Generic content' };
 * }
 * ```
 */
export const OPTIONAL_AUTH = 'optional-betterAuth';
export const AuthOptional = () => SetMetadata(OPTIONAL_AUTH, true);

type UserSessionType = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getSession>>>
>;

/**
 * Session associated with the current authenticated user
 * Contains user information, session metadata, and request headers for additional context.
 */
export type UserSession = UserSessionType & {
  headers: ExpressRequest['headers'];
};

type ReqWithSession = ExpressRequest & { session?: UserSessionType };

/**
 * Parameter decorator to extract the authenticated user's session from the request.
 * Works with both HTTP (REST) and GraphQL execution contexts.
 *
 * When called without arguments, returns the full UserSession object (or null if unauthenticated).
 * When called with a property name, returns only that specific property from the session.
 *
 * @example
 * ```typescript
 * // Get the full session object
 * @Get('profile')
 * getProfile(@AuthSession() session: UserSession) {
 *   return { userId: session.user.id };
 * }
 *
 * // Get only the user object from the session
 * @Get('user')
 * getUser(@AuthSession('user') user: UserSession['user']) {
 *   return user;
 * }
 *
 * // Get the request headers
 * @Get('headers')
 * getHeaders(@AuthSession('headers') headers: UserSession['headers']) {
 *   return headers;
 * }
 * ```
 */
export const AuthSession = createParamDecorator(
  (
    data: keyof UserSessionType | 'headers' | undefined,
    context: ExecutionContext,
  ) => {
    const contextType = context.getType<'http' | 'graphql'>();

    let request: ReqWithSession;

    if (contextType === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      request = gqlCtx.getContext<{ req: ExpressRequest }>()?.req;
    } else {
      request = context.switchToHttp().getRequest();
    }

    // If no session exists (unauthenticated), return null instead of exploding
    const session = request?.session;

    if (!data) {
      return session
        ? ({
            ...session,
            headers: request.headers,
          } satisfies UserSession)
        : null;
    }

    if (data === 'headers') return request.headers;

    return session?.[data] ?? null;
  },
);

/**
 * The authenticated user's data from the BetterAuth session.
 */
export type AuthUser = UserSessionType['user'];

/**
 * Parameter decorator that extracts the authenticated user from the request session.
 * Shorthand for `@AuthSession('user')`.
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
  (_data: unknown, context: ExecutionContext) => {
    const contextType = context.getType<'http' | 'graphql'>();

    let request: ReqWithSession;

    if (contextType === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      request = gqlCtx.getContext<{ req: ExpressRequest }>()?.req;
    } else {
      request = context.switchToHttp().getRequest();
    }

    return request?.session?.user ?? null;
  },
);
