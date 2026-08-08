import { IsDateString, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpsertDayDto {
  @IsOptional() @IsInt() @Min(1) dayNumber?: number; // omitted on create → appended
  @IsOptional() @IsDateString()  date?: string;
  @IsOptional() @IsString() @MaxLength(120)  city?: string;
  @IsOptional() @IsString() @MaxLength(200)  headline?: string;
  @IsOptional() @IsString() @MaxLength(2000) summary?: string;
}
