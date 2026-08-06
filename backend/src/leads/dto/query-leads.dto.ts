import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LeadSource, LeadStatus } from '@prisma/client';

export class QueryLeadsDto {
  @IsOptional() @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional() @IsEnum(LeadSource)
  source?: LeadSource;

  @IsOptional() @IsString()
  assignedToId?: string;

  /** matches name, phone, email or destination */
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsDateString()
  from?: string;

  @IsOptional() @IsDateString()
  to?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;
}
