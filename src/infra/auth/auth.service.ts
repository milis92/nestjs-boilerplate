import { Injectable } from '@nestjs/common';
import type { Auth } from 'better-auth';
import type { SecondaryStorage } from 'better-auth';
import betterAuthConfig from '@/infra/auth/better_auth';
import { toNodeHandler } from 'better-auth/node';
import { Cache } from '@nestjs/cache-manager';

/**
 * AuthService provides access to the BetterAuth API.
 * It wraps the configured BetterAuth instance and exposes its functionality
 * for authentication operations throughout the application.
 */
@Injectable()
export class AuthService {
  private readonly auth: Auth;

  constructor(private readonly cache: Cache) {
    const secondaryStorage: SecondaryStorage = {
      get: async (key: string) => {
        return await this.cache.get<string>(key);
      },
      set: async (key: string, value: string) => {
        await this.cache.set(key, value);
      },
      delete: async (key: string) => {
        await this.cache.del(key);
      },
    };
    this.auth = betterAuthConfig(secondaryStorage);
  }

  /**
   * Returns the BetterAuth instance for direct API access.
   * Use this to access the full BetterAuth API including session management,
   * user operations, and authentication methods.
   */
  get api() {
    return this.auth.api;
  }

  /**
   * Returns the BetterAuth handler for use with NestJS middleware.
   * Use this to integrate BetterAuth with NestJS middleware, such as authentication.
   */
  get handler() {
    return toNodeHandler(this.auth);
  }
}
