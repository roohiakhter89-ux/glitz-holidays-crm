import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CampaignChannel, CampaignStatus } from '@prisma/client';

export class QueryCampaignsDto {
  @IsOptional()
  @IsEnum(CampaignChannel)
  channel?: CampaignChannel;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
