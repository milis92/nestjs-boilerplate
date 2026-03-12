import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CanActivate } from '@nestjs/common';

const NoOpGuard: CanActivate = {
  canActivate: () => true,
};

@Global()
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useValue: NoOpGuard,
    },
  ],
})
export class TestRateLimiterModule {}
