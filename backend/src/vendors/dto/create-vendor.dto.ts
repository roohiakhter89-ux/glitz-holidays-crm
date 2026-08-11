import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { VendorType } from '@prisma/client';

export class CreateVendorDto {
  @IsString() @MinLength(2) @MaxLength(200)
  name: string;

  @IsEnum(VendorType)
  type: VendorType;

  @IsOptional() @IsString() @MaxLength(120) city?: string;
  @IsOptional() @IsString() @MaxLength(120) area?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;

  @IsOptional() @IsInt() @Min(1) @Max(7) starRating?: number;
  @IsOptional() @IsString() @MaxLength(50) falconGrade?: string;

  @IsOptional() @IsString() @MaxLength(120) contactPerson?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @MaxLength(30) altPhone?: string;
  @IsOptional() @IsEmail() email?: string;

  @IsOptional() @IsString() @MaxLength(120) bankName?: string;
  @IsOptional() @IsString() @MaxLength(50) accountNumber?: string;
  @IsOptional() @IsString() @MaxLength(20) ifsc?: string;

  @IsOptional() @IsString() @MaxLength(20) gstin?: string;
  @IsOptional() @IsString() @MaxLength(15) panNumber?: string;
  @IsOptional() @IsString() @MaxLength(300) paymentTerms?: string;

  @IsOptional() @IsString() @MaxLength(100) unionZone?: string;

  // Hotel-specific. Times as HH:MM to sidestep timezone drift.
  @IsOptional() @Matches(/^\d{2}:\d{2}$/, { message: 'checkInTime must be HH:MM' })
  checkInTime?: string;
  @IsOptional() @Matches(/^\d{2}:\d{2}$/, { message: 'checkOutTime must be HH:MM' })
  checkOutTime?: string;
  @IsOptional() @IsInt() @Min(1) @Max(1000) roomCount?: number;
  @IsOptional() @IsArray() @ArrayMaxSize(30)
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
