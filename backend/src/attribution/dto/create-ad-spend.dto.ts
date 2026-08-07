import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { AdChannel } from '@prisma/client';

export class CreateAdSpendDto {
  /** Any ISO date — the service floors to midnight UTC. */
  @IsDateString()
  spendDate: string;

  @IsEnum(AdChannel)
  channel: AdChannel;

  @IsOptional() @IsString() @MaxLength(200)
  campaign?: string;

  @IsOptional() @IsString() @MaxLength(200)
  adGroup?: string;

  @IsOptional() @IsString()
  landingPageId?: string;

  /** Amount in the smallest currency unit (paise for INR). */
  @IsInt() @Min(0)
  amount: number;

  @IsOptional() @IsString() @MaxLength(4)
  currency?: string;

  @IsOptional() @IsInt() @Min(0)
  impressions?: number;

  @IsOptional() @IsInt() @Min(0)
  clicks?: number;

  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}
