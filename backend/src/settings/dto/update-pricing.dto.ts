import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdatePricingDto {
  @IsOptional() @IsNumber() @Min(0) @Max(500) defaultMarkupPercent?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(500) hotelMarkupPercent?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(500) transportMarkupPercent?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(500) activityMarkupPercent?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(500) flightMarkupPercent?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(500) guideMarkupPercent?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(500) mealMarkupPercent?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(500) permitMarkupPercent?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(500) miscMarkupPercent?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(95) minMarginPercent?: number;

  @IsOptional() @IsInt() @Min(0) monthlyOverhead?: number;
  @IsOptional() @IsInt() @Min(1) filesPerMonth?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(100) gstPercent?: number;
  @IsOptional() @IsInt() @Min(0) roundTo?: number;
  @IsOptional() @IsString() currency?: string;
}
