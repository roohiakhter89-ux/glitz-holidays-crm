/**
 * XML sitemap parsing for the audit.
 *
 * Google ignores <priority> and <changefreq>, and uses <lastmod> only "if it's
 * consistently and verifiably accurate"
 * (https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
 * So the one thing worth checking beyond membership is whether lastmod looks
 * like real edit dates or a build timestamp stamped on every URL.
 */

export interface SitemapEntry {
  loc: string;
  lastmod: string | null;
}

export interface ParsedSitemap {
  kind: 'urlset' | 'sitemapindex' | 'unknown';
  /** Page URLs for a urlset, child sitemap URLs for an index. */
  entries: SitemapEntry[];
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

export function parseSitemap(xml: string): ParsedSitemap {
  const kind: ParsedSitemap['kind'] = /<sitemapindex[\s>]/i.test(xml)
    ? 'sitemapindex'
    : /<urlset[\s>]/i.test(xml)
      ? 'urlset'
      : 'unknown';
  if (kind === 'unknown') return { kind, entries: [] };

  const tag = kind === 'sitemapindex' ? 'sitemap' : 'url';
  const entries: SitemapEntry[] = [];
  for (const m of xml.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'gi'))) {
    const loc = /<loc>([\s\S]*?)<\/loc>/i.exec(m[1]);
    if (!loc) continue;
    const lastmod = /<lastmod>([\s\S]*?)<\/lastmod>/i.exec(m[1]);
    entries.push({ loc: decode(loc[1]), lastmod: lastmod ? decode(lastmod[1]) : null });
  }
  return { kind, entries };
}

export interface LastmodSummary {
  total: number;
  withLastmod: number;
  distinct: number;
  /** The most common lastmod value and how many URLs carry it. */
  topValue: string | null;
  topCount: number;
}

export function summariseLastmod(entries: SitemapEntry[]): LastmodSummary {
  const counts = new Map<string, number>();
  for (const e of entries) {
    if (e.lastmod) counts.set(e.lastmod, (counts.get(e.lastmod) ?? 0) + 1);
  }
  let topValue: string | null = null;
  let topCount = 0;
  for (const [value, count] of counts) {
    if (count > topCount) {
      topValue = value;
      topCount = count;
    }
  }
  const withLastmod = [...counts.values()].reduce((a, b) => a + b, 0);
  return { total: entries.length, withLastmod, distinct: counts.size, topValue, topCount };
}

/**
 * True when nearly every URL carries the same lastmod, which is what a sitemap
 * generated with the build time looks like. Twenty URLs minimum, so a small
 * site updated in one go is not flagged.
 */
export function lastmodLooksGenerated(s: LastmodSummary): boolean {
  return s.withLastmod >= 20 && s.topCount / s.withLastmod >= 0.9;
}
