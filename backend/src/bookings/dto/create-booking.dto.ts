import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  /** Build from an accepted quote tier — pricing is snapshotted from it. */
  @IsOptional() @IsString() quoteOptionId?: string;

  /** Required only when NOT building from a quote option. */
  @IsOptional() @IsString() leadId?: string;

  @IsOptional() @IsString() @MaxLength(200) packageName?: string;
  @IsOptional() @IsDateString() travelStartDate?: string;
  @IsOptional() @IsDateString() travelEndDate?: string;

  @IsOptional() @IsInt() @Min(1) adults?: number;
  @IsOptional() @IsInt() @Min(0) children?: number;
  @IsOptional() @IsInt() @Min(0) nights?: number;

  /** Only used for a manual booking with no quote behind it. */
  @IsOptional() @IsInt() @Min(0) totalSell?: number;
  @IsOptional() @IsInt() @Min(0) totalNet?: number;

  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
}
