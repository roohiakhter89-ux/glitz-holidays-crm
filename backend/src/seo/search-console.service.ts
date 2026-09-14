import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { IntegrationCategory } from '@prisma/client';
import { searchconsole, type searchconsole_v1 } from '@googleapis/searchconsole';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { decryptSecret } from '../common/crypto';
import {
  MAX_ROW_LIMIT,
  PageRollup,
  SYNC_DIMENSIONS,
  SearchAnalyticsRow,
  assertIsoDate,
  defaultWindow,
  mapRows,
  normalisePropertyUrl,
  rollupByPage,
  strikingDistance,
} from './search-console-mapping';

/**
 * Google Search Console reporting.
 *
 * Uses @googleapis/searchconsole, the single-API package from
 * google-api-nodejs-client. The full `googleapis` package is 214 MB because it
 * bundles every Google API; this one is 250 KB for the same endpoint and the
 * same auth.
 *
 * Verified against the v1 reference (Sept 2026):
 *   POST /webmasters/v3/sites/{siteUrl}/searchAnalytics/query
 *   scope: https://www.googleapis.com/auth/webmasters.readonly
 *   rowLimit 1-25000, startRow for pagination, 50k rows/day/site cap
 *   response rows: { keys[], clicks, impressions, ctr (0-1.0), position }
 */

export const SEARCH_CONSOLE_PROVIDER = 'google_search_console';

/** Read-only is all this needs; never request write scope for reporting. */
export const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

export interface SearchConsoleCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  siteUrl?: string;
}

export interface SyncResult {
  property: string;
  from: string;
  to: string;
  rowsFetched: number;
  created: number;
  updated: number;
  pagesTouched: number;
  totalClicks: number;
  totalImpressions: number;
  /** Page-level CTR rows written back to SeoOffPage for scoring. */
  offPageRowsUpdated: number;
}

@Injectable()
export class SearchConsoleService {
  private readonly logger = new Logger(SearchConsoleService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // Credentials
  // ==========================================================================

  async resolveCredentials(): Promise<SearchConsoleCredentials> {
    const row = await this.prisma.integration.findFirst({
      where: {
        category: IntegrationCategory.ADS,
        provider: SEARCH_CONSOLE_PROVIDER,
        isActive: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    if (!row) {
      throw new BadRequestException(
        'No active Google Search Console integration. Add one under Settings -> Integrations first.',
      );
    }

    let creds: SearchConsoleCredentials;
    try {
      creds = JSON.parse(decryptSecret(row.credentials)) as SearchConsoleCredentials;
    } catch {
      throw new BadRequestException(
        'Stored Search Console credentials could not be decrypted. Re-enter them under Settings -> Integrations.',
      );
    }

    for (const k of ['clientId', 'clientSecret', 'refreshToken'] as const) {
      if (!creds[k]) throw new BadRequestException(`Search Console integration is missing ${k}.`);
    }
    return creds;
  }

  /**
   * Authenticated client. The library refreshes the access token itself from
   * the refresh token, so there is no token cache to manage here.
   */
  private client(creds: SearchConsoleCredentials): searchconsole_v1.Searchconsole {
    const auth = new OAuth2Client({
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
    });
    auth.setCredentials({ refresh_token: creds.refreshToken, scope: SCOPES.join(' ') });
    return searchconsole({ version: 'v1', auth });
  }

  // ==========================================================================
  // Reads
  // ==========================================================================

  /** Properties these credentials can reach, so the operator picks from a list. */
  async listProperties(): Promise<{ properties: { siteUrl: string; permissionLevel: string }[] }> {
    const creds = await this.resolveCredentials();
    try {
      const res = await this.client(creds).sites.list({});
      const entries = res.data.siteEntry ?? [];
      return {
        properties: entries.map((e) => ({
          siteUrl: e.siteUrl ?? '',
          permissionLevel: e.permissionLevel ?? 'unknown',
        })),
      };
    } catch (e: any) {
      throw new BadRequestException(this.explain(e));
    }
  }

  /**
   * Fetch every row in a window, paginating past the 25,000-row response cap.
   *
   * Search Console caps a single response at MAX_ROW_LIMIT and a whole day at
   * 50,000 rows per site, so a wide window on a busy site genuinely needs more
   * than one request. Stops as soon as a page comes back short, which is the
   * documented end-of-results signal.
   */
  async fetchRows(
    property: string,
    from: string,
    to: string,
    opts: { maxRows?: number } = {},
  ): Promise<SearchAnalyticsRow[]> {
    assertIsoDate(from);
    assertIsoDate(to);
    if (from > to) throw new BadRequestException(`'from' (${from}) is after 'to' (${to}).`);

    const creds = await this.resolveCredentials();
    const api = this.client(creds);
    const maxRows = opts.maxRows ?? 50_000;

    const out: SearchAnalyticsRow[] = [];
    let startRow = 0;

    while (out.length < maxRows) {
      const rowLimit = Math.min(MAX_ROW_LIMIT, maxRows - out.length);
      let res;
      try {
        res = await api.searchanalytics.query({
          siteUrl: property,
          requestBody: {
            startDate: from,
            endDate: to,
            dimensions: [...SYNC_DIMENSIONS],
            rowLimit,
            startRow,
            // 'final' excludes fresh, still-moving data. Stable numbers matter
            // more here than the last day or two of partial figures.
            dataState: 'final',
            type: 'web',
          },
        });
      } catch (e: any) {
        throw new BadRequestException(this.explain(e));
      }

      const batch = mapRows(res.data.rows, SYNC_DIMENSIONS);
      out.push(...batch);

      const returned = res.data.rows?.length ?? 0;
      if (returned < rowLimit) break; // short page means no more results
      startRow += returned;
    }

    return out;
  }

  // ==========================================================================
  // Sync
  // ==========================================================================

  /**
   * Pull a window into SeoSearchAnalytics, then write page-level CTR back to
   * SeoOffPage so the existing score picks it up.
   *
   * That write-back is the point of the integration: searchConsoleCtr already
   * feeds calculatePageSignalPoints, and until now it could only be typed in
   * by hand. Only the CTR field is touched, so backlink counts an operator
   * entered are left alone.
   */
  async sync(
    siteId: string,
    opts: { property?: string; from?: string; to?: string; days?: number } = {},
  ): Promise<SyncResult> {
    const site = await this.prisma.seoSite.findUnique({ where: { id: siteId } });
    if (!site) throw new BadRequestException('Unknown site.');

    const creds = await this.resolveCredentials();
    const property = normalisePropertyUrl(opts.property || creds.siteUrl || site.url);
    if (!property) {
      throw new BadRequestException(
        'No Search Console property configured. Set one on the integration or pass it explicitly.',
      );
    }

    const window = defaultWindow(opts.days ?? 28);
    const from = opts.from ?? window.from;
    const to = opts.to ?? window.to;

    const rows = await this.fetchRows(property, from, to);

    let created = 0;
    let updated = 0;
    let totalClicks = 0;
    let totalImpressions = 0;

    for (const r of rows) {
      totalClicks += r.clicks;
      totalImpressions += r.impressions;

      const date = new Date(`${r.date}T00:00:00.000Z`);
      const data = {
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      };

      // Upsert on the natural key. Every component is NOT NULL, so unlike
      // AdSpend's key this genuinely dedupes on re-sync.
      const existing = await this.prisma.seoSearchAnalytics.findUnique({
        where: {
          siteId_date_page_query: { siteId, date, page: r.page, query: r.query },
        },
        select: { id: true },
      });

      if (existing) {
        await this.prisma.seoSearchAnalytics.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await this.prisma.seoSearchAnalytics.create({
          data: { siteId, date, page: r.page, query: r.query, ...data },
        });
        created++;
      }
    }

    const rollups = rollupByPage(rows);
    const offPageRowsUpdated = await this.writeBackCtr(siteId, rollups);

    this.logger.log(
      `Search Console sync ${from}..${to} property=${property}: ${rows.length} rows ` +
        `(${created} new, ${updated} updated), ${rollups.length} pages, ` +
        `${totalClicks} clicks / ${totalImpressions} impressions`,
    );

    return {
      property,
      from,
      to,
      rowsFetched: rows.length,
      created,
      updated,
      pagesTouched: rollups.length,
      totalClicks,
      totalImpressions,
      offPageRowsUpdated,
    };
  }

  /**
   * Write measured CTR onto the per-page off-page row.
   *
   * Creates a row when none exists so the number is not lost, but leaves every
   * other field at its default rather than inventing backlink counts. Under the
   * current scoring this can only raise a page's score, never lower it.
   */
  private async writeBackCtr(siteId: string, rollups: PageRollup[]): Promise<number> {
    let n = 0;
    for (const r of rollups) {
      // A page with no impressions has no meaningful CTR to record.
      if (r.impressions <= 0) continue;

      await this.prisma.seoOffPage.upsert({
        where: { siteId_url: { siteId, url: r.page } },
        create: { siteId, url: r.page, searchConsoleCtr: r.ctr },
        update: { searchConsoleCtr: r.ctr },
      });
      n++;
    }
    return n;
  }

  // ==========================================================================
  // Analysis
  // ==========================================================================

  /**
   * Queries ranking 11-20: already ranking, not yet on page one.
   *
   * Reads from stored rows rather than calling the API, so this is free to
   * refresh and works when the integration is offline.
   */
  async strikingDistanceReport(
    siteId: string,
    opts: { limit?: number; minImpressions?: number } = {},
  ) {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 28);

    const rows = await this.prisma.seoSearchAnalytics.findMany({
      where: { siteId, date: { gte: since }, position: { gte: 11, lte: 20 } },
      orderBy: { impressions: 'desc' },
      take: 5000,
    });

    // Collapse the per-day rows to one entry per page+query over the window.
    const acc = new Map<
      string,
      { page: string; query: string; clicks: number; impressions: number; posWeighted: number }
    >();
    for (const r of rows) {
      const k = `${r.page} ${r.query}`;
      let e = acc.get(k);
      if (!e) {
        e = { page: r.page, query: r.query, clicks: 0, impressions: 0, posWeighted: 0 };
        acc.set(k, e);
      }
      e.clicks += r.clicks;
      e.impressions += r.impressions;
      e.posWeighted += r.position * r.impressions;
    }

    const minImpr = opts.minImpressions ?? 10;
    return [...acc.values()]
      .filter((e) => e.query && e.impressions >= minImpr)
      .map((e) => ({
        page: e.page,
        query: e.query,
        clicks: e.clicks,
        impressions: e.impressions,
        ctr: e.impressions > 0 ? Math.round((e.clicks / e.impressions) * 10000) / 100 : 0,
        position: e.impressions > 0 ? Math.round((e.posWeighted / e.impressions) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, opts.limit ?? 100);
  }

  /** Stored performance for one page over the trailing window. */
  async pagePerformance(siteId: string, page: string, days = 28) {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days);

    const rows = await this.prisma.seoSearchAnalytics.findMany({
      where: { siteId, page, date: { gte: since } },
      orderBy: { impressions: 'desc' },
    });

    const mapped: SearchAnalyticsRow[] = rows.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      page: r.page,
      query: r.query,
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    }));

    const [rollup] = rollupByPage(mapped);
    return {
      page,
      days,
      totals: rollup ?? {
        page,
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
        queryCount: 0,
      },
      topQueries: mapped
        .filter((r) => r.query)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 25),
      strikingDistance: strikingDistance(mapped).slice(0, 25),
    };
  }

  /**
   * Turn a Google API error into something an operator can act on.
   * The raw errors are verbose and bury the one line that matters.
   */
  private explain(e: any): string {
    const status = e?.code ?? e?.response?.status;
    const msg = e?.response?.data?.error?.message ?? e?.message ?? String(e);

    if (status === 403) {
      return `Search Console denied access (403): ${msg}. Check the property string matches exactly, including the trailing slash on a URL-prefix property.`;
    }
    if (status === 401) {
      return `Search Console rejected the credentials (401): ${msg}. The refresh token may have been revoked.`;
    }
    if (status === 429) {
      return `Search Console rate limit hit (429): ${msg}. The daily cap is 50,000 rows per site.`;
    }
    return `Search Console error${status ? ` (${status})` : ''}: ${msg}`;
  }
}
