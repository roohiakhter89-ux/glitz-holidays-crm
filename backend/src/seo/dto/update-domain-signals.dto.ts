import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Site-wide off-page signals. Every field optional so the panel can be filled
 * in over time rather than demanding all eleven numbers at once.
 *
 * Bounds are enforced because these feed a score: a rating of 9 or a
 * completeness of 400 would silently inflate it.
 */
export class UpdateDomainSignalsDto {
  // --- Google Business Profile ---
  @IsOptional() @IsInt() @Min(0) @Max(100)
  gbpCompleteness?: number;

  @IsOptional() @IsInt() @Min(0)
  gbpReviewCount?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(5)
  gbpAverageRating?: number;

  @IsOptional() @IsInt() @Min(0)
  gbpPostsLast30d?: number;

  // --- Citations ---
  @IsOptional() @IsInt() @Min(0)
  citationsTotal?: number;

  @IsOptional() @IsInt() @Min(0)
  citationsNapConsistent?: number;

  // --- Brand mentions ---
  @IsOptional() @IsInt() @Min(0)
  brandMentionsLinked?: number;

  @IsOptional() @IsInt() @Min(0)
  brandMentionsUnlinked?: number;

  // --- Site-level authority ---
  @IsOptional() @IsInt() @Min(0)
  referringDomainsTotal?: number;

  @IsOptional() @IsInt() @Min(0)
  toxicDomainCount?: number;

  @IsOptional() @IsDateString()
  verifiedOn?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;
}
