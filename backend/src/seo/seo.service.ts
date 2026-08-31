import {
  Injectable,
  NotFoundException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { UpdateOffPageDto } from './dto/update-offpage.dto';
import {
  calculateCompositeScore,
  CheckResult,
  OffPageSignals,
  parseMeta,
  runChecks,
} from './seo-checks';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

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
    let sites = await this.prisma.seoSite.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      include: {
        audits: {
          orderBy: { createdAt: 'desc' },
          take: 300,
        },
      },
    });

    if (sites.length === 0) {
      try {
        const defaultSite = await this.prisma.seoSite.create({
          data: {
            name: 'Glitz Holidays Main Website',
            url: 'https://glitzholidays.in',
            crawlPaths: ['/', '/packages', '/destinations/gulmarg', '/destinations/pahalgam', '/destinations/sonmarg'],
            isActive: true,
          },
        });
        sites = [{
          ...defaultSite,
          audits: [],
        }] as any;
      } catch {
        // Ignored if already created concurrently
      }
    }

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
    const site = await this.prisma.seoSite.findUnique({
      where: { id },
      include: { offPageScores: true },
    });
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

  // ---- audits & rankings ----

  async getHistory(id: string) {
    return this.prisma.seoAudit.findMany({
      where: { siteId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        createdAt: true,
        runId: true,
        url: true,
        score: true,
        perfScore: true,
        seoScore: true,
      },
    });
  }

  async latestAudit(id: string) {
    const site = await this.findSite(id);
    const audits = await this.prisma.seoAudit.findMany({
      where: { siteId: id },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const latestByUrl = new Map<string, any>();
    for (const a of audits) {
      if (!latestByUrl.has(a.url)) latestByUrl.set(a.url, a);
    }

    return {
      site,
      pages: Array.from(latestByUrl.values()),
    };
  }

  /**
   * Get all website pages ranked by composite Google Algorithm score.
   * Merges manifest metadata, on-page audit results, and off-page signals.
   */
  async getPageRankings(siteId: string) {
    const site = await this.findSite(siteId);
    const manifestPages = this.loadManifestPages();

    const [latestAudits, offPageRecords] = await Promise.all([
      this.prisma.seoAudit.findMany({
        where: { siteId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.seoOffPage.findMany({
        where: { siteId },
      }),
    ]);

    const latestAuditMap = new Map<string, any>();
    for (const a of latestAudits) {
      if (!latestAuditMap.has(a.url)) latestAuditMap.set(a.url, a);
    }

    const offPageMap = new Map<string, any>();
    for (const op of offPageRecords) {
      offPageMap.set(op.url, op);
    }

    // Build unified ranking list
    // 1. Pages from manifest
    // 2. Extra crawl paths or discovered audited pages
    const seenUrls = new Set<string>();
    const rankedList: any[] = [];

    const getFullUrl = (pathOrUrl: string) => {
      try {
        return new URL(pathOrUrl, site.url).toString();
      } catch {
        return pathOrUrl;
      }
    };

    // Add homepage
    manifestPages.unshift({
      url: '/',
      title: 'Glitz Holidays — Srinagar Kashmir Tour Operator',
      h1: 'Kashmir Tour Packages with Local Srinagar Experts',
      tier: 0,
      family: 'core-homepage',
      primary: 'kashmir tour package',
    });

    for (const mp of manifestPages) {
      const fullUrl = getFullUrl(mp.url);
      if (seenUrls.has(fullUrl)) continue;
      seenUrls.add(fullUrl);

      const audit = latestAuditMap.get(fullUrl);
      const offPage = offPageMap.get(fullUrl);

      rankedList.push({
        url: fullUrl,
        path: mp.url,
        title: mp.title || mp.h1 || mp.url,
        h1: mp.h1,
        tier: mp.tier,
        family: mp.family,
        targetKeyword: mp.primary,
        impr: mp.impr ?? null,
        clicks: mp.clicks ?? null,
        conv: mp.conv ?? null,
        words: mp.words ?? null,
        auditId: audit?.id ?? null,
        lastAuditedAt: audit?.createdAt ?? null,
        score: audit?.score ?? null,
        perfScore: audit?.perfScore ?? null,
        seoScore: audit?.seoScore ?? null,
        lcpMs: audit?.lcpMs ?? null,
        clsX1k: audit?.clsX1k ?? null,
        inpMs: audit?.inpMs ?? null,
        checks: audit?.checks?.results ?? [],
        tasks: audit?.tasks ?? [],
        errors: audit?.errors ?? null,
        offPage: offPage
          ? {
              backlinkCount: offPage.backlinkCount,
              referringDomains: offPage.referringDomains,
              pageAuthority: offPage.pageAuthority,
              prMentions: offPage.prMentions,
              socialShares: offPage.socialShares,
              searchConsoleCtr: offPage.searchConsoleCtr,
              notes: offPage.notes,
              updatedAt: offPage.updatedAt,
            }
          : null,
      });
    }

    // Add any audited URLs not in manifest
    for (const [auditedUrl, audit] of latestAuditMap.entries()) {
      if (seenUrls.has(auditedUrl)) continue;
      seenUrls.add(auditedUrl);

      const offPage = offPageMap.get(auditedUrl);
      let parsedPath = auditedUrl;
      try {
        parsedPath = new URL(auditedUrl).pathname;
      } catch {}

      rankedList.push({
        url: auditedUrl,
        path: parsedPath,
        title: parsedPath,
        tier: 0,
        family: 'custom-path',
        targetKeyword: undefined,
        auditId: audit.id,
        lastAuditedAt: audit.createdAt,
        score: audit.score,
        perfScore: audit.perfScore,
        seoScore: audit.seoScore,
        lcpMs: audit.lcpMs,
        clsX1k: audit.clsX1k,
        inpMs: audit.inpMs,
        checks: audit.checks?.results ?? [],
        tasks: audit.tasks ?? [],
        errors: audit.errors,
        offPage: offPage
          ? {
              backlinkCount: offPage.backlinkCount,
              referringDomains: offPage.referringDomains,
              pageAuthority: offPage.pageAuthority,
              prMentions: offPage.prMentions,
              socialShares: offPage.socialShares,
              searchConsoleCtr: offPage.searchConsoleCtr,
              notes: offPage.notes,
              updatedAt: offPage.updatedAt,
            }
          : null,
      });
    }

    // Sort by score desc (pages with scores first, then un-audited)
    rankedList.sort((a, b) => {
      if (a.score === null && b.score === null) return 0;
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return b.score - a.score;
    });

    const auditedCount = rankedList.filter((r) => r.score !== null).length;
    const avgScore =
      auditedCount > 0
        ? Math.round(
            rankedList.reduce((sum, r) => sum + (r.score || 0), 0) / auditedCount,
          )
        : null;

    const highTier = rankedList.filter((r) => (r.score ?? 0) >= 80).length;
    const medTier = rankedList.filter(
      (r) => (r.score ?? 0) >= 60 && (r.score ?? 0) < 80,
    ).length;
    const lowTier = rankedList.filter(
      (r) => r.score !== null && (r.score ?? 0) < 60,
    ).length;

    return {
      site,
      stats: {
        totalPages: rankedList.length,
        auditedPages: auditedCount,
        averageScore: avgScore,
        highScoreCount: highTier,
        medScoreCount: medTier,
        lowScoreCount: lowTier,
      },
      rankings: rankedList,
    };
  }

  /**
   * Update off-page metrics for a specific page URL.
   * Recalculates the latest audit score if an audit exists.
   */
  async updateOffPage(siteId: string, dto: UpdateOffPageDto) {
    const site = await this.findSite(siteId);
    let targetUrl = dto.url;
    try {
      targetUrl = new URL(dto.url, site.url).toString();
    } catch {}

    const offPage = await this.prisma.seoOffPage.upsert({
      where: {
        siteId_url: { siteId, url: targetUrl },
      },
      create: {
        siteId,
        url: targetUrl,
        backlinkCount: dto.backlinkCount ?? 0,
        referringDomains: dto.referringDomains ?? 0,
        pageAuthority: dto.pageAuthority ?? null,
        prMentions: dto.prMentions ?? 0,
        socialShares: dto.socialShares ?? 0,
        searchConsoleCtr: dto.searchConsoleCtr ?? null,
        notes: dto.notes ?? null,
      },
      update: {
        backlinkCount: dto.backlinkCount !== undefined ? dto.backlinkCount : undefined,
        referringDomains:
          dto.referringDomains !== undefined ? dto.referringDomains : undefined,
        pageAuthority: dto.pageAuthority !== undefined ? dto.pageAuthority : undefined,
        prMentions: dto.prMentions !== undefined ? dto.prMentions : undefined,
        socialShares: dto.socialShares !== undefined ? dto.socialShares : undefined,
        searchConsoleCtr:
          dto.searchConsoleCtr !== undefined ? dto.searchConsoleCtr : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
      },
    });

    // Recalculate latest audit score if exists
    const latestAudit = await this.prisma.seoAudit.findFirst({
      where: { siteId, url: targetUrl },
      orderBy: { createdAt: 'desc' },
    });

    if (latestAudit && latestAudit.checks) {
      const checks = (latestAudit.checks as any).results as CheckResult[];
      const pagespeed = {
        perf: latestAudit.perfScore ?? undefined,
        a11y: latestAudit.a11yScore ?? undefined,
        bp: latestAudit.bpScore ?? undefined,
        seo: latestAudit.seoScore ?? undefined,
      };
      const composite = calculateCompositeScore(checks, offPage, pagespeed);
      await this.prisma.seoAudit.update({
        where: { id: latestAudit.id },
        data: { score: composite.finalScore },
      });
    }

    return offPage;
  }

  /**
   * Run an audit across the site's homepage + manifest/configured paths.
   */
  async runAudit(id: string) {
    const site = await this.findSite(id);
    const runId = randomUUID();
    const manifest = this.loadManifestPages();

    const urlsToAudit: { url: string; keyword?: string }[] = [
      { url: site.url, keyword: 'kashmir tour package' },
    ];

    for (const p of site.crawlPaths ?? []) {
      try {
        urlsToAudit.push({ url: new URL(p, site.url).toString() });
      } catch {}
    }

    // Include top high-intent manifest pages in the audit
    for (const m of manifest.slice(0, 30)) {
      try {
        urlsToAudit.push({
          url: new URL(m.url, site.url).toString(),
          keyword: m.primary,
        });
      } catch {}
    }

    // Deduplicate
    const uniqueMap = new Map<string, string | undefined>();
    for (const item of urlsToAudit) {
      if (!uniqueMap.has(item.url)) {
        uniqueMap.set(item.url, item.keyword);
      }
    }

    const results: any[] = [];
    for (const [url, keyword] of uniqueMap.entries()) {
      results.push(await this.auditOne(site.id, runId, url, keyword));
    }

    return { runId, pages: results };
  }

  /**
   * Audit a single page URL on-demand
   */
  async auditSinglePage(siteId: string, urlStr: string, keyword?: string) {
    const site = await this.findSite(siteId);
    let fullUrl = urlStr;
    try {
      fullUrl = new URL(urlStr, site.url).toString();
    } catch {}

    const runId = randomUUID();
    return this.auditOne(site.id, runId, fullUrl, keyword);
  }

  private async auditOne(
    siteId: string,
    runId: string,
    urlStr: string,
    targetKeyword?: string,
  ) {
    let checks: CheckResult[] = [];
    let ps: PagespeedScores = {};
    const errors: string[] = [];
    let url: URL;

    try {
      url = new URL(urlStr);
    } catch (e) {
      return this.prisma.seoAudit.create({
        data: {
          siteId,
          runId,
          url: urlStr,
          score: 0,
          errors: `Invalid URL: ${(e as Error).message}`,
        },
      });
    }

    // 1) Fetch + enhanced on-page checks
    try {
      const html = await fetchHtml(urlStr);
      const meta = parseMeta(html, url);
      checks = runChecks(meta, url, targetKeyword);
    } catch (e) {
      errors.push(`Page fetch failed: ${(e as Error).message}`);
    }

    // 2) PageSpeed Insights
    try {
      ps = await fetchPagespeed(urlStr);
    } catch (e) {
      errors.push(`PageSpeed skipped: ${(e as Error).message}`);
    }

    // 3) Off-page signals
    const offPage = await this.prisma.seoOffPage.findUnique({
      where: { siteId_url: { siteId, url: urlStr } },
    });

    const composite = calculateCompositeScore(checks, offPage, ps);

    const tasks = checks
      .filter((c) => c.task)
      .map((c) => ({
        id: c.id,
        severity: c.severity,
        label: c.label,
        category: c.category,
        task: c.task,
      }));

    return this.prisma.seoAudit.create({
      data: {
        siteId,
        runId,
        url: urlStr,
        score: composite.finalScore,
        perfScore: ps.perf ?? null,
        a11yScore: ps.a11y ?? null,
        bpScore: ps.bp ?? null,
        seoScore: ps.seo ?? null,
        lcpMs: ps.lcpMs ?? null,
        clsX1k: ps.clsX1k ?? null,
        inpMs: ps.inpMs ?? null,
        checks: { results: checks } as any,
        tasks: tasks as any,
        errors: errors.length ? errors.join(' | ') : null,
      },
    });
  }

  private loadManifestPages(): any[] {
    const paths = [
      path.resolve(__dirname, './page-manifest.json'),
      path.resolve(__dirname, '../seo/page-manifest.json'),
      path.resolve(process.cwd(), 'src/seo/page-manifest.json'),
      path.resolve(process.cwd(), 'dist/seo/page-manifest.json'),
      path.resolve(process.cwd(), 'seo/page-manifest.json'),
      path.resolve(process.cwd(), '../seo/page-manifest.json'),
      path.resolve(__dirname, '../../../../seo/page-manifest.json'),
      'c:\\Users\\user\\Desktop\\glitz\\seo\\page-manifest.json',
    ];

    for (const p of paths) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf-8');
          return JSON.parse(raw);
        } catch (e) {
          this.logger.warn(`Could not parse manifest at ${p}: ${e}`);
        }
      }
    }
    return [];
  }
}

// ---- helpers -------------------------------------------------------------

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'GlitzSEOBot/1.0 (+https://glitzholidays.in)' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new HttpException(`upstream ${res.status}`, res.status);
  const ct = res.headers.get('content-type') ?? '';
  if (!/text\/html|application\/xhtml/.test(ct)) {
    throw new Error(`unexpected content-type ${ct}`);
  }
  return await res.text();
}

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
    bp: to100(cats['best-practices']?.score),
    seo: to100(cats.seo?.score),
    lcpMs: Math.round(audits['largest-contentful-paint']?.numericValue ?? 0) || undefined,
    clsX1k: Math.round((audits['cumulative-layout-shift']?.numericValue ?? 0) * 1000) || undefined,
    inpMs: Math.round(audits['interaction-to-next-paint']?.numericValue ?? 0) || undefined,
  };
}
