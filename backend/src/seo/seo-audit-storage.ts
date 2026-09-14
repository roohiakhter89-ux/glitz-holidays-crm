import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AUDIT_VERSION, CheckResult } from './audit-types';
import { PageType } from './audit-checks';
import { SitePageAnalysis } from './audit-site';
import { PageVitals } from './audit-vitals';
import { HealthScore } from './seo-scoring';

/**
 * Shape of SeoAudit.checks for current-version audits.
 *
 * `results` holds every check and is only kept on the latest audit of each
 * URL: once a newer audit exists the full list is dropped from the old row,
 * which keeps the score, breakdown and page summary for history while a daily
 * crawl of a few hundred pages does not grow the table by megabytes a day.
 */
export interface StoredAuditChecks {
  version: number;
  results?: CheckResult[];
  breakdown: HealthScore;
  vitals: PageVitals | null;
  page: {
    pageType: PageType;
    family: string | null;
    contentHash: string | null;
    dateModified: string | null;
    /** Cross-page findings from the last full crawl that included this page. */
    analysis: SitePageAnalysis | null;
    analysedAt: string | null;
    finalUrl: string;
    status: number;
  };
}

export function readStoredChecks(checks: unknown): StoredAuditChecks | null {
  if (!checks || typeof checks !== 'object') return null;
  const c = checks as Partial<StoredAuditChecks>;
  return c.version === AUDIT_VERSION && c.breakdown && c.page ? (c as StoredAuditChecks) : null;
}

/** Prisma filter for audits written by the current framework version. */
export const CURRENT_AUDITS: Prisma.SeoAuditWhereInput = {
  checks: { path: ['version'], equals: AUDIT_VERSION },
};

export interface AuditTask {
  id: string;
  severity: 'warn' | 'fail';
  label: string;
  category: string;
  task: string;
  basis: string;
  docUrl?: string;
}

/** The fix list for a page: failures first, then by weight. */
export function taskList(results: CheckResult[]): AuditTask[] {
  return results
    .filter((r): r is CheckResult & { severity: 'warn' | 'fail'; task: string } =>
      !!r.task && (r.severity === 'warn' || r.severity === 'fail'),
    )
    .sort((a, b) => (a.severity === b.severity ? b.weight - a.weight : a.severity === 'fail' ? -1 : 1))
    .map((r) => ({
      id: r.id,
      severity: r.severity,
      label: r.label,
      category: r.category,
      task: r.task,
      basis: r.basis,
      ...(r.docUrl ? { docUrl: r.docUrl } : {}),
    }));
}

/** Drop the full check list from every audit that a newer audit of the same URL supersedes. */
export function stripSupersededResults(prisma: PrismaService, siteId: string): Promise<number> {
  return prisma.$executeRaw`
    UPDATE "SeoAudit" AS a
       SET "checks" = a."checks" - 'results'
     WHERE a."siteId" = ${siteId}
       AND a."checks" -> 'version' IS NOT NULL
       AND a."checks" -> 'results' IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM "SeoAudit" AS n
          WHERE n."siteId" = a."siteId" AND n."url" = a."url" AND n."createdAt" > a."createdAt"
       )`;
}
