import {
  CheckBasis,
  CheckCategory,
  CheckResult,
  CheckSeverity,
  DOCS,
  NotScoredReason,
  pointsFor,
} from './audit-types';
import { PageFacts, hasSelfServingRating, jsonLdAuthors, jsonLdDate } from './audit-html';
import { SitePageAnalysis } from './audit-site';
import { PageVitals, VitalMetric, VitalSource } from './audit-vitals';
import { LastmodSummary, lastmodLooksGenerated } from './audit-sitemap';
import { contentTokens } from './audit-content';
import { normalizePageUrl } from './search-console-mapping';

/**
 * Page checks, each grounded in published Google Search guidance (or marked
 * as a house rule when it isn't). The weights say how much the guidance
 * stresses a thing; they are not Google's weights, which are not published.
 *
 * What is deliberately NOT checked, because Google says it doesn't matter or
 * doesn't use it: word count, number or order of headings, title and
 * description length, keyword meta tags, FAQ markup for rich results (removed
 * in 2026), Open Graph tags, Page Authority, social shares, and "toxic" links.
 */

interface CheckSpec {
  id: string;
  label: string;
  category: CheckCategory;
  weight: number;
  basis: CheckBasis;
  docUrl?: string;
  scope?: 'page' | 'site';
  gate?: boolean;
}

const spec = (
  id: string,
  label: string,
  category: CheckCategory,
  weight: number,
  basis: CheckBasis,
  docUrl?: string,
  extra: Partial<CheckSpec> = {},
): CheckSpec => ({ id, label, category, weight, basis, docUrl, ...extra });

export const CHECKS = {
  // Crawling and indexing
  http: spec('http-status', 'Returns 200 OK', 'indexing', 8, 'google', DOCS.httpStatus, { gate: true }),
  robots: spec('robots-txt', 'Crawlable under robots.txt', 'indexing', 5, 'google', DOCS.robots, { gate: true }),
  noindex: spec('noindex', 'Allowed in the index', 'indexing', 6, 'google', DOCS.noindex, { gate: true }),
  canonical: spec('canonical', 'Canonical URL', 'indexing', 4, 'google', DOCS.canonical),
  sitemap: spec('in-sitemap', 'Listed in the sitemap', 'indexing', 2, 'google', DOCS.sitemaps, { scope: 'site' }),
  lastmod: spec('sitemap-lastmod', 'Sitemap dates match real changes', 'indexing', 1, 'google', DOCS.sitemaps, {
    scope: 'site',
  }),
  // Helpful content
  unique: spec('unique-content', 'Content specific to this page', 'content', 12, 'google', DOCS.spamPolicies, {
    scope: 'site',
  }),
  author: spec('author', 'Author named', 'content', 4, 'google', DOCS.helpfulContent),
  dates: spec('honest-dates', 'Updated date matches content changes', 'content', 2, 'google', DOCS.helpfulContent),
  images: spec('indexable-images', 'Own photos Google can index', 'content', 4, 'google', DOCS.images),
  alt: spec('image-alt', 'Image alt text', 'content', 2, 'google', DOCS.images),
  prices: spec('specific-prices', 'Specific prices', 'content', 2, 'house'),
  advice: spec('honest-advice', 'Honest "what to skip" advice', 'content', 2, 'house'),
  // Search appearance
  title: spec('title', 'Title', 'appearance', 4, 'google', DOCS.titleLinks),
  titleUnique: spec('title-unique', 'Title unique on the site', 'appearance', 4, 'google', DOCS.titleLinks, {
    scope: 'site',
  }),
  query: spec('query-coverage', 'Search words in title or main heading', 'appearance', 3, 'google', DOCS.starterGuide),
  description: spec('meta-description', 'Meta description', 'appearance', 2, 'google', DOCS.snippets),
  heading: spec('main-heading', 'Main heading', 'appearance', 1, 'google', DOCS.titleLinks),
  structured: spec('structured-data', 'Structured data parses', 'appearance', 2, 'google', DOCS.structuredData),
  // Advisory only (weight 0): self-serving ratings don't hurt ranking, they just never earn stars.
  reviews: spec('review-markup', 'Review stars eligibility', 'appearance', 0, 'google', DOCS.reviewSnippet),
  hreflang: spec('hreflang', 'Language versions linked', 'appearance', 1, 'google', DOCS.localized),
  // Page experience
  lcp: spec('cwv-lcp', 'Largest Contentful Paint', 'experience', 4, 'google', DOCS.vitals),
  inp: spec('cwv-inp', 'Interaction to Next Paint', 'experience', 4, 'google', DOCS.vitals),
  cls: spec('cwv-cls', 'Cumulative Layout Shift', 'experience', 4, 'google', DOCS.vitals),
  https: spec('https', 'Served over HTTPS', 'experience', 2, 'google', DOCS.pageExperience),
  viewport: spec('mobile-viewport', 'Mobile viewport', 'experience', 2, 'google', DOCS.mobile),
  // Internal links
  inbound: spec('inbound-links', 'Linked from other pages', 'links', 5, 'google', DOCS.links, { scope: 'site' }),
  contentLinks: spec('content-links', 'Links to related pages', 'links', 2, 'google', DOCS.links),
  anchors: spec('anchor-text', 'Descriptive link text', 'links', 2, 'google', DOCS.links),
  crawlable: spec('crawlable-links', 'Links Google can follow', 'links', 1, 'google', DOCS.links),
};

/** Checks that need the whole crawl. A single-page audit carries these forward. */
export const SITE_SCOPE_CHECK_IDS = new Set(
  Object.values(CHECKS)
    .filter((s) => s.scope === 'site')
    .map((s) => s.id),
);

function result(
  s: CheckSpec,
  severity: CheckSeverity,
  detail?: string,
  task?: string,
  na?: NotScoredReason,
): CheckResult {
  const r: CheckResult = {
    id: s.id,
    label: s.label,
    category: s.category,
    severity,
    weight: s.weight,
    score: pointsFor(severity, s.weight),
    basis: s.basis,
    scope: s.scope ?? 'page',
  };
  if (s.gate) r.gate = true;
  if (s.docUrl) r.docUrl = s.docUrl;
  if (severity === 'na') r.na = na ?? 'not-applicable';
  if (detail) r.detail = detail;
  if (task && (severity === 'warn' || severity === 'fail')) r.task = task;
  return r;
}

const notScored = (s: CheckSpec, reason: NotScoredReason, detail: string) =>
  result(s, 'na', detail, undefined, reason);

// ============================================================================
// Context
// ============================================================================

export type PageType = 'home' | 'editorial' | 'commercial' | 'other';

export interface FetchOutcome {
  /** Final HTTP status after following redirects; 0 when the request failed. */
  status: number;
  finalUrl: string;
  xRobotsTag: string | null;
  contentType: string | null;
  error: string | null;
}

export interface RobotsContext {
  /** `missing` is a 4xx robots.txt, which Google treats as no restrictions. */
  state: 'ok' | 'missing' | 'unavailable';
  allowed: boolean;
  rule: string | null;
}

export interface PageContext {
  url: string;
  fetch: FetchOutcome;
  facts: PageFacts | null;
  family: string | null;
  targetKeyword: string | null;
  pageType: PageType;
  robots: RobotsContext | null;
  /** Null when the sitemap could not be read. */
  inSitemap: boolean | null;
  /** Null when there is no crawl data for this page. */
  site: SitePageAnalysis | null;
  vitals: PageVitals | null;
  /** Why vitals are missing, shown on the unmeasured checks. */
  vitalsNote: string | null;
  contentHash: string | null;
  dateModified: string | null;
  previous: { contentHash: string | null; dateModified: string | null } | null;
  siteHost: string;
}

const ARTICLE_TYPES = new Set(['Article', 'BlogPosting', 'NewsArticle']);

export function classifyPage(url: string, family: string | null, facts: PageFacts | null): PageType {
  if (pathOf(url) === '/') return 'home';
  if (family?.startsWith('guide')) return 'editorial';
  if (facts?.jsonLd.some((b) => b.types.some((t) => ARTICLE_TYPES.has(t)))) return 'editorial';
  if (family) return 'commercial';
  return 'other';
}

export function pageDateModified(facts: PageFacts | null): string | null {
  if (!facts) return null;
  return jsonLdDate(facts.jsonLd, 'dateModified') ?? facts.modifiedMeta;
}

// ============================================================================
// Helpers
// ============================================================================

function pathOf(url: string): string {
  try {
    return new URL(url).pathname || '/';
  } catch {
    return url;
  }
}

const bareHost = (h: string) => h.toLowerCase().replace(/^www\./, '');

function sameHost(url: string, host: string): boolean {
  try {
    return bareHost(new URL(url).hostname) === bareHost(host);
  } catch {
    return false;
  }
}

const STOCK_HOSTS = [
  'unsplash.com',
  'pexels.com',
  'pixabay.com',
  'shutterstock.com',
  'istockphoto.com',
  'gettyimages.',
  'freepik.com',
  'depositphotos.com',
  'stock.adobe.com',
];

function isStockImage(src: string): boolean {
  try {
    const host = new URL(src).hostname;
    return STOCK_HOSTS.some((s) => host.includes(s));
  } catch {
    return false;
  }
}

const STOPWORDS = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'from', 'for', 'with', 'by', 'is', 'are', 'vs']);

/** Just enough stemming to match "packages" with "package" and "cities" with "city". */
export function stem(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

export function significantTerms(text: string): string[] {
  return contentTokens(text)
    .filter((t) => !STOPWORDS.has(t))
    .map(stem);
}

const GENERIC_ANCHORS = new Set([
  'click here',
  'here',
  'read more',
  'more',
  'learn more',
  'know more',
  'view more',
  'see more',
  'view details',
  'details',
  'this page',
  'this',
  'link',
  'continue',
]);

const PRICE_RE = /(?:₹|\brs\.?|\binr)\s?\d[\d,]{2,}/i;
const ADVICE_RE =
  /\b(skip|avoid|not worth|tourist traps?|mistakes?|scams?|who (?:this|it) is(?:n't| not) for|when not to|don't|do not)\b/i;
const BYLINE_RE =
  /\b(?:[Ww]ritten|[Rr]eviewed|[Ff]act[- ][Cc]hecked|[Cc]ompiled|[Cc]urated|[Uu]pdated)\s+by\s+(\p{Lu}[\p{L}.'’-]+(?:\s+\p{Lu}[\p{L}.'’-]+){0,3})/u;

/**
 * X-Robots-Tag directives that apply to Googlebot. A "botname:" prefix scopes
 * the directives after it to that crawler, until the next prefix.
 */
export function xRobotsDirectives(header: string | null): string[] {
  if (!header) return [];
  const out: string[] = [];
  const valueDirectives = new Set(['unavailable_after', 'max-snippet', 'max-image-preview', 'max-video-preview']);
  let scope: 'all' | 'google' | 'other' = 'all';
  for (const part of header.toLowerCase().split(',')) {
    let token = part.trim();
    const m = /^([a-z0-9_-]+)\s*:\s*(.*)$/.exec(token);
    if (m && !valueDirectives.has(m[1])) {
      scope = m[1] === 'googlebot' ? 'google' : 'other';
      token = m[2].trim();
    }
    if (scope !== 'other' && token) out.push(token);
  }
  return out;
}

/** Thresholds for the content uniqueness check. Google publishes none; these are ours. */
export const UNIQUENESS = {
  failShare: 0.2,
  warnShare: 0.4,
  failOverlap: 0.85,
  warnOverlap: 0.6,
  /** Fewer page-specific phrases than this is thin whatever the share. */
  minPhrases: 60,
};

export function uniquenessSeverity(a: SitePageAnalysis): 'pass' | 'warn' | 'fail' {
  const share = a.uniqueShare ?? 0;
  const overlap = a.nearest?.overlap ?? 0;
  if (share < UNIQUENESS.failShare || overlap >= UNIQUENESS.failOverlap || a.specificPhrases < UNIQUENESS.minPhrases) {
    return 'fail';
  }
  if (share < UNIQUENESS.warnShare || overlap >= UNIQUENESS.warnOverlap) return 'warn';
  return 'pass';
}

const SOURCE_LABEL: Record<VitalSource, string> = {
  'url-field': 'real users of this page',
  'origin-field': 'real users across the site',
  lab: 'lab test',
};

function formatVital(metric: VitalMetric, value: number): string {
  if (metric === 'cls') return value.toFixed(2);
  if (metric === 'lcpMs') return `${(value / 1000).toFixed(1)} s`;
  return `${Math.round(value)} ms`;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

// ============================================================================
// Checks
// ============================================================================

export function runPageChecks(ctx: PageContext): CheckResult[] {
  const out: CheckResult[] = [];
  const path = pathOf(ctx.url);
  const f = ctx.facts;
  const self = normalizePageUrl(ctx.url);

  // ---- Crawling and indexing ------------------------------------------------
  const fetched = ctx.fetch;
  let reachable = false;
  if (fetched.status === 0) {
    out.push(
      result(CHECKS.http, 'fail', `Could not fetch: ${fetched.error ?? 'network error'}`,
        `Check that ${path} loads. Google can't index a page it can't fetch.`),
    );
  } else if (fetched.status !== 200) {
    out.push(
      result(CHECKS.http, 'fail', `HTTP ${fetched.status}`,
        `${path} returns ${fetched.status}, so Google won't index it. Redirect it to the right page, or remove it from the sitemap and internal links.`),
    );
  } else if (normalizePageUrl(fetched.finalUrl) !== self) {
    out.push(
      result(CHECKS.http, 'fail', `Redirects to ${fetched.finalUrl}`,
        `Link to ${fetched.finalUrl} directly and list that URL in the sitemap. Google indexes the redirect target, not ${path}.`),
    );
  } else if (!f) {
    out.push(
      result(CHECKS.http, 'fail', `Not an HTML page (${fetched.contentType ?? 'unknown type'})`,
        `Serve ${path} as an HTML page.`),
    );
  } else {
    reachable = true;
    out.push(result(CHECKS.http, 'pass', 'HTTP 200'));
  }

  const robots = ctx.robots;
  if (!robots) {
    out.push(notScored(CHECKS.robots, 'not-measured', 'robots.txt not checked'));
  } else if (robots.state === 'unavailable') {
    out.push(
      result(CHECKS.robots, 'warn', 'robots.txt could not be fetched',
        'Make sure /robots.txt returns 200 or 404. Google pauses crawling while it returns server errors.'),
    );
  } else if (!robots.allowed) {
    out.push(
      result(CHECKS.robots, 'fail', `Blocked by "Disallow: ${robots.rule}"`,
        `Remove or narrow the robots.txt rule "${robots.rule}" if ${path} should appear in Google.`),
    );
  } else {
    out.push(
      result(CHECKS.robots, 'pass', robots.state === 'missing' ? 'No robots.txt, so nothing is blocked' : 'Allowed for Googlebot'),
    );
  }

  if (!reachable || !f) return out;

  const headerDirectives = xRobotsDirectives(fetched.xRobotsTag);
  const isNoindex = (d: string) => d === 'noindex' || d === 'none';
  if (f.robotsDirectives.some(isNoindex) || headerDirectives.some(isNoindex)) {
    const where = headerDirectives.some(isNoindex) ? 'the X-Robots-Tag header' : 'a robots meta tag';
    out.push(
      result(CHECKS.noindex, 'fail', `noindex set in ${where}`,
        `Remove noindex from ${path} if it should appear in Google.`),
    );
  } else {
    out.push(result(CHECKS.noindex, 'pass', 'No noindex'));
  }

  const canonicals = [...new Set(f.canonicals.map(normalizePageUrl))];
  if (canonicals.length === 0) {
    out.push(
      result(CHECKS.canonical, 'warn', 'No canonical tag',
        `Add <link rel="canonical" href="${self}"> to ${path} so Google doesn't have to choose between URL variants.`),
    );
  } else if (canonicals.length > 1) {
    out.push(
      result(CHECKS.canonical, 'fail', `${canonicals.length} different canonical URLs`,
        `Keep a single canonical tag on ${path}. Conflicting canonicals leave Google to pick one itself.`),
    );
  } else if (canonicals[0] !== self) {
    out.push(
      result(CHECKS.canonical, 'warn', `Canonical points to ${canonicals[0]}`,
        `Confirm this is intended: Google is asked to index ${canonicals[0]} instead of ${path}.`),
    );
  } else {
    out.push(result(CHECKS.canonical, 'pass', 'Points to itself'));
  }

  if (ctx.inSitemap === null) {
    out.push(notScored(CHECKS.sitemap, 'not-measured', 'Sitemap could not be read'));
  } else if (ctx.inSitemap) {
    out.push(result(CHECKS.sitemap, 'pass', 'Listed'));
  } else {
    out.push(
      result(CHECKS.sitemap, 'warn', 'Not in the sitemap',
        `Add ${path} to the XML sitemap so Google discovers and recrawls it.`),
    );
  }

  // ---- Helpful content ------------------------------------------------------
  const a = ctx.site;
  if (!a) {
    out.push(notScored(CHECKS.unique, 'not-measured', 'Needs a full site audit to compare pages'));
  } else if (a.uniqueShare === null) {
    out.push(
      result(CHECKS.unique, 'fail', 'No readable text in the main content',
        `Add real content to ${path}. The server HTML has no text for Google to read.`),
    );
  } else {
    const severity = uniquenessSeverity(a);
    const among = a.group === 'site' ? 'the rest of the site' : `the ${a.groupSize} "${a.group}" pages`;
    const nearest = a.nearest
      ? `${Math.round(a.nearest.overlap * 100)}% of its text also appears on ${pathOf(a.nearest.url)}`
      : 'no close match';
    out.push(
      result(CHECKS.unique, severity,
        `${Math.round(a.uniqueShare * 100)}% of its text is not found on ${among}; ${nearest}.`,
        `Rewrite ${path} around facts that only apply to it (${ctx.targetKeyword ? `for "${ctx.targetKeyword}": ` : ''}real prices, timings, routes and local advice) instead of the shared template. Google's spam policies treat many near-identical pages for different cities or regions as doorway pages.`),
    );
  }

  if (ctx.pageType !== 'editorial') {
    out.push(notScored(CHECKS.author, 'not-applicable', 'Only expected on articles and guides'));
  } else {
    const authors = jsonLdAuthors(f.jsonLd);
    const byline = BYLINE_RE.exec(f.mainText)?.[1] ?? null;
    const task = `Name the person who wrote or checked ${path}, with a line on their first-hand experience, and add them as the Person author in the Article markup.`;
    if (authors.people.length > 0 || byline) {
      out.push(result(CHECKS.author, 'pass', `By ${authors.people[0] ?? byline}`));
    } else if (authors.organizations.length > 0 || f.metaAuthor) {
      out.push(result(CHECKS.author, 'warn', `Credited to ${authors.organizations[0] ?? f.metaAuthor} only`, task));
    } else {
      out.push(result(CHECKS.author, 'fail', 'No author shown', task));
    }
  }

  const prev = ctx.previous;
  if (
    ctx.dateModified &&
    prev?.dateModified &&
    prev.contentHash &&
    ctx.contentHash &&
    ctx.dateModified !== prev.dateModified &&
    prev.contentHash === ctx.contentHash
  ) {
    out.push(
      result(CHECKS.dates, 'fail', `Date changed to ${ctx.dateModified}, but the text is the same as at the last audit`,
        `Only change the updated date on ${path} when its content changes. Google lists changing dates to seem fresh as a sign of search-engine-first content.`),
    );
  } else if (ctx.dateModified) {
    out.push(result(CHECKS.dates, 'pass', `Updated ${ctx.dateModified}`));
  } else if (ctx.pageType === 'editorial') {
    out.push(
      result(CHECKS.dates, 'warn', 'No updated date',
        `Show when ${path} was last updated, and add dateModified to its Article markup.`),
    );
  } else {
    out.push(notScored(CHECKS.dates, 'not-applicable', 'No date shown, and none expected here'));
  }

  const contentImages = f.images.filter((i) => (f.hasMain ? i.inMain : true));
  const ownImages = contentImages.filter((i) => !isStockImage(i.src));
  if (contentImages.length === 0 && f.cssBackgroundImages > 0) {
    out.push(
      result(CHECKS.images, 'fail', `No <img> tags; ${plural(f.cssBackgroundImages, 'image')} set as CSS backgrounds`,
        `Show the photos on ${path} with <img> elements and alt text. Google doesn't index CSS background images.`),
    );
  } else if (contentImages.length === 0) {
    out.push(
      result(CHECKS.images, 'warn', 'No images in the content',
        `Add your own photos to ${path}. Original photos show first-hand experience of the place.`),
    );
  } else if (ownImages.length === 0) {
    out.push(
      result(CHECKS.images, 'warn', `All ${plural(contentImages.length, 'image')} are stock photos`,
        `Replace the stock photos on ${path} with your own from trips you ran.`),
    );
  } else {
    out.push(result(CHECKS.images, 'pass', `${plural(ownImages.length, 'own image')}`));
  }

  if (contentImages.length === 0) {
    out.push(notScored(CHECKS.alt, 'not-applicable', 'No images'));
  } else {
    const missing = contentImages.filter((i) => i.alt === null).length;
    const share = missing / contentImages.length;
    const task = `Add alt text to the images on ${path} describing what each shows.`;
    if (missing === 0) out.push(result(CHECKS.alt, 'pass', `All ${contentImages.length} have alt text`));
    else out.push(result(CHECKS.alt, share <= 0.5 ? 'warn' : 'fail', `${missing} of ${contentImages.length} have no alt text`, task));
  }

  if (ctx.pageType === 'commercial' || ctx.pageType === 'home') {
    const price = PRICE_RE.exec(f.mainText)?.[0];
    out.push(
      price
        ? result(CHECKS.prices, 'pass', `Shows prices, e.g. ${price}`)
        : result(CHECKS.prices, 'warn', 'No specific prices',
            `State real starting prices and what they include on ${path}.`),
    );
  } else {
    out.push(notScored(CHECKS.prices, 'not-applicable', 'Not a package or booking page'));
  }

  const isHindi = /^hi\b/i.test(f.htmlLang ?? '') || /hindi/i.test(ctx.family ?? '');
  if ((ctx.pageType === 'commercial' || ctx.pageType === 'editorial') && !isHindi) {
    const contentHeadings = f.headings.filter((h) => h.level > 1 && (f.hasMain ? h.inMain : !h.inChrome));
    const found = contentHeadings.find((h) => ADVICE_RE.test(h.text));
    out.push(
      found
        ? result(CHECKS.advice, 'pass', `"${found.text}"`)
        : result(CHECKS.advice, 'warn', 'No section on what to skip or who it is not for',
            `Add a section to ${path} on what to skip, or who this trip is not for.`),
    );
  } else {
    out.push(notScored(CHECKS.advice, 'not-applicable', isHindi ? 'Hindi page' : 'Not a guide or package page'));
  }

  // ---- Search appearance ----------------------------------------------------
  const title = f.titles[0] ?? '';
  if (!title) {
    out.push(
      result(CHECKS.title, 'fail', 'No title',
        `Add a <title> to ${path} that says what the page offers.`),
    );
  } else {
    const issues: string[] = [];
    if (title.length < 10) issues.push('too short to describe the page');
    if (f.titles.length > 1) issues.push(`${f.titles.length} title tags`);
    const counts = new Map<string, number>();
    for (const t of significantTerms(title)) if (t.length > 2) counts.set(t, (counts.get(t) ?? 0) + 1);
    const stuffed = [...counts].filter(([, c]) => c >= 3).map(([t]) => t);
    if (stuffed.length) issues.push(`"${stuffed[0]}" repeated`);
    out.push(
      issues.length
        ? result(CHECKS.title, 'warn', `"${title}": ${issues.join('; ')}`,
            `Rewrite the title of ${path} as one clear description of the page, without repeating words.`)
        : result(CHECKS.title, 'pass', `"${title}"`),
    );
  }

  if (!a) {
    out.push(notScored(CHECKS.titleUnique, 'not-measured', 'Needs a full site audit'));
  } else if (a.duplicateTitleOf.length > 0) {
    const sample = a.duplicateTitleOf.slice(0, 3).map(pathOf).join(', ');
    out.push(
      result(CHECKS.titleUnique, 'fail', `Same title as ${plural(a.duplicateTitleOf.length, 'other page')}: ${sample}`,
        `Give ${path} a title that says what is different about it.`),
    );
  } else {
    out.push(result(CHECKS.titleUnique, 'pass', 'Unique'));
  }

  if (!ctx.targetKeyword) {
    out.push(notScored(CHECKS.query, 'not-applicable', 'No target query set'));
  } else {
    const wanted = [...new Set(significantTerms(ctx.targetKeyword))];
    const have = new Set(significantTerms(`${title} ${f.headings.filter((h) => h.level === 1).map((h) => h.text).join(' ')}`));
    const missing = wanted.filter((t) => !have.has(t));
    const share = wanted.length ? (wanted.length - missing.length) / wanted.length : 1;
    const task = `Use the words people search for ("${ctx.targetKeyword}") naturally in the title or main heading of ${path}.`;
    if (missing.length === 0) out.push(result(CHECKS.query, 'pass', `Covers "${ctx.targetKeyword}"`));
    else out.push(result(CHECKS.query, share >= 0.6 ? 'warn' : 'fail', `Missing: ${missing.join(', ')}`, task));
  }

  const description = f.metaDescriptions[0] ?? '';
  if (!description) {
    out.push(
      result(CHECKS.description, 'warn', 'No meta description',
        `Write a meta description for ${path}. Google may use it as the search snippet.`),
    );
  } else if (a && a.duplicateDescriptionOf.length > 0) {
    out.push(
      result(CHECKS.description, 'warn', `Same description as ${plural(a.duplicateDescriptionOf.length, 'other page')}`,
        `Write a description specific to ${path}.`),
    );
  } else {
    out.push(result(CHECKS.description, 'pass', `${description.length} characters`));
  }

  const h1s = f.headings.filter((h) => h.level === 1);
  out.push(
    h1s.length
      ? result(CHECKS.heading, 'pass', `"${h1s[0].text}"${h1s.length > 1 ? ` (+${h1s.length - 1} more, which is fine)` : ''}`)
      : result(CHECKS.heading, 'warn', 'No <h1>',
          `Give ${path} a visible main heading that matches what the page is about.`),
  );

  const broken = f.jsonLd.filter((b) => b.error);
  const types = [...new Set(f.jsonLd.flatMap((b) => b.types))];
  if (broken.length) {
    out.push(
      result(CHECKS.structured, 'fail', `${plural(broken.length, 'JSON-LD block')} won't parse: ${broken[0].error}`,
        `Fix the invalid JSON-LD on ${path}. Google ignores markup it can't parse.`),
    );
  } else if (!types.length) {
    out.push(
      result(CHECKS.structured, 'warn', 'No structured data',
        `Add structured data that matches what ${path} shows, such as BreadcrumbList, or Article on guides.`),
    );
  } else {
    const faqNote = types.includes('FAQPage') ? ' FAQPage markup no longer earns rich results.' : '';
    out.push(result(CHECKS.structured, 'pass', `Types: ${types.slice(0, 8).join(', ')}.${faqNote}`));
  }

  out.push(
    hasSelfServingRating(f.jsonLd, ctx.siteHost)
      ? result(CHECKS.reviews, 'warn', 'Ratings sit on your own business markup',
          'Expect no review stars from this: Google does not show them for reviews a business hosts about itself.')
      : notScored(CHECKS.reviews, 'not-applicable', 'No self-hosted business rating'),
  );

  if (!isHindi) {
    out.push(notScored(CHECKS.hreflang, 'not-applicable', 'Single-language page'));
  } else {
    out.push(
      f.hreflang.length
        ? result(CHECKS.hreflang, 'pass', `${plural(f.hreflang.length, 'alternate')}`)
        : result(CHECKS.hreflang, 'warn', 'No hreflang links',
            `Link ${path} and its English version to each other with hreflang so Google shows each language to the right searchers.`),
    );
  }

  // ---- Page experience ------------------------------------------------------
  const vitalTasks: Record<VitalMetric, string> = {
    lcpMs: `Speed up the largest element on ${path}, usually the hero image or heading: have it in the server HTML, compress it and preload it.`,
    inpMs: `Cut the JavaScript that runs when people tap or type on ${path}, and split long tasks.`,
    cls: `Reserve space for images, embeds and banners on ${path} so content doesn't jump while loading.`,
  };
  for (const [metric, s] of [['lcpMs', CHECKS.lcp], ['inpMs', CHECKS.inp], ['cls', CHECKS.cls]] as const) {
    const v = ctx.vitals?.[metric];
    if (!v) {
      const why =
        ctx.vitals && metric === 'inpMs'
          ? 'Not enough real-user data, and lab tests cannot measure INP'
          : ctx.vitalsNote ?? 'No data';
      out.push(notScored(s, 'not-measured', why));
      continue;
    }
    const severity: CheckSeverity = v.rating === 'good' ? 'pass' : v.rating === 'needs-improvement' ? 'warn' : 'fail';
    out.push(
      result(s, severity,
        `${formatVital(metric, v.value)} from ${SOURCE_LABEL[v.source]} (${ctx.vitals!.measuredAt.slice(0, 10)})`,
        vitalTasks[metric]),
    );
  }

  out.push(
    fetched.finalUrl.startsWith('https:')
      ? result(CHECKS.https, 'pass', 'HTTPS')
      : result(CHECKS.https, 'fail', 'Served over HTTP', `Serve ${path} over HTTPS and redirect HTTP to it.`),
  );
  out.push(
    f.hasViewport
      ? result(CHECKS.viewport, 'pass', 'Set')
      : result(CHECKS.viewport, 'fail', 'No viewport meta tag',
          `Add <meta name="viewport" content="width=device-width, initial-scale=1"> to ${path}. Google indexes the mobile version.`),
  );

  // ---- Internal links -------------------------------------------------------
  if (!a) {
    out.push(notScored(CHECKS.inbound, 'not-measured', 'Needs a full site audit'));
  } else if (a.inboundPages === 0) {
    out.push(
      result(CHECKS.inbound, 'fail', 'No other crawled page links here',
        `Link to ${path} from at least one related page. Google finds pages through links, and a page reachable only from the sitemap is easy to miss.`),
    );
  } else {
    out.push(
      result(CHECKS.inbound, 'pass', `Linked from ${plural(a.inboundPages, 'page')} (${a.inboundFromContent} in page content)`),
    );
  }

  const contentLinks = f.links.filter(
    (l) => sameHost(l.href, ctx.siteHost) && (f.hasMain ? l.inMain : !l.inChrome) && normalizePageUrl(l.href) !== self,
  );
  out.push(
    contentLinks.length
      ? result(CHECKS.contentLinks, 'pass', `${plural(contentLinks.length, 'link')} to other pages in the content`)
      : result(CHECKS.contentLinks, 'warn', 'No links to other pages in the content',
          `Link from the body of ${path} to the pages a reader needs next.`),
  );

  if (!contentLinks.length) {
    out.push(notScored(CHECKS.anchors, 'not-applicable', 'No content links'));
  } else {
    const empty = contentLinks.filter((l) => !l.text);
    const generic = contentLinks.filter((l) => GENERIC_ANCHORS.has(l.text.toLowerCase().replace(/[^\p{L}\s]/gu, '').trim()));
    if (empty.length) {
      out.push(
        result(CHECKS.anchors, 'warn', `${plural(empty.length, 'link')} with no text`,
          `Give every link on ${path} text, or an image with alt text, that says where it goes.`),
      );
    } else if (generic.length >= 3 || generic.length / contentLinks.length > 0.2) {
      out.push(
        result(CHECKS.anchors, 'warn', `${plural(generic.length, 'link')} say only "${generic[0].text}"`,
          `Replace generic link text like "${generic[0].text}" on ${path} with words that describe the destination.`),
      );
    } else {
      out.push(result(CHECKS.anchors, 'pass', 'Link text describes the destination'));
    }
  }

  out.push(
    f.uncrawlableLinks
      ? result(CHECKS.crawlable, 'warn', `${plural(f.uncrawlableLinks, 'link')} use JavaScript instead of an href`,
          `Use <a href="..."> for navigation on ${path}. Google only follows links with an href.`)
      : result(CHECKS.crawlable, 'pass', 'All links have an href'),
  );

  return out;
}

/** Site-wide check, attached to the homepage audit. */
export function sitemapLastmodCheck(summary: LastmodSummary | null): CheckResult {
  if (!summary || summary.total === 0) {
    return notScored(CHECKS.lastmod, 'not-measured', 'Sitemap could not be read');
  }
  if (summary.withLastmod === 0) {
    return notScored(CHECKS.lastmod, 'not-applicable', 'No lastmod dates in the sitemap');
  }
  if (lastmodLooksGenerated(summary)) {
    return result(
      CHECKS.lastmod,
      'warn',
      `${summary.topCount} of ${summary.withLastmod} URLs share lastmod ${summary.topValue}`,
      "Set each sitemap URL's lastmod to when that page's content last changed, not the build time. Google only uses lastmod when it is consistently accurate.",
    );
  }
  return result(CHECKS.lastmod, 'pass', `${summary.distinct} distinct dates`);
}
