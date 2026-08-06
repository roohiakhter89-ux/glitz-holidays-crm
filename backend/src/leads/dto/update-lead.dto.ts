import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { LeadStatus } from '@prisma/client';

export class UpdateLeadDto {
  @IsOptional() @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional() @IsString()
  assignedToId?: string | null;

  @IsOptional() @IsString() @MaxLength(300)
  lostReason?: string;

  @IsOptional() @IsDateString()
  nextFollowUp?: string;

  @IsOptional() @IsString() @MaxLength(200)
  destination?: string;

  @IsOptional() @IsDateString()
  travelDate?: string;

  @IsOptional() @IsInt() @Min(0)
  nights?: number;

  @IsOptional() @IsInt() @Min(0)
  adults?: number;

  @IsOptional() @IsInt() @Min(0)
  children?: number;

  @IsOptional() @IsInt() @Min(0)
  budget?: number;

  @IsOptional() @IsString() @MaxLength(120)
  name?: string;

  @IsOptional() @IsString() @MaxLength(20)
  phone?: string;

  @IsOptional() @IsString() @MaxLength(200)
  email?: string;
}
