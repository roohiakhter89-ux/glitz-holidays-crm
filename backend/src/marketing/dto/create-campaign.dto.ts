import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignChannel } from '@prisma/client';
import { AudienceFilterDto } from './audience-filter.dto';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(CampaignChannel)
  channel: CampaignChannel;

  @IsObject()
  @ValidateNested()
  @Type(() => AudienceFilterDto)
  audienceFilter: AudienceFilterDto;

  // WhatsApp template configuration
  @IsOptional()
  @IsString()
  templateName?: string;

  @IsOptional()
  @IsString()
  templateLang?: string;

  @IsOptional()
  @IsObject()
  templateParams?: Record<string, string>;

  // Email configuration
  @IsOptional()
  @IsString()
  emailSubject?: string;

  @IsOptional()
  @IsString()
  emailHtml?: string;

  // Schedule or Draft
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
