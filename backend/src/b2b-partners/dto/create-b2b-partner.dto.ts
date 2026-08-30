import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateB2bPartnerDto {
  @IsString()
  agencyName: string;

  @IsString()
  contactName: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionRate?: number;
}
