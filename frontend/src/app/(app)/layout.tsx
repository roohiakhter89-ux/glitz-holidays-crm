'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Building2,
  Settings,
  LogOut,
  TrendingUp,
  UserCog,
  Globe,
  Map,
  BarChart3,
  ShieldCheck,
  Wallet,
  AlarmClock,
  Menu,
  X,
  Search,
  Plug,
} from 'lucide-react';
import { tokenStore, type SessionUser } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CommandPalette } from '@/components/command-palette';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/follow-ups', label: 'Follow-ups', icon: AlarmClock },
  { href: '/itineraries', label: 'Itineraries', icon: Map },
  { href: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/attribution', label: 'Attribution', icon: TrendingUp },
  { href: '/finance', label: 'Finance', icon: Wallet },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/seo', label: 'SEO', icon: Globe },
  { href: '/vendors', label: 'Suppliers', icon: Building2 },
  { href: '/people', label: 'People', icon: UserCog },
  { href: '/users', label: 'Access', icon: ShieldCheck },
  { href: '/integrations', label: 'Integrations', icon: Plug },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const u = tokenStore.user();
    if (!tokenStore.get() || !u) {
      router.replace('/login');
      return;
    }
    setUser(u);
    setReady(true);
  }, [router]);

  // Close the drawer whenever the route changes — otherwise it'd stay open
  // after tapping a nav link on mobile.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open so the page underneath
  // doesn't rubber-band.
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [drawerOpen]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center">
        <span className="text-[13px] text-ink-500">Loading…</span>
      </div>
    );
  }

  function signOut() {
    tokenStore.clear();
    router.replace('/login');
  }

  const sidebar = (
    <>
      <div className="border-b border-ink-800/60 px-5 py-4">
        <div className="flex items-baseline gap-1.5 font-semibold tracking-tight">
          <span className="text-[17px] text-brand-500 display">Glitz</span>
          <span className="text-[13px] uppercase tracking-[0.14em] text-signal-600">
            Holidays
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px]',
                'transition-[background-color,color,transform] duration-150 ease-out',
                active
                  ? 'bg-signal-600/8 text-signal-600 font-medium'
                  : 'text-ink-400 hover:bg-ink-850 hover:text-ink-200 hover:translate-x-0.5',
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-brand-500"
                />
              )}
              <Icon className="size-4" strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-800/60 p-3">
        <p className="mb-2 hidden px-2 text-[10.5px] text-ink-500 md:block">
          Press{' '}
          <kbd className="tabular rounded border border-ink-700 bg-ink-950 px-1 py-0.5">⌘K</kbd>{' '}
          to search anything
        </p>
        <div className="flex items-center gap-2.5 px-2 pb-2">
          <div
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-signal-500 text-[11px] font-semibold text-ink-950"
          >
            {(user?.name ?? 'U').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] text-ink-200">{user?.name}</p>
            <p className="truncate text-[10.5px] uppercase tracking-[0.1em] text-ink-500">
              {user?.role.replace(/_/g, ' ').toLowerCase()}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start"
        >
          <LogOut className="size-4" strokeWidth={1.75} />
          Sign out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen md:grid md:grid-cols-[232px_1fr]">
      {/* Mobile top bar — only visible below md */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-800/60 bg-ink-900/95 px-4 py-3 backdrop-blur md:hidden">
        <button
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="grid size-9 place-items-center rounded-md text-ink-300 hover:bg-ink-850 hover:text-ink-100"
        >
          <Menu className="size-5" strokeWidth={1.75} />
        </button>
        <div className="flex items-baseline gap-1 font-semibold tracking-tight">
          <span className="text-[15px] text-brand-500 display">Glitz</span>
          <span className="text-[11px] uppercase tracking-[0.14em] text-signal-600">
            Holidays
          </span>
        </div>
        <button
          aria-label="Search"
          onClick={() => {
            // Fake a Ctrl-K keypress so the palette opens with its existing
            // listener — one source of truth for the toggle.
            window.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }),
            );
          }}
          className="grid size-9 place-items-center rounded-md text-ink-300 hover:bg-ink-850 hover:text-ink-100"
        >
          <Search className="size-5" strokeWidth={1.75} />
        </button>
      </header>

      {/* Desktop sidebar — always mounted, hidden below md */}
      <aside className="hidden flex-col border-r border-ink-800/60 bg-ink-900 shadow-[1px_0_0_rgba(217,200,163,0.15)] md:flex">
        {sidebar}
      </aside>

      {/* Mobile drawer — off-canvas, shows above the app */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[260px] max-w-[85%] flex-col border-r border-ink-800/60 bg-ink-900 shadow-2xl">
            <div className="absolute right-2 top-2">
              <button
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="grid size-9 place-items-center rounded-md text-ink-400 hover:bg-ink-850 hover:text-ink-100"
              >
                <X className="size-5" strokeWidth={1.75} />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="min-w-0 overflow-x-hidden">{children}</main>
      <CommandPalette />
    </div>
  );
}
