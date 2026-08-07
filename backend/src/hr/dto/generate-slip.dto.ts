import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Generate a slip for a month. If any component override is supplied it wins
 * over the employee's default salary structure — so a bonus/arrears month can
 * be captured without touching the Employee row.
 */
export class GenerateSlipDto {
  /** Any ISO date within the month you want. The service normalises to day 1. */
  @IsDateString() periodMonth: string;

  @IsOptional() @IsInt() @Min(0) daysWorked?: number;
  @IsOptional() @IsInt() @Min(0) lop?: number;

  @IsOptional() @IsInt() @Min(0) basic?: number;
  @IsOptional() @IsInt() @Min(0) hra?: number;
  @IsOptional() @IsInt() @Min(0) allowances?: number;
  @IsOptional() @IsInt() @Min(0) bonus?: number;
  @IsOptional() @IsInt() @Min(0) arrears?: number;

  @IsOptional() @IsInt() @Min(0) pf?: number;
  @IsOptional() @IsInt() @Min(0) esi?: number;
  @IsOptional() @IsInt() @Min(0) tax?: number;
  @IsOptional() @IsInt() @Min(0) otherDed?: number;

  @IsOptional() @IsDateString() paidOn?: string;
  @IsOptional() @IsString() @MaxLength(120) reference?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
