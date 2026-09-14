import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AUDIT_VERSION, CheckResult } from './audit-types';
import {
  CrawlTarget,
  CrawledPage,
  crawlSite,
  fetchPage,
  fetchRobots,
  fetchSitemaps,
  mapPool,
  pageSpeedKey,
  psiPriority,
  robotsContextFor,
  runPageSpeed,
  siteInputs,
} from './audit-crawler';
import {
  FetchOutcome,
  RobotsContext,
  SITE_SCOPE_CHECK_IDS,
  classifyPage,
  pageDateModified,
  runPageChecks,
  sitemapLastmodCheck,
} from './audit-checks';
import { PageFacts, parsePage } from './audit-html';
import { SitePageAnalysis, analyseSite } from './audit-site';
import { PageVitals, VitalsSet, hasAnyVital, vitalsFromOrigin, vitalsFromPsi } from './audit-vitals';
import { contentHash, contentTokens } from './audit-content';
import { DomainSignals, HealthScore, OffPageSignals, computeHealthScore } from './seo-scoring';
import { CURRENT_AUDITS, StoredAuditChecks, readStoredChecks, stripSupersededResults, taskList } from './seo-audit-storage';
import { HOMEPAGE_ENTRY, MANIFEST } from './seo-manifest';
import { normalizePageUrl } from './search-console-mapping';

const MAX_PAGES = 600;
const CRAWL_CONCURRENCY = 4;
const PSI_CONCURRENCY = 2;
const PSI_MAX_PAGES = Number(process.env.SEO_PSI_MAX_PAGES) > 0 ? Number(process.env.SEO_PSI_MAX_PAGES) : 30;
/** Field data is a 28-day rolling window, so an older reading is not carried forward. */
const VITALS_MAX_AGE_MS = 28 * 86_400_000;

const NO_KEY_NOTE = 'Not measured: PAGESPEED_API_KEY is not set on the server';
const QUOTA_NOTE = 'Not measured: the PageSpeed Insights quota was reached';

export interface AuditRunSummary {
  pagesAudited: number;
  /** Mean score of pages that returned 200. */
  averageScore: number | null;
  blockedPages: number;
  /** Pages failing the content-specific-to-this-page check. */
  nearDuplicatePages: number;
  vitalsMeasured: number;
  vitalsNote: string | null;
  robots: RobotsContext['state'];
  sitemapUrls: number | null;
  sitemapError: string | null;
  truncated: boolean;
}

export interface AuditRunStatus {
  runId: string;
  siteId: string;
  state: 'running' | 'done' | 'failed';
  phase: 'crawling' | 'analysing' | 'pagespeed' | 'saving' | 'done';
  startedAt: string;
  finishedAt: string | null;
  pagesTotal: number;
  pagesCrawled: number;
  psiTotal: number;
  psiDone: number;
  error: string | null;
  summary: AuditRunSummary | null;
}

interface SiteRow {
  id: string;
  url: string;
  crawlPaths: string[];
}

interface EvaluateInput {
  url: string;
  fetched: FetchOutcome;
  facts: PageFacts | null;
  family: string | null;
  targetKeyword: string | null;
  robots: RobotsContext;
  inSitemap: boolean | null;
  analysis: SitePageAnalysis | null;
  analysedAt: string | null;
  vitals: PageVitals | null;
  vitalsNote: string | null;
  previous: StoredAuditChecks | null;
  siteHost: string;
  extraChecks: CheckResult[];
  offPage: OffPageSignals | null;
  domain: DomainSignals | null;
}

interface Evaluated {
  url: string;
  results: CheckResult[];
  breakdown: HealthScore;
  stored: StoredAuditChecks;
  vitals: PageVitals | null;
  error: string | null;
}

/**
 * Runs page health audits.
 *
 * A full audit crawls the manifest, the configured paths and the sitemap,
 * compares the pages with each other, measures Core Web Vitals on the most
 * important pages, and stores one SeoAudit row per page. It takes minutes, so
 * it runs in the background and reports progress through status().
 *
 * Run state lives in memory. A restart mid-run loses the progress report but
 * nothing already stored; the next run simply starts over.
 */
@Injectable()
export class SeoAuditService {
  private readonly logger = new Logger(SeoAuditService.name);
  private readonly runs = new Map<string, AuditRunStatus>();
  private readonly pending = new Map<string, Promise<void>>();

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async refreshAll(): Promise<void> {
    const sites = await this.prisma.seoSite.findMany({ where: { isActive: true } });
    for (const site of sites) {
      try {
        await this.start(site.id);
        await this.pending.get(site.id);
      } catch (err) {
        this.logger.error(`Scheduled audit failed for site ${site.id}: ${(err as Error).message}`);
      }
    }
  }

  async startAll(): Promise<AuditRunStatus[]> {
    const sites = await this.prisma.seoSite.findMany({ where: { isActive: true } });
    return Promise.all(sites.map((s) => this.start(s.id)));
  }

  status(siteId: string): AuditRunStatus | null {
    return this.runs.get(siteId) ?? null;
  }

  /** Start a full audit, or return the one already running for this site. */
  async start(siteId: string): Promise<AuditRunStatus> {
    const site = await this.prisma.seoSite.findUnique({ where: { id: siteId } });
    if (!site) throw new NotFoundException('Site not found');

    const current = this.runs.get(siteId);
    if (current?.state === 'running') return current;

    const status: AuditRunStatus = {
      runId: randomUUID(),
      siteId,
      state: 'running',
      phase: 'crawling',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      pagesTotal: 0,
      pagesCrawled: 0,
      psiTotal: 0,
      psiDone: 0,
      error: null,
      summary: null,
    };
    this.runs.set(siteId, status);

    const run = this.execute(site, status)
      .catch((err: unknown) => {
        status.state = 'failed';
        status.error = err instanceof Error ? err.message : String(err);
        status.finishedAt = new Date().toISOString();
        this.logger.error(`Audit ${status.runId} for site ${siteId} failed: ${status.error}`);
      })
      .finally(() => this.pending.delete(siteId));
    this.pending.set(siteId, run);
    return status;
  }

  private async execute(site: SiteRow, status: AuditRunStatus): Promise<void> {
    const crawl = await crawlSite(site.url, this.targetsFor(site), {
      maxPages: MAX_PAGES,
      concurrency: CRAWL_CONCURRENCY,
      onProgress: (done, total) => {
        status.pagesCrawled = done;
        status.pagesTotal = total;
      },
    });

    status.phase = 'analysing';
    const analysis = analyseSite(siteInputs(crawl));
    const previous = await this.latestStored(site.id);
    const analysedAt = new Date().toISOString();

    status.phase = 'pagespeed';
    const vitals = await this.measureVitals(crawl.pages, previous, status);

    const { offPage, domain } = await this.linkSignals(site.id);

    const evaluated = crawl.pages.map((page) => {
      const pageVitals = vitals.forPage(page.key);
      return this.evaluate({
        url: page.url,
        fetched: page.fetched,
        facts: page.facts,
        family: page.family,
        targetKeyword: page.targetKeyword,
        robots: robotsContextFor(crawl.robots, page.url),
        inSitemap: crawl.sitemap.urls ? crawl.sitemap.urls.has(page.key) : null,
        analysis: analysis.get(page.key) ?? null,
        analysedAt,
        vitals: pageVitals.vitals,
        vitalsNote: pageVitals.note,
        previous: previous.get(page.key) ?? null,
        siteHost: crawl.host,
        extraChecks: page.source === 'home' ? [sitemapLastmodCheck(crawl.sitemap.lastmod)] : [],
        offPage: offPage.get(page.key) ?? null,
        domain,
      });
    });

    status.phase = 'saving';
    const rows = evaluated.map((e) => this.toRow(site.id, status.runId, e));
    for (let i = 0; i < rows.length; i += 50) {
      await this.prisma.seoAudit.createMany({ data: rows.slice(i, i + 50) as Prisma.SeoAuditCreateManyInput[] });
    }
    await stripSupersededResults(this.prisma, site.id);

    const live = evaluated.filter((e) => e.results.find((r) => r.id === 'http-status')?.severity === 'pass');
    status.summary = {
      pagesAudited: evaluated.length,
      averageScore: live.length
        ? Math.round(live.reduce((sum, e) => sum + e.breakdown.finalScore, 0) / live.length)
        : null,
      blockedPages: evaluated.filter((e) => e.breakdown.blockedBy).length,
      nearDuplicatePages: evaluated.filter((e) => e.results.some((r) => r.id === 'unique-content' && r.severity === 'fail')).length,
      vitalsMeasured: vitals.measuredCount,
      vitalsNote: vitals.note,
      robots: crawl.robots.state,
      sitemapUrls: crawl.sitemap.urls?.size ?? null,
      sitemapError: crawl.sitemap.error,
      truncated: crawl.truncated,
    };
    status.state = 'done';
    status.phase = 'done';
    status.finishedAt = new Date().toISOString();
    this.logger.log(
      `Audit ${status.runId}: ${evaluated.length} pages, average ${status.summary.averageScore}, ` +
        `${status.summary.blockedPages} blocked, ${status.summary.nearDuplicatePages} near-duplicates, ` +
        `${vitals.measuredCount} measured by PageSpeed`,
    );
  }

  /**
   * Audit one page now. Checks that need the whole crawl (uniqueness, duplicate
   * titles, inbound links) reuse this page's results from the last full audit
   * and say so; everything else is measured fresh.
   */
  async auditPage(siteId: string, rawUrl: string, keyword?: string) {
    const site = await this.prisma.seoSite.findUnique({ where: { id: siteId } });
    if (!site) throw new NotFoundException('Site not found');

    let url: string;
    try {
      url = new URL(rawUrl, site.url).toString();
    } catch {
      throw new BadRequestException('Invalid URL');
    }
    const key = normalizePageUrl(url);
    const base = new URL(site.url);
    const target = this.targetsFor(site).find((t) => normalizePageUrl(t.url) === key);

    const [robots, page, previous, signals] = await Promise.all([
      fetchRobots(base.origin),
      fetchPage(url),
      this.latestStored(siteId),
      this.linkSignals(siteId),
    ]);
    const sitemap = await fetchSitemaps(base.origin, robots.file?.sitemaps ?? [], base.hostname);

    let facts: PageFacts | null = null;
    if (page.html) {
      try {
        facts = parsePage(page.html, page.outcome.finalUrl);
      } catch {
        facts = null;
      }
    }

    const prev = previous.get(key) ?? null;
    const apiKey = pageSpeedKey();
    let vitals: PageVitals | null = null;
    let vitalsNote: string | null = null;
    if (apiKey && facts) {
      const psi = await runPageSpeed(url, apiKey);
      if (psi.ok) vitals = vitalsFromPsi(psi.parsed, new Date().toISOString());
      else vitalsNote = psi.status === 429 ? QUOTA_NOTE : `Not measured: PageSpeed Insights failed (${psi.message})`;
    }
    if (!vitals && prev && this.isFresh(prev.vitals)) {
      vitals = prev.vitals;
      vitalsNote = null;
    }
    if (!vitals && !vitalsNote) vitalsNote = NO_KEY_NOTE;

    const analysedAt = prev?.page.analysedAt ?? null;
    const isHome = normalizePageUrl(new URL('/', site.url).toString()) === key;
    const evaluated = this.evaluate({
      url,
      fetched: page.outcome,
      facts,
      family: target?.family ?? prev?.page.family ?? null,
      targetKeyword: keyword ?? target?.targetKeyword ?? null,
      robots: robotsContextFor(robots, url),
      inSitemap: sitemap.urls ? sitemap.urls.has(key) : null,
      analysis: prev?.page.analysis ?? null,
      analysedAt,
      vitals,
      vitalsNote,
      previous: prev,
      siteHost: base.hostname,
      extraChecks: isHome ? [sitemapLastmodCheck(sitemap.lastmod)] : [],
      offPage: signals.offPage.get(key) ?? null,
      domain: signals.domain,
    });

    if (analysedAt) {
      const from = ` (from the full audit on ${analysedAt.slice(0, 10)})`;
      for (const r of evaluated.results) {
        if (SITE_SCOPE_CHECK_IDS.has(r.id) && r.severity !== 'na' && r.id !== 'in-sitemap' && r.id !== 'sitemap-lastmod') {
          r.detail = `${r.detail ?? ''}${from}`;
        }
      }
    }

    const created = await this.prisma.seoAudit.create({ data: this.toRow(siteId, randomUUID(), evaluated) });
    await stripSupersededResults(this.prisma, siteId);
    return created;
  }

  // --------------------------------------------------------------------------

  private evaluate(i: EvaluateInput): Evaluated {
    const hash = i.facts ? contentHash(contentTokens(i.facts.mainText)) : null;
    const dateModified = pageDateModified(i.facts);
    const pageType = classifyPage(i.url, i.family, i.facts);

    const results = runPageChecks({
      url: i.url,
      fetch: i.fetched,
      facts: i.facts,
      family: i.family,
      targetKeyword: i.targetKeyword,
      pageType,
      robots: i.robots,
      inSitemap: i.inSitemap,
      site: i.analysis,
      vitals: i.vitals,
      vitalsNote: i.vitalsNote,
      contentHash: hash,
      dateModified,
      previous: i.previous
        ? { contentHash: i.previous.page.contentHash, dateModified: i.previous.page.dateModified }
        : null,
      siteHost: i.siteHost,
    });
    results.push(...i.extraChecks);

    const breakdown = computeHealthScore(results, i.offPage, i.domain);
    const stored: StoredAuditChecks = {
      version: AUDIT_VERSION,
      results,
      breakdown,
      vitals: i.vitals,
      page: {
        pageType,
        family: i.family,
        contentHash: hash,
        dateModified,
        analysis: i.analysis,
        analysedAt: i.analysis ? i.analysedAt : null,
        finalUrl: i.fetched.finalUrl,
        status: i.fetched.status,
      },
    };
    return { url: i.url, results, breakdown, stored, vitals: i.vitals, error: i.fetched.error };
  }

  private toRow(siteId: string, runId: string, e: Evaluated): Prisma.SeoAuditUncheckedCreateInput {
    return {
      siteId,
      runId,
      url: e.url,
      score: e.breakdown.finalScore,
      perfScore: e.vitals?.labPerformance ?? null,
      a11yScore: null,
      bpScore: null,
      seoScore: null,
      lcpMs: e.vitals?.lcpMs?.value ?? null,
      inpMs: e.vitals?.inpMs?.value ?? null,
      clsX1k: e.vitals?.cls ? Math.round(e.vitals.cls.value * 1000) : null,
      checks: e.stored as unknown as Prisma.InputJsonValue,
      tasks: taskList(e.results) as unknown as Prisma.InputJsonValue,
      errors: e.error,
    };
  }

  private targetsFor(site: { url: string; crawlPaths: string[] }): CrawlTarget[] {
    const out: CrawlTarget[] = [];
    const add = (path: string, t: Omit<CrawlTarget, 'url'>) => {
      try {
        out.push({ url: new URL(path, site.url).toString(), ...t });
      } catch {
        // A malformed configured path is skipped rather than failing the run.
      }
    };
    add(HOMEPAGE_ENTRY.url, {
      family: HOMEPAGE_ENTRY.family ?? null,
      tier: 0,
      targetKeyword: HOMEPAGE_ENTRY.primary ?? null,
      adsImpressions: null,
      source: 'home',
    });
    for (const m of MANIFEST) {
      add(m.url, {
        family: m.family ?? null,
        tier: m.tier ?? null,
        targetKeyword: m.primary ?? null,
        adsImpressions: m.impr ?? null,
        source: 'manifest',
      });
    }
    for (const p of site.crawlPaths ?? []) {
      add(p, { family: null, tier: null, targetKeyword: null, adsImpressions: null, source: 'crawl-path' });
    }
    return out;
  }

  /** Latest current-version audit per URL, keyed by normalised URL. */
  private async latestStored(siteId: string): Promise<Map<string, StoredAuditChecks>> {
    const rows = await this.prisma.seoAudit.findMany({
      where: { siteId, ...CURRENT_AUDITS },
      orderBy: [{ url: 'asc' }, { createdAt: 'desc' }],
      distinct: ['url'],
      select: { url: true, checks: true },
    });
    const out = new Map<string, StoredAuditChecks>();
    for (const r of rows) {
      const stored = readStoredChecks(r.checks);
      const key = normalizePageUrl(r.url);
      if (stored && !out.has(key)) out.set(key, stored);
    }
    return out;
  }

  private async linkSignals(siteId: string) {
    const [rows, domain] = await Promise.all([
      this.prisma.seoOffPage.findMany({ where: { siteId } }),
      this.prisma.seoDomainSignals.findUnique({ where: { siteId } }),
    ]);
    const offPage = new Map<string, OffPageSignals>();
    for (const r of rows) offPage.set(normalizePageUrl(r.url), r);
    return { offPage, domain: domain as DomainSignals | null };
  }

  private isFresh(v: PageVitals | null | undefined): v is PageVitals {
    return !!v && hasAnyVital(v) && Date.now() - Date.parse(v.measuredAt) <= VITALS_MAX_AGE_MS;
  }

  /**
   * PageSpeed Insights on the highest-priority pages. Every other page uses its
   * own reading from the last 28 days if there is one, then the origin's field
   * data. Stops early once the API reports its quota is used up.
   */
  private async measureVitals(pages: CrawledPage[], previous: Map<string, StoredAuditChecks>, status: AuditRunStatus) {
    const apiKey = pageSpeedKey();
    const queue = psiPriority(pages, apiKey ? PSI_MAX_PAGES : 1);
    status.psiTotal = queue.length;
    status.psiDone = 0;

    const measured = new Map<string, PageVitals>();
    const state: { origin: VitalsSet | null; quotaHit: boolean; failure: string | null } = {
      origin: null,
      quotaHit: false,
      failure: null,
    };

    await mapPool(queue, apiKey ? PSI_CONCURRENCY : 1, async (page) => {
      if (!state.quotaHit) {
        const r = await runPageSpeed(page.url, apiKey);
        if (r.ok) {
          measured.set(page.key, vitalsFromPsi(r.parsed, new Date().toISOString()));
          state.origin = state.origin ?? r.parsed.origin;
        } else {
          if (r.status === 429) state.quotaHit = true;
          state.failure = r.message;
        }
      }
      status.psiDone++;
    });

    const noteFor = (): string => {
      if (!apiKey) return NO_KEY_NOTE;
      if (state.quotaHit) return QUOTA_NOTE;
      if (state.failure && measured.size === 0) return `Not measured: PageSpeed Insights failed (${state.failure})`;
      return `Not measured this run: PageSpeed tests the ${PSI_MAX_PAGES} highest-priority pages, and the site has no site-wide field data yet`;
    };
    const measuredAt = new Date().toISOString();

    return {
      measuredCount: measured.size,
      note: measured.size === 0 && !state.origin ? noteFor() : null,
      forPage: (key: string): { vitals: PageVitals | null; note: string | null } => {
        const own = measured.get(key);
        if (own) return { vitals: own, note: null };
        const prev = previous.get(key)?.vitals;
        if (this.isFresh(prev)) return { vitals: prev, note: null };
        if (state.origin) return { vitals: vitalsFromOrigin(state.origin, measuredAt), note: null };
        return { vitals: null, note: noteFor() };
      },
    };
  }
}
