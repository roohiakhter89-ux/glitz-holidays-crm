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
import { HindiPageArticle, HINDI_PAGES } from '@/lib/hindi-pages';
import { getPackage } from '@/lib/packages';
import { SITE, inr } from '@/lib/site';

function renderFormattedText(text: string) {
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

        if (trimmed.startsWith('#### ')) {
          return (
            <h3 key={pIdx} className="display text-xl font-semibold text-ink-950 pt-3">
              {trimmed.replace(/^####\s+/, '')}
            </h3>
          );
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={pIdx} className="display text-2xl font-bold text-ink-950 pt-6 pb-2 border-b border-paper-200">
              {trimmed.replace(/^##\s+/, '')}
            </h2>
          );
        }

        if (trimmed.startsWith('- ')) {
          const items = trimmed
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.startsWith('- '))
            .map((line) => line.replace(/^- \s*/, ''));

          return (
            <ul key={pIdx} className="space-y-2 my-3 pl-2">
              {items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink-700">
                  <span className="mt-2 block size-1.5 shrink-0 rounded-full bg-gold-500" />
                  <span>{renderFormattedText(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (trimmed.startsWith('> [!')) {
          const match = trimmed.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n*>?(.*)$/is);
          const type = match ? match[1].toUpperCase() : 'NOTE';
          const text = match ? match[2].trim().replace(/^>\s*/gm, '') : trimmed;

          const isAlert = type === 'IMPORTANT' || type === 'WARNING' || type === 'CAUTION';

          return (
            <div
              key={pIdx}
              className={`rounded-2xl p-5 my-5 border ${
                isAlert ? 'bg-amber-500/10 border-amber-500/30' : 'bg-pine-500/10 border-pine-500/30'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-sm mb-1.5 text-ink-900">
                {isAlert ? (
                  <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                ) : (
                  <Sparkles className="size-4 text-pine-600 shrink-0" />
                )}
                <span>{type === 'NOTE' ? 'विशेष सूचना' : type === 'TIP' ? 'स्थानीय सुझाव' : 'महत्वपूर्ण सलाह'}</span>
              </div>
              <p className="text-[14px] leading-relaxed text-ink-700">{renderFormattedText(text)}</p>
            </div>
          );
        }

        return (
          <p key={pIdx} className="text-[16px] leading-relaxed text-ink-700">
            {renderFormattedText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export function HindiPageContent({ guide }: { guide: HindiPageArticle }) {
  const breadcrumbListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'होम',
        item: SITE.domain,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'हिंदी यात्रा गाइड',
        item: `${SITE.domain}/hi`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: guide.title,
        item: `${SITE.domain}${guide.urlPath}`,
      },
    ],
  };

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.summary,
    image: guide.image,
    datePublished: guide.publishedAt,
    dateModified: guide.verifiedOnISO || guide.updatedAt,
    author: {
      '@type': 'Person',
      name: guide.author,
      jobTitle: guide.authorRole,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE.domain}/brand/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE.domain}${guide.urlPath}`,
    },
  };

  const relatedPkgs = guide.relatedPackages
    .map((s) => getPackage(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <>
      <JsonLd data={breadcrumbListJsonLd} />
      <JsonLd data={articleJsonLd} />

      <PageHero
        kicker="स्थानीय अनुभव व सटीक जानकारी"
        title={guide.title}
        lede={guide.subtitle}
        crumbs={[
          { label: 'होम', href: '/' },
          { label: 'हिंदी गाइड', href: '/hi' },
          { label: guide.title },
        ]}
      />

      <section className="py-12 md:py-16">
        <div className="wrap">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-10">
              <div className="flex flex-wrap items-center gap-6 py-4 border-y border-paper-200 text-sm text-ink-600">
                <div className="flex items-center gap-2">
                  <UserCheck className="size-4 text-pine-600" />
                  <span>
                    लेखक: <strong className="text-ink-950 font-medium">{guide.author}</strong> ({guide.authorRole})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-pine-600" />
                  <span>{guide.readingTime} पढ़ने का समय</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-pine-600" />
                  <span>सत्यापित: {guide.verifiedOnISO || guide.updatedAt}</span>
                </div>
              </div>

              {guide.directAnswer && (
                <div className="rounded-3xl border border-pine-500/30 bg-pine-500/5 p-6 md:p-8 space-y-4">
                  <div className="flex items-center gap-2.5 text-pine-800 font-semibold text-sm tracking-wide">
                    <Sparkles className="size-5 text-pine-600" />
                    <span>त्वरित सारांश (Quick Answer)</span>
                  </div>
                  <h2 className="display text-xl md:text-2xl font-bold text-ink-950">{guide.directAnswer.heading}</h2>
                  <p className="text-[16px] leading-relaxed text-ink-800">{guide.directAnswer.body}</p>
                  {guide.directAnswer.highlights && guide.directAnswer.highlights.length > 0 && (
                    <ul className="space-y-2 pt-2 border-t border-pine-500/20">
                      {guide.directAnswer.highlights.map((hl, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-ink-700">
                          <CheckCircle2 className="size-4 text-pine-600 shrink-0 mt-0.5" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {guide.placesTable && (
                <div className="space-y-4">
                  {guide.placesTable.caption && (
                    <h3 className="display text-lg font-semibold text-ink-900">{guide.placesTable.caption}</h3>
                  )}
                  <div className="overflow-x-auto rounded-2xl border border-paper-300 bg-white">
                    <table className="w-full text-left text-sm text-ink-700">
                      <thead className="bg-paper-100 text-ink-900 border-b border-paper-200">
                        <tr>
                          {guide.placesTable.headers.map((h, i) => (
                            <th key={i} className="px-4 py-3 font-semibold whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-paper-200">
                        {guide.placesTable.rows.map((r, i) => (
                          <tr key={i} className="hover:bg-paper-50/60 transition-colors">
                            <td className="px-4 py-3 font-medium text-ink-950 whitespace-nowrap">{r.place}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{r.distance}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{r.drivingTime}</td>
                            <td className="px-4 py-3">{r.highlights}</td>
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-pine-700">{r.cost}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-ink-500">{r.bestSeason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="prose prose-pine max-w-none">
                <SectionContent raw={guide.content} />
              </div>

              {guide.negativeAdvice && (
                <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6 md:p-8 space-y-4">
                  <div className="flex items-center gap-2.5 text-amber-900 font-semibold text-sm">
                    <AlertTriangle className="size-5 text-amber-600" />
                    <span>{guide.negativeAdvice.title}</span>
                  </div>
                  <p className="text-[15px] leading-relaxed text-ink-800">{guide.negativeAdvice.body}</p>
                  <ul className="space-y-2 pt-2">
                    {guide.negativeAdvice.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-ink-700">
                        <span className="size-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {guide.localInsights && (
                <div className="rounded-3xl border border-paper-300 bg-paper-100/60 p-6 md:p-8 space-y-2">
                  <h4 className="font-semibold text-ink-950">{guide.localInsights.title}</h4>
                  <p className="text-sm leading-relaxed text-ink-700">{guide.localInsights.body}</p>
                </div>
              )}

              {guide.faqs && guide.faqs.length > 0 && (
                <div className="space-y-6 pt-6 border-t border-paper-200">
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="size-6 text-pine-700" />
                    <h3 className="display text-2xl font-bold text-ink-950">अक्सर पूछे जाने वाले सवाल (FAQs)</h3>
                  </div>
                  <Faq items={guide.faqs} />
                </div>
              )}

              {/* Other Hindi Guides Crosslink */}
              <div className="space-y-6 pt-8 border-t border-paper-200">
                <div className="flex items-center justify-between">
                  <h3 className="display text-xl font-bold text-ink-950">अन्य महत्वपूर्ण हिंदी यात्रा गाइड</h3>
                  <Link href="/hi" className="text-xs font-semibold text-pine-700 hover:text-gold-600">
                    सभी हिंदी गाइड देखें →
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(() => {
                    const currIdx = HINDI_PAGES.findIndex((p) => p.slug === guide.slug);
                    const others = HINDI_PAGES.filter((p) => p.slug !== guide.slug);
                    const offset = currIdx >= 0 ? currIdx % others.length : 0;
                    const rotated = [...others.slice(offset), ...others.slice(0, offset)].slice(0, 6);

                    return rotated.map((other) => (
                      <Link
                        key={other.urlPath}
                        href={other.urlPath}
                        className="group block rounded-2xl border border-paper-200 bg-white p-4 hover:border-gold-400 hover:bg-paper-50/50 transition-all"
                      >
                        <h4 className="font-semibold text-ink-900 group-hover:text-pine-700 text-sm leading-snug">
                          {other.title}
                        </h4>
                        <p className="text-xs text-ink-500 mt-1.5 line-clamp-2">{other.summary}</p>
                        <span className="inline-block text-xs font-medium text-gold-600 mt-2">गाइड पढ़ें →</span>
                      </Link>
                    ));
                  })()}
                </div>
              </div>
            </div>

            <aside className="lg:col-span-4 space-y-8">
              <div className="sticky top-28 space-y-8">
                {guide.toc && guide.toc.length > 0 && (
                  <div className="rounded-2xl border border-paper-300 bg-paper-50 p-6 space-y-3">
                    <h4 className="font-semibold text-ink-950 text-sm">विषय सूची (Table of Contents)</h4>
                    <ul className="space-y-2 text-sm">
                      {guide.toc.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            className="text-ink-600 hover:text-pine-700 transition-colors block py-0.5"
                          >
                            {item.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {relatedPkgs.length > 0 && (
                  <div className="rounded-3xl border border-paper-300 bg-white p-6 shadow-sm space-y-4">
                    <h4 className="font-semibold text-ink-950 text-base">लोकप्रिय कश्मीर टूर पैकेज</h4>
                    <div className="space-y-3">
                      {relatedPkgs.map((pkg) => (
                        <Link
                          key={pkg.slug}
                          href={`/packages/${pkg.slug}`}
                          className="group block rounded-xl border border-paper-200 p-4 hover:border-gold-400 hover:bg-paper-50/50 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-ink-900 group-hover:text-pine-700 text-sm">
                              {pkg.name}
                            </span>
                            <span className="font-semibold text-pine-700 text-sm">{inr(pkg.priceFrom)}</span>
                          </div>
                          <p className="text-xs text-ink-500 mt-1 line-clamp-1">{pkg.nights}N/{pkg.days}D</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-3xl border border-gold-400/30 bg-paper-50 p-6 shadow-sm">
                  <h4 className="font-semibold text-ink-950 text-base mb-1">कस्टम टूर पैकेज कोटेशन</h4>
                  <p className="text-xs text-ink-600 mb-4">
                    श्रीनगर की स्थानीय टीम से सीधे बात करें और अपनी यात्रा का विशेष डिस्काउंट कोट पाएं।
                  </p>
                  <EnquiryForm
                    source={`HINDI_${guide.slug}`}
                    packageName={`Hindi Guide: ${guide.title.slice(0, 35)}`}
                    destination={guide.destinationName}
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
