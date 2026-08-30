import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { LeadSource, LeadStatus } from '@prisma/client';

export class AudienceFilterDto {
  @IsOptional()
  @IsArray()
  @IsEnum(LeadStatus, { each: true })
  statuses?: LeadStatus[];

  @IsOptional()
  @IsArray()
  @IsEnum(LeadSource, { each: true })
  sources?: LeadSource[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  minScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  inactiveDays?: number;

  @IsOptional()
  @IsString()
  destination?: string;
}
