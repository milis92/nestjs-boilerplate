import { Injectable, SetMetadata } from '@nestjs/common';

import type { UserId } from '@/infra/auth/auth.schema';

import { Hook, HookRegistry } from './hook.registry';

export const USER_CREATED_HOOK_METADATA = 'user-created-hook';

/**
 * Side-effect invoked once after a user row is written by BetterAuth.
 *
 * Errors thrown from `handle` are logged and swallowed by the registry —
 * sign-up succeeds even if a hook fails.
 *
 * Whether an implementation needs to be idempotent depends on
 * its semantics and is up to the implementer.
 */
export type UserCreatedHook = Hook<UserId>;

/**
 * Marks an @Injectable() as a post-sign-up side effect.
 * Discovered at module init by UserCreatedHookRegistry.
 */
export const UserCreatedHookProvider =
  (): ClassDecorator => SetMetadata(USER_CREATED_HOOK_METADATA, true);

/**
 * Registry of providers decorated with @UserCreatedHookProvider.
 * Runs each hook on sign-up with per-hook error isolation.
 */
@Injectable()
export class UserCreatedHookRegistry extends HookRegistry<UserId> {
  protected readonly metadataKey = USER_CREATED_HOOK_METADATA;
}
