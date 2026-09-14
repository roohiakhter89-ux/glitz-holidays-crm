import { SitePageInput, analyseSite } from './audit-site';

const words = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`).join(' ');

/** A block every page carries inside <main>, like a shared call-to-action. */
const CHROME = words('chrome', 40);
const TEMPLATE = words('tpl', 120);

const page = (url: string, family: string | null, text: string, extra: Partial<SitePageInput> = {}): SitePageInput => ({
  url,
  family,
  title: url,
  description: null,
  mainText: `${CHROME} ${text}`,
  links: [],
  ...extra,
});

function site(): SitePageInput[] {
  const cities = Array.from({ length: 6 }, (_, i) =>
    page(`https://x.in/from/city${i}`, 'packages-from-city', `${TEMPLATE} ${words(`c${i}x`, 10)}`),
  );
  const guides = Array.from({ length: 4 }, (_, i) => page(`https://x.in/guide/${i}`, 'guide', words(`g${i}x`, 150)));
  return [...cities, ...guides, page('https://x.in/about', null, words('about', 150))];
}

describe('cross-page analysis', () => {
  it('flags pages that differ only by a few words from their family', () => {
    const r = analyseSite(site()).get('https://x.in/from/city0')!;
    expect(r.group).toBe('packages-from-city');
    expect(r.groupSize).toBe(6);
    expect(r.uniqueShare!).toBeLessThan(0.2);
    expect(r.nearest!.overlap).toBeGreaterThan(0.85);
    expect(r.specificPhrases).toBeLessThan(20);
  });

  it('finds distinct pages unique once site-wide chrome is set aside', () => {
    const r = analyseSite(site()).get('https://x.in/guide/1')!;
    expect(r.group).toBe('guide');
    expect(r.uniqueShare).toBe(1);
    expect(r.nearest).toBeNull();
  });

  it('compares pages without a large enough family against the whole site', () => {
    const r = analyseSite(site()).get('https://x.in/about')!;
    expect(r.group).toBe('site');
    expect(r.groupSize).toBe(11);
    expect(r.uniqueShare).toBe(1);
  });

  it('does not strip shared text as boilerplate on a small site', () => {
    const tiny = [0, 1, 2].map((i) => page(`https://x.in/p${i}`, 'fam', TEMPLATE));
    const r = analyseSite(tiny).get('https://x.in/p0')!;
    expect(r.uniqueShare).toBe(0);
    expect(r.nearest!.overlap).toBe(1);
  });

  it('finds duplicate titles and descriptions regardless of case and spacing', () => {
    const pages = site();
    pages[6].title = 'Gulmarg Guide';
    pages[7].title = '  gulmarg   guide ';
    pages[6].description = 'Same words';
    pages[8].description = 'same words';
    const r = analyseSite(pages);
    expect(r.get(pages[6].url)!.duplicateTitleOf).toEqual([pages[7].url]);
    expect(r.get(pages[7].url)!.duplicateTitleOf).toEqual([pages[6].url]);
    expect(r.get(pages[8].url)!.duplicateDescriptionOf).toEqual([pages[6].url]);
    expect(r.get(pages[9].url)!.duplicateTitleOf).toEqual([]);
  });

  it('counts distinct linking pages, ignoring self-links and unknown targets', () => {
    const pages = site();
    pages[0].links = [
      { url: pages[6].url, inMain: true },
      { url: pages[6].url, inMain: true },
      { url: pages[7].url, inMain: false },
      { url: pages[0].url, inMain: true },
      { url: 'https://x.in/not-crawled', inMain: true },
    ];
    pages[1].links = [{ url: pages[6].url, inMain: false }];
    const r = analyseSite(pages);
    expect(r.get(pages[6].url)).toMatchObject({ inboundPages: 2, inboundFromContent: 1 });
    expect(r.get(pages[7].url)).toMatchObject({ inboundPages: 1, inboundFromContent: 0 });
    expect(r.get(pages[0].url)).toMatchObject({ inboundPages: 0, inboundFromContent: 0 });
  });

  it('reports no uniqueness for a page without text', () => {
    const pages = site();
    pages.push({ ...page('https://x.in/empty', null, ''), mainText: '' });
    expect(analyseSite(pages).get('https://x.in/empty')!.uniqueShare).toBeNull();
  });
});
