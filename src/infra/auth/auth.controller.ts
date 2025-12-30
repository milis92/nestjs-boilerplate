import {
  All,
  Controller,
  Get,
  Req,
  Res,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { AuthService } from '@/infra/auth/auth.service';
import {
  AuthAllowAnonymous,
  AuthOptional,
} from '@/infra/auth/auth.decorators';
import type { Request, Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { NoCache } from '@/infra/cache/cache.decorators';
import { hours, SkipThrottle, Throttle } from '@nestjs/throttler';

/**
 * Controller that handles all BetterAuth authentication endpoints.
 * Acts as a pass-through to the BetterAuth handler, forwarding all requests
 * under the /auth/* path to the underlying authentication service.
 */
@ApiExcludeController(true)
@Controller('auth')
export class AuthController {
  constructor(readonly authService: AuthService) {}

  @Get('open-api/*path')
  @SkipThrottle()
  @NoCache()
  @AuthAllowAnonymous()
  @Version(VERSION_NEUTRAL)
  async getOpenApi(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    return await this.authService.handler(req, res);
  }

  /**
   * Catch-all handler that forwards all authentication requests to BetterAuth.
   * Handles all HTTP methods (GET, POST, etc.) for any path under /auth/*.
   *
   * Rate limiter is applied to prevent brute-force attacks.
   * Caching is disabled to ensure a fresh authentication state.
   *
   * Authentication is optional since some endpoints
   * do not require a session to work.
   *
   * @param req - The incoming Express request object
   * @param res - The Express response object for sending the response
   */
  @All('*path')
  @NoCache()
  @AuthOptional()
  @Version(VERSION_NEUTRAL)
  @Throttle({
    default: {
      limit: 5,
      ttl: hours(1),
    },
  })
  async handler(@Req() req: Request, @Res() res: Response) {
    return await this.authService.handler(req, res);
  }
}
