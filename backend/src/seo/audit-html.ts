import { Parser } from 'htmlparser2';

/**
 * Reads the facts the audit needs from a page's HTML.
 *
 * A real tokenizer rather than regular expressions, so nesting is tracked:
 * text inside <main> is told apart from navigation, a <title> inside an inline
 * SVG is not mistaken for the page title, and script contents never leak into
 * the text.
 *
 * The audit reads server HTML and does not run JavaScript, so anything a page
 * adds client-side is invisible here. Google does render JavaScript, but the
 * server HTML is what it sees first and most reliably.
 */

export interface PageLink {
  /** Absolute http(s) URL. */
  href: string;
  /** Link text, including the alt text of an image inside the link. */
  text: string;
  /** Inside <main> and not inside a <nav> within it. */
  inMain: boolean;
  /** Inside nav, header, footer or aside. */
  inChrome: boolean;
  nofollow: boolean;
}

export interface PageImage {
  src: string;
  /** Null when the alt attribute is absent. An empty string marks a decorative image. */
  alt: string | null;
  inMain: boolean;
}

export interface PageHeading {
  level: 1 | 2 | 3;
  text: string;
  inMain: boolean;
  inChrome: boolean;
}

export interface JsonLdBlock {
  types: string[];
  data: unknown;
  error: string | null;
}

export interface PageFacts {
  titles: string[];
  metaDescriptions: string[];
  /** Resolved absolute URLs. */
  canonicals: string[];
  /** Lowercased directives from robots and googlebot meta tags. */
  robotsDirectives: string[];
  htmlLang: string | null;
  hreflang: Array<{ lang: string; href: string }>;
  headings: PageHeading[];
  images: PageImage[];
  /** Elements whose inline style sets a background image. Google doesn't index these. */
  cssBackgroundImages: number;
  links: PageLink[];
  /** <a> elements Google can't follow: javascript: hrefs or onclick without an href. */
  uncrawlableLinks: number;
  jsonLd: JsonLdBlock[];
  metaAuthor: string | null;
  relAuthor: boolean;
  /** article:modified_time meta. */
  modifiedMeta: string | null;
  hasViewport: boolean;
  hasMain: boolean;
  /** Text of <main> (minus nav), or of the body minus site chrome when there is no <main>. */
  mainText: string;
}

const SKIP = new Set(['script', 'style', 'noscript', 'template', 'svg']);
const CHROME = new Set(['nav', 'header', 'footer', 'aside']);
const MAX_TEXT = 300_000;
const NON_PAGE_SCHEMES = /^(mailto|tel|sms|whatsapp|intent|data):/i;

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

function resolveUrl(href: string | undefined, base: string): string | null {
  if (!href) return null;
  try {
    const u = new URL(href.trim(), base);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

function firstSrcset(srcset: string | undefined): string | undefined {
  return srcset?.split(',')[0]?.trim().split(/\s+/)[0] || undefined;
}

function readJsonLd(raw: string): JsonLdBlock {
  const text = raw.trim().replace(/^<!--/, '').replace(/-->$/, '').trim();
  if (!text) return { types: [], data: null, error: 'Empty block' };
  try {
    const data = JSON.parse(text);
    const types = new Set<string>();
    visitJsonLd(data, (obj) => typesOf(obj).forEach((t) => types.add(t)));
    return { types: [...types], data, error: null };
  } catch (e) {
    return { types: [], data: null, error: (e as Error).message.slice(0, 160) };
  }
}

export function parsePage(html: string, pageUrl: string): PageFacts {
  const facts: PageFacts = {
    titles: [],
    metaDescriptions: [],
    canonicals: [],
    robotsDirectives: [],
    htmlLang: null,
    hreflang: [],
    headings: [],
    images: [],
    cssBackgroundImages: 0,
    links: [],
    uncrawlableLinks: 0,
    jsonLd: [],
    metaAuthor: null,
    relAuthor: false,
    modifiedMeta: null,
    hasViewport: false,
    hasMain: false,
    mainText: '',
  };

  let skipDepth = 0;
  let svgDepth = 0;
  let mainDepth = 0;
  let navDepth = 0;
  let chromeDepth = 0;
  let title: string | null = null;
  let jsonLd: string | null = null;
  let heading: PageHeading | null = null;
  let anchor: {
    href: string | undefined;
    onclick: boolean;
    nofollow: boolean;
    text: string;
    label: string;
    inMain: boolean;
    inChrome: boolean;
  } | null = null;
  let mainBuf = '';
  let bodyBuf = '';

  const dec = (n: number) => Math.max(0, n - 1);
  const addText = (t: string) => {
    if (mainDepth > 0 && navDepth === 0 && mainBuf.length < MAX_TEXT) mainBuf += t;
    if (chromeDepth === 0 && bodyBuf.length < MAX_TEXT) bodyBuf += t;
  };

  const parser = new Parser(
    {
      onopentag(name, attribs) {
        addText(' ');
        if (attribs.style && /background(?:-image)?\s*:[^;]*url\(/i.test(attribs.style)) {
          facts.cssBackgroundImages++;
        }

        switch (name) {
          case 'html':
            facts.htmlLang = attribs.lang?.trim() || null;
            break;
          case 'title':
            if (svgDepth === 0 && title === null) title = '';
            break;
          case 'meta': {
            const key = (attribs.name ?? attribs.property ?? '').toLowerCase();
            const content = attribs.content ?? '';
            if (key === 'description') facts.metaDescriptions.push(clean(content));
            else if (key === 'robots' || key === 'googlebot') {
              facts.robotsDirectives.push(
                ...content.toLowerCase().split(',').map((d) => d.trim()).filter(Boolean),
              );
            } else if (key === 'viewport') facts.hasViewport = true;
            else if (key === 'author') facts.metaAuthor = clean(content) || null;
            else if (key === 'article:modified_time') facts.modifiedMeta = content.trim() || null;
            break;
          }
          case 'link': {
            const rel = (attribs.rel ?? '').toLowerCase().split(/\s+/);
            const href = resolveUrl(attribs.href, pageUrl);
            if (rel.includes('canonical') && href) facts.canonicals.push(href);
            if (rel.includes('alternate') && attribs.hreflang && href) {
              facts.hreflang.push({ lang: attribs.hreflang, href });
            }
            if (rel.includes('author')) facts.relAuthor = true;
            break;
          }
          case 'main':
            mainDepth++;
            facts.hasMain = true;
            break;
          case 'h1':
          case 'h2':
          case 'h3':
            if (skipDepth === 0) {
              heading = {
                level: Number(name[1]) as 1 | 2 | 3,
                text: '',
                inMain: mainDepth > 0 && navDepth === 0,
                inChrome: chromeDepth > 0,
              };
            }
            break;
          case 'a':
            if (skipDepth === 0) {
              const rel = (attribs.rel ?? '').toLowerCase();
              if (/\bauthor\b/.test(rel)) facts.relAuthor = true;
              anchor = {
                href: attribs.href,
                onclick: 'onclick' in attribs,
                nofollow: /\bnofollow\b/.test(rel),
                text: '',
                label: attribs['aria-label'] ?? attribs.title ?? '',
                inMain: mainDepth > 0 && navDepth === 0,
                inChrome: chromeDepth > 0,
              };
            }
            break;
          case 'img': {
            const src = resolveUrl(attribs.src || firstSrcset(attribs.srcset), pageUrl);
            if (src && skipDepth === 0) {
              facts.images.push({
                src,
                alt: 'alt' in attribs ? clean(attribs.alt) : null,
                inMain: mainDepth > 0,
              });
            }
            if (anchor && attribs.alt) anchor.text += ` ${attribs.alt} `;
            break;
          }
        }

        if (SKIP.has(name)) {
          skipDepth++;
          if (name === 'svg') svgDepth++;
          if (name === 'script' && /ld\+json/i.test(attribs.type ?? '')) jsonLd = '';
        }
        if (CHROME.has(name)) {
          chromeDepth++;
          if (name === 'nav') navDepth++;
        }
      },

      ontext(data) {
        if (jsonLd !== null) {
          jsonLd += data;
          return;
        }
        if (title !== null) {
          title += data;
          return;
        }
        if (skipDepth > 0) return;
        if (heading) heading.text += data;
        if (anchor) anchor.text += data;
        addText(data);
      },

      onclosetag(name) {
        switch (name) {
          case 'title':
            if (title !== null) {
              facts.titles.push(clean(title));
              title = null;
            }
            break;
          case 'main':
            mainDepth = dec(mainDepth);
            break;
          case 'h1':
          case 'h2':
          case 'h3':
            if (heading && `h${heading.level}` === name) {
              const text = clean(heading.text);
              if (text) facts.headings.push({ ...heading, text });
              heading = null;
            }
            break;
          case 'a':
            if (anchor) {
              const raw = anchor.href?.trim();
              if (!raw || /^javascript:/i.test(raw)) {
                if (anchor.onclick || raw) facts.uncrawlableLinks++;
              } else if (!raw.startsWith('#') && !NON_PAGE_SCHEMES.test(raw)) {
                const href = resolveUrl(raw, pageUrl);
                if (href) {
                  facts.links.push({
                    href,
                    text: clean(anchor.text) || clean(anchor.label),
                    inMain: anchor.inMain,
                    inChrome: anchor.inChrome,
                    nofollow: anchor.nofollow,
                  });
                }
              }
              anchor = null;
            }
            break;
        }

        if (SKIP.has(name)) {
          skipDepth = dec(skipDepth);
          if (name === 'svg') svgDepth = dec(svgDepth);
          if (name === 'script' && jsonLd !== null) {
            facts.jsonLd.push(readJsonLd(jsonLd));
            jsonLd = null;
          }
        }
        if (CHROME.has(name)) {
          chromeDepth = dec(chromeDepth);
          if (name === 'nav') navDepth = dec(navDepth);
        }
        addText(' ');
      },
    },
    { decodeEntities: true, lowerCaseTags: true, lowerCaseAttributeNames: true },
  );

  parser.write(html);
  parser.end();

  facts.mainText = clean(facts.hasMain ? mainBuf : bodyBuf);
  return facts;
}

// ============================================================================
// JSON-LD helpers
// ============================================================================

type JsonObject = Record<string, unknown>;

function typesOf(obj: JsonObject): string[] {
  const t = obj['@type'];
  return (Array.isArray(t) ? t : [t]).filter((x): x is string => typeof x === 'string');
}

function visitJsonLd(node: unknown, visit: (obj: JsonObject) => void, depth = 0): void {
  if (depth > 12 || node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) visitJsonLd(item, visit, depth + 1);
    return;
  }
  const obj = node as JsonObject;
  visit(obj);
  for (const value of Object.values(obj)) visitJsonLd(value, visit, depth + 1);
}

export function walkJsonLd(blocks: JsonLdBlock[], visit: (obj: JsonObject) => void): void {
  for (const b of blocks) if (!b.error) visitJsonLd(b.data, visit);
}

export function jsonLdAuthors(blocks: JsonLdBlock[]): { people: string[]; organizations: string[] } {
  const people: string[] = [];
  const organizations: string[] = [];
  walkJsonLd(blocks, (obj) => {
    if (!('author' in obj)) return;
    const list = Array.isArray(obj.author) ? obj.author : [obj.author];
    for (const a of list) {
      if (typeof a === 'string') {
        if (a.trim()) organizations.push(a.trim());
      } else if (a && typeof a === 'object') {
        const name = typeof (a as JsonObject).name === 'string' ? String((a as JsonObject).name) : '';
        if (typesOf(a as JsonObject).includes('Person')) people.push(name || 'Unnamed person');
        else organizations.push(name || 'Unnamed organisation');
      }
    }
  });
  return { people, organizations };
}

export function jsonLdDate(blocks: JsonLdBlock[], key: 'dateModified' | 'datePublished'): string | null {
  let found: string | null = null;
  walkJsonLd(blocks, (obj) => {
    if (!found && typeof obj[key] === 'string' && obj[key]) found = String(obj[key]);
  });
  return found;
}

const SELF_REVIEWED_TYPES = new Set([
  'Organization',
  'Corporation',
  'LocalBusiness',
  'TravelAgency',
  'ProfessionalService',
]);

const bareHost = (h: string) => h.toLowerCase().replace(/^www\./, '');

/**
 * Ratings attached to the site owner's own business markup. Google does not
 * show review stars when "the entity that's being reviewed controls the
 * reviews about itself". Business markup without a url is assumed to describe
 * the site owner, since that is what it nearly always is.
 */
export function hasSelfServingRating(blocks: JsonLdBlock[], siteHost: string): boolean {
  let found = false;
  walkJsonLd(blocks, (obj) => {
    if (found || !typesOf(obj).some((t) => SELF_REVIEWED_TYPES.has(t))) return;
    if (!('aggregateRating' in obj) && !('review' in obj)) return;
    const ref = typeof obj.url === 'string' ? obj.url : typeof obj['@id'] === 'string' ? obj['@id'] : null;
    if (!ref) {
      found = true;
      return;
    }
    try {
      found = bareHost(new URL(String(ref)).hostname) === bareHost(siteHost);
    } catch {
      found = true;
    }
  });
  return found;
}
