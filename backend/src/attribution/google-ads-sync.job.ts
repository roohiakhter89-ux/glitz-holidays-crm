import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IntegrationCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AttributionService } from './attribution.service';
import { GoogleAdsService } from './google-ads.service';
import { GOOGLE_ADS_SOURCE } from './google-ads-mapping';

/**
 * Nightly Google Ads pull.
 *
 * Runs at 04:00 server time: after Google has settled the previous day and
 * before anyone opens the dashboard. Re-pulls a rolling window rather than
 * just yesterday because Google restates recent cost and conversion figures —
 * the sync is keyed on (externalSource, externalId), so re-pulling updates
 * instead of duplicating.
 *
 * Silent when no Google Ads integration is configured. This is the normal
 * state until an operator adds credentials, and a nightly error log for an
 * unconfigured optional feature is noise that trains people to ignore logs.
 */
@Injectable()
export class GoogleAdsSyncJob {
  private readonly logger = new Logger(GoogleAdsSyncJob.name);

  /** Guards against a slow run overlapping the next tick. */
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleAds: GoogleAdsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM, { name: 'google-ads-spend-sync' })
  async run(): Promise<void> {
    if (this.running) {
      this.logger.warn('Previous Google Ads sync still running — skipping this tick.');
      return;
    }

    const configured = await this.prisma.integration.count({
      where: {
        category: IntegrationCategory.ADS,
        provider: GOOGLE_ADS_SOURCE,
        isActive: true,
      },
    });
    if (configured === 0) return;

    this.running = true;
    try {
      const results = await this.googleAds.syncAllAccounts(
        AttributionService.SYNC_LOOKBACK_DAYS,
      );
      const rows = results.reduce((a, r) => a + r.rowsFetched, 0);
      const spend = results.reduce((a, r) => a + r.totalAmount, 0);
      this.logger.log(
        `Google Ads nightly sync: ${results.length} account(s), ${rows} rows, total ${spend}`,
      );
    } catch (e: any) {
      // Never let a scheduled job take the process down. Expired refresh
      // tokens and sunset API versions both land here.
      this.logger.error(`Google Ads nightly sync failed: ${e?.message ?? e}`);
    } finally {
      this.running = false;
    }
  }
}
