import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * Write a price for a specific (itemId, optionId) cell. If vendorRateId is
 * present the service copies unitNet from the stored rate and ignores any
 * unitNet in the body — you never want a rate ID and a hand-typed number
 * disagreeing on the same row.
 */
export class UpsertPricingDto {
  @IsOptional() @IsString() vendorRateId?: string;
  @IsOptional() @IsString() vendorId?: string;

  /** Whole rupees. Required unless vendorRateId is supplied. */
  @IsOptional() @IsInt() @Min(0) unitNet?: number;

  /** Percent — overrides the option / global default. Null clears the override. */
  @IsOptional() @IsNumber() @Min(0) @Max(500)
  markupPercent?: number | null;
}
