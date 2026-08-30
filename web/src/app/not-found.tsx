import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="container-editorial grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-brand-600)]">
          404
        </p>
        <h1 className="display mt-3 text-[52px] leading-[1.02] md:text-[72px]">
          Off the map.
        </h1>
        <p className="mt-4 text-[15px] text-[color:var(--color-ink-600)]">
          The page you were looking for isn't here. Try one of the destinations instead.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-ink-900)] px-6 py-3 text-[14px] text-[color:var(--color-ink-50)] hover:bg-[color:var(--color-brand-600)] transition-colors"
        >
          Take me home
        </Link>
      </div>
    </section>
  );
}
