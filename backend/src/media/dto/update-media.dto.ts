import { IsOptional, IsString } from 'class-validator';

export class UpdateMediaDto {
  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  pageSlug?: string;

  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  tags?: string[] | string;
}
