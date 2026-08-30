import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Plane, TrainFront, Info, ArrowUpRight, MapPin } from 'lucide-react';
import { ORIGIN_CITIES, getOriginCity } from '@/lib/origin-cities';
import { getPackage } from '@/lib/packages';
import { TONE_HERO } from '@/lib/destinations';
import { PackageCard, SectionHead, Faq, JsonLd } from '@/components/cards';
import { PageHero, FactStrip } from '@/components/page-hero';
import { EnquiryForm } from '@/components/enquiry-form';
import { StickyMobileCta } from '@/components/sticky-mobile-cta';
import { SITE, inr, whatsAppLink } from '@/lib/site';

type Params = Promise<{ city: string }>;

export function generateStaticParams() {
  return ORIGIN_CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { city } = await params;
  const c = getOriginCity(city);
  if (!c) return {};

  const cheapest = c.packages
    .map((s) => getPackage(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .reduce((min, p) => (p.priceFrom < min ? p.priceFrom : min), Infinity);

  const title = `Kashmir Tour Packages from ${c.name} — Itineraries & Prices from ${inr(cheapest)}`;
  const description = `${c.summary} Day-by-day itineraries, GST-inclusive land prices from ${inr(cheapest)} per person, and honest advice on flights and timing from ${c.name}.`;

  return {
    title,
    description,
    alternates: { canonical: `/packages/from/${c.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE.domain}/packages/from/${c.slug}`,
      type: 'website',
    },
  };
}

export default async function PackagesFromCity({ params }: { params: Params }) {
  const { city } = await params;
  const c = getOriginCity(city);
  if (!c) notFound();

  const packages = c.packages
    .map((s) => getPackage(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  if (packages.length === 0) notFound();

  const cheapest = packages.reduce((min, p) => (p.priceFrom < min ? p.priceFrom : min), Infinity);
  const url = `${SITE.domain}/packages/from/${c.slug}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${url}#page`,
      name: `Kashmir Tour Packages from ${c.name}`,
      description: c.summary,
      url,
      provider: { '@id': `${SITE.domain}/#org` },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: packages.length,
        itemListElement: packages.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'TouristTrip',
            name: p.name,
            description: p.summary,
            url: `${SITE.domain}/packages/${p.slug}`,
            offers: {
              '@type': 'Offer',
              price: p.priceFrom,
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
            },
          },
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: c.faqs.map((f) => ({
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
        { '@type': 'ListItem', position: 2, name: 'Packages', item: `${SITE.domain}/packages` },
        { '@type': 'ListItem', position: 3, name: `From ${c.name}`, item: url },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />

      <PageHero
        kicker={`Departing from ${c.name} · ${c.state}`}
        title={`Kashmir tour packages from ${c.name}`}
        lede={c.summary}
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Packages', href: '/packages' },
          { label: `From ${c.name}` },
        ]}
        background={TONE_HERO.kashmir}
      >
        <FactStrip
          facts={[
            ['Land package from', `${inr(cheapest)} per person`],
            ['Itineraries', `${packages.length} built for ${c.name} travellers`],
            ['Arrival airport', 'Srinagar (SXR)'],
            ['Office', 'Srinagar — we operate this ourselves'],
          ]}
        />
      </PageHero>

      <div className="mesh-warm">
        <div className="wrap section-sm grid gap-12 lg:grid-cols-12">
          {/* ───────────── main column */}
          <div className="lg:col-span-8">
            <section data-reveal>
              <p className="kicker">Starting from {c.name}</p>
              <h2 className="display d3 mt-2 text-ink-900">
                What changes when you start here.
              </h2>
              <div className="mt-6 space-y-5">
                {c.body.map((para) => (
                  <p key={para.slice(0, 40)} className="text-[15px] leading-relaxed text-ink-600">
                    {para}
                  </p>
                ))}
              </div>
            </section>

            {/* planning note */}
            <aside
              data-reveal
              className="mt-10 flex gap-4 rounded-2xl border border-gold-200 bg-gold-50 p-6"
            >
              <Info className="mt-0.5 size-5 shrink-0 text-gold-600" strokeWidth={2} />
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-700">
                  The one thing to get right
                </p>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-700">
                  {c.planningNote}
                </p>
              </div>
            </aside>

            {/* ───────────── travel facts, only when verified */}
            {(c.flight || c.train) && (
              <section className="mt-14" data-reveal>
                <p className="kicker">Getting here</p>
                <h2 className="display d3 mt-2 text-ink-900">
                  {c.name} to Srinagar, in real numbers.
                </h2>
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  {c.flight && (
                    <div className="rounded-2xl border border-paper-300 bg-white p-6">
                      <h3 className="flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-600">
                        <Plane className="size-4 text-gold-600" strokeWidth={2.2} />
                        By air
                      </h3>
                      <dl className="mt-5 space-y-3 text-[13.5px]">
                        <div className="flex justify-between gap-3 border-b border-paper-200 pb-3">
                          <dt className="text-ink-500">Fastest</dt>
                          <dd className="text-right font-medium text-ink-900">{c.flight.duration}</dd>
                        </div>
                        <div className="flex justify-between gap-3 border-b border-paper-200 pb-3">
                          <dt className="text-ink-500">Typical return fare</dt>
                          <dd className="text-right font-medium text-ink-900">
                            {inr(c.flight.fareBand[0])}–{inr(c.flight.fareBand[1])}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-500">Airlines</dt>
                          <dd className="text-right font-medium text-ink-900">
                            {c.flight.airlines.join(', ')}
                          </dd>
                        </div>
                      </dl>
                      <p className="mt-4 text-[11.5px] text-ink-500">
                        Checked {c.flight.verifiedOn}. Fares move — treat this as a band, not a quote.
                      </p>
                    </div>
                  )}
                  {c.train && (
                    <div className="rounded-2xl border border-paper-300 bg-white p-6">
                      <h3 className="flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-600">
                        <TrainFront className="size-4 text-gold-600" strokeWidth={2.2} />
                        By rail
                      </h3>
                      <dl className="mt-5 space-y-3 text-[13.5px]">
                        <div className="flex justify-between gap-3 border-b border-paper-200 pb-3">
                          <dt className="text-ink-500">Railhead</dt>
                          <dd className="text-right font-medium text-ink-900">{c.train.railhead}</dd>
                        </div>
                        <div className="flex justify-between gap-3 border-b border-paper-200 pb-3">
                          <dt className="text-ink-500">Journey</dt>
                          <dd className="text-right font-medium text-ink-900">{c.train.duration}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-500">Fare band</dt>
                          <dd className="text-right font-medium text-ink-900">
                            {inr(c.train.fareBand[0])}–{inr(c.train.fareBand[1])}
                          </dd>
                        </div>
                      </dl>
                      <p className="mt-4 text-[12px] leading-relaxed text-ink-600">
                        {c.train.onwardLeg}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ───────────── packages */}
            <section className="mt-16" data-reveal>
              <p className="kicker">Itineraries</p>
              <h2 className="display d3 mt-2 text-ink-900">
                Built for {c.name} arrival times.
              </h2>
              <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-ink-600">
                Land prices are per person on twin-sharing with GST included, and
                are the same whichever city you fly from. Airfare sits on top and
                we quote it separately, because bundling the two into one number
                hides which half is actually moving.
              </p>
              <div data-reveal-group className="mt-9 grid gap-5 md:grid-cols-2">
                {packages.map((p) => (
                  <PackageCard key={p.slug} p={p} />
                ))}
              </div>
            </section>

            {/* ───────────── faqs */}
            <section className="mt-16" data-reveal>
              <p className="kicker">From {c.name}, specifically</p>
              <h2 className="display d3 mb-8 mt-2 text-ink-900">
                Questions we get from this city.
              </h2>
              <Faq items={c.faqs} />
            </section>
          </div>

          {/* ───────────── sticky sidebar */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-[104px]">
              <div className="overflow-hidden rounded-2xl border border-paper-300 bg-white shadow-lg">
                <div className="relative px-6 py-7" style={{ background: TONE_HERO.kashmir }}>
                  <div aria-hidden className="grain absolute inset-0" />
                  <p className="relative text-[10.5px] uppercase tracking-[0.16em] text-paper-200/70">
                    Land package from
                  </p>
                  <p className="display relative mt-1.5 text-[40px] leading-none text-paper-50">
                    {inr(cheapest)}
                  </p>
                  <p className="relative mt-2 text-[12px] text-paper-200/70">
                    per person · twin-sharing · GST included
                  </p>
                </div>

                <div className="p-6">
                  <p className="text-[13.5px] leading-relaxed text-ink-600">
                    We do not publish live airfares from {c.name}, because a number
                    written here today would be wrong by the time you read it. Send
                    us your dates and we will price the flights and the land package
                    together, as two honest lines rather than one blended figure.
                  </p>

                  <div className="mt-6 grid gap-2.5">
                    <a
                      href={whatsAppLink(`a Kashmir package from ${c.name}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-gold btn-shine w-full"
                    >
                      Get today&rsquo;s fare + quote
                    </a>
                    <a href={`tel:${SITE.phone.tel}`} className="btn btn-ghost w-full">
                      Call {SITE.phone.display}
                    </a>
                  </div>

                  <p className="mt-4 text-center text-[11.5px] leading-relaxed text-ink-500">
                    Answered from our Srinagar office by the person who will run
                    your trip.
                  </p>
                </div>
              </div>

              <Link
                href="/destinations/kashmir"
                className="lift group mt-5 flex items-center justify-between gap-3 rounded-2xl border border-paper-300 bg-paper-50 p-5 transition-colors hover:border-gold-400 hover:bg-white"
              >
                <div>
                  <p className="kicker">Destination guide</p>
                  <p className="display mt-1.5 text-[19px] text-ink-900">Kashmir Tour Packages</p>
                </div>
                <ArrowUpRight className="arrow-slide size-5 shrink-0 text-gold-600" strokeWidth={2} />
              </Link>

              <div className="mt-5 rounded-2xl border border-paper-300 bg-paper-100 p-5">
                <p className="kicker">Other departure cities</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ORIGIN_CITIES.filter((o) => o.slug !== c.slug).map((o) => (
                    <Link
                      key={o.slug}
                      href={`/packages/from/${o.slug}`}
                      className="rounded-full border border-paper-300 bg-paper-50 px-3 py-1.5 text-[12px] text-ink-600 transition-all duration-200 hover:border-gold-400 hover:bg-gold-50 hover:text-gold-700"
                    >
                      {o.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ───────────── enquiry */}
      <section className="mesh-pine grain section relative isolate overflow-hidden">
        <div
          aria-hidden
          className="blob right-[-6%] top-[6%] h-[400px] w-[400px]"
          style={{ background: 'rgba(232,185,35,0.15)' }}
        />
        <div className="wrap relative grid items-start gap-12 lg:grid-cols-2">
          <div data-reveal>
            <p className="kicker kicker-light">Planning from {c.name}</p>
            <h2 className="display d2 mt-3 text-paper-50">
              Tell us your dates. We&rsquo;ll tell you the real cost.
            </h2>
            <p className="lede mt-5 max-w-md !text-paper-200/75">
              Flights and land package priced separately, so you can see which
              half to move if the total is more than you had in mind. Most of the
              time, shifting the dates by three days does more than cutting a
              night.
            </p>
            <div className="mt-8">
              <MapPin className="mb-3 size-5 text-gold-300" strokeWidth={1.8} />
              <p className="text-[13.5px] leading-relaxed text-paper-200/60">
                {SITE.address.street}, {SITE.address.city} — {SITE.stats.rating}★ from{' '}
                {SITE.stats.reviewCount} Google reviews.
              </p>
            </div>
          </div>
          <div data-reveal="right" className="glass-dark rounded-2xl p-6 md:p-8" id="enquiry">
            <EnquiryForm
              source={`origin_city_${c.slug}`}
              destination="Kashmir"
              light
            />
          </div>
        </div>
      </section>

      <StickyMobileCta packageName={`Kashmir from ${c.name}`} priceFrom={cheapest} />
    </>
  );
}
