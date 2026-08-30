'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Phone, LogIn } from 'lucide-react';
import { SITE } from '@/lib/site';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/destinations/kashmir', label: 'Kashmir' },
  { href: '/destinations/ladakh', label: 'Ladakh' },
  { href: '/destinations/himachal', label: 'Himachal' },
  { href: '/destinations/vaishno-devi', label: 'Vaishno Devi' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--color-ink-200)] bg-[color:var(--color-ink-50)]/85 backdrop-blur">
      <div className="container-editorial flex h-16 items-center justify-between md:h-20">
        <Link href="/" className="flex items-baseline gap-1.5 font-semibold tracking-tight">
          <span className="display text-[22px] md:text-[26px] text-[color:var(--color-brand-600)]">
            Glitz
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink-500)]">
            Holidays
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-[13.5px] text-[color:var(--color-ink-700)] hover:text-[color:var(--color-brand-600)] transition-colors"
            >
              {n.label}
            </Link>
          ))}
          <a
            href={`tel:${SITE.phone.tel}`}
            className="flex items-center gap-2 rounded-full border border-[color:var(--color-ink-300)] px-3.5 py-1.5 text-[13px] font-medium text-[color:var(--color-ink-800)] hover:border-[color:var(--color-brand-500)] hover:text-[color:var(--color-brand-600)] transition-colors"
          >
            <Phone className="size-3.5" strokeWidth={1.75} />
            {SITE.phone.display}
          </a>
          <a
            href={`${SITE.crmUrl}/login`}
            className="flex items-center gap-1.5 text-[13.5px] text-[color:var(--color-ink-500)] hover:text-[color:var(--color-brand-600)] transition-colors"
            title="Staff login"
          >
            <LogIn className="size-3.5" strokeWidth={1.75} />
            Staff
          </a>
        </nav>

        <button
          className="md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[color:var(--color-ink-200)] bg-[color:var(--color-ink-50)]">
          <nav className="container-editorial flex flex-col gap-1 py-3">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-md px-3 py-2.5 text-[14px] text-[color:var(--color-ink-800)]',
                  'hover:bg-[color:var(--color-ink-100)]',
                )}
              >
                {n.label}
              </Link>
            ))}
            <a
              href={`tel:${SITE.phone.tel}`}
              className="mt-1 flex items-center gap-2 rounded-md bg-[color:var(--color-brand-500)] px-3 py-2.5 text-[14px] font-medium text-[color:var(--color-ink-950)]"
            >
              <Phone className="size-4" strokeWidth={1.75} />
              Call {SITE.phone.display}
            </a>
            <a
              href={`${SITE.crmUrl}/login`}
              className="flex items-center gap-2 rounded-md border border-[color:var(--color-ink-300)] px-3 py-2.5 text-[13.5px] text-[color:var(--color-ink-700)]"
            >
              <LogIn className="size-4" strokeWidth={1.75} />
              Staff login
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
