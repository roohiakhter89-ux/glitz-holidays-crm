'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Globe,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Gauge,
  ExternalLink,
  Search,
  Filter,
  Sliders,
  Image as ImageIcon,
  UploadCloud,
  Copy,
  Check,
  Trophy,
  Layers,
  Sparkles,
  Link as LinkIcon,
  FileText,
  TrendingUp,
  Tag,
  ChevronRight,
  ShieldCheck,
  Share2,
  Newspaper,
  BookOpen,
} from 'lucide-react';
import {
  api,
  ApiError,
  type SeoSiteRow,
  type SeoAuditResponse,
  type SeoCheck,
  type SeoRankedPage,
  type SeoRankingsResponse,
  type SeoOffPageData,
  type MediaAssetRow,
  type PageManifestItem,
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

type ActiveTab = 'rankings' | 'audits' | 'media';

export default function SeoPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('rankings');
  const [sites, setSites] = useState<SeoSiteRow[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [audit, setAudit] = useState<SeoAuditResponse | null>(null);
  const [rankingsData, setRankingsData] = useState<SeoRankingsResponse | null>(null);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetRow[]>([]);
  const [websitePages, setWebsitePages] = useState<PageManifestItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [busy, setBusy] = useState<'idle' | 'audit' | 'auditPage' | 'saveOffPage' | 'uploadMedia'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals / Drawers state
  const [selectedPageForOffPage, setSelectedPageForOffPage] = useState<SeoRankedPage | null>(null);
  const [selectedPageForChecklist, setSelectedPageForChecklist] = useState<SeoRankedPage | null>(null);

  // Load sites
  const loadSites = useCallback(async () => {
    try {
      const rows = await api.get<SeoSiteRow[]>('/seo/sites');
      setSites(rows);
      setSelectedSiteId((cur) =>
        cur && rows.some((r) => r.id === cur) ? cur : (rows[0]?.id ?? null),
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load SEO sites.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load audit for selected site
  const loadAudit = useCallback(async (id: string) => {
    try {
      setAudit(await api.get<SeoAuditResponse>(`/seo/sites/${id}/audit`));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load site audit.');
    }
  }, []);

  // Load rankings for selected site
  const loadRankings = useCallback(async (id: string) => {
    setRankingsLoading(true);
    try {
      const res = await api.get<SeoRankingsResponse>(`/seo/sites/${id}/rankings`);
      setRankingsData(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load page rankings.');
    } finally {
      setRankingsLoading(false);
    }
  }, []);

  // Load media assets
  const loadMedia = useCallback(async () => {
    setMediaLoading(true);
    try {
      const [assets, pages] = await Promise.all([
        api.get<MediaAssetRow[]>('/media'),
        api.get<PageManifestItem[]>('/media/pages'),
      ]);
      setMediaAssets(assets);
      setWebsitePages(pages);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load media library.');
    } finally {
      setMediaLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  useEffect(() => {
    if (selectedSiteId) {
      loadAudit(selectedSiteId);
      loadRankings(selectedSiteId);
    }
  }, [selectedSiteId, loadAudit, loadRankings]);

  useEffect(() => {
    if (activeTab === 'media') {
      loadMedia();
    }
  }, [activeTab, loadMedia]);

  // Flash message helper
  const notifySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Run full site audit
  async function runAudit() {
    if (!selectedSiteId) return;
    setBusy('audit');
    setError(null);
    try {
      await api.post(`/seo/sites/${selectedSiteId}/audit`);
      await Promise.all([
        loadSites(),
        loadAudit(selectedSiteId),
        loadRankings(selectedSiteId),
      ]);
      notifySuccess('Full site SEO audit completed!');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Audit failed.');
    } finally {
      setBusy('idle');
    }
  }

  // Audit single page
  async function auditSinglePage(url: string, keyword?: string) {
    if (!selectedSiteId) return;
    setBusy('auditPage');
    setError(null);
    try {
      await api.post(`/seo/sites/${selectedSiteId}/audit-page`, { url, keyword });
      await Promise.all([
        loadAudit(selectedSiteId),
        loadRankings(selectedSiteId),
      ]);
      notifySuccess(`Audited page: ${url}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Single page audit failed.');
    } finally {
      setBusy('idle');
    }
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="display text-[26px] font-semibold tracking-tight text-ink-100">
              SEO Command Center
            </h1>
            <span className="rounded-full bg-signal-500/10 px-2.5 py-0.5 text-[11px] font-medium text-signal-500 border border-signal-500/20">
              270+ Pages Scored
            </span>
          </div>
          <p className="mt-1 text-[13px] text-ink-400 max-w-2xl">
            Google Algorithm quality metrics, on-page information gain checks,
            off-page authority tracking, and website media management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AddSiteDialog onCreated={(id) => { setSelectedSiteId(id); loadSites(); }} />
          {selectedSiteId && (
            <Button
              size="sm"
              onClick={runAudit}
              disabled={busy !== 'idle'}
              className="gap-1.5"
            >
              <RefreshCw
                className={`size-3.5 ${busy === 'audit' ? 'animate-spin' : ''}`}
                strokeWidth={1.75}
              />
              {busy === 'audit' ? 'Auditing…' : 'Run Full Site Audit'}
            </Button>
          )}
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-loss-500/40 bg-loss-500/10 px-4 py-3 text-[13px] text-loss-500 flex items-center justify-between"
        >
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-healthy-500/40 bg-healthy-500/10 px-4 py-3 text-[13px] text-healthy-500 flex items-center gap-2"
        >
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-12 w-full rounded-xl shimmer bg-ink-900" />
          <div className="h-64 w-full rounded-xl shimmer bg-ink-900" />
        </div>
      ) : sites.length === 0 ? (
        <Panel>
          <PanelBody className="py-16 text-center">
            <Globe aria-hidden strokeWidth={1.25} className="mx-auto size-8 text-ink-500" />
            <p className="mt-3 text-[14px] font-medium text-ink-200">No sites registered</p>
            <p className="mt-1 text-[12px] text-ink-500">
              Register the Glitz website domain to track SEO algorithm rankings.
            </p>
          </PanelBody>
        </Panel>
      ) : (
        <>
          {/* Site Selector Bar */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="text-[12px] font-medium uppercase tracking-wider text-ink-500">
              Target Domain:
            </span>
            <div className="flex flex-wrap gap-2">
              {sites.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSiteId(s.id)}
                  className={`group flex items-center gap-2.5 rounded-lg border px-3.5 py-2 text-left transition-all duration-200 ${
                    selectedSiteId === s.id
                      ? 'border-signal-500/60 bg-ink-900 text-ink-100 shadow-sm'
                      : 'border-ink-800 bg-ink-950 text-ink-400 hover:border-ink-700 hover:text-ink-200'
                  }`}
                >
                  <ScoreRing score={s.avgScore ?? 0} unknown={s.avgScore === null} size={28} stroke={3} />
                  <div>
                    <span className="text-[12.5px] font-medium">{s.name}</span>
                    <span className="ml-2 text-[10.5px] text-ink-500">({new URL(s.url).host})</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6 border-b border-ink-800/80">
            <nav className="flex space-x-6">
              <button
                onClick={() => setActiveTab('rankings')}
                className={`pb-3 text-[13.5px] font-medium transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'rankings'
                    ? 'border-signal-500 text-signal-500'
                    : 'border-transparent text-ink-400 hover:text-ink-200'
                }`}
              >
                <Trophy className="size-4" />
                Algorithm Leaderboard & Rankings
                {rankingsData?.stats.totalPages ? (
                  <span className="ml-1 rounded-full bg-ink-800 px-2 py-0.5 text-[11px] text-ink-300">
                    {rankingsData.stats.totalPages}
                  </span>
                ) : null}
              </button>

              <button
                onClick={() => setActiveTab('media')}
                className={`pb-3 text-[13.5px] font-medium transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'media'
                    ? 'border-signal-500 text-signal-500'
                    : 'border-transparent text-ink-400 hover:text-ink-200'
                }`}
              >
                <ImageIcon className="size-4" />
                Website Media Library
                {mediaAssets.length > 0 && (
                  <span className="ml-1 rounded-full bg-ink-800 px-2 py-0.5 text-[11px] text-ink-300">
                    {mediaAssets.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('audits')}
                className={`pb-3 text-[13.5px] font-medium transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'audits'
                    ? 'border-signal-500 text-signal-500'
                    : 'border-transparent text-ink-400 hover:text-ink-200'
                }`}
              >
                <Gauge className="size-4" />
                Site Health & PageSpeed
              </button>
            </nav>
          </div>

          {/* TAB 1: RANKINGS LEADERBOARD */}
          {activeTab === 'rankings' && (
            <RankingsLeaderboard
              data={rankingsData}
              loading={rankingsLoading}
              onAuditPage={auditSinglePage}
              onEditOffPage={(page) => setSelectedPageForOffPage(page)}
              onViewChecklist={(page) => setSelectedPageForChecklist(page)}
              busy={busy === 'auditPage'}
            />
          )}

          {/* TAB 2: MEDIA LIBRARY */}
          {activeTab === 'media' && (
            <MediaLibraryTab
              assets={mediaAssets}
              pages={websitePages}
              loading={mediaLoading}
              onReload={loadMedia}
              notifySuccess={notifySuccess}
            />
          )}

          {/* TAB 3: SITE HEALTH & AUDITS */}
          {activeTab === 'audits' && audit && (
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                <SitePages audit={audit} busy={busy === 'audit'} onAudit={runAudit} />
              </div>
              <div className="space-y-4">
                <TasksPanel audit={audit} />
                <ExternalIntegrations />
              </div>
            </div>
          )}
        </>
      )}

      {/* Off-Page Signals Modal / Drawer */}
      {selectedPageForOffPage && selectedSiteId && (
        <OffPageEditDialog
          page={selectedPageForOffPage}
          siteId={selectedSiteId}
          onClose={() => setSelectedPageForOffPage(null)}
          onSaved={() => {
            setSelectedPageForOffPage(null);
            loadRankings(selectedSiteId);
            notifySuccess('Off-page signals updated & score recalculated!');
          }}
        />
      )}

      {/* Page Checklist Breakdown Modal */}
      {selectedPageForChecklist && (
        <PageChecklistDialog
          page={selectedPageForChecklist}
          onClose={() => setSelectedPageForChecklist(null)}
          onAuditSingle={() => {
            auditSinglePage(selectedPageForChecklist.url, selectedPageForChecklist.targetKeyword);
            setSelectedPageForChecklist(null);
          }}
        />
      )}
    </div>
  );
}

/* ==========================================================================
 * SUB-COMPONENTS
 * ========================================================================== */

function RankingsLeaderboard({
  data,
  loading,
  onAuditPage,
  onEditOffPage,
  onViewChecklist,
  busy,
}: {
  data: SeoRankingsResponse | null;
  loading: boolean;
  onAuditPage: (url: string, keyword?: string) => void;
  onEditOffPage: (page: SeoRankedPage) => void;
  onViewChecklist: (page: SeoRankedPage) => void;
  busy: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'tier' | 'title'>('score_desc');

  const filteredPages = useMemo(() => {
    if (!data?.rankings) return [];
    let list = [...data.rankings];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.path?.toLowerCase().includes(q) ||
          p.targetKeyword?.toLowerCase().includes(q) ||
          p.family?.toLowerCase().includes(q),
      );
    }

    if (tierFilter !== 'all') {
      list = list.filter((p) => p.tier === Number(tierFilter));
    }

    if (scoreFilter === 'audited') {
      list = list.filter((p) => p.score !== null);
    } else if (scoreFilter === 'unaudited') {
      list = list.filter((p) => p.score === null);
    } else if (scoreFilter === 'high') {
      list = list.filter((p) => (p.score ?? 0) >= 80);
    } else if (scoreFilter === 'mid') {
      list = list.filter((p) => (p.score ?? 0) >= 60 && (p.score ?? 0) < 80);
    } else if (scoreFilter === 'low') {
      list = list.filter((p) => p.score !== null && (p.score ?? 0) < 60);
    } else if (scoreFilter === 'has_offpage') {
      list = list.filter((p) => p.offPage !== null);
    }

    list.sort((a, b) => {
      if (sortBy === 'score_desc') {
        if (a.score === null && b.score === null) return 0;
        if (a.score === null) return 1;
        if (b.score === null) return -1;
        return (b.score ?? 0) - (a.score ?? 0);
      }
      if (sortBy === 'score_asc') {
        if (a.score === null && b.score === null) return 0;
        if (a.score === null) return 1;
        if (b.score === null) return -1;
        return (a.score ?? 0) - (b.score ?? 0);
      }
      if (sortBy === 'tier') {
        return (a.tier ?? 99) - (b.tier ?? 99);
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

    return list;
  }, [data, searchTerm, tierFilter, scoreFilter, sortBy]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl shimmer bg-ink-900" />
          ))}
        </div>
        <div className="h-96 rounded-xl shimmer bg-ink-900" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-ink-800 bg-ink-900/60 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">Total Pages</p>
          <p className="mt-1 text-2xl font-bold text-ink-100">{data.stats.totalPages}</p>
        </div>
        <div className="rounded-xl border border-ink-800 bg-ink-900/60 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">Avg SEO Score</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold ${
              (data.stats.averageScore ?? 0) >= 80 ? 'text-healthy-500' :
              (data.stats.averageScore ?? 0) >= 60 ? 'text-warn-500' : 'text-loss-500'
            }`}>
              {data.stats.averageScore ?? '—'}
            </span>
            <span className="text-[11px] text-ink-500">/ 100</span>
          </div>
        </div>
        <div className="rounded-xl border border-ink-800 bg-ink-900/60 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">Audited</p>
          <p className="mt-1 text-2xl font-bold text-signal-500">{data.stats.auditedPages}</p>
        </div>
        <div className="rounded-xl border border-healthy-500/20 bg-healthy-500/5 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-healthy-500">High (80-100)</p>
          <p className="mt-1 text-2xl font-bold text-healthy-500">{data.stats.highScoreCount}</p>
        </div>
        <div className="rounded-xl border border-warn-500/20 bg-warn-500/5 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-warn-500">Mid (60-79)</p>
          <p className="mt-1 text-2xl font-bold text-warn-500">{data.stats.medScoreCount}</p>
        </div>
        <div className="rounded-xl border border-loss-500/20 bg-loss-500/5 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-loss-500">Needs Work (&lt;60)</p>
          <p className="mt-1 text-2xl font-bold text-loss-500">{data.stats.lowScoreCount}</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-800 bg-ink-900/80 p-3.5">
        <div className="flex flex-1 items-center gap-2.5 min-w-[260px]">
          <Search className="size-4 text-ink-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search pages by keyword, slug, title..."
            className="w-full bg-transparent text-[13px] text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-[11px] text-ink-500 hover:text-ink-300"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="rounded-lg border border-ink-700 bg-ink-950 px-2.5 py-1.5 text-ink-200 focus:border-signal-500 focus:outline-none"
          >
            <option value="all">All Tiers</option>
            <option value="0">Tier 0 (Core/Pillars)</option>
            <option value="1">Tier 1 (Origin Cities)</option>
            <option value="2">Tier 2 (Collections)</option>
            <option value="3">Tier 3 (Routes)</option>
            <option value="4">Tier 4 (Place Guides)</option>
            <option value="5">Tier 5 (Month Hubs)</option>
            <option value="6">Tier 6 (Hindi Pages)</option>
          </select>

          {/* Score Filter */}
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            className="rounded-lg border border-ink-700 bg-ink-950 px-2.5 py-1.5 text-ink-200 focus:border-signal-500 focus:outline-none"
          >
            <option value="all">All Scores</option>
            <option value="audited">Audited Only</option>
            <option value="high">Score 80+ (High)</option>
            <option value="mid">Score 60–79 (Mid)</option>
            <option value="low">Score &lt;60 (Low)</option>
            <option value="has_offpage">Has Off-Page Data</option>
            <option value="unaudited">Not Audited</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="rounded-lg border border-ink-700 bg-ink-950 px-2.5 py-1.5 text-ink-200 focus:border-signal-500 focus:outline-none"
          >
            <option value="score_desc">Highest Score First</option>
            <option value="score_asc">Lowest Score First</option>
            <option value="tier">By Manifest Tier</option>
            <option value="title">By Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Pages Leaderboard Table */}
      <div className="overflow-hidden rounded-xl border border-ink-800 bg-ink-950">
        <div className="border-b border-ink-800 bg-ink-900/90 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400 grid grid-cols-12 gap-4 items-center">
          <div className="col-span-1">Rank / Tier</div>
          <div className="col-span-5">Page & Target Intent</div>
          <div className="col-span-2 text-center">Algorithm Score</div>
          <div className="col-span-2 text-center">Off-Page Signals</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {filteredPages.length === 0 ? (
          <div className="py-16 text-center text-ink-500 text-[13px]">
            No pages match the current filter or search criteria.
          </div>
        ) : (
          <div className="divide-y divide-ink-800/60">
            {filteredPages.map((p, idx) => (
              <PageRankRow
                key={p.url}
                rank={idx + 1}
                page={p}
                onAudit={() => onAuditPage(p.url, p.targetKeyword)}
                onEditOffPage={() => onEditOffPage(p)}
                onViewChecklist={() => onViewChecklist(p)}
                busy={busy}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PageRankRow({
  rank,
  page: p,
  onAudit,
  onEditOffPage,
  onViewChecklist,
  busy,
}: {
  rank: number;
  page: SeoRankedPage;
  onAudit: () => void;
  onEditOffPage: () => void;
  onViewChecklist: () => void;
  busy: boolean;
}) {
  const scoreTone =
    p.score === null ? 'text-ink-600' :
    p.score >= 80 ? 'text-healthy-500' :
    p.score >= 60 ? 'text-warn-500' : 'text-loss-500';

  const tierBadge =
    p.tier === 0 ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
    p.tier === 1 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
    p.tier === 2 ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
    p.tier === 3 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
    p.tier === 4 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
    p.tier === 5 ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
    p.tier === 6 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
    'bg-ink-800 text-ink-400 border-ink-700';

  return (
    <div className="grid grid-cols-12 gap-4 px-4 py-3.5 items-center hover:bg-ink-900/40 transition-colors">
      {/* Col 1: Rank & Tier */}
      <div className="col-span-1 flex items-center gap-2">
        <span className="text-[12px] font-mono font-medium text-ink-400 w-5">
          #{rank}
        </span>
        {p.tier !== undefined && (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${tierBadge}`}>
            T{p.tier}
          </span>
        )}
      </div>

      {/* Col 2: Page & Target Intent */}
      <div className="col-span-5 min-w-0 pr-2">
        <div className="flex items-center gap-1.5">
          <a
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className="truncate text-[13.5px] font-medium text-ink-100 hover:text-signal-500 inline-flex items-center gap-1"
          >
            {p.title || p.path}
            <ExternalLink className="size-3 text-ink-500 shrink-0" />
          </a>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-400">
          <span className="font-mono text-ink-500">{p.path}</span>
          {p.targetKeyword && (
            <span className="rounded bg-ink-900 border border-ink-800 px-1.5 py-0.2 text-signal-500">
              🔑 {p.targetKeyword}
            </span>
          )}
        </div>
      </div>

      {/* Col 3: Algorithm Score */}
      <div className="col-span-2 flex flex-col items-center justify-center">
        {p.score !== null ? (
          <div className="flex items-center gap-2">
            <ScoreRing score={p.score} size={36} stroke={3.5} />
            <div className="text-left">
              <span className={`text-[13px] font-bold ${scoreTone}`}>{p.score}</span>
              <span className="text-[10px] text-ink-500 block">
                {p.offPage ? 'On+Off Page' : 'On-Page only'}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-[11px] text-ink-600 italic">Not audited yet</span>
        )}
      </div>

      {/* Col 4: Off-Page Signals */}
      <div className="col-span-2 text-center text-[11.5px]">
        {p.offPage ? (
          <div className="flex items-center justify-center gap-2 text-ink-300">
            <span title="Backlinks" className="flex items-center gap-0.5">
              <LinkIcon className="size-3 text-signal-500" />
              {p.offPage.backlinkCount}
            </span>
            <span title="Referring Domains" className="flex items-center gap-0.5">
              <Globe className="size-3 text-emerald-400" />
              {p.offPage.referringDomains}
            </span>
            {p.offPage.pageAuthority !== null && (
              <span title="Page Authority" className="rounded bg-ink-800 px-1 text-[10px] text-amber-400 font-mono">
                PA:{p.offPage.pageAuthority}
              </span>
            )}
            {p.offPage.prMentions > 0 && (
              <span title="PR Mentions" className="flex items-center gap-0.5 text-purple-400">
                <Newspaper className="size-3" />
                {p.offPage.prMentions}
              </span>
            )}
          </div>
        ) : (
          <button
            onClick={onEditOffPage}
            className="text-[11px] text-ink-500 hover:text-signal-500 underline"
          >
            + Add off-page
          </button>
        )}
      </div>

      {/* Col 5: Actions */}
      <div className="col-span-2 flex items-center justify-end gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          className="h-7 text-[11.5px] px-2"
          onClick={onViewChecklist}
        >
          Checklist
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-[11.5px] px-2 text-ink-400 hover:text-ink-100"
          onClick={onEditOffPage}
          title="Edit Off-page signals"
        >
          <Share2 className="size-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-[11.5px] px-2 text-ink-400 hover:text-signal-500"
          onClick={onAudit}
          disabled={busy}
          title="Re-audit page"
        >
          <RefreshCw className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ==========================================================================
 * TAB 2: MEDIA LIBRARY TAB
 * ========================================================================== */

function MediaLibraryTab({
  assets,
  pages,
  loading,
  onReload,
  notifySuccess,
}: {
  assets: MediaAssetRow[];
  pages: PageManifestItem[];
  loading: boolean;
  onReload: () => void;
  notifySuccess: (msg: string) => void;
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [filterPage, setFilterPage] = useState('all');
  const [searchTag, setSearchTag] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('altText', altText.trim());
      formData.append('caption', caption.trim());
      formData.append('pageSlug', pageSlug);
      formData.append('tags', tags);

      await api.upload<MediaAssetRow>('/media', formData);
      setUploadOpen(false);
      setFile(null);
      setAltText('');
      setCaption('');
      setPageSlug('');
      setTags('');
      onReload();
      notifySuccess('Original image uploaded and registered for website page!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
    notifySuccess('CDN image URL copied to clipboard!');
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (filterPage !== 'all' && a.pageSlug !== filterPage) return false;
      if (searchTag.trim() && !a.tags?.some((t) => t.toLowerCase().includes(searchTag.toLowerCase())) && !a.filename.toLowerCase().includes(searchTag.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [assets, filterPage, searchTag]);

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-semibold text-ink-100">Original Photography & Media Library</h2>
          <p className="text-[12.5px] text-ink-400">
            Upload genuine Kashmir photos to replace stock Unsplash imagery and fulfill Google Information Gain standards.
          </p>
        </div>

        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <UploadCloud className="size-4" />
              Upload Website Photo
            </Button>
          </DialogTrigger>
          <DialogContent
            title="Upload Website Photography"
            description="Upload authentic photos taken by the Srinagar ground team. Assign to a destination or package guide page."
          >
            <form onSubmit={handleUpload} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="photoFile">Photo File *</Label>
                <input
                  id="photoFile"
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-200 file:mr-3 file:rounded file:border-0 file:bg-signal-500/20 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-signal-400"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pageTarget">Assign to Website Page</Label>
                <select
                  id="pageTarget"
                  value={pageSlug}
                  onChange={(e) => setPageSlug(e.target.value)}
                  className="w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-100 focus:border-signal-500 focus:outline-none"
                >
                  <option value="">-- General Website Asset --</option>
                  {pages.map((p) => (
                    <option key={p.url} value={p.url}>
                      {p.url} ({p.title.slice(0, 45)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="altText">Descriptive Alt Text (For SEO & Screen Readers) *</Label>
                <Input
                  id="altText"
                  required
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="e.g. Shikara ride on Dal Lake Srinagar at sunset with snow peaks in background"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="caption">Caption (Optional)</Label>
                <Input
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Photographed by Tariq Ahmad, Glitz Holidays Srinagar"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="gulmarg, winter, gondola, hero-image"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-ink-800 pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="ghost" size="sm">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={uploading || !file || !altText.trim()}>
                  {uploading ? 'Uploading…' : 'Upload to S3 CDN'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-800 bg-ink-900/70 p-3">
        <select
          value={filterPage}
          onChange={(e) => setFilterPage(e.target.value)}
          className="rounded-lg border border-ink-700 bg-ink-950 px-3 py-1.5 text-[12.5px] text-ink-200 focus:border-signal-500 focus:outline-none max-w-xs"
        >
          <option value="all">All Assigned Pages ({assets.length})</option>
          {pages.map((p) => (
            <option key={p.url} value={p.url}>
              {p.url}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Input
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
            placeholder="Search by tag or filename..."
            className="h-8 text-[12.5px]"
          />
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-56 rounded-xl shimmer bg-ink-900" />
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <Panel>
          <PanelBody className="py-14 text-center">
            <ImageIcon className="mx-auto size-8 text-ink-500" />
            <p className="mt-3 text-[14px] font-medium text-ink-200">No photos in media library</p>
            <p className="mt-1 text-[12px] text-ink-500">
              Click &quot;Upload Website Photo&quot; to upload original photography.
            </p>
          </PanelBody>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="group overflow-hidden rounded-xl border border-ink-800 bg-ink-950 flex flex-col justify-between hover:border-ink-700 transition-all"
            >
              <div className="relative aspect-video bg-ink-900 overflow-hidden">
                <img
                  src={asset.url}
                  alt={asset.altText}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {asset.pageSlug && (
                  <span className="absolute top-2 left-2 rounded bg-ink-950/80 backdrop-blur px-2 py-0.5 text-[10px] font-mono text-signal-400 border border-ink-800">
                    {asset.pageSlug}
                  </span>
                )}
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <p className="text-[12.5px] font-medium text-ink-100 truncate" title={asset.filename}>
                    {asset.filename}
                  </p>
                  <p className="mt-1 text-[11.5px] text-ink-400 line-clamp-2 leading-relaxed" title={asset.altText}>
                    Alt: {asset.altText || <span className="text-loss-500 italic">No alt text</span>}
                  </p>
                </div>

                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {asset.tags.map((t, idx) => (
                      <span key={idx} className="rounded bg-ink-900 px-1.5 py-0.5 text-[10px] text-ink-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-ink-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-ink-500 font-mono">
                    {(asset.sizeBytes / 1024).toFixed(0)} KB
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-[11px] px-2 gap-1"
                    onClick={() => copyUrl(asset.id, asset.url)}
                  >
                    {copiedId === asset.id ? (
                      <>
                        <Check className="size-3 text-healthy-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        Copy URL
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
 * MODAL: OFF-PAGE SIGNALS EDITOR
 * ========================================================================== */

function OffPageEditDialog({
  page,
  siteId,
  onClose,
  onSaved,
}: {
  page: SeoRankedPage;
  siteId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [backlinkCount, setBacklinkCount] = useState<number>(page.offPage?.backlinkCount ?? 0);
  const [referringDomains, setReferringDomains] = useState<number>(page.offPage?.referringDomains ?? 0);
  const [pageAuthority, setPageAuthority] = useState<number | string>(page.offPage?.pageAuthority ?? '');
  const [prMentions, setPrMentions] = useState<number>(page.offPage?.prMentions ?? 0);
  const [socialShares, setSocialShares] = useState<number>(page.offPage?.socialShares ?? 0);
  const [searchConsoleCtr, setSearchConsoleCtr] = useState<number | string>(page.offPage?.searchConsoleCtr ?? '');
  const [notes, setNotes] = useState<string>(page.offPage?.notes ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/seo/sites/${siteId}/off-page`, {
        url: page.url,
        backlinkCount: Number(backlinkCount) || 0,
        referringDomains: Number(referringDomains) || 0,
        pageAuthority: pageAuthority !== '' ? Number(pageAuthority) : null,
        prMentions: Number(prMentions) || 0,
        socialShares: Number(socialShares) || 0,
        searchConsoleCtr: searchConsoleCtr !== '' ? Number(searchConsoleCtr) : null,
        notes: notes.trim() || null,
      });
      onSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save off-page signals');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        title="Off-Page SEO Signals & Backlinks"
        description={`Configure off-page ranking metrics for ${page.path}`}
      >
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="rounded-lg bg-ink-900 p-3 text-[12px] text-ink-300">
            <span className="font-semibold text-ink-100">Formula Weight:</span> Off-page signals contribute up to 30 points to the Google Algorithm score (Backlinks: 8, Referring Domains: 7, PA: 5, PR: 5, Social: 3, CTR: 2).
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="bl">Backlinks Count</Label>
              <Input
                id="bl"
                type="number"
                min="0"
                value={backlinkCount}
                onChange={(e) => setBacklinkCount(Number(e.target.value))}
              />
              <p className="text-[10.5px] text-ink-500">From Ahrefs / Search Console</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="rd">Referring Domains</Label>
              <Input
                id="rd"
                type="number"
                min="0"
                value={referringDomains}
                onChange={(e) => setReferringDomains(Number(e.target.value))}
              />
              <p className="text-[10.5px] text-ink-500">Unique referring root domains</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="pa">Page Authority (0-100)</Label>
              <Input
                id="pa"
                type="number"
                min="0"
                max="100"
                value={pageAuthority}
                onChange={(e) => setPageAuthority(e.target.value)}
                placeholder="e.g. 28"
              />
              <p className="text-[10.5px] text-ink-500">Moz PA or Ahrefs URL Rating (UR)</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="pr">PR / Press Releases</Label>
              <Input
                id="pr"
                type="number"
                min="0"
                value={prMentions}
                onChange={(e) => setPrMentions(Number(e.target.value))}
              />
              <p className="text-[10.5px] text-ink-500">Media articles citing this page</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="ss">Social Shares / Mentions</Label>
              <Input
                id="ss"
                type="number"
                min="0"
                value={socialShares}
                onChange={(e) => setSocialShares(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="ctr">GSC CTR (%)</Label>
              <Input
                id="ctr"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={searchConsoleCtr}
                onChange={(e) => setSearchConsoleCtr(e.target.value)}
                placeholder="e.g. 4.2"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">SEO Strategy Notes</Label>
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Target of Q3 Kashmir travel outreach campaign"
              className="w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:border-signal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-ink-800 pt-4">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Calculating…' : 'Save & Recalculate Score'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ==========================================================================
 * MODAL: PAGE ALGORITHM CHECKLIST
 * ========================================================================== */

function PageChecklistDialog({
  page,
  onClose,
  onAuditSingle,
}: {
  page: SeoRankedPage;
  onClose: () => void;
  onAuditSingle: () => void;
}) {
  const checks = page.checks || [];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        title={`SEO Algorithm Audit: ${page.title || page.path}`}
        description={`Target Query: "${page.targetKeyword || 'kashmir tour package'}" · Total Score: ${page.score ?? '—'}/100`}
      >
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Header score overview */}
          <div className="rounded-xl border border-ink-800 bg-ink-900 p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Composite Score</p>
              <p className="text-3xl font-bold text-ink-100">{page.score ?? '—'}<span className="text-sm font-normal text-ink-500"> / 100</span></p>
              <p className="text-[11.5px] text-ink-400 mt-1">
                {page.offPage ? 'Blended 70% On-Page + 30% Off-Page' : 'Normalized 100% On-Page'}
              </p>
            </div>
            <ScoreRing score={page.score ?? 0} size={56} stroke={5} />
          </div>

          {checks.length === 0 ? (
            <div className="py-8 text-center text-ink-500 text-[13px]">
              This page has not been audited yet.
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-[12.5px] font-semibold text-ink-200 uppercase tracking-wider">
                Google Algorithm Signals ({checks.length} Checks)
              </h3>
              <ul className="divide-y divide-ink-800/60 border border-ink-800 rounded-lg overflow-hidden bg-ink-950">
                {checks.map((c, i) => (
                  <CheckRow key={i} check={c} />
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-ink-800 pt-4">
            <Button size="sm" variant="secondary" onClick={onAuditSingle}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Re-audit This Page Now
            </Button>
            <Button type="button" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ==========================================================================
 * SHARED UI HELPERS (ScoreRing, AddSiteDialog, SitePages, TasksPanel)
 * ========================================================================== */

function ScoreRing({
  score,
  unknown,
  size = 44,
  stroke = 4,
}: {
  score: number;
  unknown?: boolean;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = unknown ? 0 : (score / 100) * c;
  const tone =
    unknown ? 'text-ink-600' :
    score >= 80 ? 'text-healthy-500' :
    score >= 60 ? 'text-warn-500' : 'text-loss-500';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="stroke-ink-800" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          className={`transition-all duration-700 ${tone}`}
          stroke="currentColor"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className={`tabular text-[10.5px] font-semibold ${tone}`}>
          {unknown ? '—' : score}
        </span>
      </div>
    </div>
  );
}

function CheckRow({ check: c }: { check: SeoCheck }) {
  const Icon = c.severity === 'pass' ? CheckCircle2 : c.severity === 'warn' ? AlertTriangle : XCircle;
  const tone =
    c.severity === 'pass' ? 'text-healthy-500' :
    c.severity === 'warn' ? 'text-warn-500' : 'text-loss-500';
  return (
    <li className="flex items-start gap-3 px-4 py-2.5">
      <Icon className={`mt-0.5 size-3.5 shrink-0 ${tone}`} strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-[12.5px] font-medium text-ink-100">
            {c.label}
          </p>
          <span className="text-[10px] text-ink-500 font-mono">
            {c.score ?? (c.severity === 'pass' ? c.weight : c.severity === 'warn' ? c.weight * 0.5 : 0)}/{c.weight} pts
          </span>
        </div>
        {c.detail && <p className="text-[11px] text-ink-400 mt-0.5">{c.detail}</p>}
        {c.task && (
          <p className="mt-1 text-[11px] leading-relaxed text-warn-500 bg-warn-500/10 rounded px-2 py-1">
            💡 {c.task}
          </p>
        )}
      </div>
    </li>
  );
}

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
      setName('');
      setUrl('');
      setPaths('');
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
        <Button size="sm" variant="secondary" className="gap-1.5">
          <Plus className="size-3.5" strokeWidth={1.75} />
          Register Site
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Register Site for SEO Audit"
        description="The homepage and manifest pages are crawled and audited against Google's search algorithms."
      >
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="sn">Name *</Label>
            <Input
              id="sn"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Glitz Holidays Website"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="su">Homepage URL *</Label>
            <Input
              id="su"
              required
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://glitzholidays.in"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sp">Additional Custom Paths (optional)</Label>
            <textarea
              id="sp"
              rows={3}
              value={paths}
              onChange={(e) => setPaths(e.target.value)}
              placeholder="/kashmir&#10;/ladakh&#10;/packages/from/delhi"
              className="w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:border-signal-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-[12px] text-loss-500">{error}</p>}

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
          Core Web Vitals & Page Audits ({audit.pages.length})
        </PanelTitle>
        <Button size="sm" onClick={onAudit} disabled={busy}>
          <RefreshCw className={`size-3.5 ${busy ? 'animate-spin' : ''}`} strokeWidth={1.75} />
          {busy ? 'Auditing…' : 'Re-audit'}
        </Button>
      </PanelHeader>

      {audit.pages.length === 0 ? (
        <PanelBody className="py-10 text-center text-ink-500 text-[13px]">
          No audit recorded yet. Click Re-audit above to crawl.
        </PanelBody>
      ) : (
        <PanelBody className="space-y-4">
          {audit.pages.map((p) => (
            <div key={p.id} className="rounded-lg border border-ink-800 bg-ink-950 p-4">
              <div className="flex items-start gap-4">
                <ScoreRing score={p.score} size={50} />
                <div className="min-w-0 flex-1">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[13px] font-medium text-ink-100 hover:text-signal-500 inline-flex items-center gap-1"
                  >
                    {new URL(p.url).pathname === '/' ? 'Homepage' : new URL(p.url).pathname}
                    <ExternalLink className="size-3 text-ink-500" />
                  </a>
                  <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                    <Sub label="Perf" value={p.perfScore} />
                    <Sub label="A11y" value={p.a11yScore} />
                    <Sub label="Best" value={p.bpScore} />
                    <Sub label="SEO" value={p.seoScore} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </PanelBody>
      )}
    </Panel>
  );
}

function Sub({ label, value }: { label: string; value: number | null }) {
  const tone =
    value === null ? 'text-ink-600' :
    value >= 80 ? 'text-healthy-500' :
    value >= 60 ? 'text-warn-500' : 'text-loss-500';
  return (
    <div className="rounded bg-ink-900/60 p-1.5">
      <p className="text-[9px] uppercase tracking-wider text-ink-500">{label}</p>
      <p className={`text-[13px] font-bold ${tone}`}>{value ?? '—'}</p>
    </div>
  );
}

function TasksPanel({ audit }: { audit: SeoAuditResponse }) {
  const tasks = audit.pages.flatMap((p) =>
    (p.tasks ?? []).map((t) => ({ ...t, url: p.url })),
  );

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Actionable Fixes ({tasks.length})</PanelTitle>
      </PanelHeader>
      {tasks.length === 0 ? (
        <PanelBody className="py-8 text-center text-[12.5px] text-ink-500">
          No critical warnings on audited pages.
        </PanelBody>
      ) : (
        <ul className="divide-y divide-ink-800/60 max-h-96 overflow-y-auto">
          {tasks.slice(0, 15).map((t, i) => (
            <li key={i} className="px-4 py-2.5 text-[12px] text-ink-300">
              <span className={`inline-block size-1.5 rounded-full mr-2 ${t.severity === 'fail' ? 'bg-loss-500' : 'bg-warn-500'}`} />
              {t.task}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ExternalIntegrations() {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>External Providers</PanelTitle>
      </PanelHeader>
      <PanelBody className="space-y-3">
        <div className="rounded-lg border border-dashed border-ink-800 p-3">
          <p className="text-[12.5px] font-medium text-ink-200">Google Search Console</p>
          <p className="text-[11px] text-ink-500">Live clicks, impressions, and CTR</p>
          <Chip className="mt-2 border-warn-500/30 text-warn-500">OAuth Ready</Chip>
        </div>
        <div className="rounded-lg border border-dashed border-ink-800 p-3">
          <p className="text-[12.5px] font-medium text-ink-200">Ahrefs / Moz Backlink API</p>
          <p className="text-[11px] text-ink-500">Automated Domain Rating & Backlink Sync</p>
          <Chip className="mt-2 border-signal-500/30 text-signal-500">Manual Entry Active</Chip>
        </div>
      </PanelBody>
    </Panel>
  );
}
