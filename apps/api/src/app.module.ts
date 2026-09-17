import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from './common/logger/logger.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { HttpLoggerMiddleware } from './common/logger/http-logger.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PlacesModule } from './modules/places/places.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MailModule } from './modules/mail/mail.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    MailModule,
    StorageModule,
    AuthModule,
    UsersModule,
    PlacesModule,
    SessionsModule,
    RegistrationsModule,
    PaymentsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Order matters: RequestId first, then HTTP logger
    consumer
      .apply(RequestIdMiddleware, HttpLoggerMiddleware)
      .forRoutes('*');
  }
}
