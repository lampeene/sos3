import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(
      dto.registrationId,
      dto.amount,
      dto.method || 'CARD',
    );
  }

  /**
  * SumUp webhook – called by SumUp servers (no auth).
  * Payload: { event_type: 'CHECKOUT_STATUS_CHANGED', id: '<checkout id>' }
  * We always re-verify the status server-side via GET /checkouts/{id}.
  */
  @Post('webhook')
  @HttpCode(200)
  async webhook(@Query('tracker') tracker: string) {
    this.logger.log(`Webhook received for tracker=${tracker}`);
    try {
      await this.paymentsService.handleWebhook(tracker);
    } catch (err) {
      this.logger.error(`Webhook error for ${tracker}`, err);
    }
    return 'OK';
  }

  @Get('pending-transfers')
  @UseGuards(JwtAuthGuard)
  findPendingTransfers() {
    return this.paymentsService.findPendingTransfers();
  }

  @Post(':id/confirm-transfer')
  @UseGuards(JwtAuthGuard)
  confirmTransfer(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.confirmTransfer(id);
  }

  @Get('registration/:id')
  @UseGuards(JwtAuthGuard)
  findByRegistration(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findByRegistration(id);
  }

  @Get('tracker/:tracker')
  findByTracker(@Param('tracker') tracker: string) {
    return this.paymentsService.findByTracker(tracker);
  }
}
