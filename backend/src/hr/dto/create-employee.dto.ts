import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EmploymentStatus, EmploymentType } from '@prisma/client';

export class CreateEmployeeDto {
  @IsString() @MinLength(2) @MaxLength(160) fullName: string;
  @IsString() @MinLength(6) @MaxLength(20)  phone: string;
  @IsString() @MinLength(2) @MaxLength(120) designation: string;
  @IsDateString() joinedOn: string;

  @IsOptional() @IsString() @MaxLength(160) fatherName?: string;
  @IsOptional() @IsString() @MaxLength(500) photoUrl?: string;
  @IsOptional() @IsString() @MaxLength(4)   bloodGroup?: string;
  @IsOptional() @IsDateString()             dob?: string;
  @IsOptional() @IsString() @MaxLength(20)  gender?: string;
  @IsOptional() @IsString() @MaxLength(60)  nationality?: string;

  @IsOptional() @IsString() @MaxLength(20)  altPhone?: string;
  @IsOptional() @IsEmail()                  email?: string;
  @IsOptional() @IsString() @MaxLength(300) addressLine?: string;
  @IsOptional() @IsString() @MaxLength(80)  city?: string;
  @IsOptional() @IsString() @MaxLength(80)  state?: string;
  @IsOptional() @IsString() @MaxLength(12)  pincode?: string;

  @IsOptional() @IsString() @MaxLength(120) emergencyContactName?: string;
  @IsOptional() @IsString() @MaxLength(20)  emergencyContactPhone?: string;
  @IsOptional() @IsString() @MaxLength(40)  emergencyContactRelation?: string;

  @IsOptional() @IsString() @MaxLength(20)  aadhaar?: string;
  @IsOptional() @IsString() @MaxLength(12)  pan?: string;

  @IsOptional() @IsString() @MaxLength(80)  department?: string;
  @IsOptional() @IsEnum(EmploymentType)     employmentType?: EmploymentType;
  @IsOptional() @IsEnum(EmploymentStatus)   status?: EmploymentStatus;
  @IsOptional() @IsDateString()             confirmedOn?: string;
  @IsOptional() @IsString()                 reportsToId?: string;
  @IsOptional() @IsString()                 userId?: string;

  // Salary components — monthly, whole rupees.
  @IsOptional() @IsInt() @Min(0)  ctcMonthly?: number;
  @IsOptional() @IsInt() @Min(0)  basicMonthly?: number;
  @IsOptional() @IsInt() @Min(0)  hraMonthly?: number;
  @IsOptional() @IsInt() @Min(0)  allowMonthly?: number;
  @IsOptional() @IsInt() @Min(0)  pfMonthly?: number;
  @IsOptional() @IsInt() @Min(0)  esiMonthly?: number;
  @IsOptional() @IsInt() @Min(0)  taxMonthly?: number;
  @IsOptional() @IsInt() @Min(0)  otherDedMonthly?: number;

  @IsOptional() @IsString() @MaxLength(120) bankName?: string;
  @IsOptional() @IsString() @MaxLength(40)  accountNumber?: string;
  @IsOptional() @IsString() @MaxLength(20)  ifsc?: string;

  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
