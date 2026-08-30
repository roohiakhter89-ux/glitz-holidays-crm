'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { SITE } from '@/lib/site';

type Props = {
  /** Which page / package this form sits on — passed to CRM as `campaign`. */
  source: string;
  /** Optional prefill for the "package" hidden field. */
  packageName?: string;
  className?: string;
};

/**
 * Server-agnostic enquiry form. POSTs to the CRM's public capture endpoint
 * (same one PHP landers use). No client-side email — everything goes into
 * the CRM so ops can assign and follow up per the standard cadence.
 */
export function EnquiryForm({ source, packageName, className }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    // Match the CRM's expected shape.
    const payload = {
      name: String(data.get('name') ?? '').trim(),
      phone: String(data.get('phone') ?? '').trim(),
      email: String(data.get('email') ?? '').trim() || undefined,
      message: String(data.get('message') ?? '').trim() || undefined,
      source: 'WEBSITE',
      campaign: source,
      landingPage: typeof window !== 'undefined' ? window.location.pathname : source,
      tags: packageName ? [packageName] : undefined,
    };

    try {
      const res = await fetch(SITE.leadCaptureUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('sent');
      form.reset();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (status === 'sent') {
    return (
      <div className={className}>
        <div className="rounded-lg border border-[color:var(--color-brand-500)] bg-[color:var(--color-brand-50)] p-5 text-[color:var(--color-ink-900)]">
          <h3 className="display text-[22px]">Thank you.</h3>
          <p className="mt-1 text-[14px] text-[color:var(--color-ink-700)]">
            Our travel expert will reach out within a few hours. For anything urgent,
            WhatsApp or call {SITE.phone.display}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="grid gap-3">
        <label className="block">
          <span className="mb-1 block text-[11.5px] font-medium uppercase tracking-wider text-[color:var(--color-ink-500)]">
            Your name
          </span>
          <input
            required
            name="name"
            autoComplete="name"
            className="w-full rounded-md border border-[color:var(--color-ink-300)] bg-white px-3.5 py-2.5 text-[14px] focus:border-[color:var(--color-brand-500)] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11.5px] font-medium uppercase tracking-wider text-[color:var(--color-ink-500)]">
            Phone / WhatsApp
          </span>
          <input
            required
            name="phone"
            type="tel"
            autoComplete="tel"
            pattern="[0-9+() -]{8,}"
            className="w-full rounded-md border border-[color:var(--color-ink-300)] bg-white px-3.5 py-2.5 text-[14px] focus:border-[color:var(--color-brand-500)] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11.5px] font-medium uppercase tracking-wider text-[color:var(--color-ink-500)]">
            Email (optional)
          </span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-md border border-[color:var(--color-ink-300)] bg-white px-3.5 py-2.5 text-[14px] focus:border-[color:var(--color-brand-500)] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11.5px] font-medium uppercase tracking-wider text-[color:var(--color-ink-500)]">
            Tell us what you're planning
          </span>
          <textarea
            name="message"
            rows={3}
            placeholder={
              packageName
                ? `E.g. Interested in ${packageName} for 4 people, late June.`
                : 'E.g. 5 nights Kashmir in June, family of 4.'
            }
            className="w-full rounded-md border border-[color:var(--color-ink-300)] bg-white px-3.5 py-2.5 text-[14px] focus:border-[color:var(--color-brand-500)] focus:outline-none"
          />
        </label>

        {error && (
          <p className="text-[12.5px] text-red-700">
            Couldn't send: {error}. Please WhatsApp us on {SITE.phone.display}.
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'sending'}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-[color:var(--color-ink-900)] px-5 py-3 text-[13.5px] font-medium text-[color:var(--color-ink-50)] hover:bg-[color:var(--color-brand-600)] transition-colors disabled:opacity-60"
        >
          {status === 'sending' && <Loader2 className="size-4 animate-spin" />}
          {status === 'sending' ? 'Sending…' : 'Send my enquiry'}
        </button>
        <p className="mt-1 text-[11.5px] text-[color:var(--color-ink-500)]">
          Or WhatsApp us directly on {SITE.phone.display} for an instant response.
        </p>
      </div>
    </form>
  );
}
