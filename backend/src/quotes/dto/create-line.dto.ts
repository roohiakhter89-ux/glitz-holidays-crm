import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MarkupMode, ServiceType } from '@prisma/client';

export class CreateLineDto {
  @IsEnum(ServiceType) serviceType: ServiceType;

  @IsString() @MinLength(1) @MaxLength(300) description: string;

  @IsOptional() @IsString() vendorId?: string;
  @IsOptional() @IsString() vendorRateId?: string;

  /** rooms / vehicles */
  @IsOptional() @IsInt() @Min(1) quantity?: number;
  /** nights / days */
  @IsOptional() @IsInt() @Min(1) units?: number;

  /** net cost per unit per quantity */
  @IsInt() @Min(0) unitNet: number;

  @IsOptional() @IsEnum(MarkupMode) markupMode?: MarkupMode;
  /** percent when PERCENT, rupees when FIXED, total sell when MANUAL */
  @IsOptional() @IsNumber() @Min(0) markupValue?: number;

  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
