import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { ItineraryItemKind } from '@prisma/client';

export class UpsertItemDto {
  @IsEnum(ItineraryItemKind) kind: ItineraryItemKind;
  @IsString() @MinLength(1) @MaxLength(200) title: string;
  @IsOptional() @IsString() @MaxLength(60)   time?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(200)  location?: string;
  @IsOptional() @IsString()                  vendorId?: string;
  @IsOptional() @IsInt() @Min(0)             sortOrder?: number;
}
