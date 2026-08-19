import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpsertIntegrationDto {
  @IsString() @MaxLength(60) provider: string;
  @IsOptional() @IsString() @MaxLength(120) label?: string;

  /** Freeform key/value credential map — validated against provider registry in service. */
  @IsObject()
  credentials: Record<string, unknown>;

  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() priority?: number;
}
