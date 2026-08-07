'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError, type LeadDetail, type QuoteDetail } from '@/lib/api';
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

export default function NewQuotePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[560px] px-8 py-10">
          <div className="h-4 w-40 animate-pulse rounded bg-ink-800" />
        </div>
      }
    >
      <NewQuoteForm />
    </Suspense>
  );
}

function NewQuoteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const leadId = params.get('leadId') ?? '';

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [title, setTitle] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leadId) return;
    api
      .get<LeadDetail>(`/leads/${leadId}`)
      .then((l) => {
        setLead(l);
        setTitle(
          l.destination
            ? `${l.destination}${l.nights ? ` ${l.nights}N` : ''} — ${l.name}`
            : `Package for ${l.name}`,
        );
      })
      .catch(() => setError('That lead could not be found.'));
  }, [leadId]);

  // default validity: two weeks out, the usual shelf life of a hotel hold
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setValidUntil(d.toISOString().slice(0, 10));
  }, []);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const quote = await api.post<QuoteDetail>('/quotes', {
        leadId,
        title: title.trim() || undefined,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
      });
      router.replace(`/quotes/${quote.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not create the quotation.');
      setBusy(false);
    }
  }

  if (!leadId) {
    return (
      <div className="mx-auto max-w-[560px] px-8 py-10">
        <Panel>
          <PanelBody className="py-10 text-center">
            <p className="text-[13px] text-ink-300">Start from a lead</p>
            <p className="mt-1 text-[12px] text-ink-500">
              Quotations belong to an enquiry. Open the lead and choose “Build
              quotation”.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => router.push('/leads')}
            >
              Go to leads
            </Button>
          </PanelBody>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[560px] px-8 py-10">
      <h1 className="text-xl font-semibold tracking-tight text-ink-50">
        New quotation
      </h1>
      <p className="mt-0.5 text-[13px] text-ink-400">
        {lead ? `for ${lead.name}` : 'Loading the enquiry…'}
      </p>

      <Panel className="mt-6">
        <PanelHeader>
          <PanelTitle>Details</PanelTitle>
        </PanelHeader>
        <PanelBody className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kashmir 5N/6D — Sharma family"
            />
            <p className="text-[11px] text-ink-600">
              The client sees this. Name the trip, not the file.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="valid">Hold prices until</Label>
            <Input
              id="valid"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="tabular"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md border border-loss-500/40 bg-loss-500/10 px-3 py-2 text-[13px] text-loss-400"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={create} disabled={busy}>
              {busy ? 'Creating…' : 'Create and add tiers'}
            </Button>
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}
