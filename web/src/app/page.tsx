import Link from 'next/link';
import { ArrowRight, Star, Award, Users, MapPin } from 'lucide-react';
import { SITE } from '@/lib/site';
import { DESTINATIONS } from '@/lib/destinations';
import { DestinationCard } from '@/components/destination-card';
import { EnquiryForm } from '@/components/enquiry-form';

/** JSON-LD for the home page — WebSite + SearchAction (site links search box). */
const webSiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE.domain}/#website`,
  name: SITE.name,
  url: SITE.domain,
  publisher: { '@id': `${SITE.domain}/#org` },
};

const TESTIMONIALS = [
  {
    quote:
      'Our Kashmir trip was everything the brochures promise but rarely deliver. Every driver, every hotel, every meal — thoughtfully arranged.',
    author: 'Priya Menon',
    trip: '7-night Kashmir · Family of 4',
  },
  {
    quote:
      'Ladakh at altitude is no joke. The Glitz team paced it perfectly, got us the best hotels in Leh, and even arranged oxygen at Pangong. Zero drama.',
    author: 'Arjun Reddy',
    trip: '8-night Ladakh · Couple',
  },
  {
    quote:
      'We combined Vaishno Devi with Kashmir. From Katra to Srinagar, every touchpoint was handled. This is what a real DMC feels like.',
    author: 'Rekha Sharma',
    trip: 'Vaishno Devi + Kashmir · Group of 6',
  },
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />

      {/* ---------- Hero ---------- */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{
            // Placeholder — swap for /public/images/hero.jpg once real photo is available.
            backgroundImage:
              'linear-gradient(180deg, rgba(15,13,10,0.35) 0%, rgba(15,13,10,0.75) 100%), radial-gradient(140% 100% at 30% 20%, #4a6d7c 0%, #1a2f3a 55%, #0f1a22 100%)',
          }}
        />
        <div className="container-editorial min-h-[78vh] py-24 md:py-32 text-[color:var(--color-ink-50)]">
          <p className="text-[11.5px] uppercase tracking-[0.22em] text-[color:var(--color-brand-300)]">
            Srinagar-based Himalayan DMC · Est. 2019
          </p>
          <h1 className="display mt-4 max-w-3xl text-[44px] leading-[1.02] md:text-[72px]">
            Journeys through Kashmir, Ladakh, Himachal — as they should be lived.
          </h1>
          <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-[color:var(--color-ink-100)]">
            We are locals. Every itinerary is handcrafted by people whose grandparents
            walked these mountains — so your trip skips the tourist queues and finds
            the country the postcards missed.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="#destinations"
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-brand-500)] px-6 py-3 text-[14px] font-medium text-[color:var(--color-ink-950)] hover:bg-[color:var(--color-brand-300)] transition-colors"
            >
              Explore destinations
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-ink-100)]/40 px-6 py-3 text-[14px] font-medium hover:border-[color:var(--color-brand-300)] hover:text-[color:var(--color-brand-300)] transition-colors"
            >
              Talk to a specialist
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Trust strip ---------- */}
      <section className="border-y border-[color:var(--color-ink-200)] bg-[color:var(--color-ink-100)]">
        <div className="container-editorial grid gap-6 py-8 md:grid-cols-4 md:py-10">
          {[
            { icon: MapPin, k: 'Srinagar', v: 'Local, not middlemen' },
            { icon: Users, k: '4,000+', v: 'Guests hosted' },
            { icon: Star,  k: '4.9 / 5', v: 'Google rating' },
            { icon: Award, k: '24 × 7',  v: 'On-trip support' },
          ].map((t) => (
            <div key={t.k} className="flex items-center gap-4">
              <div className="grid size-11 place-items-center rounded-full bg-[color:var(--color-brand-500)] text-[color:var(--color-ink-950)]">
                <t.icon className="size-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className="display text-[20px] leading-none">{t.k}</p>
                <p className="text-[12.5px] text-[color:var(--color-ink-600)]">{t.v}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Destinations ---------- */}
      <section id="destinations" className="container-editorial py-20 md:py-28">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-brand-600)]">
              Where we take you
            </p>
            <h2 className="display mt-2 text-[36px] leading-[1.05] md:text-[52px] max-w-xl">
              Four regions. Every mood the Himalayas can hold.
            </h2>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DESTINATIONS.map((d) => (
            <DestinationCard key={d.slug} d={d} />
          ))}
        </div>
      </section>

      {/* ---------- Editorial section: why us ---------- */}
      <section className="bg-[color:var(--color-ink-900)] text-[color:var(--color-ink-100)]">
        <div className="container-editorial grid gap-14 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-brand-300)]">
              Why Glitz
            </p>
            <h2 className="display mt-3 text-[36px] leading-[1.05] md:text-[46px]">
              A DMC, not a reseller.
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-[color:var(--color-ink-300)]">
              Ninety percent of Kashmir bookings on the internet come from agencies in
              Delhi or Mumbai who forward your enquiry to someone like us. You pay their
              margin and lose a day in the middle.
              <br /><br />
              We are that someone. Book direct, save the margin, get answers from the
              person who actually knows whether Rohtang is open today.
            </p>
          </div>
          <div className="space-y-6">
            {[
              ['Own vehicles', 'Innovas, Xylos and Tempo Travellers. No third-party markup.'],
              ['Hand-picked hotels', "We've stayed in every hotel we sell — no exceptions."],
              ['24 × 7 on-trip WhatsApp', 'You reach the same team, not a call centre.'],
              ['Transparent pricing', 'GST-inclusive quotes. No surprise inclusions/exclusions games.'],
            ].map(([title, body]) => (
              <div key={title} className="border-l-2 border-[color:var(--color-brand-500)] pl-5">
                <h3 className="display text-[20px] text-[color:var(--color-ink-50)]">{title}</h3>
                <p className="mt-1 text-[13.5px] text-[color:var(--color-ink-400)]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Testimonials ---------- */}
      <section className="container-editorial py-20 md:py-28">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-brand-600)]">
          What guests say
        </p>
        <h2 className="display mt-2 text-[36px] leading-[1.05] md:text-[52px] max-w-2xl">
          The reviews are the itinerary.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.author}
              className="rounded-xl border border-[color:var(--color-ink-200)] bg-white p-7"
            >
              <div className="flex gap-0.5 text-[color:var(--color-brand-500)]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" strokeWidth={0} />
                ))}
              </div>
              <blockquote className="mt-4 text-[15.5px] leading-relaxed text-[color:var(--color-ink-800)]">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 border-t border-[color:var(--color-ink-200)] pt-4">
                <p className="text-[13.5px] font-medium text-[color:var(--color-ink-900)]">
                  {t.author}
                </p>
                <p className="text-[12px] text-[color:var(--color-ink-500)]">{t.trip}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ---------- Enquiry CTA ---------- */}
      <section className="bg-[color:var(--color-ink-100)]">
        <div className="container-editorial grid gap-14 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-brand-600)]">
              Start planning
            </p>
            <h2 className="display mt-2 text-[36px] leading-[1.05] md:text-[52px]">
              Tell us what you're dreaming about.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[color:var(--color-ink-700)] max-w-md">
              One quick note, one specialist assigned to you within a few hours. No
              call-centre hand-offs, no generic itineraries — the person who replies
              will handle your trip end-to-end.
            </p>
          </div>
          <div>
            <EnquiryForm source="homepage_hero" />
          </div>
        </div>
      </section>
    </>
  );
}
