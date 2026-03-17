import 'reflect-metadata';
import { HEALTH_INDICATOR_KEY, RegisterHealthIndicator } from './health.indicator';

describe('RegisterHealthIndicator', () => {
  it('should set HEALTH_INDICATOR_KEY metadata with the given name', () => {
    @RegisterHealthIndicator('test')
    class TestIndicator {}

    const name = Reflect.getMetadata(HEALTH_INDICATOR_KEY, TestIndicator) as string;
    expect(name).toBe('test');
  });
});
