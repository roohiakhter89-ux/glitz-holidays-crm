import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';
import { DESTINATIONS } from '@/lib/destinations';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE.domain, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE.domain}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE.domain}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  const destRoutes: MetadataRoute.Sitemap = DESTINATIONS.map((d) => ({
    url: `${SITE.domain}/destinations/${d.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticRoutes, ...destRoutes];
}
