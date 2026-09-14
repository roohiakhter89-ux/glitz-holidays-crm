import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { searchconsole, type searchconsole_v1 } from '@googleapis/searchconsole';
import { PrismaService } from '../prisma/prisma.service';
import { decryptSecret } from '../common/crypto';
import { SeoService } from './seo.service';
import { SearchInsightsService } from './search-insights.service';
import {
  MAX_ROW_LIMIT,
  PageRollup,
  SYNC_DIMENSIONS,
  SearchAnalyticsRow,
  assertIsoDate,
  defaultWindow,
  DimensionDailyRow,
  mapDimensionRows,
  mapRows,
  mergeDimensionRows,
  normalisePropertyUrl,
  normalizePageUrl,
  rollupByPage,
  strikingDistance,
} from './search-console-mapping';
import {
  RawSearchConsoleCredentials,
  SearchConsoleAuthError,
  buildAuthClient,
  resolveAuthConfig,
} from './search-console-auth';

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

/** Stored credential blob. Auth method rules live in search-console-auth.ts. */
export type SearchConsoleCredentials = RawSearchConsoleCredentials;

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
  /** Number of latest page audit scores recomputed and updated. */
  rescoredAudits: number;
  /** Site, page, device and country totals stored (pulls without the query dimension). */
  dimensionRows: number;
}

@Injectable()
export class SearchConsoleService {
  private readonly logger = new Logger(SearchConsoleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly seo: SeoService,
    private readonly insights: SearchInsightsService,
  ) {}

  // ==========================================================================
  // Credentials
  // ==========================================================================

  async resolveCredentials(): Promise<SearchConsoleCredentials> {
    const row = await this.prisma.integration.findFirst({
      // Filtered by provider alone, so the lookup does not depend on which
      // category the row is filed under or on migration order during a deploy.
      where: {
        provider: SEARCH_CONSOLE_PROVIDER,
        isActive: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    if (!row) {
      throw new BadRequestException(
        'No active Google Search Console integration. Add one under Integrations → Search & analytics first.',
      );
    }

    let creds: SearchConsoleCredentials;
    try {
      creds = JSON.parse(decryptSecret(row.credentials)) as SearchConsoleCredentials;
    } catch {
      throw new BadRequestException(
        'Stored Search Console credentials could not be decrypted. Re-enter them under Integrations → Search & analytics.',
      );
    }

    // Validate the auth method up front so a misconfigured row fails with the
    // operator-facing reason rather than deep inside the Google client.
    try {
      resolveAuthConfig(creds);
    } catch (e: any) {
      throw new BadRequestException(e?.message ?? 'Invalid Search Console configuration.');
    }
    return creds;
  }

  /**
   * Authenticated client for whichever auth method the integration uses. Both
   * the service account and OAuth clients refresh their own access tokens.
   */
  private client(creds: SearchConsoleCredentials): searchconsole_v1.Searchconsole {
    const auth = buildAuthClient(resolveAuthConfig(creds));
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

    // 56 days by default: the current and previous 28-day windows the dashboard compares.
    const window = defaultWindow(opts.days ?? 56);
    const from = opts.from ?? window.from;
    const to = opts.to ?? window.to;

    const rows = await this.fetchRows(property, from, to);

    let created = 0;
    let updated = 0;
    let totalClicks = 0;
    let totalImpressions = 0;

    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toDate = new Date(`${to}T23:59:59.999Z`);

    // Pre-load all existing natural keys in the date window for this site.
    // This reduces thousands of sequential roundtrips to 1 bulk read.
    const existingRows = await this.prisma.seoSearchAnalytics.findMany({
      where: {
        siteId,
        date: { gte: fromDate, lte: toDate },
      },
      select: { id: true, date: true, page: true, query: true },
    });

    const existingMap = new Map<string, string>();
    for (const e of existingRows) {
      const k = `${e.date.toISOString().slice(0, 10)}|${e.page}|${e.query}`;
      existingMap.set(k, e.id);
    }

    const updates: { id: string; data: any }[] = [];
    const creates: any[] = [];

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

      const k = `${r.date}|${r.page}|${r.query}`;
      const existingId = existingMap.get(k);
      if (existingId) {
        updates.push({ id: existingId, data });
      } else {
        creates.push({ siteId, date, page: r.page, query: r.query, ...data });
      }
    }

    // Execute in chunks via transactions to prevent connection exhaustion
    const CHUNK_SIZE = 100;
    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
      const chunk = updates.slice(i, i + CHUNK_SIZE);
      await this.prisma.$transaction(
        chunk.map((u) =>
          this.prisma.seoSearchAnalytics.update({ where: { id: u.id }, data: u.data }),
        ),
      );
    }
    updated = updates.length;

    for (let i = 0; i < creates.length; i += CHUNK_SIZE) {
      const chunk = creates.slice(i, i + CHUNK_SIZE);
      await this.prisma.seoSearchAnalytics.createMany({
        data: chunk,
        skipDuplicates: true,
      });
    }
    created = creates.length;

    // Totals without the query dimension. Google leaves anonymized queries out
    // of any breakdown by query, so site and page figures summed from the rows
    // above would come out too low.
    const DIMENSION_PULLS: { dimension: string; dimensions: string[] }[] = [
      { dimension: 'site', dimensions: ['date'] },
      { dimension: 'page', dimensions: ['date', 'page'] },
      { dimension: 'device', dimensions: ['date', 'device'] },
      { dimension: 'country', dimensions: ['date', 'country'] },
    ];
    let dimensionRows = 0;
    for (const pull of DIMENSION_PULLS) {
      const pulled = await this.fetchDimensionRows(property, from, to, pull.dimensions);
      dimensionRows += await this.upsertDimensionRows(siteId, pull.dimension, from, to, pulled);
    }

    const rollups = rollupByPage(rows);
    const offPageRowsUpdated = await this.writeBackCtr(siteId, rollups);

    // Rescore all page audits on this site so the newly synced CTR data
    // immediately updates leaderboard scores.
    const rescoredAudits = await this.seo.rescoreAllPages(siteId);
    this.insights.invalidate(siteId);

    this.logger.log(
      `Search Console sync ${from}..${to} property=${property}: ${rows.length} rows ` +
        `(${created} new, ${updated} updated), ${rollups.length} pages, ` +
        `${totalClicks} clicks / ${totalImpressions} impressions, ` +
        `${rescoredAudits} audits rescored`,
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
      rescoredAudits,
      dimensionRows,
    };
  }

  /**
   * Fetch a pull without the query dimension: site totals (date only), or date
   * plus page, device or country. Paginates past the response cap like fetchRows.
   */
  async fetchDimensionRows(
    property: string,
    from: string,
    to: string,
    dimensions: string[],
  ): Promise<DimensionDailyRow[]> {
    assertIsoDate(from);
    assertIsoDate(to);
    const creds = await this.resolveCredentials();
    const api = this.client(creds);

    const out: DimensionDailyRow[] = [];
    let startRow = 0;
    for (;;) {
      let res;
      try {
        res = await api.searchanalytics.query({
          siteUrl: property,
          requestBody: {
            startDate: from,
            endDate: to,
            dimensions,
            rowLimit: MAX_ROW_LIMIT,
            startRow,
            dataState: 'final',
            type: 'web',
          },
        });
      } catch (e: any) {
        throw new BadRequestException(this.explain(e));
      }
      out.push(...mapDimensionRows(res.data.rows, dimensions));
      const returned = res.data.rows?.length ?? 0;
      if (returned < MAX_ROW_LIMIT) break;
      startRow += returned;
    }
    // Normalised page URLs can map two rows onto one key; merge before storing.
    return mergeDimensionRows(out);
  }

  /** Bulk upsert, same pattern as the query rows: one read, chunked writes. */
  private async upsertDimensionRows(
    siteId: string,
    dimension: string,
    from: string,
    to: string,
    rows: DimensionDailyRow[],
  ): Promise<number> {
    if (rows.length === 0) return 0;

    const existing = await this.prisma.seoSearchDimensionDaily.findMany({
      where: {
        siteId,
        dimension,
        date: { gte: new Date(`${from}T00:00:00.000Z`), lte: new Date(`${to}T23:59:59.999Z`) },
      },
      select: { id: true, date: true, key: true },
    });
    const ids = new Map<string, string>();
    for (const e of existing) ids.set(JSON.stringify([e.date.toISOString().slice(0, 10), e.key]), e.id);

    const updates: { id: string; data: { clicks: number; impressions: number; ctr: number; position: number } }[] = [];
    const creates: {
      siteId: string;
      dimension: string;
      date: Date;
      key: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }[] = [];

    for (const r of rows) {
      const data = { clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position };
      const id = ids.get(JSON.stringify([r.date, r.key]));
      if (id) updates.push({ id, data });
      else creates.push({ siteId, dimension, date: new Date(`${r.date}T00:00:00.000Z`), key: r.key, ...data });
    }

    const CHUNK = 100;
    for (let i = 0; i < updates.length; i += CHUNK) {
      await this.prisma.$transaction(
        updates
          .slice(i, i + CHUNK)
          .map((u) => this.prisma.seoSearchDimensionDaily.update({ where: { id: u.id }, data: u.data })),
      );
    }
    for (let i = 0; i < creates.length; i += CHUNK) {
      await this.prisma.seoSearchDimensionDaily.createMany({ data: creates.slice(i, i + CHUNK), skipDuplicates: true });
    }
    return rows.length;
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

      const targetUrl = normalizePageUrl(r.page) || r.page;

      await this.prisma.seoOffPage.upsert({
        where: { siteId_url: { siteId, url: targetUrl } },
        create: { siteId, url: targetUrl, searchConsoleCtr: r.ctr },
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
      const k = JSON.stringify([r.page, r.query]);
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

    const targetUrl = normalizePageUrl(page) || page;
    const variants = Array.from(
      new Set([page, targetUrl, targetUrl.endsWith('/') ? targetUrl.slice(0, -1) : `${targetUrl}/`]),
    );

    const rows = await this.prisma.seoSearchAnalytics.findMany({
      where: { siteId, page: { in: variants }, date: { gte: since } },
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

    if (e?.response?.data?.error === 'invalid_grant' || /invalid_grant/.test(String(msg))) {
      return (
        'Google rejected the refresh token (invalid_grant). If the OAuth consent screen is in ' +
        'Testing, refresh tokens expire after 7 days: publish it to Production, then generate a ' +
        'new refresh token.'
      );
    }
    if (status === 403) {
      return `Search Console denied access (403): ${msg}. Check the property string matches exactly, including the trailing slash on a URL-prefix property.`;
    }
    if (status === 401) {
      return `Search Console rejected the credentials (401): ${msg}. Re-test the integration under Integrations → Search & analytics.`;
    }
    if (status === 429) {
      return `Search Console rate limit hit (429): ${msg}. The daily cap is 50,000 rows per site.`;
    }
    return `Search Console error${status ? ` (${status})` : ''}: ${msg}`;
  }
}
