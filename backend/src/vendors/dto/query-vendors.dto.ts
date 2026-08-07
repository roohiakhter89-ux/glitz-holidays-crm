import {
  IsBooleanString,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Season, VendorType } from '@prisma/client';

export class QueryVendorsDto {
  @IsOptional() @IsEnum(VendorType) type?: VendorType;
  @IsOptional() @IsString() city?: string;
  /** matches name, area or contact person */
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsBooleanString() activeOnly?: string;
  @IsOptional() @IsEnum(Season) season?: Season;
  /** Only show rates valid on this date. Defaults to today. */
  @IsOptional() @IsDateString() on?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
