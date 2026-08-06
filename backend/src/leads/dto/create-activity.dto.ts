import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ActivityType } from '@prisma/client';

export class CreateActivityDto {
  @IsOptional() @IsEnum(ActivityType)
  type?: ActivityType;

  @IsString() @MinLength(1) @MaxLength(4000)
  content: string;
}
