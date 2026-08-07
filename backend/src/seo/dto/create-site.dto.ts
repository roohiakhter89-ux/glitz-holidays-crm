import { IsArray, IsBoolean, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateSiteDto {
  @IsString() @MinLength(2) @MaxLength(120) name: string;

  @IsUrl({ require_protocol: true }) url: string;

  /** Extra paths to include in every audit. Homepage is always audited. */
  @IsOptional() @IsArray() @IsString({ each: true }) crawlPaths?: string[];

  @IsOptional() @IsBoolean() isActive?: boolean;
}
