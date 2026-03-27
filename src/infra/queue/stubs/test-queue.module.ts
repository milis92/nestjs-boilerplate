import { DynamicModule, Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

export interface RedisConnectionConfig {
  host: string;
  port: number;
}

@Global()
@Module({})
export class TestQueueModule {
  static forRoot(config: RedisConnectionConfig): DynamicModule {
    return {
      module: TestQueueModule,
      imports: [
        BullModule.forRoot({
          connection: {
            host: config.host,
            port: config.port,
          },
        }),
      ],
    };
  }
}
