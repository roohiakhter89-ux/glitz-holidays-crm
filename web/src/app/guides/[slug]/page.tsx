import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Clock,
  Calendar,
  UserCheck,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { PageHero } from '@/components/page-hero';
import { JsonLd, Faq } from '@/components/cards';
import { EnquiryForm } from '@/components/enquiry-form';
import { GUIDES, getGuide } from '@/lib/guides';
import { getPackage } from '@/lib/packages';
import { SITE, inr } from '@/lib/site';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};

  const pageTitle = guide.seoTitle || guide.title;

  return {
    title: pageTitle,
    description: guide.summary,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      title: pageTitle,
      description: guide.summary,
      url: `${SITE.domain}/guides/${guide.slug}`,
      type: 'article',
      publishedTime: guide.publishedAt,
      modifiedTime: guide.verifiedOnISO || guide.updatedAt,
      authors: [guide.author],
    },
  };
}

function renderFormattedText(text: string) {
  // Parse inline bold and links: **bold** and [text](url)
  const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-ink-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      const isInternal = href.startsWith('/');
      return isInternal ? (
        <Link key={i} href={href} className="link-sweep font-medium text-pine-700 hover:text-gold-600">
          {label}
        </Link>
      ) : (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="link-sweep font-medium text-pine-700 hover:text-gold-600"
        >
          {label}
        </a>
      );
    }
    return part;
  });
}

function SectionContent({ raw }: { raw: string }) {
  const paragraphs = raw.split(/\n\n+/).filter(Boolean);

  return (
    <div className="space-y-4">
      {paragraphs.map((p, pIdx) => {
        const trimmed = p.trim();

        // Subheading ####
        if (trimmed.startsWith('#### ')) {
          return (
            <h3 key={pIdx} className="display text-xl font-semibold text-ink-950 pt-3">
              {trimmed.replace(/^####\s+/, '')}
            </h3>
          );
        }

        // Bullet list
        if (trimmed.includes('\n- ') || trimmed.startsWith('- ')) {
          const items = trimmed
            .split('\n')
            .filter((l) => l.trim().startsWith('- '))
            .map((l) => l.trim().replace(/^-\s+/, ''));

          return (
            <ul key={pIdx} className="space-y-2.5 my-3">
              {items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink-700">
                  <span className="mt-2 size-1.5 rounded-full bg-gold-500 shrink-0" />
                  <span>{renderFormattedText(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        // Numbered list
        if (/^\d+\.\s+/.test(trimmed)) {
          const items = trimmed
            .split('\n')
            .filter((l) => /^\d+\.\s+/.test(l.trim()))
            .map((l) => l.trim().replace(/^\d+\.\s+/, ''));

          return (
            <ol key={pIdx} className="space-y-2.5 my-3">
              {items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink-700">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-paper-200 text-xs font-semibold text-ink-800">
                    {iIdx + 1}
                  </span>
                  <span>{renderFormattedText(item)}</span>
                </li>
              ))}
            </ol>
          );
        }

        // Standard Paragraph
        return (
          <p key={pIdx} className="text-[15.5px] leading-relaxed text-ink-700">
            {renderFormattedText(trimmed)}
          </p>
        );
      })}
    </div>
  );
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
      '@id': `${url}#article`,
      headline: guide.title,
      description: guide.summary,
      url,
      datePublished: guide.publishedAt,
      dateModified: guide.verifiedOnISO || guide.updatedAt,
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
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" /> Updated {guide.updatedAt}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" /> {guide.readingTime}
                  </span>
                </div>
              </div>

              {/* Direct Answer (First 100 Words) */}
              {guide.directAnswer && (
                <div className="rounded-3xl border border-gold-300/80 bg-gold-50/70 p-7 md:p-8 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-800">
                    <Sparkles className="size-4 text-gold-600" />
                    <span>Direct Answer</span>
                  </div>
                  <h2 className="display text-xl md:text-2xl font-bold text-ink-950 mt-2">
                    {guide.directAnswer.heading}
                  </h2>
                  <p className="mt-4 text-[15.5px] leading-relaxed text-ink-800">
                    {guide.directAnswer.body}
                  </p>
                  {guide.directAnswer.highlights && (
                    <ul className="mt-5 space-y-2 border-t border-gold-200/80 pt-4">
                      {guide.directAnswer.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[14px] text-ink-700">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-pine-600" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Featured Cover Image */}
              <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-lg border border-paper-300">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url("${guide.image}")` }}
                />
              </div>

              {/* Table of Contents */}
              {guide.toc.length > 0 && (
                <div className="p-6 rounded-2xl bg-paper-100 border border-paper-300">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-600 mb-3">
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

              {/* Places Summary Comparison Table */}
              {guide.placesTable && (
                <div className="space-y-4">
                  {guide.placesTable.caption && (
                    <h3 className="display text-lg font-semibold text-ink-900">
                      {guide.placesTable.caption}
                    </h3>
                  )}
                  <div className="scroll-x overflow-x-auto rounded-2xl border border-paper-300 bg-white shadow-sm">
                    <table className="w-full min-w-[700px] text-left text-[13.5px]">
                      <thead>
                        <tr className="border-b border-paper-300 bg-paper-100">
                          {guide.placesTable.headers.map((h, i) => (
                            <th
                              key={i}
                              scope="col"
                              className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-600"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-paper-200">
                        {guide.placesTable.rows.map((r, i) => (
                          <tr key={i} className="hover:bg-paper-50/80 transition-colors">
                            <th scope="row" className="px-4 py-3.5 font-semibold text-ink-950 align-top">
                              {r.place}
                            </th>
                            <td className="px-4 py-3.5 text-ink-700 align-top font-mono text-xs">
                              {r.distance}
                            </td>
                            <td className="px-4 py-3.5 text-ink-700 align-top">
                              {r.drivingTime}
                            </td>
                            <td className="px-4 py-3.5 text-ink-700 align-top leading-relaxed">
                              {r.highlights}
                            </td>
                            <td className="px-4 py-3.5 text-ink-600 align-top text-xs leading-relaxed font-mono">
                              {r.cost}
                            </td>
                            <td className="px-4 py-3.5 text-ink-700 align-top whitespace-nowrap text-xs">
                              <span className="inline-block px-2.5 py-1 rounded-full bg-pine-50 text-pine-700 font-medium border border-pine-200">
                                {r.bestSeason}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-ink-800 align-top font-medium text-xs">
                              {r.stay}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Formatted Guide Body */}
              <div className="glass-panel rounded-3xl p-8 md:p-12 space-y-10 text-ink-800 text-[15.5px] leading-relaxed">
                {guide.content.split('### ').filter(Boolean).map((section, idx) => {
                  const [heading, ...rest] = section.split('\n');
                  const body = rest.join('\n');
                  const tocItem = guide.toc[idx];
                  return (
                    <div key={idx} id={tocItem ? tocItem.id : undefined} className="space-y-4 pt-6 first:pt-0">
                      <h2 className="display text-2xl font-semibold text-ink-950 border-b border-paper-300 pb-3">
                        {heading.trim()}
                      </h2>
                      <SectionContent raw={body.trim()} />
                    </div>
                  );
                })}
              </div>

              {/* Negative Advice Box */}
              {guide.negativeAdvice && (
                <div className="rounded-3xl border border-rose-300/80 bg-rose-50/50 p-7 md:p-8 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2.5 text-rose-800">
                    <AlertTriangle className="size-5 text-rose-600 shrink-0" />
                    <h3 className="display text-xl font-bold">{guide.negativeAdvice.title}</h3>
                  </div>
                  <p className="text-[14.5px] leading-relaxed text-ink-700">
                    {guide.negativeAdvice.body}
                  </p>
                  <ul className="space-y-2.5 pt-2">
                    {guide.negativeAdvice.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[14px] text-ink-800 leading-relaxed">
                        <span className="mt-1 size-2 rounded-full bg-rose-500 shrink-0" />
                        <span>{renderFormattedText(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Local Insights Callout */}
              {guide.localInsights && (
                <div className="rounded-3xl border border-pine-300/80 bg-pine-50/50 p-7 md:p-8 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 text-pine-800 font-semibold text-xs uppercase tracking-wider">
                    <Sparkles className="size-4 text-pine-600" />
                    <span>Local Operator Reality</span>
                  </div>
                  <h3 className="display text-lg md:text-xl font-bold text-ink-950">
                    {guide.localInsights.title}
                  </h3>
                  <p className="text-[14.5px] leading-relaxed text-ink-700">
                    {guide.localInsights.body}
                  </p>
                </div>
              )}

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
              <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
                <Link href="/guides" className="btn btn-ghost inline-flex items-center gap-2">
                  <ArrowLeft className="size-4" /> Back to all travel guides
                </Link>
                <Link
                  href="/guides/by-month/kashmir-by-month"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-pine-700 hover:text-gold-600"
                >
                  View Month-by-Month Kashmir Guide <ArrowRight className="size-3.5" />
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
                  <EnquiryForm
                    source={`GUIDE_${guide.slug}`}
                    packageName={`Guide: ${guide.title.slice(0, 40)}`}
                    destination={guide.destinationName}
                  />
                </div>
              </div>

              {/* Related High-Intent Packages */}
              {related.length > 0 && (
                <div className="glass-panel rounded-3xl p-6 space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-900">
                    Recommended Itineraries
                  </h4>
                  <div className="space-y-3">
                    {related.map(
                      (pkg) =>
                        pkg && (
                          <Link
                            key={pkg.slug}
                            href={`/packages/${pkg.slug}`}
                            className="block p-3.5 rounded-2xl bg-paper-100 hover:bg-gold-50 transition-colors border border-paper-300 text-left"
                          >
                            <p className="text-xs font-semibold text-gold-700">
                              {pkg.destinationName} · {pkg.nights}N/{pkg.days}D
                            </p>
                            <h5 className="font-semibold text-ink-950 text-sm mt-0.5">{pkg.name}</h5>
                            <p className="text-xs text-ink-600 mt-1">From {inr(pkg.priceFrom)}/person</p>
                          </Link>
                        )
                    )}
                  </div>
                </div>
              )}

              {/* Destination Hub Cross Link */}
              <div className="p-6 rounded-3xl bg-paper-100 border border-paper-300 text-center space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Destination Hub</p>
                <h4 className="display text-base font-bold text-ink-950">Explore Kashmir Packages & Routes</h4>
                <Link
                  href="/destinations/kashmir"
                  className="btn btn-secondary w-full justify-center text-xs py-2.5"
                >
                  View Kashmir Destination Hub
                </Link>
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}

