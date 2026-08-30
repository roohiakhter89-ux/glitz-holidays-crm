import Link from 'next/link';
import { SITE } from '@/lib/site';
import { DESTINATIONS } from '@/lib/destinations';

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[color:var(--color-ink-200)] bg-[color:var(--color-ink-900)] text-[color:var(--color-ink-300)]">
      <div className="container-editorial grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-baseline gap-1.5">
            <span className="display text-[24px] text-[color:var(--color-brand-300)]">Glitz</span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink-400)]">
              Holidays
            </span>
          </div>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-[color:var(--color-ink-400)]">
            Srinagar-based DMC crafting Kashmir, Ladakh, Himachal and Vaishno Devi
            journeys for discerning Indian and international travellers.
          </p>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink-100)]">
            Destinations
          </h4>
          <ul className="mt-3 space-y-2 text-[13px]">
            {DESTINATIONS.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/destinations/${d.slug}`}
                  className="text-[color:var(--color-ink-300)] hover:text-[color:var(--color-brand-300)] transition-colors"
                >
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink-100)]">
            Company
          </h4>
          <ul className="mt-3 space-y-2 text-[13px]">
            <li><Link href="/about" className="hover:text-[color:var(--color-brand-300)] transition-colors">About us</Link></li>
            <li><Link href="/contact" className="hover:text-[color:var(--color-brand-300)] transition-colors">Contact</Link></li>
            <li><Link href="/blog" className="hover:text-[color:var(--color-brand-300)] transition-colors">Travel guides</Link></li>
            <li>
              <a
                href={`${SITE.crmUrl}/login`}
                className="text-[color:var(--color-ink-500)] hover:text-[color:var(--color-brand-300)] transition-colors"
              >
                Staff login
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink-100)]">
            Talk to us
          </h4>
          <ul className="mt-3 space-y-2 text-[13px]">
            <li>
              <a href={`tel:${SITE.phone.tel}`} className="hover:text-[color:var(--color-brand-300)] transition-colors">
                {SITE.phone.display}
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`} className="hover:text-[color:var(--color-brand-300)] transition-colors">
                {SITE.email}
              </a>
            </li>
            <li className="text-[color:var(--color-ink-400)]">
              {SITE.address.street}, {SITE.address.city}<br />
              {SITE.address.region} {SITE.address.postalCode}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[color:var(--color-ink-800)]">
        <div className="container-editorial flex flex-col justify-between gap-2 py-5 text-[11.5px] text-[color:var(--color-ink-500)] md:flex-row">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <p>Handcrafted in Srinagar, Kashmir.</p>
        </div>
      </div>
    </footer>
  );
}
