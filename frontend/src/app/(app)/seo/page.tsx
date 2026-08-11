'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Globe,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Gauge,
  ExternalLink,
} from 'lucide-react';
import {
  api,
  ApiError,
  type SeoSiteRow,
  type SeoAuditResponse,
  type SeoCheck,
} from '@/lib/api';
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Chip } from '@/components/ui/badge';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * SEO health for every registered site. Each site card shows:
 *   - Composite health score (weighted rules + PageSpeed).
 *   - Latest audit's Core Web Vitals.
 *   - Actionable tasks pulled from failed checks.
 *
 * The "connect to enable" blocks call out capabilities that need OAuth or a
 * paid data provider — kept visible so it's obvious what's inside vs outside.
 */
export default function SeoPage() {
  const [sites, setSites] = useState<SeoSiteRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [audit, setAudit] = useState<SeoAuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'idle' | 'audit' | 'save'>('idle');
  const [error, setError] = useState<string | null>(null);

  const loadSites = useCallback(async () => {
    try {
      const rows = await api.get<SeoSiteRow[]>('/seo/sites');
      setSites(rows);
      setSelected((cur) =>
        cur && rows.some((r) => r.id === cur) ? cur : (rows[0]?.id ?? null),
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load sites.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAudit = useCallback(async (id: string) => {
    try {
      setAudit(await api.get<SeoAuditResponse>(`/seo/sites/${id}/audit`));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load audit.');
    }
  }, []);

  useEffect(() => { loadSites(); }, [loadSites]);
  useEffect(() => { if (selected) loadAudit(selected); }, [selected, loadAudit]);

  async function runAudit() {
    if (!selected) return;
    setBusy('audit');
    setError(null);
    try {
      await api.post(`/seo/sites/${selected}/audit`);
      await Promise.all([loadSites(), loadAudit(selected)]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Audit failed.');
    } finally {
      setBusy('idle');
    }
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[26px] font-semibold tracking-tight text-ink-100">
            SEO
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-400">
            On-page audit + PageSpeed. Backlinks & rankings need a paid data
            provider — flagged below.
          </p>
        </div>
        <AddSiteDialog onCreated={(id) => { setSelected(id); loadSites(); }} />
      </header>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-loss-500/40 bg-loss-500/10 px-3 py-2 text-[13px] text-loss-500"
        >
          {error}
        </p>
      )}

      {loading ? (
        <div className="h-4 w-40 rounded shimmer" />
      ) : sites.length === 0 ? (
        <Panel>
          <PanelBody className="py-14 text-center">
            <Globe
              aria-hidden strokeWidth={1.25}
              className="mx-auto size-6 text-ink-500"
            />
            <p className="mt-3 text-[13px] text-ink-300">No sites registered</p>
            <p className="mt-1 text-[12px] text-ink-500">
              Register a homepage above to start auditing.
            </p>
          </PanelBody>
        </Panel>
      ) : (
        <>
          {/* Site chips */}
          <div className="mb-4 flex flex-wrap gap-2">
            {sites.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`group flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                  selected === s.id
                    ? 'border-signal-500/60 bg-ink-900 shadow-[0_2px_10px_-4px_rgba(11,74,90,0.2)]'
                    : 'border-ink-800 bg-ink-900/80 hover:-translate-y-px hover:border-ink-700'
                }`}
              >
                <ScoreRing score={s.avgScore ?? 0} unknown={s.avgScore === null} />
                <div>
                  <p className="text-[13px] font-medium text-ink-100">{s.name}</p>
                  <p className="tabular text-[10.5px] text-ink-500">
                    {new URL(s.url).host}
                    {s.pageCount > 0 && ` · ${s.pageCount} page${s.pageCount === 1 ? '' : 's'}`}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {audit && (
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <SitePages
                  audit={audit}
                  busy={busy === 'audit'}
                  onAudit={runAudit}
                />
              </div>
              <div className="space-y-4">
                <TasksPanel audit={audit} />
                <ExternalIntegrations />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AddSiteDialog({ onCreated }: { onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [paths, setPaths] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const crawlPaths = paths
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await api.post<{ id: string }>('/seo/sites', {
        name: name.trim(),
        url: url.trim(),
        crawlPaths,
      });
      setOpen(false);
      setName(''); setUrl(''); setPaths('');
      onCreated(res.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" strokeWidth={1.75} />
          Register site
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Register site"
        description="The homepage is always audited. Add extra paths (one per line) for landing pages you also want to track."
      >
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="sn">Name *</Label>
            <Input
              id="sn" autoFocus required
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Glitz main site"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="su">Homepage URL *</Label>
            <Input
              id="su" required type="url"
              value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://glitzholidays.in"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sp">Extra paths (optional)</Label>
            <textarea
              id="sp" rows={3}
              value={paths}
              onChange={(e) => setPaths(e.target.value)}
              placeholder="/kashmir&#10;/ladakh&#10;/kashmir-honeymoon"
              className="w-full rounded-md border border-ink-700 bg-ink-950/60 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:border-signal-500 focus:outline-none"
            />
            <p className="text-[11px] text-ink-500">
              One per line. Relative to the homepage.
            </p>
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-loss-500/40 bg-loss-500/10 px-3 py-2 text-[13px] text-loss-500">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-ink-800 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={busy || !name.trim() || !url.trim()}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ScoreRing({ score, unknown, size = 44 }: { score: number; unknown?: boolean; size?: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = unknown ? 0 : (score / 100) * c;
  const tone =
    unknown ? 'text-ink-600' :
    score >= 80 ? 'text-healthy-500' :
    score >= 60 ? 'text-warn-500' :
    'text-loss-500';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} strokeWidth={stroke} className="stroke-ink-800" fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r} strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          className={`transition-all duration-700 ${tone}`}
          stroke="currentColor" fill="none"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className={`tabular text-[11px] font-semibold ${tone}`}>
          {unknown ? '—' : score}
        </span>
      </div>
    </div>
  );
}

function SitePages({
  audit,
  busy,
  onAudit,
}: {
  audit: SeoAuditResponse;
  busy: boolean;
  onAudit: () => void;
}) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle className="flex items-center gap-2">
          <Gauge className="size-3.5" strokeWidth={1.75} />
          Audit
        </PanelTitle>
        <Button size="sm" onClick={onAudit} disabled={busy}>
          <RefreshCw
            className={`size-4 ${busy ? 'animate-spin' : ''}`}
            strokeWidth={1.75}
          />
          {busy ? 'Running…' : 'Re-audit'}
        </Button>
      </PanelHeader>

      {audit.pages.length === 0 ? (
        <PanelBody className="py-10 text-center">
          <p className="text-[13px] text-ink-300">No audit yet</p>
          <p className="mt-1 text-[12px] text-ink-500">
            Click Re-audit to run PageSpeed + on-page checks.
          </p>
        </PanelBody>
      ) : (
        <PanelBody className="space-y-4">
          {audit.pages.map((p) => (
            <PageCard key={p.id} page={p} />
          ))}
        </PanelBody>
      )}
    </Panel>
  );
}

function PageCard({ page: p }: { page: SeoAuditResponse['pages'][number] }) {
  const [expanded, setExpanded] = useState(false);
  const checks = p.checks?.results ?? [];

  return (
    <div className="rounded-lg border border-ink-800 bg-ink-950">
      <div className="flex items-start gap-4 p-4">
        <ScoreRing score={p.score} size={56} />
        <div className="min-w-0 flex-1">
          <a
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-1 text-[13.5px] font-medium text-ink-100 hover:text-signal-600"
          >
            {new URL(p.url).pathname === '/' ? 'Homepage' : new URL(p.url).pathname}
            <ExternalLink className="size-3 text-ink-500 group-hover:text-signal-500" strokeWidth={1.75} />
          </a>
          <p className="tabular mt-0.5 text-[11px] text-ink-500">
            {new URL(p.url).host}
          </p>

          {p.errors && (
            <p className="mt-2 text-[11px] text-loss-500">{p.errors}</p>
          )}

          <div className="mt-3 grid grid-cols-4 gap-3">
            <Sub label="Perf" value={p.perfScore} />
            <Sub label="A11y" value={p.a11yScore} />
            <Sub label="Best" value={p.bpScore} />
            <Sub label="SEO"  value={p.seoScore} />
          </div>

          {(p.lcpMs || p.clsX1k || p.inpMs) && (
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-ink-500">
              {p.lcpMs !== null && p.lcpMs !== undefined && (
                <span>LCP <span className={p.lcpMs < 2500 ? 'text-healthy-500' : p.lcpMs < 4000 ? 'text-warn-500' : 'text-loss-500'}>
                  {(p.lcpMs / 1000).toFixed(1)}s
                </span></span>
              )}
              {p.clsX1k !== null && p.clsX1k !== undefined && (
                <span>CLS <span className={p.clsX1k < 100 ? 'text-healthy-500' : p.clsX1k < 250 ? 'text-warn-500' : 'text-loss-500'}>
                  {(p.clsX1k / 1000).toFixed(2)}
                </span></span>
              )}
              {p.inpMs !== null && p.inpMs !== undefined && (
                <span>INP <span className={p.inpMs < 200 ? 'text-healthy-500' : p.inpMs < 500 ? 'text-warn-500' : 'text-loss-500'}>
                  {p.inpMs}ms
                </span></span>
              )}
            </div>
          )}
        </div>
      </div>

      {checks.length > 0 && (
        <div className="border-t border-ink-800">
          <button
            onClick={() => setExpanded((x) => !x)}
            className="flex w-full items-center justify-between px-4 py-2 text-[12px] text-ink-400 hover:text-ink-100"
          >
            <span>
              {checks.filter((c) => c.severity === 'pass').length} pass ·
              {' '}{checks.filter((c) => c.severity === 'warn').length} warn ·
              {' '}{checks.filter((c) => c.severity === 'fail').length} fail
            </span>
            <span className="text-[11px]">{expanded ? 'Hide' : 'Show all'}</span>
          </button>
          {expanded && (
            <ul className="divide-y divide-ink-800/60 border-t border-ink-800/60">
              {checks.map((c) => (
                <CheckRow key={c.id} check={c} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function CheckRow({ check: c }: { check: SeoCheck }) {
  const Icon = c.severity === 'pass' ? CheckCircle2 : c.severity === 'warn' ? AlertTriangle : XCircle;
  const tone =
    c.severity === 'pass' ? 'text-healthy-500' :
    c.severity === 'warn' ? 'text-warn-500' :
    'text-loss-500';
  return (
    <li className="flex items-start gap-3 px-4 py-2.5">
      <Icon className={`mt-0.5 size-3.5 shrink-0 ${tone}`} strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] text-ink-100">
          {c.label}
          {c.detail && <span className="ml-2 text-[11px] text-ink-500">{c.detail}</span>}
        </p>
        {c.task && (
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-400">
            {c.task}
          </p>
        )}
      </div>
    </li>
  );
}

function Sub({ label, value }: { label: string; value: number | null }) {
  const tone =
    value === null ? 'text-ink-600' :
    value >= 80 ? 'text-healthy-500' :
    value >= 60 ? 'text-warn-500' :
    'text-loss-500';
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.09em] text-ink-500">{label}</p>
      <p className={`tabular text-[15px] font-semibold ${tone}`}>
        {value === null ? '—' : value}
      </p>
    </div>
  );
}

function TasksPanel({ audit }: { audit: SeoAuditResponse }) {
  const tasks = audit.pages.flatMap((p) =>
    (p.tasks ?? []).map((t) => ({ ...t, url: p.url })),
  );
  // Fails first, then warns.
  tasks.sort((a, b) => (a.severity === 'fail' ? -1 : 1) - (b.severity === 'fail' ? -1 : 1));

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Today&rsquo;s tasks</PanelTitle>
        <span className="tabular text-[11px] text-ink-500">{tasks.length}</span>
      </PanelHeader>
      {tasks.length === 0 ? (
        <PanelBody className="py-8 text-center text-[12.5px] text-ink-500">
          Nothing failing. Re-audit after any content update.
        </PanelBody>
      ) : (
        <ul className="divide-y divide-ink-800/60">
          {tasks.slice(0, 12).map((t, i) => (
            <li key={i} className="px-5 py-2.5">
              <div className="flex items-start gap-2">
                <span
                  aria-hidden
                  className={`mt-1 size-1.5 shrink-0 rounded-full ${
                    t.severity === 'fail' ? 'bg-loss-500' : 'bg-warn-500'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-[12.5px] leading-snug text-ink-200">
                    {t.task}
                  </p>
                </div>
              </div>
            </li>
          ))}
          {tasks.length > 12 && (
            <li className="px-5 py-2 text-center text-[11px] text-ink-500">
              +{tasks.length - 12} more — expand each page above to see them all.
            </li>
          )}
        </ul>
      )}
    </Panel>
  );
}

function ExternalIntegrations() {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Extend with</PanelTitle>
      </PanelHeader>
      <PanelBody className="space-y-3">
        <IntegrationRow
          name="Search Console"
          detail="Clicks, impressions, keyword positions"
          status="Needs Google OAuth"
        />
        <IntegrationRow
          name="Domain Authority"
          detail="DA, PA, backlink count"
          status="Needs Moz or DataForSEO"
        />
        <IntegrationRow
          name="Backlink profile"
          detail="Referring domains, anchor mix"
          status="Needs Ahrefs or DataForSEO"
        />
      </PanelBody>
    </Panel>
  );
}

function IntegrationRow({
  name, detail, status,
}: {
  name: string; detail: string; status: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-ink-800 p-3">
      <p className="text-[13px] font-medium text-ink-200">{name}</p>
      <p className="text-[11px] text-ink-500">{detail}</p>
      <Chip className="mt-2 border-warn-500/30 text-warn-500">{status}</Chip>
    </div>
  );
}
