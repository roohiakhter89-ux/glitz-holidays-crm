import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SEARCH_CONSOLE_PROVIDER, SearchConsoleService } from './search-console.service';

/**
 * Nightly Search Console pull.
 *
 * Runs at 05:00, an hour after the Google Ads sync, so the two do not compete
 * for the same window. Re-pulls a rolling 28 days rather than just the newest
 * day: Search Console restates recent figures, and the sync is keyed on
 * (siteId, date, page, query) so re-pulling updates in place.
 *
 * Silent when no integration is configured. That is the normal state until an
 * operator adds credentials, and a nightly error for an unconfigured optional
 * feature just trains people to ignore the log.
 */
@Injectable()
export class SearchConsoleSyncJob {
  private readonly logger = new Logger(SearchConsoleSyncJob.name);

  /** Guards against a slow run overlapping the next tick. */
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchConsole: SearchConsoleService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_5AM, { name: 'search-console-sync' })
  async run(): Promise<void> {
    if (this.running) {
      this.logger.warn('Previous Search Console sync still running, skipping this tick.');
      return;
    }

    const configured = await this.prisma.integration.count({
      where: {
        provider: SEARCH_CONSOLE_PROVIDER,
        isActive: true,
      },
    });
    if (configured === 0) return;

    const sites = await this.prisma.seoSite.findMany({ where: { isActive: true } });
    if (sites.length === 0) return;

    this.running = true;
    try {
      for (const site of sites) {
        try {
          const r = await this.searchConsole.sync(site.id, { days: 28 });
          this.logger.log(
            `Search Console nightly sync ${site.url}: ${r.rowsFetched} rows, ` +
              `${r.totalClicks} clicks, ${r.pagesTouched} pages, ` +
              `${r.offPageRowsUpdated} CTR values written back, ` +
              `${r.rescoredAudits} audits rescored`,
          );
        } catch (e: any) {
          // One misconfigured property must not stop the others.
          this.logger.warn(`Search Console sync skipped ${site.url}: ${e?.message ?? e}`);
        }
      }
    } catch (e: any) {
      this.logger.error(`Search Console nightly sync failed: ${e?.message ?? e}`);
    } finally {
      this.running = false;
    }
  }
}
