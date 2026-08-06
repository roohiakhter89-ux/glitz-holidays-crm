import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { QuoteStatus } from '@prisma/client';

export class UpdateQuoteDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsEnum(QuoteStatus) status?: QuoteStatus;
  @IsOptional() @IsDateString() validUntil?: string;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
  @IsOptional() @IsString() @MaxLength(8000) terms?: string;
}
