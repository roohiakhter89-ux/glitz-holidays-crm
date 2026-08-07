'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { api, ApiError, type LeadDetail, type QuoteDetail } from '@/lib/api';
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

function NewQuoteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const leadId = params.get('leadId');

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
      .catch(() => setError('Could not load that lead.'));
  }, [leadId]);

  // default validity: two weeks out, the usual life of a Kashmir quote
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setValidUntil(d.toISOString().slice(0, 10));
  }, []);

  async function create() {
    if (!leadId) return;
    setBusy(true);
    setError(null);
    try {
      const quote = await api.post<QuoteDetail>('/quotes', {
        leadId,
        title: title.trim() || undefined,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
      });
      // seed a first tier so the builder is never an empty room
      await api.post(`/quotes/${quote.id}/options`, {
        name: 'Standard',
        adults: lead?.adults ?? 2,
        children: lead?.children ?? 0,
        nights: lead?.nights ?? 0,
        sortOrder: 0,
      });
      router.replace(`/quotes/${quote.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not create the quotation.');
      setBusy(false);
    }
  }

  if (!leadId) {
    return (
      <div className="mx-auto max-w-[560px] px-8 py-8">
        <Panel>
          <PanelBody className="py-10 text-center">
            <p className="text-[13px] text-ink-300">Start from a lead</p>
            <p className="mt-1 text-[12px] text-ink-500">
              Quotations belong to a client, so open the lead first.
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
    <div className="mx-auto max-w-[560px] px-8 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-3"
        onClick={() => router.push(`/leads/${leadId}`)}
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        Back to lead
      </Button>

      <Panel>
        <PanelHeader>
          <PanelTitle>New quotation</PanelTitle>
        </PanelHeader>
        <PanelBody className="space-y-4">
          {lead && (
            <p className="text-[13px] text-ink-400">
              For <span className="text-ink-100">{lead.name}</span>
              <span className="tabular"> · {lead.phone}</span>
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="t">Package name</Label>
            <Input
              id="t"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kashmir 5N/6D — family"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="v">Valid until</Label>
            <Input
              id="v"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
            <p className="text-[11px] text-ink-600">
              Rates move. Two weeks is the usual life of a quote.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md border border-loss-500/40 bg-loss-500/10 px-3 py-2 text-[13px] text-loss-400"
            >
              {error}
            </p>
          )}

          <Button onClick={create} disabled={busy} className="w-full" size="lg">
            {busy ? 'Creating…' : 'Create and start building'}
          </Button>
        </PanelBody>
      </Panel>
    </div>
  );
}

export default function NewQuotePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[560px] px-8 py-8">
          <div className="h-4 w-40 animate-pulse rounded bg-ink-800" />
        </div>
      }
    >
      <NewQuoteForm />
    </Suspense>
  );
}
