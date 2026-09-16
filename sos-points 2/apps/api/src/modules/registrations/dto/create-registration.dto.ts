import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsString,
  IsDateString,
  IsUrl,
  ValidateNested,
  ValidateIf,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CaseNumber } from '../../../common/document-rules';

class DrivingLicenseDto {
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  drivingLicenseNumber: string;

  @IsString()
  @MinLength(2)
  placeOfIssue: string;

  @IsDateString()
  dateOfIssue: string;

  @IsOptional()
  @IsNumber()
  numberOfPoints?: number;

  @IsString()
  @MinLength(1)
  fileName: string;

  @IsString()
  @IsUrl({ require_protocol: true })
  url: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}

class DocCat2Dto {
  @IsString()
  @MinLength(2)
  infracPlace: string;

  @IsDateString()
  infracDate: string;

  @IsDateString()
  infracTime: string;

  @IsString()
  @MinLength(2)
  infracReason: string;

  @IsString()
  @MinLength(1)
  letterNumber: string;

  @IsString()
  @MinLength(1)
  letterCode: string;

  @IsNumber()
  numPoints48n: number;

  @IsDateString()
  receiptDate: string;

  @IsString()
  @MinLength(1)
  fileName: string;

  @IsString()
  @IsUrl({ require_protocol: true })
  url: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}

class DocCat3Cat4Dto {
  @IsDateString()
  dateOfJudgement: string;

  @IsString()
  @MinLength(1)
  judgementNumber: string;

  @IsString()
  @MinLength(1)
  fileName: string;

  @IsString()
  @IsUrl({ require_protocol: true })
  url: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class CreateRegistrationDto {
  @IsEnum(['CASE_1', 'CASE_2', 'CASE_3', 'CASE_4'], {
    message: 'caseNumber must be CASE_1, CASE_2, CASE_3 or CASE_4',
  })
  caseNumber: CaseNumber;

  @IsOptional()
  @IsBoolean()
  noLicense?: boolean;

  @IsNumber()
  sessionId: number;

  @IsNumber()
  userId: number;

  @ValidateIf((o) => !o.noLicense)
  @ValidateNested()
  @Type(() => DrivingLicenseDto)
  drivingLicense?: DrivingLicenseDto;

  @ValidateIf((o) => o.caseNumber === 'CASE_2')
  @ValidateNested()
  @Type(() => DocCat2Dto)
  docCat2?: DocCat2Dto;

  @ValidateIf((o) => o.caseNumber === 'CASE_3' || o.caseNumber === 'CASE_4')
  @ValidateNested()
  @Type(() => DocCat3Cat4Dto)
  docCat3Cat4?: DocCat3Cat4Dto;
}
