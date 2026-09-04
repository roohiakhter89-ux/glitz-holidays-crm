import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * Window to pull from Google Ads.
 *
 * Dates are interpolated into a GAQL string, so the format is enforced here as
 * well as in assertIsoDate() — validation at the edge keeps a malformed value
 * from reaching the query builder at all.
 */
export class SyncGoogleAdsDto {
  /**
   * Which Ads account to pull. Omit to sync every account the credentials can
   * reach, which is what the scheduled job does.
   */
  @IsOptional() @IsString() @MaxLength(20)
  customerId?: string;

  /** Inclusive start, YYYY-MM-DD. Defaults to the lookback window. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  /** Inclusive end, YYYY-MM-DD. Defaults to today. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must be YYYY-MM-DD' })
  to?: string;
}
