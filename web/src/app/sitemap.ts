import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';
import { DESTINATIONS } from '@/lib/destinations';
import { PACKAGES } from '@/lib/packages';
import { TRAVEL_STYLES } from '@/lib/travel-styles';
import { GUIDES } from '@/lib/guides';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const statics: MetadataRoute.Sitemap = [
    { url: SITE.domain, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE.domain}/destinations`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE.domain}/packages`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE.domain}/plan-my-trip`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE.domain}/guides`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE.domain}/partner-with-us`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE.domain}/reviews`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE.domain}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE.domain}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE.domain}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE.domain}/privacy-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE.domain}/terms-and-conditions`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE.domain}/cancellation-and-refund-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const destinations: MetadataRoute.Sitemap = DESTINATIONS.map((d) => ({
    url: `${SITE.domain}/destinations/${d.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  // Highest-intent pages on the site — highest priority after the home page.
  const packages: MetadataRoute.Sitemap = PACKAGES.map((p) => ({
    url: `${SITE.domain}/packages/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const styles: MetadataRoute.Sitemap = TRAVEL_STYLES.map((s) => ({
    url: `${SITE.domain}/travel-styles/${s.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const guides: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${SITE.domain}/guides/${g.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...statics, ...destinations, ...packages, ...styles, ...guides];
}
