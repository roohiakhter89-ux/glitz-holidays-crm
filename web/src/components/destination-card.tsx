import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Destination } from '@/lib/destinations';

/**
 * Editorial placeholder backgrounds per destination. Each is a two-stop
 * gradient chosen to match the region's mood — Kashmir alpine, Ladakh
 * cold-desert, Himachal pine, Vaishno saffron. Replace with real photos
 * dropped into /public/images/destinations/<slug>.jpg.
 */
const BG_BY_SLUG: Record<string, string> = {
  kashmir:
    'linear-gradient(180deg, rgba(15,13,10,0.10) 0%, rgba(15,13,10,0.85) 100%), radial-gradient(120% 100% at 30% 20%, #4a6d7c 0%, #1a2f3a 60%, #0f1a22 100%)',
  ladakh:
    'linear-gradient(180deg, rgba(15,13,10,0.10) 0%, rgba(15,13,10,0.85) 100%), radial-gradient(120% 100% at 70% 20%, #d4a574 0%, #7d5a3d 55%, #2a1d14 100%)',
  himachal:
    'linear-gradient(180deg, rgba(15,13,10,0.10) 0%, rgba(15,13,10,0.85) 100%), radial-gradient(120% 100% at 50% 20%, #4d6b4a 0%, #263b28 60%, #12191a 100%)',
  'vaishno-devi':
    'linear-gradient(180deg, rgba(15,13,10,0.10) 0%, rgba(15,13,10,0.85) 100%), radial-gradient(120% 100% at 40% 30%, #c8721a 0%, #7a3e0d 55%, #2a1408 100%)',
};
const BG_DEFAULT = BG_BY_SLUG.kashmir;

export function DestinationCard({ d }: { d: Destination }) {
  return (
    <Link
      href={`/destinations/${d.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-[color:var(--color-ink-200)] bg-white transition-shadow hover:shadow-xl"
    >
      <div
        className="relative aspect-[4/5] bg-cover bg-center"
        style={{
          // Placeholder: swap for /public/images/destinations/<slug>.jpg once
          // real photography is ready. Colored gradient reads as intent, not broken.
          backgroundImage: BG_BY_SLUG[d.slug] ?? BG_DEFAULT,
        }}
      >
        <div className="absolute inset-x-0 bottom-0 p-5 text-[color:var(--color-ink-50)]">
          <div className="text-[10.5px] uppercase tracking-[0.2em] text-[color:var(--color-brand-300)]">
            {d.duration} · from ₹{d.startingFrom.toLocaleString('en-IN')}
          </div>
          <h3 className="display mt-1.5 text-[26px] leading-tight">{d.name}</h3>
          <p className="mt-1 text-[12.5px] text-[color:var(--color-ink-200)] line-clamp-2">
            {d.headline}
          </p>
        </div>
        <div className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-[color:var(--color-ink-900)] transition-transform group-hover:rotate-45">
          <ArrowUpRight className="size-4" strokeWidth={1.75} />
        </div>
      </div>
    </Link>
  );
}
