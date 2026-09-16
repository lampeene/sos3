import { IsDateString, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class CreateSessionDto {
  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  maxRegistration?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  minRegistration?: number;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsNumber()
  placeId: number;

  @IsOptional()
  @IsNumber()
  psyId?: number;

  @IsOptional()
  @IsNumber()
  trainerId?: number;
}
