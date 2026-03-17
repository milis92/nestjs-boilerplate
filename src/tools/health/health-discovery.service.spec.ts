import 'reflect-metadata';
import { DiscoveryService } from '@nestjs/core';

import { HealthDiscoveryService } from './health-discovery.service';
import {
  RegisterHealthIndicator,
  type HealthIndicator,
} from './health.indicator';

describe('HealthDiscoveryService', () => {
  let service: HealthDiscoveryService;
  let mockDiscovery: { getProviders: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDiscovery = { getProviders: vi.fn().mockReturnValue([]) };
    service = new HealthDiscoveryService(
      mockDiscovery as unknown as DiscoveryService,
    );
  });

  it('should discover providers with @RegisterHealthIndicator metadata', () => {
    @RegisterHealthIndicator('test')
    class TestIndicator implements HealthIndicator {
      async isHealthy(): Promise<boolean> {
        return true;
      }
    }

    const instance = new TestIndicator();
    mockDiscovery.getProviders.mockReturnValue([{ instance }]);

    service.onModuleInit();

    expect(service.indicators.size).toBe(1);
    expect(service.indicators.get('test')).toBe(instance);
  });

  it('should skip providers without the decorator', () => {
    class PlainService {}
    mockDiscovery.getProviders.mockReturnValue([
      { instance: new PlainService() },
    ]);

    service.onModuleInit();

    expect(service.indicators.size).toBe(0);
  });

  it('should skip providers with null instance', () => {
    mockDiscovery.getProviders.mockReturnValue([{ instance: null }]);

    service.onModuleInit();

    expect(service.indicators.size).toBe(0);
  });

  it('should throw on duplicate indicator names', () => {
    @RegisterHealthIndicator('dup')
    class Indicator1 implements HealthIndicator {
      async isHealthy(): Promise<boolean> {
        return true;
      }
    }

    @RegisterHealthIndicator('dup')
    class Indicator2 implements HealthIndicator {
      async isHealthy(): Promise<boolean> {
        return true;
      }
    }

    mockDiscovery.getProviders.mockReturnValue([
      { instance: new Indicator1() },
      { instance: new Indicator2() },
    ]);

    expect(() => service.onModuleInit()).toThrow(
      'Duplicate health indicator name: "dup"',
    );
  });

  it('should warn when no indicators are discovered', () => {
    const warnSpy = vi.spyOn(service['logger'], 'warn');
    mockDiscovery.getProviders.mockReturnValue([]);

    service.onModuleInit();

    expect(warnSpy).toHaveBeenCalledWith('No health indicators discovered');
  });
});
