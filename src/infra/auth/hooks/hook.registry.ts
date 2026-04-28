import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';

/**
 * Side-effect invoked with a payload of type `TPayload`. Implementations are
 * registered as providers in their feature module and discovered lazily by a
 * concrete `HookRegistry` subclass on the first `run()` call.
 */
export interface Hook<TPayload> {
  handle(payload: TPayload): Promise<void>;
}

/**
 * Base class for hook registries. Subclasses supply a `metadataKey`; the
 * registry discovers every provider marked with that key on the first
 * `run()` invocation and invokes each hook sequentially, with per-hook
 * error isolation (errors are logged and swallowed).
 *
 * Discovery is deferred until the first `run()` call rather than fired from
 * `onModuleInit`: lifecycle hooks run per-module in dependency order, and a
 * registry in an early-initialised module (e.g. a `@Global()` auth module)
 * would otherwise walk the provider graph before downstream feature modules
 * have instantiated their hook classes, silently discovering zero hooks.
 */
@Injectable()
export abstract class HookRegistry<TPayload> {
  private readonly logger = new Logger(this.constructor.name);
  private hooks: Hook<TPayload>[] | null = null;

  protected abstract readonly metadataKey: string | symbol;

  constructor(private readonly discovery: DiscoveryService) {}

  /**
   * Invokes every discovered hook sequentially.
   * Errors from individual hooks are logged and swallowed.
   */
  async run(payload: TPayload): Promise<void> {
    const hooks = this.hooks ?? this.discoverHooks();
    for (const hook of hooks) {
      try {
        await hook.handle(payload);
      } catch (err) {
        this.logger.error(
          `${hook.constructor.name} failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
          err instanceof Error ? err.stack : undefined,
        );
      }
    }
  }

  private discoverHooks(): Hook<TPayload>[] {
    const hooks = this.discovery
      .getProviders()
      .filter((wrapper): wrapper is InstanceWrapper<Hook<TPayload>> =>
        !!wrapper.metatype &&
        Reflect.getMetadata(this.metadataKey, wrapper.metatype) === true &&
        !!wrapper.instance && typeof (wrapper.instance as Hook<TPayload>).handle === 'function',
      )
      .map((w) => w.instance);
    this.logger.log(`Discovered ${hooks.length} hook(s)`);
    this.hooks = hooks;
    return hooks;
  }
}
