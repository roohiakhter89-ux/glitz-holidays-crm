'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarCheck,
  Building2,
  Settings,
  LogOut,
} from 'lucide-react';
import { tokenStore, type SessionUser } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/quotes', label: 'Quotations', icon: FileText },
  { href: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/vendors', label: 'Suppliers', icon: Building2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const u = tokenStore.user();
    if (!tokenStore.get() || !u) {
      router.replace('/login');
      return;
    }
    setUser(u);
    setReady(true);
  }, [router]);

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

  return (
    <div className="grid min-h-screen grid-cols-[220px_1fr]">
      <aside className="flex flex-col border-r border-ink-800 bg-ink-900">
        <div className="border-b border-ink-800 px-5 py-4">
          <span className="text-[13px] font-semibold uppercase tracking-[0.2em] text-ink-200">
            Glitz
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px]',
                  'transition-[background-color,color,transform] duration-150 ease-out',
                  active
                    ? 'bg-ink-800 text-ink-50'
                    : 'text-ink-400 hover:bg-ink-850 hover:text-ink-100 hover:translate-x-0.5',
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-signal-400"
                  />
                )}
                <Icon className="size-4" strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-ink-800 p-3">
          <div className="px-2 pb-2">
            <p className="truncate text-[13px] text-ink-200">{user?.name}</p>
            <p className="truncate text-[11px] uppercase tracking-[0.08em] text-ink-500">
              {user?.role.replace(/_/g, ' ').toLowerCase()}
            </p>
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
      </aside>

      <main className="min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
