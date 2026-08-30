import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Clock, ArrowRight, UserCheck } from 'lucide-react';
import { PageHero } from '@/components/page-hero';
import { JsonLd } from '@/components/cards';
import { GUIDES } from '@/lib/guides';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Himalayan Travel Guides & Local Advice — Glitz Holidays',
  description:
    'Expert advice from Srinagar-based travel curators: Gulmarg Gondola booking rules, month-by-month weather guides, Ladakh acclimatization health tips, and houseboat insights.',
  alternates: { canonical: '/guides' },
};

export default function GuidesIndexPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Travel Guides — Glitz Holidays',
    description: 'Local expert travel guides for Kashmir and Ladakh journeys.',
    url: `${SITE.domain}/guides`,
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <PageHero
        kicker="Local Wisdom & Expert Advice"
        title="Himalayan Travel Guides"
        lede="No generic AI listicles. Actionable, on-ground travel guides written by our Srinagar operations managers and mountain expedition leads."
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Travel Guides' },
        ]}
      />

      <section className="py-16 md:py-24">
        <div className="wrap">
          <div className="grid md:grid-cols-2 gap-8">
            {GUIDES.map((guide) => (
              <article key={guide.slug} className="glass-panel card-tilt rounded-3xl p-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-gold-100 text-gold-800 text-xs font-semibold">
                      {guide.destinationName}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-ink-500">
                      <Clock className="size-3.5" /> {guide.readingTime}
                    </span>
                  </div>

                  <h2 className="display text-2xl font-semibold text-ink-950 hover:text-gold-600 transition-colors">
                    <Link href={`/guides/${guide.slug}`}>{guide.title}</Link>
                  </h2>

                  <p className="mt-3 text-[14.5px] leading-relaxed text-ink-600">
                    {guide.summary}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-paper-300 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-ink-700">
                    <UserCheck className="size-4 text-pine-600" />
                    <span>{guide.author} · {guide.authorRole}</span>
                  </div>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-pine-700 hover:text-gold-600"
                  >
                    Read Guide <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
