#!/usr/bin/env bash
# ==============================================================================
# Glitz Holidays — FRONTEND  |  PHASE 7: Foundation, Auth, Desk
# ------------------------------------------------------------------------------
# Builds the Next.js app in ./frontend (inside your glitz/ folder).
#
#   Next 16 (App Router) + React 19 + Tailwind v4
#   shadcn-style components, hand-written so you own the code
#   Apache ECharts (wrapped directly — no react wrapper to go stale)
#   Geist + Geist Mono, self-hosted (no Google Fonts fetch at build time)
#
# DESIGN THESIS — "colour means money":
#   The interface is graphite. No decorative colour anywhere. Saturated colour
#   appears only where it states a financial fact: margin health, cash owed,
#   supplier exposure. Amber means a file is thin. Red means it is losing.
#   Pipeline stages are NOT colour-coded — a stage is not a financial fact.
#
#   Every number is set in Geist Mono with tabular figures so digits align in
#   columns. Currency uses Indian lakh/crore grouping.
#
# Ships in this phase: login, app shell, and the Desk (dashboard).
# Leads, quote builder and bookings screens come in phase 8.
#
# RUN FROM YOUR PROJECT ROOT (the folder containing backend/):
#   cd ~/Desktop/glitz
#   bash phase-7.sh
#
# Options: SKIP_INSTALL=1  SKIP_BUILD=1
# ==============================================================================
set -euo pipefail

say()  { printf "\n\033[1;36m==>\033[0m %s\n" "$1"; }
ok()   { printf "\033[1;32m  ok\033[0m %s\n" "$1"; }
warn() { printf "\033[1;33m  ! \033[0m %s\n" "$1"; }
die()  { printf "\033[1;31m  x \033[0m %s\n" "$1"; exit 1; }

say "Checking location"
command -v node >/dev/null 2>&1 || die "node not found."
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || die "Node 20+ required. You have $(node -v)."

if [ -d backend ] && [ -f backend/package.json ]; then
  ok "found ./backend — running from the project root"
elif [ -f package.json ] && [ -d prisma ]; then
  die "You are inside backend/. Run this from the project root: cd .. && bash phase-7.sh"
else
  warn "No ./backend here. Continuing — frontend/ will be created in $(pwd)."
fi

if [ -d frontend/src ]; then
  die "./frontend/src already exists. Move or delete ./frontend, then re-run."
fi

mkdir -p frontend
cd frontend
ok "building in $(pwd)"

cat > '.env.local.example' << 'GLITZEOF'
# Backend API base. Include the /api prefix.
NEXT_PUBLIC_API_URL=http://localhost:3000/api
GLITZEOF
cat > 'next.config.ts' << 'GLITZEOF'
import type { NextConfig } from 'next';
const nextConfig: NextConfig = { reactStrictMode: true };
export default nextConfig;
GLITZEOF
cat > 'package.json' << 'GLITZEOF'
{
  "name": "glitz-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-slot": "^1.1.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "echarts": "^6.1.0",
    "geist": "^1.7.2",
    "lucide-react": "^0.474.0",
    "next": "16.3.0",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "tailwind-merge": "^3.0.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.3.3",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.3.3",
    "typescript": "^5.7.0"
  }
}
GLITZEOF
cat > 'postcss.config.mjs' << 'GLITZEOF'
const config = { plugins: { '@tailwindcss/postcss': {} } };
export default config;
GLITZEOF
cat > 'tsconfig.json' << 'GLITZEOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
GLITZEOF
mkdir -p "src/components"
cat > 'src/components/echart.tsx' << 'GLITZEOF'
'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

/**
 * Thin ECharts wrapper. Deliberately not using `echarts-for-react` — that
 * package lags on React peer versions and this is 30 lines.
 */
export function EChart({
  option,
  height = 260,
  className,
}: {
  option: echarts.EChartsOption;
  height?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chart.current = echarts.init(ref.current, undefined, { renderer: 'canvas' });

    const onResize = () => chart.current?.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      chart.current?.dispose();
      chart.current = null;
    };
  }, []);

  useEffect(() => {
    chart.current?.setOption(option, true);
  }, [option]);

  return <div ref={ref} style={{ height }} className={className} />;
}

/** Shared axis/tooltip styling so every chart in the product matches. */
export const chartBase: Pick<
  echarts.EChartsOption,
  'grid' | 'textStyle' | 'tooltip'
> = {
  grid: { left: 8, right: 12, top: 16, bottom: 4, containLabel: true },
  textStyle: { fontFamily: 'var(--font-geist-mono), monospace', fontSize: 11 },
  tooltip: {
    backgroundColor: '#171b22',
    borderColor: '#333b4a',
    borderWidth: 1,
    textStyle: { color: '#dfe3ea', fontSize: 12 },
    padding: [8, 10],
  },
};

export const axisStyle = {
  axisLine: { lineStyle: { color: '#262c38' } },
  axisTick: { show: false },
  axisLabel: { color: '#6b7688', fontSize: 10 },
  splitLine: { lineStyle: { color: '#1c212a' } },
};
GLITZEOF
mkdir -p "src/components"
cat > 'src/components/margin-ribbon.tsx' << 'GLITZEOF'
'use client';

import { cn } from '@/lib/utils';
import { marginHealth, money, percent } from '@/lib/format';

/**
 * THE SIGNATURE ELEMENT.
 *
 * A single horizontal bar showing what a file is actually made of: the
 * portion that goes straight back out to suppliers, and the portion you keep.
 * The kept portion is the only part that carries colour, and that colour is
 * the margin verdict — healthy, thin, or losing.
 *
 * It replaces the usual "big number + gradient" card, because the proportion
 * IS the insight. ₹75,700 revenue tells you nothing on its own.
 */
export function MarginRibbon({
  sell,
  cost,
  minMargin = 15,
  showLabels = true,
  className,
}: {
  sell: number;
  cost: number;
  minMargin?: number;
  showLabels?: boolean;
  className?: string;
}) {
  const profit = sell - cost;
  const marginPct = sell > 0 ? (profit / sell) * 100 : 0;
  const health = marginHealth(marginPct, minMargin);

  // A loss-making file still renders a full bar; the cost simply overflows it.
  const costShare = sell > 0 ? Math.min(100, (cost / sell) * 100) : 100;
  const keptShare = Math.max(0, 100 - costShare);

  const keptColor =
    health === 'healthy'
      ? 'bg-healthy-500'
      : health === 'warn'
        ? 'bg-warn-500'
        : 'bg-loss-500';

  const textColor =
    health === 'healthy'
      ? 'text-healthy-400'
      : health === 'warn'
        ? 'text-warn-400'
        : 'text-loss-400';

  return (
    <div className={cn('w-full', className)}>
      {showLabels && (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-[11px] uppercase tracking-[0.09em] text-ink-400">
            {profit >= 0 ? 'You keep' : 'Shortfall'}
          </span>
          <span className={cn('tabular text-sm font-medium', textColor)}>
            {money(profit)}
            <span className="ml-2 text-ink-500">{percent(marginPct)}</span>
          </span>
        </div>
      )}

      <div
        className="relative h-1.5 w-full overflow-hidden rounded-full bg-ink-800"
        role="img"
        aria-label={`Margin ${percent(marginPct)}. Cost ${money(cost)} of ${money(sell)}.`}
      >
        {/* supplier share — always neutral, it was never yours */}
        <div
          className="sweep absolute inset-y-0 left-0 bg-ink-600"
          style={{ width: `${costShare}%` }}
        />
        {/* your share — the only coloured pixels */}
        <div
          className={cn('sweep absolute inset-y-0', keptColor)}
          style={{ left: `${costShare}%`, width: `${keptShare}%` }}
        />
      </div>

      {showLabels && (
        <div className="mt-1.5 flex justify-between text-[10px] tabular text-ink-500">
          <span>cost {money(cost)}</span>
          <span>sell {money(sell)}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Lead score, 0-100. Deliberately monochrome: a score is a prediction, not
 * money. Only the fill length carries meaning.
 */
export function ScoreMeter({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-12 overflow-hidden rounded-full bg-ink-800">
        <div
          className="h-full rounded-full bg-ink-300 transition-[width] duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="tabular text-[11px] text-ink-400">{clamped}</span>
    </div>
  );
}
GLITZEOF
mkdir -p "src/components/ui"
cat > 'src/components/ui/badge.tsx' << 'GLITZEOF'
import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Pipeline stages are NOT colour-coded. Colour in this product means money,
 * and a lead being at "Negotiation" is not a financial fact. Stages are
 * distinguished by weight and a leading rule instead.
 */
export function Stage({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const label = value.replace(/_/g, ' ').toLowerCase();
  const strong = ['CONFIRMED', 'NEGOTIATION', 'QUOTATION_SENT'].includes(value);
  const dim = ['LOST', 'CANCELLED'].includes(value);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] tracking-wide capitalize',
        strong ? 'text-ink-100' : dim ? 'text-ink-500' : 'text-ink-300',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'h-3 w-px',
          strong ? 'bg-ink-200' : dim ? 'bg-ink-600' : 'bg-ink-500',
        )}
      />
      {label}
    </span>
  );
}

export function Chip({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border border-ink-700 bg-ink-850 px-1.5 py-0.5',
        'text-[10px] uppercase tracking-[0.08em] text-ink-400',
        className,
      )}
      {...props}
    />
  );
}
GLITZEOF
mkdir -p "src/components/ui"
cat > 'src/components/ui/button.tsx' << 'GLITZEOF'
'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ' +
    'transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out ' +
    'disabled:pointer-events-none disabled:opacity-45 active:translate-y-px ' +
    '[&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-signal-600 text-ink-50 hover:bg-signal-500 shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_1px_2px_0_rgba(0,0,0,0.6)]',
        secondary:
          'bg-ink-800 text-ink-100 border border-ink-700 hover:bg-ink-700 hover:border-ink-600',
        ghost: 'text-ink-300 hover:text-ink-50 hover:bg-ink-800',
        danger: 'bg-loss-500 text-ink-50 hover:bg-loss-400',
        link: 'text-signal-400 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4',
        lg: 'h-10 px-5',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
GLITZEOF
mkdir -p "src/components/ui"
cat > 'src/components/ui/input.tsx' << 'GLITZEOF'
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-9 w-full rounded-md border border-ink-700 bg-ink-950/60 px-3 text-sm text-ink-100',
      'placeholder:text-ink-500',
      'transition-[border-color,box-shadow,background-color] duration-150 ease-out',
      'hover:border-ink-600',
      'focus:border-signal-500 focus:bg-ink-950 focus:outline-none',
      'focus:shadow-[0_0_0_3px_rgba(53,146,150,0.15)]',
      'disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-[11px] font-medium uppercase tracking-[0.09em] text-ink-400',
      className,
    )}
    {...props}
  />
));
Label.displayName = 'Label';
GLITZEOF
mkdir -p "src/components/ui"
cat > 'src/components/ui/panel.tsx' << 'GLITZEOF'
import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * The one container in the product. Hover lift is 1px — enough to register as
 * interactive, small enough not to make a dense table feel like it's breathing.
 */
export function Panel({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-[10px] border border-ink-700/80 bg-ink-900',
        'shadow-[0_1px_2px_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.7)]',
        interactive &&
          'transition-[transform,border-color,box-shadow] duration-200 ease-out ' +
            'hover:-translate-y-px hover:border-ink-600 ' +
            'hover:shadow-[0_2px_4px_rgba(0,0,0,0.5),0_16px_32px_-16px_rgba(0,0,0,0.85)]',
        className,
      )}
      {...props}
    />
  );
}

export function PanelHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-ink-700/60 px-5 py-3.5',
        className,
      )}
      {...props}
    />
  );
}

export function PanelTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        'text-[13px] font-semibold tracking-[0.08em] uppercase text-ink-300',
        className,
      )}
      {...props}
    />
  );
}

export function PanelBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />;
}
GLITZEOF
mkdir -p "src/app"
cat > 'src/app/globals.css' << 'GLITZEOF'
@import "tailwindcss";

/*
  GLITZ — instrument panel.
  The interface is graphite. Saturated colour is reserved for financial
  meaning only: margin health, cash position, overdue balance. If you see
  colour on a screen, it is telling you something about money.
*/
@theme {
  --color-ink-950: #0d1015;
  --color-ink-900: #12151b;
  --color-ink-850: #171b22;
  --color-ink-800: #1c212a;
  --color-ink-700: #262c38;
  --color-ink-600: #333b4a;
  --color-ink-500: #4a5566;
  --color-ink-400: #6b7688;
  --color-ink-300: #8b94a6;
  --color-ink-200: #b4bcc9;
  --color-ink-100: #dfe3ea;
  --color-ink-50:  #f2f4f8;

  --color-signal-600: #2c7a7d;
  --color-signal-500: #359296;
  --color-signal-400: #4bb0b3;
  --color-signal-300: #7ccbcd;

  --color-healthy-500: #3f9d6d;
  --color-healthy-400: #52b981;
  --color-warn-500:    #c08a2e;
  --color-warn-400:    #dda63f;
  --color-loss-500:    #b4483f;
  --color-loss-400:    #d0594e;

  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;

  --radius-panel: 10px;
}

:root { color-scheme: dark; }
html, body { height: 100%; }

body {
  background: var(--color-ink-950);
  color: var(--color-ink-100);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

/* Every number in this product aligns. Money you misread is money you lose. */
.tabular {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

:focus-visible {
  outline: 2px solid var(--color-signal-400);
  outline-offset: 2px;
  border-radius: 3px;
}

::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: var(--color-ink-950); }
::-webkit-scrollbar-thumb {
  background: var(--color-ink-700);
  border-radius: 6px;
  border: 2px solid var(--color-ink-950);
}
::-webkit-scrollbar-thumb:hover { background: var(--color-ink-600); }

@keyframes rise {
  from { opacity: 0; transform: translate3d(0, 8px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
}
.rise { animation: rise 380ms cubic-bezier(0.16, 1, 0.3, 1) both; }

@keyframes sweep {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
.sweep { animation: sweep 620ms cubic-bezier(0.16, 1, 0.3, 1) both; transform-origin: left; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
GLITZEOF
mkdir -p "src/app"
cat > 'src/app/layout.tsx' << 'GLITZEOF'
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: 'Glitz Holidays',
  description: 'Lead, quotation and booking desk',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
GLITZEOF
mkdir -p "src/app"
cat > 'src/app/page.tsx' << 'GLITZEOF'
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { tokenStore } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace(tokenStore.get() ? '/dashboard' : '/login');
  }, [router]);
  return null;
}
GLITZEOF
mkdir -p "src/app/(app)"
cat > 'src/app/(app)/layout.tsx' << 'GLITZEOF'
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
GLITZEOF
mkdir -p "src/app/(app)/dashboard"
cat > 'src/app/(app)/dashboard/page.tsx' << 'GLITZEOF'
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { EChartsOption } from 'echarts';
import Link from 'next/link';
import { ArrowUpRight, TriangleAlert } from 'lucide-react';
import {
  api,
  ApiError,
  type BookingStats,
  type LeadStats,
  type LeadRow,
  type Paged,
} from '@/lib/api';
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel';
import { MarginRibbon, ScoreMeter } from '@/components/margin-ribbon';
import { EChart, chartBase, axisStyle } from '@/components/echart';
import { Stage } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { money, moneyShort, percent, relativeDate } from '@/lib/format';

export default function DashboardPage() {
  const [bookings, setBookings] = useState<BookingStats | null>(null);
  const [leads, setLeads] = useState<LeadStats | null>(null);
  const [recent, setRecent] = useState<LeadRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [b, l, r] = await Promise.all([
          api.get<BookingStats>('/bookings/stats').catch(() => null),
          api.get<LeadStats>('/leads/stats').catch(() => null),
          api.get<Paged<LeadRow>>('/leads?limit=6').catch(
            (): Paged<LeadRow> => ({
              total: 0,
              page: 1,
              limit: 6,
              pages: 0,
              data: [],
            }),
          ),
        ]);
        if (cancelled) return;
        setBookings(b);
        setLeads(l);
        setRecent(r.data ?? []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'Could not load the desk.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sourceOption = useMemo<EChartsOption>(() => {
    const rows = (leads?.bySource ?? []).slice().sort((a, b) => b.count - a.count);
    return {
      ...chartBase,
      grid: { ...chartBase.grid, left: 4 },
      xAxis: { type: 'value' as const, ...axisStyle },
      yAxis: {
        type: 'category' as const,
        ...axisStyle,
        data: rows.map((r) => r.source.replace(/_/g, ' ').toLowerCase()),
        splitLine: { show: false },
      },
      series: [
        {
          type: 'bar' as const,
          data: rows.map((r) => r.count),
          barMaxWidth: 14,
          itemStyle: { color: '#4a5566', borderRadius: [0, 3, 3, 0] },
          emphasis: { itemStyle: { color: '#359296' } },
        },
      ],
    };
  }, [leads]);

  const pipelineOption = useMemo<EChartsOption>(() => {
    const order = [
      'NEW',
      'CONTACTED',
      'INTERESTED',
      'QUOTATION_SENT',
      'NEGOTIATION',
      'CONFIRMED',
    ];
    const map = new Map((leads?.byStatus ?? []).map((r) => [r.status, r.count]));
    return {
      ...chartBase,
      xAxis: {
        type: 'category' as const,
        ...axisStyle,
        data: order.map((s) => s.replace(/_/g, ' ').toLowerCase()),
        axisLabel: { ...axisStyle.axisLabel, interval: 0, rotate: 28 },
      },
      yAxis: { type: 'value' as const, ...axisStyle },
      series: [
        {
          type: 'bar' as const,
          data: order.map((s) => map.get(s) ?? 0),
          barMaxWidth: 26,
          itemStyle: { color: '#333b4a', borderRadius: [3, 3, 0, 0] },
          emphasis: { itemStyle: { color: '#359296' } },
        },
      ],
    };
  }, [leads]);

  const eroding =
    bookings != null && bookings.profitVariance < 0 ? bookings.profitVariance : 0;

  return (
    <div className="mx-auto max-w-[1180px] px-8 py-8">
      <header className="mb-7 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-50">
            Desk
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-400">
            Where the money is, right now.
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/leads">
            Open leads
            <ArrowUpRight className="size-4" strokeWidth={1.75} />
          </Link>
        </Button>
      </header>

      {error && (
        <Panel className="mb-6 border-loss-500/40 bg-loss-500/5">
          <PanelBody className="flex items-start gap-3 py-4">
            <TriangleAlert className="mt-0.5 size-4 text-loss-400" strokeWidth={1.75} />
            <div>
              <p className="text-[13px] text-ink-100">{error}</p>
              <p className="mt-1 text-[12px] text-ink-400">
                Start the backend with <code className="tabular">npm run start:dev</code>,
                then reload.
              </p>
            </div>
          </PanelBody>
        </Panel>
      )}

      {/* Row 1 — the money question */}
      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr_1fr]">
        <Panel interactive className="rise">
          <PanelHeader>
            <PanelTitle>Booked value</PanelTitle>
            {eroding < 0 && (
              <span className="tabular text-[11px] text-warn-400">
                {money(eroding)} vs quoted
              </span>
            )}
          </PanelHeader>
          <PanelBody>
            {loading ? (
              <Skeleton />
            ) : bookings && bookings.totalSell > 0 ? (
              <>
                <p className="tabular text-[2rem] leading-none font-semibold text-ink-50">
                  {money(bookings.totalSell)}
                </p>
                <p className="mt-1.5 text-[12px] text-ink-500">
                  across {bookings.bookings} file
                  {bookings.bookings === 1 ? '' : 's'}
                </p>
                <div className="mt-5">
                  <MarginRibbon
                    sell={bookings.totalSell}
                    cost={bookings.totalSell - bookings.totalActualProfit}
                  />
                </div>
              </>
            ) : (
              <Empty
                title="No bookings yet"
                hint="Confirm a quotation to see value here."
              />
            )}
          </PanelBody>
        </Panel>

        <Panel interactive className="rise" style={{ animationDelay: '60ms' }}>
          <PanelHeader>
            <PanelTitle>Owed to you</PanelTitle>
          </PanelHeader>
          <PanelBody>
            {loading ? (
              <Skeleton />
            ) : (
              <>
                <p className="tabular text-[2rem] leading-none font-semibold text-ink-50">
                  {money(bookings?.totalOutstanding ?? 0)}
                </p>
                <p className="mt-1.5 text-[12px] text-ink-500">
                  {money(bookings?.totalReceived ?? 0)} received so far
                </p>
              </>
            )}
          </PanelBody>
        </Panel>

        <Panel interactive className="rise" style={{ animationDelay: '120ms' }}>
          <PanelHeader>
            <PanelTitle>You owe suppliers</PanelTitle>
          </PanelHeader>
          <PanelBody>
            {loading ? (
              <Skeleton />
            ) : (
              <>
                <p className="tabular text-[2rem] leading-none font-semibold text-ink-50">
                  {money(bookings?.vendorOutstanding ?? 0)}
                </p>
                <p className="mt-1.5 text-[12px] text-ink-500">
                  {bookings && bookings.averageMarginPercent > 0
                    ? `${percent(bookings.averageMarginPercent)} average margin`
                    : 'Record vendor costs to track this'}
                </p>
              </>
            )}
          </PanelBody>
        </Panel>
      </div>

      {/* Row 2 — where work comes from */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel className="rise" style={{ animationDelay: '180ms' }}>
          <PanelHeader>
            <PanelTitle>Pipeline</PanelTitle>
            <span className="tabular text-[11px] text-ink-500">
              {leads?.total ?? 0} leads
            </span>
          </PanelHeader>
          <PanelBody className="pt-2">
            {leads && leads.total > 0 ? (
              <EChart option={pipelineOption} height={240} />
            ) : (
              <Empty
                title="No leads yet"
                hint="Point a landing page at /api/leads/capture."
              />
            )}
          </PanelBody>
        </Panel>

        <Panel className="rise" style={{ animationDelay: '240ms' }}>
          <PanelHeader>
            <PanelTitle>Where leads come from</PanelTitle>
            {leads && leads.unassigned > 0 && (
              <span className="tabular text-[11px] text-warn-400">
                {leads.unassigned} unassigned
              </span>
            )}
          </PanelHeader>
          <PanelBody className="pt-2">
            {leads && leads.bySource.length > 0 ? (
              <EChart option={sourceOption} height={240} />
            ) : (
              <Empty title="Nothing to chart" hint="Sources appear as leads arrive." />
            )}
          </PanelBody>
        </Panel>
      </div>

      {/* Row 3 — the actual work queue */}
      <Panel className="rise mt-4" style={{ animationDelay: '300ms' }}>
        <PanelHeader>
          <PanelTitle>Latest enquiries</PanelTitle>
          <Button asChild variant="link" size="sm">
            <Link href="/leads">View all</Link>
          </Button>
        </PanelHeader>
        {recent.length === 0 ? (
          <PanelBody>
            <Empty
              title="No enquiries yet"
              hint="Leads captured from your landing pages land here first."
            />
          </PanelBody>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-ink-800 text-[10px] uppercase tracking-[0.09em] text-ink-500">
                <th className="px-5 py-2.5 font-medium">Name</th>
                <th className="px-5 py-2.5 font-medium">Destination</th>
                <th className="px-5 py-2.5 font-medium">Stage</th>
                <th className="px-5 py-2.5 font-medium">Score</th>
                <th className="px-5 py-2.5 text-right font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((lead) => (
                <tr
                  key={lead.id}
                  className="group border-b border-ink-800/60 transition-colors duration-150 last:border-0 hover:bg-ink-850"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-ink-100 transition-colors group-hover:text-signal-300"
                    >
                      {lead.name}
                    </Link>
                    <span className="tabular ml-2 text-[11px] text-ink-500">
                      {lead.phone}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink-300">
                    {lead.destination ?? '—'}
                  </td>
                  <td className="px-5 py-3">
                    <Stage value={lead.status} />
                  </td>
                  <td className="px-5 py-3">
                    <ScoreMeter score={lead.score} />
                  </td>
                  <td className="tabular px-5 py-3 text-right text-[12px] text-ink-500">
                    {relativeDate(lead.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2">
      <div className="h-8 w-32 animate-pulse rounded bg-ink-800" />
      <div className="h-3 w-20 animate-pulse rounded bg-ink-850" />
    </div>
  );
}

function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-[13px] text-ink-300">{title}</p>
      <p className="mt-1 text-[12px] text-ink-500">{hint}</p>
    </div>
  );
}
GLITZEOF
mkdir -p "src/app/login"
cat > 'src/app/login/page.tsx' << 'GLITZEOF'
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, tokenStore, ApiError, type SessionUser } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ access_token: string; user: SessionUser }>(
        '/auth/login',
        { email, password },
      );
      tokenStore.set(res.access_token, res.user);
      router.replace('/dashboard');
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.status === 401
            ? 'That email and password do not match an account.'
            : e.message
          : 'Something went wrong.',
      );
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Left: the thesis. Not a stock photo — the numbers this desk exists for. */}
      <section className="relative hidden overflow-hidden border-r border-ink-800 bg-ink-950 lg:block">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #1c212a 1px, transparent 1px), linear-gradient(to bottom, #1c212a 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage:
              'radial-gradient(ellipse 70% 60% at 40% 45%, black 30%, transparent 100%)',
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="text-[13px] font-semibold uppercase tracking-[0.28em] text-ink-400">
            Glitz Holidays
          </div>

          <div className="max-w-md">
            <p className="rise text-[2.6rem] leading-[1.08] font-semibold tracking-tight text-ink-50">
              Every file shows what you
              <span className="text-signal-400"> actually </span>
              made on it.
            </p>
            <p
              className="rise mt-5 text-sm leading-relaxed text-ink-400"
              style={{ animationDelay: '90ms' }}
            >
              Quoted margin and real margin, side by side, on every booking.
              Supplier costs and client payments in one place.
            </p>
          </div>

          <dl
            className="rise grid grid-cols-3 gap-6 border-t border-ink-800 pt-6"
            style={{ animationDelay: '180ms' }}
          >
            {[
              ['Attribution', 'Keyword to booking'],
              ['Margin', 'Quoted vs actual'],
              ['Suppliers', 'Owned by the company'],
            ].map(([term, desc]) => (
              <div key={term}>
                <dt className="text-[11px] uppercase tracking-[0.09em] text-ink-300">
                  {term}
                </dt>
                <dd className="mt-1 text-[11px] leading-snug text-ink-500">
                  {desc}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Right: the work */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[340px]">
          <h1 className="text-lg font-semibold tracking-tight text-ink-50">
            Sign in
          </h1>
          <p className="mt-1 text-[13px] text-ink-400">
            Use the account your administrator created.
          </p>

          <div className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && signIn()}
                placeholder="you@glitzholidays.in"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && signIn()}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rise rounded-md border border-loss-500/40 bg-loss-500/10 px-3 py-2 text-[13px] text-loss-400"
              >
                {error}
              </p>
            )}

            <Button
              onClick={signIn}
              disabled={busy || !email || !password}
              className="w-full"
              size="lg"
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
GLITZEOF
mkdir -p "src/lib"
cat > 'src/lib/api.ts' << 'GLITZEOF'
/**
 * Single place that talks to the NestJS backend.
 *
 * NOTE ON TOKEN STORAGE: the JWT lives in localStorage. That is readable by
 * any script running on the page, so it is only acceptable because this is an
 * internal tool on a domain you control. If Glitz ever becomes a product sold
 * to other DMCs, move to an httpOnly cookie set by the backend.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

const TOKEN_KEY = 'glitz.token';
const USER_KEY = 'glitz.user';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const tokenStore = {
  get(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string, user: SessionUser) {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  user(): SessionUser | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  },
  clear() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = tokenStore.get();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      'Cannot reach the server. Check that the backend is running.',
      0,
    );
  }

  if (res.status === 401) {
    tokenStore.clear();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new ApiError('Your session has expired. Sign in again.', 401);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body?.message === 'string') message = body.message;
      else if (Array.isArray(body?.message)) message = body.message.join(', ');
    } catch {
      /* keep the default message */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// ---- shapes returned by the backend (kept minimal on purpose) ------------

export interface LeadStats {
  total: number;
  unassigned: number;
  byStatus: { status: string; count: number }[];
  bySource: { source: string; count: number }[];
}

export interface BookingStats {
  bookings: number;
  totalSell: number;
  totalReceived: number;
  totalOutstanding: number;
  vendorOutstanding: number;
  totalQuotedProfit: number;
  totalActualProfit: number;
  profitVariance: number;
  averageMarginPercent: number;
  byStatus: { status: string; count: number }[];
}

export interface LeadRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  destination: string | null;
  status: string;
  source: string;
  score: number;
  createdAt: string;
  assignedTo?: { id: string; name: string } | null;
}

export interface Paged<T> {
  total: number;
  page: number;
  limit: number;
  pages: number;
  data: T[];
}
GLITZEOF
mkdir -p "src/lib"
cat > 'src/lib/format.ts' << 'GLITZEOF'
/**
 * Indian numbering throughout — lakh/crore grouping, not thousands.
 * ₹12,45,000 is readable to your team; ₹1,245,000 is not.
 */
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrCompact = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 1,
});

export function money(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return inr.format(value);
}

/** 1250000 -> "12.5L" ; 24500000 -> "2.5Cr" — for dense cards only. */
export function moneyShort(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const abs = Math.abs(value);
  if (abs >= 10000000) return `${inrCompact.format(value / 10000000)}Cr`;
  if (abs >= 100000) return `${inrCompact.format(value / 100000)}L`;
  if (abs >= 1000) return `${inrCompact.format(value / 1000)}K`;
  return String(value);
}

export function percent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(digits)}%`;
}

export function shortDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function relativeDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return shortDate(d);
}

/**
 * Margin health bands. These drive every colour decision in the product,
 * so they live in exactly one place.
 */
export type Health = 'healthy' | 'warn' | 'loss';

export function marginHealth(marginPercent: number, minMargin = 15): Health {
  if (marginPercent < 0) return 'loss';
  if (marginPercent < minMargin) return 'warn';
  return 'healthy';
}

export const healthText: Record<Health, string> = {
  healthy: 'text-healthy-400',
  warn: 'text-warn-400',
  loss: 'text-loss-400',
};

export const healthBg: Record<Health, string> = {
  healthy: 'bg-healthy-500',
  warn: 'bg-warn-500',
  loss: 'bg-loss-500',
};
GLITZEOF
mkdir -p "src/lib"
cat > 'src/lib/utils.ts' << 'GLITZEOF'
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
GLITZEOF
cat > '.env.local.example' << 'GLITZEOF'
# Backend API base. Include the /api prefix.
NEXT_PUBLIC_API_URL=http://localhost:3000/api
GLITZEOF
ok "wrote 21 files"

cat > .gitignore << 'GLITZEOF'
node_modules
.next
out
.env.local
*.log
.DS_Store
next-env.d.ts
GLITZEOF

cat > README.md << 'GLITZEOF'
# Glitz — frontend

Next 16 + Tailwind v4 + ECharts. Talks to the NestJS backend.

## Run

    cp .env.local.example .env.local     # point at your backend
    npm install
    npm run dev                          # http://localhost:3001

The backend runs on :3000, so this dev server uses :3001.

## Deploy (Vercel)

Import the repo, set **Root Directory** to `frontend`, and set
`NEXT_PUBLIC_API_URL` to your Render backend URL (including `/api`).

## Design rules

- Colour is reserved for financial meaning. Never use it decoratively.
- All numbers use `.tabular` (Geist Mono, tabular figures).
- Currency goes through `money()` in `src/lib/format.ts` for lakh/crore grouping.
- Margin bands live in `marginHealth()` — one place, used everywhere.
GLITZEOF
ok "gitignore + readme"

say "Setting the dev port to 3001 (backend owns 3000)"
node -e '
const fs=require("fs");
const p=JSON.parse(fs.readFileSync("package.json","utf8"));
p.scripts.dev="next dev -p 3001";
p.scripts.start="next start -p 3001";
fs.writeFileSync("package.json", JSON.stringify(p,null,2)+"\n");
console.log("  dev -> next dev -p 3001");
'
ok "package.json"

if [ ! -f .env.local ]; then
  cp .env.local.example .env.local
  ok "created .env.local (edit it if your backend is not on :3000)"
fi

if [ "${SKIP_INSTALL:-0}" != "1" ]; then
  say "Installing dependencies (a minute or two)"
  npm install || die "npm install failed"
  ok "installed"
fi

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  say "Production build (type-checks everything)"
  npm run build || die "Build failed — see errors above."
  ok "build passed"
fi

say "Committing"
cd ..
if git rev-parse --git-dir >/dev/null 2>&1; then
  git add -A
  git commit -qm "Phase 7: frontend foundation — auth, app shell, desk" || warn "commit skipped"
  ok "committed"
else
  warn "no git repo at project root — skipping commit"
fi

say "PHASE 7 COMPLETE"
cat << 'GLITZEOF'

Start both servers, in two terminals:

  cd backend  && npm run start:dev     # :3000
  cd frontend && npm run dev           # :3001

Then open  http://localhost:3001  and sign in with your owner account.

What you should see:
  - Login split screen; the left panel states what the desk is for
  - Desk: booked value with a margin ribbon, money owed to you,
    money you owe suppliers, pipeline + lead source charts,
    and the latest enquiries
  - Empty states everywhere until real data exists — that is correct,
    not a bug. Capture a lead and confirm a booking to fill it.

The margin ribbon is the piece to look at: the grey portion of the bar is
what goes straight back out to suppliers, the coloured portion is what you
keep. Green is healthy, amber is thin, red is losing.

Next: phase 8 — lead inbox, lead detail with the activity timeline,
and the quote builder.
GLITZEOF
