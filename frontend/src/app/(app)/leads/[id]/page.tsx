'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Phone as PhoneIcon, Mail } from 'lucide-react';
import {
  api,
  ApiError,
  tokenStore,
  type LeadDetail,
  type UserRow,
} from '@/lib/api';
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Select, Textarea } from '@/components/ui/select';
import { Label } from '@/components/ui/input';
import { Chip } from '@/components/ui/badge';
import { ScoreMeter } from '@/components/margin-ribbon';
import { Timeline } from '@/components/timeline';
import {
  ACTIVITY_TYPES,
  LEAD_STATUSES,
  humanise,
  whatsappHref,
} from '@/lib/constants';
import { money, shortDate } from '@/lib/format';

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [staff, setStaff] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [noteType, setNoteType] = useState<string>('CALL');
  const [note, setNote] = useState('');

  const canAssign = ['OWNER', 'SUPER_ADMIN', 'SALES_MANAGER'].includes(
    tokenStore.user()?.role ?? '',
  );

  const load = useCallback(async () => {
    try {
      const data = await api.get<LeadDetail>(`/leads/${id}`);
      setLead(data);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.status === 404
            ? 'That lead does not exist, or it is not assigned to you.'
            : e.message
          : 'Could not load this lead.',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!canAssign) return;
    api
      .get<UserRow[]>('/users')
      .then((u) => setStaff(u.filter((x) => x.isActive)))
      .catch(() => setStaff([]));
  }, [canAssign]);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    try {
      await api.patch(`/leads/${id}`, body);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Update failed.');
    } finally {
      setSaving(false);
    }
  }

  async function logActivity() {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await api.post(`/leads/${id}/activities`, {
        type: noteType,
        content: note.trim(),
      });
      setNote('');
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save that.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1180px] px-8 py-8">
        <div className="h-4 w-40 animate-pulse rounded bg-ink-800" />
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="mx-auto max-w-[1180px] px-8 py-8">
        <Button variant="ghost" size="sm" onClick={() => router.push('/leads')}>
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Back to leads
        </Button>
        <Panel className="mt-4 border-loss-500/40 bg-loss-500/5">
          <PanelBody>
            <p className="text-[13px] text-ink-100">{error}</p>
          </PanelBody>
        </Panel>
      </div>
    );
  }

  if (!lead) return null;

  const attribution = [
    ['Source', humanise(lead.source)],
    ['Campaign', lead.utmCampaign],
    ['Medium', lead.utmMedium],
    ['Keyword', lead.utmTerm ?? lead.keyword],
    ['Ad content', lead.utmContent],
    ['Landing page', lead.landingPage],
    ['Google click id', lead.gclid],
    ['Meta click id', lead.fbclid],
    ['Device', lead.device],
  ].filter(([, v]) => Boolean(v)) as [string, string][];

  return (
    <div className="mx-auto max-w-[1180px] px-8 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-3"
        onClick={() => router.push('/leads')}
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        Leads
      </Button>

      {/* Header: identity + the three things you actually do next */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="display text-[26px] font-semibold tracking-tight text-ink-100">
              {lead.name}
            </h1>
            {lead.enquiryCount > 1 && (
              <Chip className="border-warn-500/40 text-warn-400">
                {lead.enquiryCount} enquiries
              </Chip>
            )}
          </div>
          <p className="tabular mt-1 text-[13px] text-ink-400">
            {lead.phone}
            {lead.email ? ` · ${lead.email}` : ''}
            {lead.city ? ` · ${lead.city}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <a href={`tel:${lead.phone}`}>
              <PhoneIcon className="size-4" strokeWidth={1.75} />
              Call
            </a>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <a
              href={whatsappHref(
                lead.phone,
                `Hello ${lead.name}, this is Glitz Holidays regarding your Kashmir enquiry.`,
              )}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="size-4" strokeWidth={1.75} />
              WhatsApp
            </a>
          </Button>
          {lead.email && (
            <Button asChild variant="secondary" size="sm">
              <a href={`mailto:${lead.email}`}>
                <Mail className="size-4" strokeWidth={1.75} />
                Email
              </a>
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                const it = await api.post<{ id: string }>('/itineraries', {
                  leadId: lead.id,
                  title: lead.destination
                    ? `${lead.destination} itinerary`
                    : `Itinerary for ${lead.name}`,
                  totalPax:
                    (lead.adults ?? 2) + (lead.children ?? 0),
                });
                router.push(`/itineraries/${it.id}`);
              } catch (e) {
                setError(
                  e instanceof ApiError ? e.message : 'Could not create.',
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            Build itinerary
          </Button>
          <Button asChild size="sm">
            <Link href={`/quotes/new?leadId=${lead.id}`}>Build quotation</Link>
          </Button>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-loss-500/40 bg-loss-500/10 px-3 py-2 text-[13px] text-loss-400"
        >
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Left: the conversation */}
        <div className="space-y-4">
          <Panel>
            <PanelHeader>
              <PanelTitle>Log what happened</PanelTitle>
            </PanelHeader>
            <PanelBody className="space-y-3">
              <div className="flex gap-2">
                <div className="w-[150px]">
                  <Select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value)}
                    aria-label="Activity type"
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {humanise(t)}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What did they say? Dates, budget, objections — the things you will not remember next week."
              />
              <div className="flex justify-end">
                <Button onClick={logActivity} disabled={saving || !note.trim()}>
                  {saving ? 'Saving…' : 'Save entry'}
                </Button>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>History</PanelTitle>
              <span className="tabular text-[11px] text-ink-500">
                {lead.activities.length} entries
              </span>
            </PanelHeader>
            <PanelBody className="pt-1">
              <Timeline items={lead.activities} />
            </PanelBody>
          </Panel>
        </div>

        {/* Right: the facts */}
        <div className="space-y-4">
          <Panel>
            <PanelHeader>
              <PanelTitle>Stage</PanelTitle>
            </PanelHeader>
            <PanelBody className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="stage">Pipeline stage</Label>
                <Select
                  id="stage"
                  value={lead.status}
                  disabled={saving}
                  onChange={(e) => patch({ status: e.target.value })}
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {humanise(s)}
                    </option>
                  ))}
                </Select>
              </div>

              {canAssign && (
                <div className="space-y-1.5">
                  <Label htmlFor="owner">Owner</Label>
                  <Select
                    id="owner"
                    value={lead.assignedTo?.id ?? ''}
                    disabled={saving}
                    onChange={(e) =>
                      patch({ assignedToId: e.target.value || null })
                    }
                  >
                    <option value="">Unassigned</option>
                    {staff.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>The trip</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <dl className="space-y-2.5 text-[13px]">
                <Row label="Destination" value={lead.destination} />
                <Row
                  label="Travel date"
                  value={lead.travelDate ? shortDate(lead.travelDate) : null}
                />
                <Row
                  label="Nights"
                  value={lead.nights ? String(lead.nights) : null}
                />
                <Row
                  label="Party"
                  value={
                    lead.adults
                      ? `${lead.adults} adult${lead.adults === 1 ? '' : 's'}${
                          lead.children ? `, ${lead.children} child` : ''
                        }`
                      : null
                  }
                />
                <Row
                  label="Budget"
                  value={lead.budget ? money(lead.budget) : null}
                  mono
                />
              </dl>
              {lead.message && (
                <p className="mt-4 border-t border-ink-800 pt-3 text-[13px] leading-relaxed text-ink-300">
                  {lead.message}
                </p>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Score</PanelTitle>
              <ScoreMeter score={lead.score} />
            </PanelHeader>
            {lead.scoreNotes && (
              <PanelBody className="pt-3">
                <p className="text-[11px] leading-relaxed text-ink-500">
                  {lead.scoreNotes}
                </p>
              </PanelBody>
            )}
          </Panel>

          {/* This panel is why you can trace a booking back to a keyword. */}
          <Panel>
            <PanelHeader>
              <PanelTitle>Where this came from</PanelTitle>
            </PanelHeader>
            <PanelBody>
              {attribution.length === 0 ? (
                <p className="text-[12px] text-ink-500">
                  No campaign data — this lead did not arrive through a tracked link.
                </p>
              ) : (
                <dl className="space-y-2.5 text-[13px]">
                  {attribution.map(([label, value]) => (
                    <Row key={label} label={label} value={value} mono />
                  ))}
                </dl>
              )}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-[11px] uppercase tracking-[0.08em] text-ink-500">
        {label}
      </dt>
      <dd
        className={
          'min-w-0 truncate text-right text-ink-200 ' +
          (mono ? 'tabular text-[12px]' : '')
        }
        title={value ?? undefined}
      >
        {value ?? <span className="text-ink-600">—</span>}
      </dd>
    </div>
  );
}
