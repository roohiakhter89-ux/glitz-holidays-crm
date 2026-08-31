import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateOffPageDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsNumber()
  backlinkCount?: number;

  @IsOptional()
  @IsNumber()
  referringDomains?: number;

  @IsOptional()
  @IsNumber()
  pageAuthority?: number;

  @IsOptional()
  @IsNumber()
  prMentions?: number;

  @IsOptional()
  @IsNumber()
  socialShares?: number;

  @IsOptional()
  @IsNumber()
  searchConsoleCtr?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
