import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Calendar, UserCheck, ArrowLeft, ArrowRight, Share2, HelpCircle } from 'lucide-react';
import { PageHero } from '@/components/page-hero';
import { JsonLd, Faq } from '@/components/cards';
import { EnquiryForm } from '@/components/enquiry-form';
import { GUIDES, getGuide } from '@/lib/guides';
import { PACKAGES, getPackage } from '@/lib/packages';
import { SITE, inr } from '@/lib/site';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};

  return {
    title: `${guide.title} — Glitz Holidays`,
    description: guide.summary,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      title: guide.title,
      description: guide.summary,
      url: `${SITE.domain}/guides/${guide.slug}`,
      type: 'article',
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
      authors: [guide.author],
    },
  };
}

export default async function GuideDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const url = `${SITE.domain}/guides/${guide.slug}`;
  const related = guide.relatedPackages.map((s) => getPackage(s)).filter(Boolean);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.summary,
      url,
      datePublished: guide.publishedAt,
      dateModified: guide.updatedAt,
      author: {
        '@type': 'Person',
        name: guide.author,
        jobTitle: guide.authorRole,
      },
      publisher: { '@id': `${SITE.domain}/#org` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: guide.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.domain },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE.domain}/guides` },
        { '@type': 'ListItem', position: 3, name: guide.title, item: url },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />

      <PageHero
        kicker={`${guide.destinationName} Travel Guide · ${guide.readingTime}`}
        title={guide.title}
        lede={guide.subtitle}
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Guides', href: '/guides' },
          { label: guide.title },
        ]}
      />

      <article className="py-16 md:py-24">
        <div className="wrap">
          <div className="grid gap-12 lg:grid-cols-12 items-start">
            {/* Main Article Body */}
            <div className="lg:col-span-8 space-y-12">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-paper-100 border border-paper-300 text-xs text-ink-700">
                <div className="flex items-center gap-2">
                  <UserCheck className="size-4 text-pine-600" />
                  <span>Curated by <strong>{guide.author}</strong> ({guide.authorRole})</span>
                </div>
                <div className="flex items-center gap-4 text-ink-500">
                  <span className="flex items-center gap-1"><Calendar className="size-3.5" /> Updated {guide.updatedAt}</span>
                  <span className="flex items-center gap-1"><Clock className="size-3.5" /> {guide.readingTime}</span>
                </div>
              </div>

              {/* Featured Image */}
              <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-lg border border-paper-300">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url("${guide.image}")` }}
                />
              </div>

              {/* Table of Contents */}
              {guide.toc.length > 0 && (
                <div className="p-6 rounded-2xl bg-gold-50/70 border border-gold-300/80">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold-800 mb-3">
                    Table of Contents
                  </p>
                  <ul className="space-y-2 text-[14px]">
                    {guide.toc.map((t) => (
                      <li key={t.id}>
                        <a href={`#${t.id}`} className="text-pine-700 hover:text-gold-600 font-medium transition-colors">
                          → {t.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Formatted Guide Body */}
              <div className="glass-panel rounded-3xl p-8 md:p-12 space-y-8 text-ink-800 text-[15.5px] leading-relaxed">
                {guide.content.split('### ').filter(Boolean).map((section, idx) => {
                  const [heading, ...rest] = section.split('\n');
                  const body = rest.join('\n');
                  const tocItem = guide.toc[idx];
                  return (
                    <div key={idx} id={tocItem ? tocItem.id : undefined} className="space-y-3 pt-4 first:pt-0">
                      <h2 className="display text-2xl font-semibold text-ink-950 border-b border-paper-300 pb-2">
                        {heading.trim()}
                      </h2>
                      <div className="whitespace-pre-line text-ink-700">
                        {body.trim()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* FAQs */}
              {guide.faqs.length > 0 && (
                <div className="space-y-4 pt-6">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="size-5 text-gold-600" />
                    <h3 className="display d3 text-ink-950">Frequently Asked Questions</h3>
                  </div>
                  <Faq items={guide.faqs} />
                </div>
              )}

              {/* Back to Guides */}
              <div className="pt-4">
                <Link href="/guides" className="btn btn-ghost inline-flex items-center gap-2">
                  <ArrowLeft className="size-4" /> Back to all travel guides
                </Link>
              </div>
            </div>

            {/* Sidebar Sticky Quick Enquiry & Related Packages */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-8">
              {/* Contextual Enquiry Form */}
              <div className="glass-panel glow-gold rounded-3xl p-7 border border-gold-400/30">
                <p className="kicker">Need Expert Help?</p>
                <h3 className="display text-xl font-semibold text-ink-950 mt-1">
                  Plan Your {guide.destinationName} Journey
                </h3>
                <p className="text-xs text-ink-600 mt-2">
                  Have questions about this itinerary? Ask our local team in Srinagar.
                </p>
                <div className="mt-5">
                  <EnquiryForm source={`GUIDE_${guide.slug}`} packageName={`Guide: ${guide.title.slice(0, 40)}`} destination={guide.destinationName} />
                </div>
              </div>

              {/* Related High-Intent Packages */}
              {related.length > 0 && (
                <div className="glass-panel rounded-3xl p-6 space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-900">
                    Recommended Itineraries
                  </h4>
                  <div className="space-y-3">
                    {related.map((pkg) => pkg && (
                      <Link
                        key={pkg.slug}
                        href={`/packages/${pkg.slug}`}
                        className="block p-3.5 rounded-2xl bg-paper-100 hover:bg-gold-50 transition-colors border border-paper-300 text-left"
                      >
                        <p className="text-xs font-semibold text-gold-700">{pkg.destinationName} · {pkg.nights}N/{pkg.days}D</p>
                        <h5 className="font-semibold text-ink-950 text-sm mt-0.5">{pkg.name}</h5>
                        <p className="text-xs text-ink-600 mt-1">From {inr(pkg.priceFrom)}/person</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
