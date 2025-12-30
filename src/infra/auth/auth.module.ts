import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from '@/infra/auth/auth.service';
import { AuthGuard } from '@/infra/auth/auth.guard';
import { AuthController } from '@/infra/auth/auth.controller';
import { AuthHealthCheckIndicator } from '@/infra/auth/auth.health';

@Global()
@Module({
  providers: [
    AuthService,
    AuthGuard,
    AuthHealthCheckIndicator,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService, AuthHealthCheckIndicator],
})
export class AuthModule {}
