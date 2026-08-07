import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InterviewOutcome } from '@prisma/client';

export class QAItem {
  @IsString() @MaxLength(500) question: string;
  @IsOptional() @IsString() @MaxLength(2000) answer?: string;
  @IsOptional() @IsInt() @Min(1) @Max(5) rating?: number;
}

export class CreateInterviewDto {
  @IsString() @MinLength(2) @MaxLength(160) candidateName: string;
  @IsString() @MinLength(6) @MaxLength(20)  candidatePhone: string;
  @IsOptional() @IsEmail()                  candidateEmail?: string;
  @IsString() @MinLength(2) @MaxLength(120) role: string;
  @IsDateString()                           scheduledAt: string;
  @IsOptional() @IsInt() @Min(5) @Max(240)  durationMinutes?: number;

  @IsOptional() @IsString() interviewerId?: string;
  @IsOptional() @IsString() @MaxLength(160) interviewerName?: string;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => QAItem)
  questionnaire?: QAItem[];

  @IsOptional() @IsInt() @Min(1) @Max(5) overallRating?: number;
  @IsOptional() @IsString() @MaxLength(2000) strengths?: string;
  @IsOptional() @IsString() @MaxLength(2000) concerns?: string;
  @IsOptional() @IsEnum(InterviewOutcome)    outcome?: InterviewOutcome;
  @IsOptional() @IsString() @MaxLength(1000) outcomeNote?: string;
}
