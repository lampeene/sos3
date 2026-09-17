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
    return this.paymentsService.createPayment(dto.registrationId, dto.amount);
  }

  /**
   * PayPlug IPN – called by PayPlug servers (no auth).
   */
  @Post('ipn')
  @HttpCode(200)
  async ipn(@Query('tracker') tracker: string) {
    this.logger.log(`IPN received for tracker=${tracker}`);
    try {
      await this.paymentsService.handleIpn(tracker);
    } catch (err) {
      this.logger.error(`IPN error for ${tracker}`, err);
    }
    return 'OK';
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
