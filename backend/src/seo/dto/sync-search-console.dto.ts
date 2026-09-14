import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

/**
 * Window and property to pull from Search Console.
 *
 * Every field optional: the common case is a bare POST that syncs the default
 * 28-day window for the property configured on the integration.
 */
export class SyncSearchConsoleDto {
  /**
   * Override the property. Accepts a domain property
   * (sc-domain:example.com) or a URL-prefix property (https://example.com/).
   * Omit to use the one stored on the integration.
   */
  @IsOptional() @IsString() @MaxLength(300)
  property?: string;

  /** Inclusive start, YYYY-MM-DD. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  /** Inclusive end, YYYY-MM-DD. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must be YYYY-MM-DD' })
  to?: string;

  /**
   * Trailing days to pull when from/to are omitted. Capped at 480 because
   * Search Console only retains about 16 months of data.
   */
  @IsOptional() @IsInt() @Min(1) @Max(480)
  days?: number;
}
