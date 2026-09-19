import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { SumUpClient } from './sumup.client';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, SumUpClient],
  exports: [PaymentsService],
})
export class PaymentsModule {}
