import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Check, Clock, MapPin, Snowflake } from 'lucide-react';
import { DESTINATIONS, getDestination } from '@/lib/destinations';
import { EnquiryForm } from '@/components/enquiry-form';
import { SITE } from '@/lib/site';

/**
 * Destination-hero placeholder gradients. Deleted once
 * /public/images/destinations/<slug>-hero.jpg lands.
 */
const HERO_BG: Record<string, string> = {
  kashmir:
    'linear-gradient(180deg, rgba(15,13,10,0.30) 0%, rgba(15,13,10,0.80) 100%), radial-gradient(140% 100% at 30% 20%, #4a6d7c 0%, #1a2f3a 55%, #0f1a22 100%)',
  ladakh:
    'linear-gradient(180deg, rgba(15,13,10,0.30) 0%, rgba(15,13,10,0.80) 100%), radial-gradient(140% 100% at 60% 25%, #d4a574 0%, #7d5a3d 55%, #2a1d14 100%)',
  himachal:
    'linear-gradient(180deg, rgba(15,13,10,0.30) 0%, rgba(15,13,10,0.80) 100%), radial-gradient(140% 100% at 50% 20%, #4d6b4a 0%, #263b28 60%, #12191a 100%)',
  'vaishno-devi':
    'linear-gradient(180deg, rgba(15,13,10,0.30) 0%, rgba(15,13,10,0.80) 100%), radial-gradient(140% 100% at 40% 30%, #c8721a 0%, #7a3e0d 55%, #2a1408 100%)',
};
const HERO_BG_DEFAULT = HERO_BG.kashmir;

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return DESTINATIONS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const d = getDestination(slug);
  if (!d) return {};
  const title = `${d.name} Tour Packages — ${d.duration} from ₹${d.startingFrom.toLocaleString('en-IN')}`;
  const description = `${d.intro.slice(0, 155)}`;
  const url = `${SITE.domain}/destinations/${d.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website' },
  };
}

export default async function DestinationHubPage({ params }: { params: Params }) {
  const { slug } = await params;
  const d = getDestination(slug);
  if (!d) notFound();

  const url = `${SITE.domain}/destinations/${d.slug}`;

  /* JSON-LD: TouristDestination + FAQPage + Breadcrumbs */
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'TouristDestination',
      name: d.name,
      description: d.intro,
      url,
      includesAttraction: d.regions.map((r) => ({
        '@type': 'TouristAttraction',
        name: r.name,
        description: r.note,
      })),
      touristType: ['Family', 'Couples', 'Adventure', 'Pilgrimage'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: d.faqs.map((f) => ({
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
        { '@type': 'ListItem', position: 2, name: 'Destinations', item: `${SITE.domain}/destinations/${d.slug}` },
        { '@type': 'ListItem', position: 3, name: d.name, item: url },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{
            // Placeholder — swap for /public/images/destinations/<slug>-hero.jpg.
            backgroundImage: HERO_BG[d.slug] ?? HERO_BG_DEFAULT,
          }}
        />
        <div className="container-editorial py-20 md:py-28 text-[color:var(--color-ink-50)]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-brand-300)]">
            {d.name} · Tour Packages
          </p>
          <h1 className="display mt-3 max-w-3xl text-[44px] leading-[1.02] md:text-[72px]">
            {d.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-[15.5px] leading-relaxed text-[color:var(--color-ink-100)]">
            {d.intro}
          </p>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[13px] text-[color:var(--color-ink-200)]">
            <span className="flex items-center gap-2"><Clock className="size-4" strokeWidth={1.75} /> {d.duration}</span>
            <span className="flex items-center gap-2"><Snowflake className="size-4" strokeWidth={1.75} /> Best time: {d.bestTime}</span>
            <span className="flex items-center gap-2"><MapPin className="size-4" strokeWidth={1.75} /> Starts ₹{d.startingFrom.toLocaleString('en-IN')} pp</span>
          </div>
        </div>
      </section>

      {/* Regions */}
      <section className="container-editorial py-20 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-brand-600)]">
          Where you'll go
        </p>
        <h2 className="display mt-2 text-[36px] leading-[1.05] md:text-[46px] max-w-xl">
          {d.regions.length} regions worth crossing a border for.
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {d.regions.map((r) => (
            <div
              key={r.name}
              className="rounded-xl border border-[color:var(--color-ink-200)] bg-white p-6"
            >
              <h3 className="display text-[22px] text-[color:var(--color-ink-900)]">{r.name}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[color:var(--color-ink-600)]">
                {r.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="bg-[color:var(--color-ink-100)]">
        <div className="container-editorial grid gap-12 py-20 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-brand-600)]">
              What's typically included
            </p>
            <h2 className="display mt-2 text-[36px] leading-[1.05] md:text-[46px]">
              Signature experiences we build every {d.name} trip around.
            </h2>
          </div>
          <ul className="space-y-4">
            {d.highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 border-b border-[color:var(--color-ink-200)] pb-4">
                <Check className="mt-0.5 size-5 shrink-0 text-[color:var(--color-brand-600)]" strokeWidth={2} />
                <span className="text-[15px] text-[color:var(--color-ink-800)]">{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQs */}
      <section className="container-editorial py-20 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-brand-600)]">
          Frequently asked
        </p>
        <h2 className="display mt-2 text-[36px] leading-[1.05] md:text-[46px] max-w-xl">
          Questions we hear before every {d.name} trip.
        </h2>
        <div className="mt-10 divide-y divide-[color:var(--color-ink-200)] border-y border-[color:var(--color-ink-200)]">
          {d.faqs.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer items-start justify-between gap-4 text-[16.5px] font-medium text-[color:var(--color-ink-900)]">
                {f.q}
                <span className="mt-1 text-[color:var(--color-brand-600)] group-open:rotate-45 transition-transform">＋</span>
              </summary>
              <p className="mt-3 text-[14.5px] leading-relaxed text-[color:var(--color-ink-600)]">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Enquiry */}
      <section className="bg-[color:var(--color-ink-900)] text-[color:var(--color-ink-100)]">
        <div className="container-editorial grid gap-14 py-20 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-brand-300)]">
              Plan your {d.name} trip
            </p>
            <h2 className="display mt-2 text-[36px] leading-[1.05] md:text-[46px]">
              Same-day quote. Same team. Same phone number for the trip.
            </h2>
            <p className="mt-5 text-[14.5px] leading-relaxed text-[color:var(--color-ink-300)]">
              Tell us the dates, group size, and a rough idea — we'll come back with a
              custom itinerary and pricing in a few hours. No obligation, no spam.
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 md:p-8">
            <EnquiryForm source={`destination_${d.slug}`} packageName={d.name} />
          </div>
        </div>
      </section>
    </>
  );
}
