import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Public payload from the landing-page beacon. Same shape as CaptureLeadDto's
 * attribution block on purpose — the two eventually converge on the same
 * dashboard rows.
 *
 * visitorId + sessionId are set by the snippet, not the server. The snippet
 * mints visitorId on first visit and keeps it in a first-party cookie; a
 * fresh sessionId is minted every 30 minutes of inactivity.
 */
export class TrackVisitDto {
  @IsString() @MinLength(6) @MaxLength(64)
  visitorId: string;

  @IsString() @MinLength(6) @MaxLength(64)
  sessionId: string;

  /** Slug OR full path. The service looks up the LandingPage by slug. */
  @IsString() @MinLength(1) @MaxLength(500)
  pagePath: string;

  @IsOptional() @IsString() @MaxLength(200) utmSource?: string;
  @IsOptional() @IsString() @MaxLength(200) utmMedium?: string;
  @IsOptional() @IsString() @MaxLength(200) utmCampaign?: string;
  @IsOptional() @IsString() @MaxLength(200) utmTerm?: string;
  @IsOptional() @IsString() @MaxLength(200) utmContent?: string;
  @IsOptional() @IsString() @MaxLength(300) gclid?: string;
  @IsOptional() @IsString() @MaxLength(300) fbclid?: string;
  @IsOptional() @IsString() @MaxLength(500) referrer?: string;
  @IsOptional() @IsString() @MaxLength(200) keyword?: string;
  @IsOptional() @IsString() @MaxLength(4) country?: string;
}
