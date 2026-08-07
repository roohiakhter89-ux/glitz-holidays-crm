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
