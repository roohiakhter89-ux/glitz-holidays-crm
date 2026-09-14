/**
 * Comprehensive SEO Algorithm & On-Page Scoring Framework
 * Designed per Google Search Quality Rater Guidelines, Content Standards,
 * Information Gain requirements, and E-E-A-T operational standards.
 */

export type CheckSeverity = 'pass' | 'warn' | 'fail';

export interface CheckResult {
  id: string;
  label: string;
  category: 'on-page' | 'content' | 'technical' | 'trust-moat';
  severity: CheckSeverity;
  weight: number;
  score: number; // calculated points earned
  detail?: string;
  task?: string;
}

export interface OffPageSignals {
  backlinkCount?: number | null;
  referringDomains?: number | null;
  pageAuthority?: number | null; // 0 - 100
  prMentions?: number | null; // Press Releases / media mentions
  socialShares?: number | null;
  searchConsoleCtr?: number | null; // % CTR from GSC
  notes?: string | null;
}

/**
 * Site-wide off-page signals. Distinct from OffPageSignals, which is per-URL.
 *
 * Google Business Profile completeness, review volume, citation consistency
 * and site-level referring domains belong to the DOMAIN, not to any one page.
 * Recording them per-URL would mean copying identical values across every page
 * on the site, so they live on their own row keyed by site and lift every
 * page's score equally, which is what a stronger domain actually does.
 */
export interface DomainSignals {
  /** 0-100. How complete the GBP listing is (hours, categories, services, Q&A). */
  gbpCompleteness?: number | null;
  /** Total Google reviews on the profile. */
  gbpReviewCount?: number | null;
  /** 1.0 - 5.0. */
  gbpAverageRating?: number | null;
  /** GBP posts published in the trailing 30 days. Local prominence decays. */
  gbpPostsLast30d?: number | null;
  /** Directory and local listings carrying the business NAP. */
  citationsTotal?: number | null;
  /** Of those, how many match the GBP name/address/phone character for character. */
  citationsNapConsistent?: number | null;
  /** Brand mentions that already carry a link. */
  brandMentionsLinked?: number | null;
  /** Brand mentions with no link. These are the outreach queue. */
  brandMentionsUnlinked?: number | null;
  /** Unique referring domains across the whole site. */
  referringDomainsTotal?: number | null;
  /** Referring domains judged spammy. Costs part of the domain bonus. */
  toxicDomainCount?: number | null;
  /** When a human last checked these against the live sources. */
  verifiedOn?: Date | string | null;
  notes?: string | null;
}

// ============================================================================
// Score composition
// ============================================================================
//
// On-page is the base and off-page is HEADROOM ON TOP. The previous model
// rebased on-page to 70% the moment any off-page row existed, so a page
// scoring 88 on-page dropped to 70 when three honest backlinks were recorded,
// and needed 27 of 30 off-page points merely to break even. Recording real
// data made the number worse, which is why the table held zero rows.
//
// Under this split the base is fixed, every off-page component is clamped
// non-negative, and the total is capped at 100. Entering data can therefore
// only raise a score or leave it unchanged. That property is the whole point:
// a measurement people are punished for entering does not get entered.

/** On-page (blended with PageSpeed) scales into 0-85. */
export const ON_PAGE_BASE_MAX = 85;
/** Per-URL off-page signals add up to 9. */
export const PAGE_SIGNAL_MAX = 9;
/** Site-wide domain signals add up to 6. */
export const DOMAIN_SIGNAL_MAX = 6;
/** Combined off-page headroom. */
export const OFF_PAGE_MAX = PAGE_SIGNAL_MAX + DOMAIN_SIGNAL_MAX;

export interface ParsedMeta {
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
  h2s: string[];
  h3s: string[];
  imgTotal: number;
  imgWithoutAlt: number;
  imgStockCount: number;
  imgOriginalCount: number;
  internalLinks: number;
  externalLinks: number;
  jsonLdCount: number;
  jsonLdTypes: string[];
  hasViewport: boolean;
  hasFavicon: boolean;
  wordCount: number;
  bodyText: string;
  first150Words: string;
  hasNegativeAdvice: boolean;
  negativeAdviceSnippets: string[];
  hasPricingTransparency: boolean;
  hasLocalOperationalFacts: boolean;
  faqCount: number;
}

/**
 * Extract deep signals from HTML for algorithm evaluation
 */
export function parseMeta(html: string, baseUrl: URL): ParsedMeta {
  const m: ParsedMeta = {
    h1s: [],
    h2s: [],
    h3s: [],
    imgTotal: 0,
    imgWithoutAlt: 0,
    imgStockCount: 0,
    imgOriginalCount: 0,
    internalLinks: 0,
    externalLinks: 0,
    jsonLdCount: 0,
    jsonLdTypes: [],
    hasViewport: false,
    hasFavicon: false,
    wordCount: 0,
    bodyText: '',
    first150Words: '',
    hasNegativeAdvice: false,
    negativeAdviceSnippets: [],
    hasPricingTransparency: false,
    hasLocalOperationalFacts: false,
    faqCount: 0,
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

  // Title
  const titleMatch = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  if (titleMatch) m.title = titleMatch[1].trim();

  // Meta tags
  m.description = grabMeta(html, /name=["']description["']/i);
  m.canonical =
    grabAttr('link', /rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ??
    grabAttr('link', /href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
  m.robots = grabMeta(html, /name=["']robots["']/i);

  m.ogTitle = grabMeta(html, /property=["']og:title["']/i);
  m.ogDescription = grabMeta(html, /property=["']og:description["']/i);
  m.ogImage = grabMeta(html, /property=["']og:image["']/i);
  m.twitterCard = grabMeta(html, /name=["']twitter:card["']/i);

  const htmlTag = /<html\b[^>]*>/i.exec(html);
  if (htmlTag) {
    const lang = /lang=["']([^"']+)["']/i.exec(htmlTag[0]);
    if (lang) m.htmlLang = lang[1];
  }

  // Headings
  const h1Re = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  let h1: RegExpExecArray | null;
  while ((h1 = h1Re.exec(html)) !== null) {
    m.h1s.push(stripTags(h1[1]).trim());
  }

  const h2Re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let h2: RegExpExecArray | null;
  while ((h2 = h2Re.exec(html)) !== null) {
    m.h2s.push(stripTags(h2[1]).trim());
  }

  const h3Re = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  let h3: RegExpExecArray | null;
  while ((h3 = h3Re.exec(html)) !== null) {
    m.h3s.push(stripTags(h3[1]).trim());
  }

  // Images
  const imgRe = /<img\b([^>]*)>/gi;
  let img: RegExpExecArray | null;
  while ((img = imgRe.exec(html)) !== null) {
    const imgAttrs = img[1];
    m.imgTotal++;
    if (!/\balt=["'][^"']+["']/.test(imgAttrs)) {
      m.imgWithoutAlt++;
    }

    const srcMatch = /src=["']([^"']+)["']/i.exec(imgAttrs);
    if (srcMatch) {
      const src = srcMatch[1].toLowerCase();
      if (src.includes('images.unsplash.com') || src.includes('pexels.com') || src.includes('pixabay.com')) {
        m.imgStockCount++;
      } else if (src.startsWith('http') || src.startsWith('/') || src.includes('supabase') || src.includes('cloudinary') || src.includes('glitz')) {
        m.imgOriginalCount++;
      }
    }
  }

  // Links
  const linkRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let a: RegExpExecArray | null;
  while ((a = linkRe.exec(html)) !== null) {
    const href = a[1];
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    try {
      const u = new URL(href, baseUrl);
      if (u.host === baseUrl.host) m.internalLinks++;
      else m.externalLinks++;
    } catch {
      // Relative links are internal
      if (href.startsWith('/')) m.internalLinks++;
    }
  }

  // Structured Data (JSON-LD)
  const jsonLdRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let ldMatch: RegExpExecArray | null;
  while ((ldMatch = jsonLdRe.exec(html)) !== null) {
    m.jsonLdCount++;
    try {
      const parsed = JSON.parse(ldMatch[1]);
      const checkType = (obj: any) => {
        if (!obj) return;
        if (obj['@type']) {
          m.jsonLdTypes.push(String(obj['@type']));
          if (obj['@type'] === 'FAQPage' && Array.isArray(obj.mainEntity)) {
            m.faqCount += obj.mainEntity.length;
          }
        }
        if (Array.isArray(obj['@graph'])) {
          obj['@graph'].forEach(checkType);
        }
      };
      checkType(parsed);
    } catch {
      // Ignored malformed json-ld string
    }
  }

  m.hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  m.hasFavicon =
    /<link[^>]+rel=["']([^"']*\b)?icon(\b[^"']*)?["']/i.test(html) ||
    /<link[^>]+rel=["']shortcut icon["']/i.test(html);

  // Body content extraction
  const bodyMatch = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(html);
  const cleanBodyHtml = bodyMatch
    ? bodyMatch[1]
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '')
        .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '')
    : html;

  const rawText = stripTags(cleanBodyHtml).replace(/\s+/g, ' ').trim();
  m.bodyText = rawText;
  const words = rawText.split(/\s+/).filter(Boolean);
  m.wordCount = words.length;
  m.first150Words = words.slice(0, 150).join(' ');

  // Content Quality & Honesty Checks (Moat signals)
  const lowerBody = rawText.toLowerCase();

  // Negative advice / What to skip
  const negativePatterns = [
    /what to skip/i,
    /skip the/i,
    /avoid /i,
    /don't visit/i,
    /not worth/i,
    /who this is not for/i,
    /who should avoid/i,
    /when not to go/i,
    /common tourist trap/i,
  ];
  for (const pat of negativePatterns) {
    if (pat.test(lowerBody)) {
      m.hasNegativeAdvice = true;
      const matchSnippet = pat.exec(lowerBody);
      if (matchSnippet && m.negativeAdviceSnippets.length < 3) {
        m.negativeAdviceSnippets.push(matchSnippet[0]);
      }
    }
  }

  // Pricing Transparency
  m.hasPricingTransparency =
    /₹|\brs\.?|\binr\b|per person|twin sharing|gst included|permit fee|union rate/i.test(
      lowerBody,
    );

  // Local Operational Facts (Moat)
  m.hasLocalOperationalFacts =
    /srinagar|kashmir|gulmarg|pahalgam|sonmarg|doodhpathri|gondola|taxi union|chain taxi|verified on|tariq ahmad|since 2013/i.test(
      lowerBody,
    );

  return m;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, ' ');
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
 * Run comprehensive algorithm evaluation against parsed meta + primary keyword
 */
export function runChecks(
  meta: ParsedMeta,
  url: URL,
  targetKeyword?: string,
): CheckResult[] {
  const out: CheckResult[] = [];
  const push = (
    id: string,
    label: string,
    category: CheckResult['category'],
    severity: CheckSeverity,
    weight: number,
    detail?: string,
    task?: string,
  ) => {
    const score = severity === 'pass' ? weight : severity === 'warn' ? weight * 0.5 : 0;
    out.push({ id, label, category, severity, weight, score, detail, task });
  };

  const kw = targetKeyword?.toLowerCase().trim();

  // ==========================================================================
  // 1. ON-PAGE SIGNALS (Title, Meta Description, Headings, Keywords)
  // ==========================================================================

  // --- Title Tag ---
  if (!meta.title) {
    push(
      'title-present',
      'Title Tag',
      'on-page',
      'fail',
      6,
      'Missing',
      `Add a <title> tag to ${url.pathname} (aim for 50–60 characters).`,
    );
  } else if (meta.title.length < 25 || meta.title.length > 68) {
    push(
      'title-length',
      'Title Length',
      'on-page',
      'warn',
      6,
      `${meta.title.length} chars`,
      `Adjust title on ${url.pathname} to 50–60 chars (currently ${meta.title.length}).`,
    );
  } else {
    push('title-ok', 'Title Tag Optimized', 'on-page', 'pass', 6, `${meta.title.length} chars: "${meta.title.slice(0, 50)}..."`);
  }

  // --- Target Keyword in Title ---
  if (kw) {
    if (meta.title && meta.title.toLowerCase().includes(kw)) {
      push('kw-in-title', 'Target Keyword in Title', 'on-page', 'pass', 4, `Found "${kw}"`);
    } else {
      push(
        'kw-in-title-missing',
        'Target Keyword in Title',
        'on-page',
        'warn',
        4,
        `Missing "${kw}"`,
        `Include target keyword "${kw}" naturally in <title> on ${url.pathname}.`,
      );
    }
  }

  // --- Meta Description ---
  if (!meta.description) {
    push(
      'desc-present',
      'Meta Description',
      'on-page',
      'fail',
      5,
      'Missing',
      `Add a meta description to ${url.pathname} (140–160 characters).`,
    );
  } else if (meta.description.length < 80 || meta.description.length > 165) {
    push(
      'desc-length',
      'Meta Description Length',
      'on-page',
      'warn',
      5,
      `${meta.description.length} chars`,
      `Fine-tune meta description to 140–160 chars on ${url.pathname}.`,
    );
  } else {
    push('desc-ok', 'Meta Description Optimized', 'on-page', 'pass', 5, `${meta.description.length} chars`);
  }

  // --- H1 Tag ---
  if (meta.h1s.length === 0) {
    push('h1-present', 'H1 Heading', 'on-page', 'fail', 5, 'Missing H1', `Add exactly one descriptive <h1> to ${url.pathname}.`);
  } else if (meta.h1s.length > 1) {
    push('h1-single', 'H1 Heading', 'on-page', 'warn', 5, `${meta.h1s.length} H1 tags found`, `Keep only one primary <h1> on ${url.pathname}.`);
  } else {
    push('h1-ok', 'H1 Heading Present', 'on-page', 'pass', 5, `"${meta.h1s[0].slice(0, 45)}..."`);
  }

  // --- Heading Hierarchy (H2, H3) ---
  if (meta.h2s.length < 2) {
    push(
      'heading-hierarchy',
      'Heading Structure (H2/H3)',
      'on-page',
      'warn',
      3,
      `Only ${meta.h2s.length} H2 sections`,
      `Break content on ${url.pathname} into clear H2 sections targeting sub-intents.`,
    );
  } else {
    push('heading-hierarchy-ok', 'Heading Hierarchy', 'on-page', 'pass', 3, `${meta.h2s.length} H2s, ${meta.h3s.length} H3s`);
  }

  // ==========================================================================
  // 2. CONTENT QUALITY & INFORMATION GAIN (Glitz Moat, Honesty, Depth)
  // ==========================================================================

  // --- Content Depth & Word Count ---
  if (meta.wordCount < 300) {
    push(
      'content-depth',
      'Content Depth',
      'content',
      'fail',
      5,
      `${meta.wordCount} words (thin)`,
      `Expand depth on ${url.pathname}. Google rewards comprehensive, helpful content over thin pages.`,
    );
  } else if (meta.wordCount < 600) {
    push(
      'content-depth-mod',
      'Content Depth',
      'content',
      'warn',
      5,
      `${meta.wordCount} words`,
      `Consider adding detailed tables, FAQs, or day-by-day notes to ${url.pathname}.`,
    );
  } else {
    push('content-depth-ok', 'Content Depth & Substance', 'content', 'pass', 5, `${meta.wordCount} words`);
  }

  // --- Direct Answer in First 150 Words ---
  if (meta.first150Words.length > 150) {
    push('direct-answer-ok', 'Direct Answer / Immediate Value', 'content', 'pass', 5, 'Early intent match present');
  } else {
    push('direct-answer-warn', 'Direct Answer in Lead', 'content', 'warn', 5, 'Content starts slowly', `Provide the direct answer / price in the first 100 words on ${url.pathname}.`);
  }

  // --- Honesty Rule: Negative Advice ("What to Skip") ---
  if (meta.hasNegativeAdvice) {
    push(
      'negative-advice-ok',
      'Negative Advice & Honesty ("What to Skip")',
      'trust-moat',
      'pass',
      4,
      `Detected honesty signals: ${meta.negativeAdviceSnippets.join(', ')}`,
    );
  } else {
    push(
      'negative-advice-missing',
      'Negative Advice ("What to Skip")',
      'trust-moat',
      'warn',
      4,
      'No explicit negative advice found',
      `Add a "What to Skip / When Not to Visit" section to ${url.pathname} to differentiate from generic spam.`,
    );
  }

  // --- Local Operational Moat Facts ---
  if (meta.hasLocalOperationalFacts) {
    push('local-moat-ok', 'Local Operational Moat', 'trust-moat', 'pass', 4, 'Includes local operational context');
  } else {
    push('local-moat-warn', 'Local Operational Moat', 'trust-moat', 'warn', 4, 'Generic phrasing', `Mention specific local details (permits, unions, Srinagar ground team) on ${url.pathname}.`);
  }

  // --- Transparent Pricing / Inclusions ---
  if (meta.hasPricingTransparency) {
    push('pricing-transparency-ok', 'Pricing Transparency', 'trust-moat', 'pass', 3, 'Floor prices or permit charges visible');
  } else {
    push('pricing-transparency-warn', 'Pricing Transparency', 'trust-moat', 'warn', 3, 'No pricing/exclusion terms found');
  }

  // ==========================================================================
  // 3. TECHNICAL SEO, STRUCTURED DATA & LINKING
  // ==========================================================================

  // --- Canonical Link ---
  if (!meta.canonical) {
    push('canonical', 'Canonical Link', 'technical', 'warn', 3, 'Missing', `Add <link rel="canonical"> to ${url.pathname}.`);
  } else {
    push('canonical-ok', 'Canonical Tag Set', 'technical', 'pass', 3, meta.canonical);
  }

  // --- Schema.org Structured Data & FAQ Schema ---
  if (meta.jsonLdCount === 0) {
    push('schema-missing', 'Structured Data (JSON-LD)', 'technical', 'fail', 5, 'No JSON-LD found', `Add Schema.org JSON-LD (Article, TouristTrip, or FAQPage) to ${url.pathname}.`);
  } else {
    const typesStr = meta.jsonLdTypes.join(', ') || `${meta.jsonLdCount} block(s)`;
    push('schema-ok', 'Structured Data (JSON-LD)', 'technical', 'pass', 5, `Types: ${typesStr}`);
  }

  if (meta.faqCount > 0) {
    push('faq-schema-ok', 'FAQPage Rich Schema', 'technical', 'pass', 3, `${meta.faqCount} FAQ questions indexed`);
  } else if (meta.jsonLdTypes.includes('FAQPage')) {
    push('faq-schema-ok', 'FAQPage Schema Present', 'technical', 'pass', 3);
  } else {
    push('faq-schema-missing', 'FAQPage Schema', 'technical', 'warn', 3, 'Missing FAQ Schema', `Add FAQ structured data to ${url.pathname} to qualify for Google PAA rich snippets.`);
  }

  // --- Open Graph & Social Cards ---
  const ogMissing = [!meta.ogTitle && 'og:title', !meta.ogDescription && 'og:description', !meta.ogImage && 'og:image'].filter(Boolean);
  if (ogMissing.length > 0) {
    push('og-missing', 'Open Graph Metadata', 'technical', ogMissing.length === 3 ? 'fail' : 'warn', 3, `Missing ${ogMissing.join(', ')}`);
  } else {
    push('og-ok', 'Open Graph Tags Complete', 'technical', 'pass', 3, 'og:title, image, desc present');
  }

  // --- Internal Linking ---
  if (meta.internalLinks < 3) {
    push('internal-links-low', 'Internal Linking Equity', 'technical', 'warn', 5, `${meta.internalLinks} internal links`, `Add at least 3-5 contextual internal links from ${url.pathname} to related guides and packages.`);
  } else {
    push('internal-links-ok', 'Internal Linking Equity', 'technical', 'pass', 5, `${meta.internalLinks} internal links, ${meta.externalLinks} outbound`);
  }

  // --- Image Alt Text & Original Photography ---
  if (meta.imgTotal === 0) {
    push('images-present', 'Imagery', 'content', 'warn', 3, 'No images on page', `Add original photos of Kashmir to ${url.pathname}.`);
  } else {
    if (meta.imgWithoutAlt > 0) {
      push('img-alt-warn', 'Image Alt Text', 'technical', meta.imgWithoutAlt > meta.imgTotal / 2 ? 'fail' : 'warn', 3, `${meta.imgWithoutAlt}/${meta.imgTotal} missing alt`, `Provide descriptive alt text for all images on ${url.pathname}.`);
    } else {
      push('img-alt-ok', 'Image Alt Text', 'technical', 'pass', 3, `All ${meta.imgTotal} images have alt tags`);
    }

    if (meta.imgOriginalCount > 0) {
      push('original-imagery-ok', 'Original / CDN Imagery', 'trust-moat', 'pass', 3, `${meta.imgOriginalCount} custom/CRM images`);
    } else {
      push('stock-imagery-warn', 'Original Photography Moat', 'trust-moat', 'warn', 3, 'All stock images', `Replace stock Unsplash photos on ${url.pathname} with original operator photos uploaded from CRM.`);
    }
  }

  // --- Indexable & Mobile Viewport ---
  if (meta.robots && /noindex/i.test(meta.robots)) {
    push('robots-noindex', 'Search Indexability', 'technical', 'fail', 5, `robots="${meta.robots}"`, `Remove noindex tag from ${url.pathname}.`);
  } else {
    push('robots-index-ok', 'Search Indexable', 'technical', 'pass', 5, 'Index, follow allowed');
  }

  if (!meta.hasViewport) {
    push('viewport-missing', 'Mobile Viewport', 'technical', 'fail', 2, 'Missing viewport tag');
  } else {
    push('viewport-ok', 'Mobile Responsive Viewport', 'technical', 'pass', 2, 'Viewport configured');
  }

  return out;
}

/**
 * Per-URL off-page signals, scored out of PAGE_SIGNAL_MAX.
 *
 * The relative weighting between the six inputs is unchanged from the original
 * 30-point scale; only the ceiling moved. Kept as a named export so the
 * dashboard can show the sub-score on its own.
 */
export function calculatePageSignalPoints(offPage?: OffPageSignals | null): number {
  if (!offPage) return 0;

  // Same bands as before, on the original 0-30 scale.
  let raw = 0;

  const bl = offPage.backlinkCount ?? 0;
  if (bl >= 20) raw += 8;
  else if (bl >= 6) raw += 6;
  else if (bl >= 1) raw += 3;

  const rd = offPage.referringDomains ?? 0;
  if (rd >= 10) raw += 7;
  else if (rd >= 4) raw += 5;
  else if (rd >= 1) raw += 3;

  const pa = offPage.pageAuthority ?? 0;
  raw += Math.min(5, (Math.max(0, pa) / 100) * 5);

  const pr = offPage.prMentions ?? 0;
  raw += Math.min(5, Math.max(0, pr) * 1.5);

  const ss = offPage.socialShares ?? 0;
  if (ss >= 50) raw += 3;
  else if (ss >= 10) raw += 2;
  else if (ss >= 1) raw += 1;

  const ctr = offPage.searchConsoleCtr ?? 0;
  if (ctr >= 5) raw += 2;
  else if (ctr >= 2) raw += 1;

  // Rescale 0-30 onto 0-PAGE_SIGNAL_MAX.
  const scaled = (raw / 30) * PAGE_SIGNAL_MAX;
  return Math.min(PAGE_SIGNAL_MAX, Math.max(0, scaled));
}

/**
 * Site-wide domain signals, scored out of DOMAIN_SIGNAL_MAX.
 *
 * These are the components where an operator running trips from Srinagar since
 * 2013 genuinely outranks a reseller: a real verified listing, real reviews,
 * consistent citations. Identical for every page, so this lifts the whole site
 * at once.
 *
 * Toxic domains subtract from the bonus but the result is clamped at zero, so
 * filling this in can never drag a page below its no-data score. Spam should
 * cost you the reward, not punish you for measuring it.
 */
export function calculateDomainSignalPoints(domain?: DomainSignals | null): number {
  if (!domain) return 0;

  let pts = 0;

  // 1. GBP completeness and freshness (1.5). Local prominence decays without
  //    activity, so a complete profile that has not posted in a month is worth
  //    less than one that has.
  const completeness = clamp01((domain.gbpCompleteness ?? 0) / 100);
  pts += completeness * 1.0;
  const posts = domain.gbpPostsLast30d ?? 0;
  if (posts >= 4) pts += 0.5;
  else if (posts >= 1) pts += 0.25;

  // 2. Reviews (1.5). Volume and rating together: 500 reviews at 3.1 stars is
  //    not the asset 500 at 4.8 is.
  const reviews = domain.gbpReviewCount ?? 0;
  const rating = domain.gbpAverageRating ?? 0;
  let reviewPts = 0;
  if (reviews >= 250) reviewPts = 1.0;
  else if (reviews >= 50) reviewPts = 0.7;
  else if (reviews >= 10) reviewPts = 0.4;
  else if (reviews >= 1) reviewPts = 0.2;
  if (rating >= 4.5) reviewPts += 0.5;
  else if (rating >= 4.0) reviewPts += 0.3;
  else if (rating >= 3.5) reviewPts += 0.1;
  pts += Math.min(1.5, reviewPts);

  // 3. Citation NAP consistency (1.5). The ratio matters more than the count:
  //    inconsistent citations actively confuse local ranking, so 20 listings
  //    that all agree beat 100 that do not.
  const cTotal = domain.citationsTotal ?? 0;
  const cConsistent = domain.citationsNapConsistent ?? 0;
  if (cTotal > 0) {
    const ratio = clamp01(cConsistent / cTotal);
    const volume = cTotal >= 30 ? 1 : cTotal >= 10 ? 0.7 : 0.4;
    pts += ratio * volume * 1.5;
  }

  // 4. Site-wide referring domains (1.5), log-scaled. The 10th referring
  //    domain matters far more than the 200th.
  const rd = Math.max(0, domain.referringDomainsTotal ?? 0);
  if (rd > 0) {
    pts += Math.min(1.5, (Math.log10(1 + rd) / Math.log10(101)) * 1.5);
  }

  // 5. Toxic domain drag, up to -1.5. Proportional to the share of the
  //    backlink profile that is spam, not the raw count.
  const toxic = Math.max(0, domain.toxicDomainCount ?? 0);
  if (toxic > 0 && rd > 0) {
    pts -= clamp01(toxic / rd) * 1.5;
  } else if (toxic > 0) {
    pts -= 0.5;
  }

  return Math.min(DOMAIN_SIGNAL_MAX, Math.max(0, pts));
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * Full score: on-page base out of ON_PAGE_BASE_MAX, plus off-page headroom.
 *
 *   final = onPage% * 0.85  +  pageSignals (0-9)  +  domainSignals (0-6)
 *
 * Capped at 100. Both off-page terms are non-negative, so the score is
 * monotonic in the off-page data: adding a signal never lowers the total.
 */
export function calculateCompositeScore(
  checks: CheckResult[],
  offPage?: OffPageSignals | null,
  pagespeed?: { perf?: number; a11y?: number; bp?: number; seo?: number },
  domain?: DomainSignals | null,
) {
  // On-page points earned vs total possible weight
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const earnedScore = checks.reduce((sum, c) => sum + c.score, 0);
  const rawOnPagePercentage = totalWeight > 0 ? (earnedScore / totalWeight) * 100 : 0;

  // If PageSpeed exists, blend 85% On-Page Rules + 15% Core Web Vitals
  let onPageScore = rawOnPagePercentage;
  if (pagespeed) {
    const psList = [pagespeed.perf, pagespeed.a11y, pagespeed.bp, pagespeed.seo].filter(
      (n): n is number => typeof n === 'number',
    );
    if (psList.length > 0) {
      const psAvg = psList.reduce((a, b) => a + b, 0) / psList.length;
      onPageScore = rawOnPagePercentage * 0.85 + psAvg * 0.15;
    }
  }

  const pageSignalScore = calculatePageSignalPoints(offPage);
  const domainSignalScore = calculateDomainSignalPoints(domain);
  const offPagePoints = pageSignalScore + domainSignalScore;

  const base = (Math.min(100, Math.max(0, onPageScore)) / 100) * ON_PAGE_BASE_MAX;
  const finalScore = Math.round(base + offPagePoints);

  return {
    finalScore: Math.min(100, Math.max(0, finalScore)),
    onPageScore: Math.round(onPageScore),
    offPageScore: Math.round(offPagePoints),
    pageSignalScore: Math.round(pageSignalScore * 10) / 10,
    domainSignalScore: Math.round(domainSignalScore * 10) / 10,
    hasOffPageData: !!offPage,
    hasDomainData: !!domain,
    checks,
  };
}
