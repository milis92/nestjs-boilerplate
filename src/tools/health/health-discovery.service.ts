import {
  Injectable,
  Logger,
  type OnModuleInit,
} from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';

import {
  HEALTH_INDICATOR_KEY,
  type HealthIndicator,
} from './health.indicator';

/** Discovers all providers decorated with @RegisterHealthIndicator at startup. */
@Injectable()
export class HealthDiscoveryService implements OnModuleInit {
  private readonly logger = new Logger(HealthDiscoveryService.name);
  private readonly _indicators = new Map<string, HealthIndicator>();

  constructor(private readonly discovery: DiscoveryService) {}

  onModuleInit(): void {
    const providers = this.discovery.getProviders();
    for (const wrapper of providers) {
      const instance = wrapper.instance as Record<
        string,
        unknown
      > | null;
      if (!instance) continue;

      const name = Reflect.getMetadata(
        HEALTH_INDICATOR_KEY,
        (instance as object).constructor,
      ) as string | undefined;
      if (name) {
        if (this._indicators.has(name)) {
          throw new Error(
            `Duplicate health indicator name: "${name}"`,
          );
        }
        this._indicators.set(
          name,
          instance as unknown as HealthIndicator,
        );
      }
    }

    if (this._indicators.size === 0) {
      this.logger.warn('No health indicators discovered');
    }
  }

  get indicators(): ReadonlyMap<string, HealthIndicator> {
    return this._indicators;
  }
}
