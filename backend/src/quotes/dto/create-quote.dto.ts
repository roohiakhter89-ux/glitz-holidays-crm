import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateQuoteDto {
  @IsString() leadId: string;

  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) title?: string;
  @IsOptional() @IsDateString() validUntil?: string;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
  @IsOptional() @IsString() @MaxLength(8000) terms?: string;
}
