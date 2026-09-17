import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PayPlugClient } from './payplug.client';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PayPlugClient],
  exports: [PaymentsService],
})
export class PaymentsModule {}
