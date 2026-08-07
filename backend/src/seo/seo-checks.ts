/**
 * On-page SEO checks. Deliberately regex-based rather than pulling in cheerio
 * — the rules we care about are simple presence/length/count checks on HTML
 * strings, and the fewer deps this module has, the fewer supply-chain risks.
 *
 * Every check returns the same shape so the aggregate score is easy. A rule
 * that fires "warning" contributes half its weight; passed contributes full;
 * failed contributes zero.
 */

export type CheckSeverity = 'pass' | 'warn' | 'fail';

export interface CheckResult {
  id: string;
  label: string;
  severity: CheckSeverity;
  weight: number;
  detail?: string;
  /** Actionable task text — only present on warn/fail. */
  task?: string;
}

interface Meta {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  htmlLang?: string;
  h1s: string[];
  imgTotal: number;
  imgWithoutAlt: number;
  internalLinks: number;
  externalLinks: number;
  jsonLdCount: number;
  hasViewport: boolean;
  hasFavicon: boolean;
}

/**
 * Extract the small set of signals we need. Deliberately tolerant — bad HTML
 * shouldn't crash the audit.
 */
export function parseMeta(html: string, baseUrl: URL): Meta {
  const m: Meta = {
    h1s: [],
    imgTotal: 0,
    imgWithoutAlt: 0,
    internalLinks: 0,
    externalLinks: 0,
    jsonLdCount: 0,
    hasViewport: false,
    hasFavicon: false,
  };

  const grabAttr = (tag: string, attrPattern: RegExp): string | undefined => {
    const re = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = re.exec(html)) !== null) {
      const el = match[0];
      const a = attrPattern.exec(el);
      if (a) return a[1];
    }
    return undefined;
  };

  const titleMatch = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  if (titleMatch) m.title = titleMatch[1].trim();

  m.description = grabMeta(html, /name=["']description["']/i);
  m.canonical = grabAttr('link', /rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
    ?? grabAttr('link', /href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
  m.robots = grabMeta(html, /name=["']robots["']/i);

  m.ogTitle       = grabMeta(html, /property=["']og:title["']/i);
  m.ogDescription = grabMeta(html, /property=["']og:description["']/i);
  m.ogImage       = grabMeta(html, /property=["']og:image["']/i);
  m.twitterCard   = grabMeta(html, /name=["']twitter:card["']/i);

  const htmlTag = /<html\b[^>]*>/i.exec(html);
  if (htmlTag) {
    const lang = /lang=["']([^"']+)["']/i.exec(htmlTag[0]);
    if (lang) m.htmlLang = lang[1];
  }

  const h1Re = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  let h1: RegExpExecArray | null;
  while ((h1 = h1Re.exec(html)) !== null) {
    m.h1s.push(h1[1].replace(/<[^>]+>/g, '').trim());
  }

  const imgRe = /<img\b([^>]*)>/gi;
  let img: RegExpExecArray | null;
  while ((img = imgRe.exec(html)) !== null) {
    m.imgTotal++;
    if (!/\balt=["']/.test(img[1])) m.imgWithoutAlt++;
  }

  const linkRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let a: RegExpExecArray | null;
  while ((a = linkRe.exec(html)) !== null) {
    const href = a[1];
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    try {
      const u = new URL(href, baseUrl);
      if (u.host === baseUrl.host) m.internalLinks++;
      else m.externalLinks++;
    } catch { /* ignore malformed */ }
  }

  m.jsonLdCount = (html.match(/type=["']application\/ld\+json["']/gi) ?? []).length;

  m.hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  m.hasFavicon =
    /<link[^>]+rel=["']([^"']*\b)?icon(\b[^"']*)?["']/i.test(html) ||
    /<link[^>]+rel=["']shortcut icon["']/i.test(html);

  return m;
}

function grabMeta(html: string, attrRe: RegExp): string | undefined {
  const tagRe = /<meta\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html)) !== null) {
    const el = m[0];
    if (!attrRe.test(el)) continue;
    const c = /content=["']([^"']*)["']/i.exec(el);
    if (c) return c[1].trim();
  }
  return undefined;
}

/**
 * Run every rule against parsed meta. Returns pass/warn/fail with a task
 * suggestion when action is needed.
 */
export function runChecks(meta: Meta, url: URL): CheckResult[] {
  const out: CheckResult[] = [];
  const push = (r: CheckResult) => out.push(r);

  // --- title ------------------------------------------------------------
  if (!meta.title) {
    push({ id: 'title-present', label: 'Page title', severity: 'fail', weight: 8,
      task: `Add a <title> tag to ${url.pathname}. Aim for 50–60 characters describing the page.` });
  } else if (meta.title.length < 20 || meta.title.length > 65) {
    push({ id: 'title-length', label: 'Title length', severity: 'warn', weight: 4,
      detail: `${meta.title.length} chars`,
      task: `Adjust the <title> on ${url.pathname} to 50–60 characters (currently ${meta.title.length}).` });
  } else {
    push({ id: 'title-ok', label: 'Title present & sensible', severity: 'pass', weight: 8, detail: meta.title });
  }

  // --- meta description -------------------------------------------------
  if (!meta.description) {
    push({ id: 'desc-present', label: 'Meta description', severity: 'fail', weight: 6,
      task: `Add a meta description on ${url.pathname} (140–160 chars). This is what Google shows under the title.` });
  } else if (meta.description.length < 80 || meta.description.length > 165) {
    push({ id: 'desc-length', label: 'Description length', severity: 'warn', weight: 3,
      detail: `${meta.description.length} chars`,
      task: `Trim or extend the meta description on ${url.pathname} to 140–160 characters.` });
  } else {
    push({ id: 'desc-ok', label: 'Description present & sized', severity: 'pass', weight: 6 });
  }

  // --- h1 ---------------------------------------------------------------
  if (meta.h1s.length === 0) {
    push({ id: 'h1-present', label: '<h1> tag', severity: 'fail', weight: 5,
      task: `Add exactly one <h1> to ${url.pathname}.` });
  } else if (meta.h1s.length > 1) {
    push({ id: 'h1-single', label: 'Single <h1>', severity: 'warn', weight: 3,
      detail: `${meta.h1s.length} h1s`,
      task: `${url.pathname} has ${meta.h1s.length} <h1> tags. Keep just one primary heading.` });
  } else {
    push({ id: 'h1-ok', label: 'One <h1>', severity: 'pass', weight: 5, detail: meta.h1s[0].slice(0, 80) });
  }

  // --- canonical --------------------------------------------------------
  if (!meta.canonical) {
    push({ id: 'canonical', label: 'Canonical link', severity: 'warn', weight: 3,
      task: `Add <link rel="canonical" href="${url.origin}${url.pathname}"> to ${url.pathname}.` });
  } else {
    push({ id: 'canonical-ok', label: 'Canonical set', severity: 'pass', weight: 3, detail: meta.canonical });
  }

  // --- Open Graph -------------------------------------------------------
  const ogMissing = [
    !meta.ogTitle && 'og:title',
    !meta.ogDescription && 'og:description',
    !meta.ogImage && 'og:image',
  ].filter(Boolean) as string[];
  if (ogMissing.length > 0) {
    push({ id: 'og', label: 'Open Graph', severity: ogMissing.length === 3 ? 'fail' : 'warn', weight: 5,
      detail: `missing ${ogMissing.join(', ')}`,
      task: `Add missing Open Graph tags on ${url.pathname}: ${ogMissing.join(', ')}. These control how the link previews in WhatsApp and social.` });
  } else {
    push({ id: 'og-ok', label: 'Open Graph complete', severity: 'pass', weight: 5 });
  }

  // --- Twitter card -----------------------------------------------------
  if (!meta.twitterCard) {
    push({ id: 'twitter', label: 'Twitter card', severity: 'warn', weight: 2,
      task: `Add <meta name="twitter:card" content="summary_large_image"> to ${url.pathname}.` });
  } else {
    push({ id: 'twitter-ok', label: 'Twitter card set', severity: 'pass', weight: 2 });
  }

  // --- html lang --------------------------------------------------------
  if (!meta.htmlLang) {
    push({ id: 'html-lang', label: '<html lang="…">', severity: 'warn', weight: 3,
      task: `Add lang="en" (or the actual language) to the <html> tag on ${url.pathname}.` });
  } else {
    push({ id: 'html-lang-ok', label: 'HTML language set', severity: 'pass', weight: 3, detail: meta.htmlLang });
  }

  // --- viewport ---------------------------------------------------------
  if (!meta.hasViewport) {
    push({ id: 'viewport', label: 'Mobile viewport', severity: 'fail', weight: 4,
      task: `Add <meta name="viewport" content="width=device-width, initial-scale=1"> to ${url.pathname}.` });
  } else {
    push({ id: 'viewport-ok', label: 'Viewport meta set', severity: 'pass', weight: 4 });
  }

  // --- favicon ----------------------------------------------------------
  if (!meta.hasFavicon) {
    push({ id: 'favicon', label: 'Favicon', severity: 'warn', weight: 1,
      task: `Add a favicon link to ${url.pathname}.` });
  } else {
    push({ id: 'favicon-ok', label: 'Favicon present', severity: 'pass', weight: 1 });
  }

  // --- alt text ---------------------------------------------------------
  if (meta.imgTotal === 0) {
    // Neutral — a page with no images doesn't need alt.
  } else if (meta.imgWithoutAlt > 0) {
    push({ id: 'alt', label: 'Image alt text', severity: meta.imgWithoutAlt > meta.imgTotal / 2 ? 'fail' : 'warn', weight: 5,
      detail: `${meta.imgWithoutAlt} of ${meta.imgTotal} missing alt`,
      task: `${meta.imgWithoutAlt} of ${meta.imgTotal} images on ${url.pathname} have no alt text. Describe each one — this helps SEO and screen readers.` });
  } else {
    push({ id: 'alt-ok', label: 'Every image has alt', severity: 'pass', weight: 5, detail: `${meta.imgTotal} images` });
  }

  // --- schema.org -------------------------------------------------------
  if (meta.jsonLdCount === 0) {
    push({ id: 'schema', label: 'Schema.org JSON-LD', severity: 'warn', weight: 4,
      task: `Add JSON-LD structured data to ${url.pathname}. For a DMC, TravelAgency + Product schema unlock rich results.` });
  } else {
    push({ id: 'schema-ok', label: 'JSON-LD present', severity: 'pass', weight: 4, detail: `${meta.jsonLdCount} block(s)` });
  }

  // --- internal linking --------------------------------------------------
  if (meta.internalLinks < 3) {
    push({ id: 'internal-links', label: 'Internal linking', severity: 'warn', weight: 3,
      detail: `${meta.internalLinks} internal link(s)`,
      task: `${url.pathname} has only ${meta.internalLinks} internal link(s). Link to related destinations, itineraries and reviews.` });
  } else {
    push({ id: 'internal-links-ok', label: 'Internal linking healthy', severity: 'pass', weight: 3, detail: `${meta.internalLinks} links` });
  }

  // --- robots -----------------------------------------------------------
  if (meta.robots && /noindex/i.test(meta.robots)) {
    push({ id: 'noindex', label: 'Indexable', severity: 'fail', weight: 10,
      detail: `robots="${meta.robots}"`,
      task: `${url.pathname} is set to noindex. Remove the robots meta or set it to "index, follow" so Google can find you.` });
  } else {
    push({ id: 'indexable-ok', label: 'Indexable', severity: 'pass', weight: 10 });
  }

  return out;
}

/**
 * 0-100 score. Weighted average of check results (pass=full, warn=half,
 * fail=0), optionally blended 50/50 with PageSpeed's four scores when present.
 */
export function aggregateScore(
  checks: CheckResult[],
  pagespeed?: { perf?: number; a11y?: number; bp?: number; seo?: number },
): number {
  const w = checks.reduce((a, c) => a + c.weight, 0);
  const scored = checks.reduce((a, c) => {
    const mult = c.severity === 'pass' ? 1 : c.severity === 'warn' ? 0.5 : 0;
    return a + c.weight * mult;
  }, 0);
  const onPage = w > 0 ? (scored / w) * 100 : 0;

  const ps = pagespeed;
  if (!ps) return Math.round(onPage);

  const psScores = [ps.perf, ps.a11y, ps.bp, ps.seo].filter(
    (s): s is number => typeof s === 'number',
  );
  if (psScores.length === 0) return Math.round(onPage);
  const psAvg = psScores.reduce((a, b) => a + b, 0) / psScores.length;

  return Math.round(onPage * 0.5 + psAvg * 0.5);
}
