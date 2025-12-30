import type { CanActivate, ExecutionContext } from '@nestjs/common';
import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { fromNodeHeaders } from 'better-auth/node';
import { Request as ExpressRequest } from 'express';
import {
  ALLOW_ANONYMOUS,
  OPTIONAL_AUTH,
} from '@/infra/auth/auth.decorators';
import { AuthService } from '@/infra/auth/auth.service';

/**
 * Guard that protects routes by validating user authentication.
 * Supports both HTTP (REST) and GraphQL execution contexts.
 *
 * The guard checks for authentication metadata set by decorators:
 * - Routes marked with @AuthAllowAnonymous() bypass authentication entirely
 * - Routes marked with @AuthOptional() allow unauthenticated access but still attach session if present
 * - All other routes require valid authentication
 *
 * On successful authentication, attaches session and user data to the request object.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  /**
   * Validates if the current request is authenticated for all REST, GraphQL & Websockets
   * Attaches session and user information to the request object
   * @param context - The execution context of the current request
   * @returns True if the request is authorized to proceed, throws an error otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowAnonymous = this.reflector.getAllAndOverride<boolean>(
      ALLOW_ANONYMOUS,
      [context.getHandler(), context.getClass()],
    );

    if (allowAnonymous) return true;

    const contextType = context.getType<'http' | 'graphql'>();

    let request: ExpressRequest;
    if (contextType === 'graphql') {
      const gqlExecutionContext = GqlExecutionContext.create(context);
      request = gqlExecutionContext.getContext<{
        req: ExpressRequest;
      }>()?.req;
    } else {
      request = context.switchToHttp().getRequest();
    }

    const session = await this.authService.api.getSession({
      headers: fromNodeHeaders(request?.headers),
    });

    (request as any)['session'] = session;
    (request as any)['user'] = session?.user;

    const isOptional = this.reflector.getAllAndOverride<boolean>(
      OPTIONAL_AUTH,
      [context.getHandler(), context.getClass()],
    );

    if (isOptional && !session) return true;

    if (!session) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
