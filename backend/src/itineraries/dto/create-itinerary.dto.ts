import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateItineraryDto {
  @IsString() leadId: string;
  @IsString() @MinLength(2) @MaxLength(200) title: string;

  @IsOptional() @IsString() @MaxLength(200)  headline?: string;
  @IsOptional() @IsString() @MaxLength(4000) intro?: string;
  @IsOptional() @IsInt() @Min(1)             totalPax?: number;
  @IsOptional() @IsString() @MaxLength(4000) inclusions?: string;
  @IsOptional() @IsString() @MaxLength(4000) exclusions?: string;
}
