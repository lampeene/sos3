import { IsNumber, IsPositive, Min, IsOptional, IsIn } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @IsPositive()
  registrationId: number;

  /**
  * Amount in euros (e.g. 250 = 250.00 €)
  */
  @IsNumber()
  @Min(1)
  amount: number;

  /**
  * Payment method: CARD (SumUp – card / Apple Pay / Google Pay) or TRANSFER (virement bancaire manuel).
  * Defaults to CARD.
  */
  @IsOptional()
  @IsIn(['CARD', 'TRANSFER'])
  method?: 'CARD' | 'TRANSFER';
}
