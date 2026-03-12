import { Inject, Injectable } from '@nestjs/common';
import { toNodeHandler } from 'better-auth/node';
import {
  BETTER_AUTH,
  type BetterAuthInstance,
} from '@/infra/auth/auth.factory';

/** NestJS wrapper around the BetterAuth instance, providing access to the auth API and HTTP handler. */
@Injectable()
export class AuthService {
  constructor(
    @Inject(BETTER_AUTH) private readonly auth: BetterAuthInstance,
  ) {}

  /** BetterAuth API for programmatic auth operations (session validation, user management). */
  get api() {
    return this.auth.api;
  }

  /** Express-compatible HTTP handler that delegates auth routes (sign-up, sign-in, etc.) to BetterAuth. */
  get handler() {
    return toNodeHandler(this.auth);
  }
}
