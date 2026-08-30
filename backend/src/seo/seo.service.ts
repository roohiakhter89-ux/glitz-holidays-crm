import { Injectable, NotFoundException, HttpException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import {
  aggregateScore,
  CheckResult,
  parseMeta,
  runChecks,
} from './seo-checks';
import { randomUUID } from 'crypto';

interface PagespeedScores {
  perf?: number;
  a11y?: number;
  bp?: number;
  seo?: number;
  lcpMs?: number;
  clsX1k?: number;
  inpMs?: number;
}

@Injectable()
export class SeoService {
  private readonly logger = new Logger(SeoService.name);
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async refreshAll() {
    this.logger.log('Running daily SEO audits for active sites...');
    const sites = await this.prisma.seoSite.findMany({ where: { isActive: true } });
    for (const site of sites) {
      try {
        await this.runAudit(site.id);
        this.logger.log(`Audit completed for site ${site.id}`);
      } catch (err) {
        this.logger.error(`Audit failed for site ${site.id}`, err);
      }
    }
    return { message: `Queued/ran audit for ${sites.length} sites` };
  }

  // ---- sites ----

  createSite(dto: CreateSiteDto) {
    return this.prisma.seoSite.create({
      data: {
        name: dto.name,
        url: dto.url,
        crawlPaths: dto.crawlPaths ?? [],
        isActive: dto.isActive ?? true,
      },
    });
  }

  async listSites() {
    // Attach the most recent audit per URL so the dashboard has the current
    // health scores in one round-trip. Prisma doesn't have a native
    // "latest-per-group" so we group ourselves.
    const sites = await this.prisma.seoSite.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      include: {
        audits: {
          orderBy: { createdAt: 'desc' },
          take: 20, // enough to cover a multi-URL last-run
        },
      },
    });
    return sites.map((s: any) => {
      const latestByUrl = new Map<string, any>();
      for (const a of s.audits) {
        if (!latestByUrl.has(a.url)) latestByUrl.set(a.url, a);
      }
      const latest = Array.from(latestByUrl.values());
      const avgScore =
        latest.length > 0
          ? Math.round(latest.reduce((a, b) => a + b.score, 0) / latest.length)
          : null;
      return {
        id: s.id,
        name: s.name,
        url: s.url,
        crawlPaths: s.crawlPaths,
        isActive: s.isActive,
        lastRunAt: s.audits[0]?.createdAt ?? null,
        avgScore,
        pageCount: latest.length,
      };
    });
  }

  async findSite(id: string) {
    const site = await this.prisma.seoSite.findUnique({ where: { id } });
    if (!site) throw new NotFoundException('Site not found');
    return site;
  }

  async updateSite(id: string, dto: UpdateSiteDto) {
    await this.findSite(id);
    return this.prisma.seoSite.update({
      where: { id },
      data: { ...dto },
    });
  }

  // ---- audits ----

  async getHistory(id: string) {
    const audits = await this.prisma.seoAudit.findMany({
      where: { siteId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        createdAt: true,
        runId: true,
        url: true,
        score: true,
        perfScore: true,
        seoScore: true,
      }
    });
    return audits;
  }

  async latestAudit(id: string) {
    const site = await this.findSite(id);
    const audits = await this.prisma.seoAudit.findMany({
      where: { siteId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    // Pick the latest per URL for the "current health" view.
    const latestByUrl = new Map<string, any>();
    for (const a of audits) if (!latestByUrl.has(a.url)) latestByUrl.set(a.url, a);
    return {
      site,
      pages: Array.from(latestByUrl.values()),
    };
  }

  /**
   * Run an audit across the site's homepage + configured paths. Each URL
   * gets one HTTP fetch + one PageSpeed Insights call. If PSI errors or the
   * page fetch fails, we still store an audit row with the errors captured
   * so the operator sees what happened.
   */
  async runAudit(id: string) {
    const site = await this.findSite(id);
    const runId = randomUUID();
    const urls = new Set<string>([site.url]);
    for (const p of site.crawlPaths ?? []) {
      try {
        urls.add(new URL(p, site.url).toString());
      } catch { /* skip malformed path */ }
    }

    const results: Awaited<ReturnType<SeoService['auditOne']>>[] = [];
    for (const url of urls) {
      results.push(await this.auditOne(site.id, runId, url));
    }
    return { runId, pages: results };
  }

  private async auditOne(siteId: string, runId: string, urlStr: string) {
    let checks: CheckResult[] = [];
    let ps: PagespeedScores = {};
    const errors: string[] = [];
    let url: URL;
    try {
      url = new URL(urlStr);
    } catch (e) {
      // Store an errored audit row so the failure surfaces on the dashboard.
      return this.prisma.seoAudit.create({
        data: {
          siteId, runId, url: urlStr, score: 0,
          errors: `Invalid URL: ${(e as Error).message}`,
        },
      });
    }

    // 1) Fetch + on-page checks
    try {
      const html = await fetchHtml(urlStr);
      const meta = parseMeta(html, url);
      checks = runChecks(meta, url);
    } catch (e) {
      errors.push(`Page fetch failed: ${(e as Error).message}`);
    }

    // 2) PageSpeed Insights — free, no key, generous quota for internal use.
    // If it fails we still commit the on-page score.
    try {
      ps = await fetchPagespeed(urlStr);
    } catch (e) {
      errors.push(`PageSpeed skipped: ${(e as Error).message}`);
    }

    const score = aggregateScore(checks, ps);
    const tasks = checks
      .filter((c) => c.task)
      .map((c) => ({
        id: c.id,
        severity: c.severity,
        label: c.label,
        task: c.task,
      }));

    return this.prisma.seoAudit.create({
      data: {
        siteId, runId, url: urlStr,
        score,
        perfScore: ps.perf ?? null,
        a11yScore: ps.a11y ?? null,
        bpScore:   ps.bp   ?? null,
        seoScore:  ps.seo  ?? null,
        lcpMs:  ps.lcpMs  ?? null,
        clsX1k: ps.clsX1k ?? null,
        inpMs:  ps.inpMs  ?? null,
        checks: { results: checks } as any,
        tasks:  tasks as any,
        errors: errors.length ? errors.join(' | ') : null,
      },
    });
  }
}

// ---- helpers -------------------------------------------------------------

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    // A UA is important — some hosts block empty UA requests, and we want
    // to look like a real crawler (not a browser).
    headers: { 'User-Agent': 'GlitzSEOBot/1.0 (+https://glitzholidays.in)' },
    // 20s cap — Windows / DNS oddities can hang forever without a signal.
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new HttpException(`upstream ${res.status}`, res.status);
  const ct = res.headers.get('content-type') ?? '';
  if (!/text\/html|application\/xhtml/.test(ct)) {
    throw new Error(`unexpected content-type ${ct}`);
  }
  return await res.text();
}

/**
 * Google's PageSpeed Insights v5 API. Works keyless at low volume, but a
 * single site with 4-5 landing pages burns the free per-IP quota fast and
 * starts returning 429. Setting PAGESPEED_API_KEY in the env lifts that.
 * Grab a key from https://developers.google.com/speed/docs/insights/v5/get-started
 * — it's free.
 *
 * Category=performance, accessibility, best-practices, seo — one call, four
 * scores. Mobile strategy because Kashmir traffic skews mobile.
 */
async function fetchPagespeed(url: string): Promise<PagespeedScores> {
  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.searchParams.set('url', url);
  for (const c of ['performance', 'accessibility', 'best-practices', 'seo']) {
    endpoint.searchParams.append('category', c);
  }
  endpoint.searchParams.set('strategy', 'mobile');
  if (process.env.PAGESPEED_API_KEY) {
    endpoint.searchParams.set('key', process.env.PAGESPEED_API_KEY);
  }

  const res = await fetch(endpoint.toString(), {
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`PSI ${res.status}`);
  const j: any = await res.json();

  const cats = j.lighthouseResult?.categories ?? {};
  const audits = j.lighthouseResult?.audits ?? {};
  const to100 = (n: unknown): number | undefined =>
    typeof n === 'number' ? Math.round(n * 100) : undefined;

  return {
    perf: to100(cats.performance?.score),
    a11y: to100(cats.accessibility?.score),
    bp:   to100(cats['best-practices']?.score),
    seo:  to100(cats.seo?.score),
    lcpMs:  Math.round(audits['largest-contentful-paint']?.numericValue ?? 0) || undefined,
    clsX1k: Math.round((audits['cumulative-layout-shift']?.numericValue ?? 0) * 1000) || undefined,
    inpMs:  Math.round(audits['interaction-to-next-paint']?.numericValue ?? 0) || undefined,
  };
}
