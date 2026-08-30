import type { Metadata } from 'next';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About Glitz Holidays — Srinagar-based Kashmir DMC',
  description:
    'We are a Srinagar-based DMC, founded in 2019, crafting Kashmir, Ladakh, Himachal and Vaishno Devi holidays. Meet the team, the story, and how we work.',
  alternates: { canonical: `${SITE.domain}/about` },
};

export default function AboutPage() {
  return (
    <>
      <section className="container-editorial py-20 md:py-28">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-brand-600)]">
          Our story
        </p>
        <h1 className="display mt-3 text-[44px] leading-[1.02] md:text-[72px] max-w-3xl">
          Locals who fell in love with hosting.
        </h1>
        <div className="mt-10 grid gap-14 md:grid-cols-3">
          <div className="prose prose-lg md:col-span-2 text-[15.5px] leading-[1.8] text-[color:var(--color-ink-700)]">
            <p>
              Glitz Holidays started in 2019 when a few Srinagar friends grew tired of
              watching agencies from Delhi mis-sell our own valley to visitors who
              deserved better. We opened a small office in Rajbagh, bought our first
              Innova, and started arranging trips for friends of friends.
            </p>
            <p className="mt-5">
              Six years and four thousand guests later, we still do it the same way —
              answer every enquiry ourselves, host every itinerary ourselves, and stand
              behind every hotel we book. When you WhatsApp us from Gulmarg at 11pm,
              you're texting the same team that quoted your trip.
            </p>
            <p className="mt-5">
              We now cover Kashmir, Ladakh, Himachal, and Vaishno Devi. Different
              geographies, same philosophy: local hands, local knowledge, transparent
              pricing.
            </p>
          </div>

          <aside className="rounded-xl border border-[color:var(--color-ink-200)] bg-[color:var(--color-ink-100)] p-6 text-[13.5px]">
            <h2 className="display text-[22px] text-[color:var(--color-ink-900)]">Quick facts</h2>
            <dl className="mt-4 space-y-3 text-[color:var(--color-ink-700)]">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[color:var(--color-ink-500)]">Founded</dt>
                <dd>2019, Srinagar</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[color:var(--color-ink-500)]">Guests hosted</dt>
                <dd>4,000+ and counting</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[color:var(--color-ink-500)]">Team</dt>
                <dd>Sales · Operations · On-trip · Accounts</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[color:var(--color-ink-500)]">Coverage</dt>
                <dd>Kashmir · Ladakh · Himachal · Vaishno Devi</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </>
  );
}
