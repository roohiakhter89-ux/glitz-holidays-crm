import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpsertOptionDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(80) name?: string;
  @IsOptional() @IsInt() @Min(0)                          sortOrder?: number;
  @IsOptional() @IsBoolean()                              isRecommended?: boolean;
  @IsOptional() @IsNumber() @Min(0) @Max(500)             markupPercent?: number | null;
}
