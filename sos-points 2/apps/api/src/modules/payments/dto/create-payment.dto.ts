import { IsNumber, IsPositive, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @IsPositive()
  registrationId: number;

  /**
   * Amount in euros (will be converted to cents for PayPlug).
   * Example: 250 = 250.00 €
   */
  @IsNumber()
  @Min(1)
  amount: number;
}
