import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MealPlan, RateBasis, Season } from '@prisma/client';

export class CreateRateDto {
  /** "Deluxe Room" for a hotel, "Toyota Innova" for transport. */
  @IsString() @MinLength(1) @MaxLength(120)
  variant: string;

  @IsEnum(Season)
  season: Season;

  /** Hotels only. Leave out for transport/guides. */
  @IsOptional() @IsEnum(MealPlan)
  mealPlan?: MealPlan;

  @IsOptional() @IsEnum(RateBasis)
  rateBasis?: RateBasis;

  /** REQUIRED — what you pay the supplier. */
  @IsInt() @Min(0)
  netRate: number;

  /** Optional — published rate. */
  @IsOptional() @IsInt() @Min(0)
  rackRate?: number;

  @IsOptional() @IsInt() @Min(0) extraBedRate?: number;
  @IsOptional() @IsInt() @Min(0) childRate?: number;
  @IsOptional() @IsInt() @Min(1) maxOccupancy?: number;

  @IsOptional() @IsDateString() validFrom?: string;
  @IsOptional() @IsDateString() validTo?: string;

  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
