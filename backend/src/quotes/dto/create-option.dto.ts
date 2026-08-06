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

export class CreateOptionDto {
  /** "Budget", "Standard", "Deluxe" — free text, as many as you like. */
  @IsString() @MinLength(1) @MaxLength(80) name: string;

  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsBoolean() isRecommended?: boolean;

  @IsOptional() @IsInt() @Min(1) adults?: number;
  @IsOptional() @IsInt() @Min(0) children?: number;
  @IsOptional() @IsInt() @Min(0) nights?: number;

  /** Option-level markup override. Omit to inherit service-type/global. */
  @IsOptional() @IsNumber() @Min(0) @Max(500) markupPercent?: number;
}
