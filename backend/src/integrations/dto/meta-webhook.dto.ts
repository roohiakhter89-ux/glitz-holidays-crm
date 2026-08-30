import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class MetaChangeValue {
  @IsString()
  leadgen_id: string;

  @IsOptional()
  @IsString()
  form_id?: string;

  @IsOptional()
  @IsString()
  page_id?: string;
}

class MetaChange {
  @IsString()
  field: string;

  @ValidateNested()
  @Type(() => MetaChangeValue)
  value: MetaChangeValue;
}

class MetaEntry {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  time?: number | string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetaChange)
  changes: MetaChange[];
}

export class MetaLeadgenWebhookDto {
  @IsString()
  object: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetaEntry)
  entry: MetaEntry[];
}
