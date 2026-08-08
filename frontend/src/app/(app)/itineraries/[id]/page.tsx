'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileDown,
  Plus,
  Trash2,
  GripVertical,
  MapPin,
  Users2,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  api,
  ApiError,
  openBinary,
  type ItineraryDetail,
  type ItineraryDayRow,
  type ItineraryItemRow,
  type ItineraryItemKind,
} from '@/lib/api';
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Select, Textarea } from '@/components/ui/select';
import { Chip } from '@/components/ui/badge';
import { ITINERARY_ITEM_KINDS, KIND_META, humanise } from '@/lib/constants';
import { shortDate } from '@/lib/format';

/**
 * Day-by-day editor.
 *   Days list on the left (sortable), selected day's items on the right
 *   (also sortable). Cover fields (title, headline, intro, inclusions,
 *   exclusions) live in the header panel above.
 *
 * Every mutation refetches — the server is the source of truth for
 * sort orders and day numbers so a two-tab concurrent edit stays coherent.
 */
export default function ItineraryEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [it, setIt] = useState<ItineraryDetail | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<ItineraryDetail>(`/itineraries/${id}`);
      setIt(data);
      setSelectedDayId((cur) =>
        cur && data.days.some((d) => d.id === cur)
          ? cur
          : (data.days[0]?.id ?? null),
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load itinerary.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function mutate(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'That change did not save.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1180px] px-8 py-8">
        <div className="h-4 w-40 rounded shimmer" />
      </div>
    );
  }

  if (!it) {
    return (
      <div className="mx-auto max-w-[1180px] px-8 py-8">
        <Button variant="ghost" size="sm" onClick={() => router.push('/itineraries')}>
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Itineraries
        </Button>
        <Panel className="mt-4 border-loss-500/40 bg-loss-500/5">
          <PanelBody>
            <p className="text-[13px] text-ink-100">{error ?? 'Not found.'}</p>
          </PanelBody>
        </Panel>
      </div>
    );
  }

  const selectedDay = it.days.find((d) => d.id === selectedDayId) ?? null;

  return (
    <div className="mx-auto max-w-[1180px] px-8 py-8">
      <Button
        variant="ghost" size="sm" className="mb-4 -ml-3"
        onClick={() => router.push('/itineraries')}
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        Itineraries
      </Button>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="display text-[26px] font-semibold tracking-tight text-ink-100">
              {it.title}
            </h1>
            <Chip className="tabular">{it.code}</Chip>
          </div>
          <p className="mt-1 text-[13px] text-ink-400">
            for{' '}
            <Link
              href={`/leads/${it.lead.id}`}
              className="text-signal-600 transition-colors hover:text-signal-500"
            >
              {it.lead.name}
            </Link>
            <span className="tabular"> · {it.lead.phone}</span>
            {'  ·  '}
            <Users2 className="inline size-3.5" strokeWidth={1.75} /> {it.totalPax} pax
            {'  ·  '}
            {it.days.length} day{it.days.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary" size="sm" disabled={busy}
            onClick={() =>
              openBinary(
                `/itineraries/${id}/pdf`,
                `Itinerary-${it.code}.pdf`,
              ).catch((e) =>
                setError(e instanceof ApiError ? e.message : 'Download failed.'),
              )
            }
          >
            <FileDown className="size-4" strokeWidth={1.75} />
            Itinerary PDF
          </Button>
        </div>
      </header>

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-loss-500/40 bg-loss-500/10 px-3 py-2 text-[13px] text-loss-500">
          {error}
        </p>
      )}

      <CoverPanel it={it} busy={busy} onSave={(body) => mutate(() => api.patch(`/itineraries/${id}`, body))} />

      <div className="mt-4 grid gap-4 lg:grid-cols-[280px_1fr]">
        <DayList
          days={it.days}
          selectedId={selectedDayId}
          busy={busy}
          onSelect={setSelectedDayId}
          onAdd={() =>
            mutate(async () => {
              const created: any = await api.post(`/itineraries/${id}/days`, {});
              setSelectedDayId(created.id);
            })
          }
          onReorder={(ids) => mutate(() => api.post(`/itineraries/${id}/days/reorder`, { ids }))}
          onDelete={(dayId) => mutate(() => api.del(`/itineraries/days/${dayId}`))}
        />

        {selectedDay ? (
          <DayEditor
            key={selectedDay.id}
            day={selectedDay}
            busy={busy}
            onSaveDay={(body) => mutate(() => api.patch(`/itineraries/days/${selectedDay.id}`, body))}
            onAddItem={(body) => mutate(() => api.post(`/itineraries/days/${selectedDay.id}/items`, body))}
            onSaveItem={(itemId, body) => mutate(() => api.patch(`/itineraries/items/${itemId}`, body))}
            onDeleteItem={(itemId) => mutate(() => api.del(`/itineraries/items/${itemId}`))}
            onReorderItems={(ids) => mutate(() => api.post(`/itineraries/days/${selectedDay.id}/items/reorder`, { ids }))}
          />
        ) : (
          <Panel>
            <PanelBody className="py-14 text-center">
              <p className="text-[13px] text-ink-300">No days yet</p>
              <p className="mt-1 text-[12px] text-ink-500">
                Add the first day on the left to start planning.
              </p>
            </PanelBody>
          </Panel>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CoverPanel({
  it,
  busy,
  onSave,
}: {
  it: ItineraryDetail;
  busy: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [title, setTitle] = useState(it.title);
  const [headline, setHeadline] = useState(it.headline ?? '');
  const [intro, setIntro] = useState(it.intro ?? '');
  const [totalPax, setTotalPax] = useState(String(it.totalPax));
  const [inclusions, setInclusions] = useState(it.inclusions ?? '');
  const [exclusions, setExclusions] = useState(it.exclusions ?? '');
  useEffect(() => {
    setTitle(it.title);
    setHeadline(it.headline ?? '');
    setIntro(it.intro ?? '');
    setTotalPax(String(it.totalPax));
    setInclusions(it.inclusions ?? '');
    setExclusions(it.exclusions ?? '');
  }, [it]);

  const dirty =
    title !== it.title ||
    headline !== (it.headline ?? '') ||
    intro !== (it.intro ?? '') ||
    Number(totalPax) !== it.totalPax ||
    inclusions !== (it.inclusions ?? '') ||
    exclusions !== (it.exclusions ?? '');

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Cover</PanelTitle>
        {dirty && (
          <Button
            size="sm" disabled={busy}
            onClick={() =>
              onSave({
                title, headline: headline || null, intro: intro || null,
                totalPax: Number(totalPax) || 1,
                inclusions: inclusions || null, exclusions: exclusions || null,
              })
            }
          >
            Save cover
          </Button>
        )}
      </PanelHeader>
      <PanelBody className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 space-y-1">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Headline (client sees this under the title)</Label>
          <Input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="A honeymoon between Dal Lake and the Zanskar range"
          />
        </div>
        <div className="space-y-1">
          <Label>Pax</Label>
          <Input
            type="number" min={1}
            value={totalPax}
            onChange={(e) => setTotalPax(e.target.value)}
            className="text-right tabular"
          />
        </div>
        <div className="md:col-span-2 space-y-1">
          <Label>Intro paragraph</Label>
          <Textarea
            rows={3} value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="A short intro shown at the top of the itinerary."
          />
        </div>
        <div className="space-y-1">
          <Label>What&rsquo;s included (one per line)</Label>
          <Textarea
            rows={4} value={inclusions}
            onChange={(e) => setInclusions(e.target.value)}
            placeholder="Accommodation on twin-sharing&#10;Airport pickup and drop&#10;Daily breakfast"
          />
        </div>
        <div className="space-y-1">
          <Label>Not included (one per line)</Label>
          <Textarea
            rows={4} value={exclusions}
            onChange={(e) => setExclusions(e.target.value)}
            placeholder="Airfare&#10;Personal expenses&#10;GST on services"
          />
        </div>
      </PanelBody>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */

function DayList({
  days,
  selectedId,
  busy,
  onSelect,
  onAdd,
  onReorder,
  onDelete,
}: {
  days: ItineraryDayRow[];
  selectedId: string | null;
  busy: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onReorder: (ids: string[]) => void;
  onDelete: (id: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIndex = days.findIndex((d) => d.id === e.active.id);
    const newIndex = days.findIndex((d) => d.id === e.over!.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(days, oldIndex, newIndex).map((d) => d.id));
  }

  return (
    <Panel className="self-start">
      <PanelHeader>
        <PanelTitle>Days</PanelTitle>
        <Button size="sm" onClick={onAdd} disabled={busy}>
          <Plus className="size-4" strokeWidth={1.75} />
          Add
        </Button>
      </PanelHeader>

      {days.length === 0 ? (
        <PanelBody className="py-6 text-center">
          <p className="text-[12.5px] text-ink-500">No days yet.</p>
        </PanelBody>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={days.map((d) => d.id)} strategy={verticalListSortingStrategy}>
            <ul className="divide-y divide-ink-800/60">
              {days.map((d) => (
                <SortableDay
                  key={d.id}
                  day={d}
                  selected={d.id === selectedId}
                  busy={busy}
                  onSelect={() => onSelect(d.id)}
                  onDelete={() => {
                    if (confirm(`Delete Day ${d.dayNumber}?`)) onDelete(d.id);
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </Panel>
  );
}

function SortableDay({
  day,
  selected,
  busy,
  onSelect,
  onDelete,
}: {
  day: ItineraryDayRow;
  selected: boolean;
  busy: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: day.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1 px-2 py-2 transition-colors ${
        selected ? 'bg-signal-600/8' : 'hover:bg-ink-850'
      }`}
    >
      <button
        {...attributes} {...listeners}
        aria-label="Reorder day"
        className="cursor-grab touch-none p-1 text-ink-500 active:cursor-grabbing hover:text-ink-200"
      >
        <GripVertical className="size-3.5" strokeWidth={1.75} />
      </button>
      <button
        onClick={onSelect}
        className="min-w-0 flex-1 text-left"
      >
        <p className={`text-[13px] ${selected ? 'font-medium text-signal-600' : 'text-ink-100'}`}>
          Day {day.dayNumber}
          {day.city && <span className="text-ink-500"> · {day.city}</span>}
        </p>
        <p className="truncate text-[11.5px] text-ink-500">
          {day.headline ?? (day.date ? shortDate(day.date) : 'Untitled')}
          {' · '}
          {day.items.length} item{day.items.length === 1 ? '' : 's'}
        </p>
      </button>
      <button
        onClick={onDelete}
        disabled={busy}
        aria-label="Delete day"
        className="rounded p-1 text-ink-500 opacity-0 transition-[opacity,color,background-color] group-hover:opacity-100 hover:bg-ink-850 hover:text-loss-500"
      >
        <Trash2 className="size-3.5" strokeWidth={1.75} />
      </button>
    </li>
  );
}

/* ------------------------------------------------------------------ */

function DayEditor({
  day,
  busy,
  onSaveDay,
  onAddItem,
  onSaveItem,
  onDeleteItem,
  onReorderItems,
}: {
  day: ItineraryDayRow;
  busy: boolean;
  onSaveDay: (body: Record<string, unknown>) => void;
  onAddItem: (body: Record<string, unknown>) => void;
  onSaveItem: (itemId: string, body: Record<string, unknown>) => void;
  onDeleteItem: (itemId: string) => void;
  onReorderItems: (ids: string[]) => void;
}) {
  return (
    <div className="space-y-4">
      <DayHeaderPanel day={day} busy={busy} onSave={onSaveDay} />
      <ItemsPanel
        day={day}
        busy={busy}
        onAdd={onAddItem}
        onSave={onSaveItem}
        onDelete={onDeleteItem}
        onReorder={onReorderItems}
      />
    </div>
  );
}

function DayHeaderPanel({
  day,
  busy,
  onSave,
}: {
  day: ItineraryDayRow;
  busy: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [city, setCity] = useState(day.city ?? '');
  const [headline, setHeadline] = useState(day.headline ?? '');
  const [summary, setSummary] = useState(day.summary ?? '');
  const [date, setDate] = useState(day.date ? day.date.slice(0, 10) : '');
  useEffect(() => {
    setCity(day.city ?? '');
    setHeadline(day.headline ?? '');
    setSummary(day.summary ?? '');
    setDate(day.date ? day.date.slice(0, 10) : '');
  }, [day]);

  const dirty =
    city !== (day.city ?? '') ||
    headline !== (day.headline ?? '') ||
    summary !== (day.summary ?? '') ||
    date !== (day.date ? day.date.slice(0, 10) : '');

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Day {day.dayNumber}</PanelTitle>
        {dirty && (
          <Button
            size="sm" disabled={busy}
            onClick={() => onSave({
              city: city || null,
              headline: headline || null,
              summary: summary || null,
              date: date || null,
            })}
          >
            Save
          </Button>
        )}
      </PanelHeader>
      <PanelBody className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <Label>City</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Srinagar" />
        </div>
        <div className="md:col-span-2 space-y-1">
          <Label>Headline</Label>
          <Input
            value={headline} onChange={(e) => setHeadline(e.target.value)}
            placeholder="Arrival & Shikara ride on the Dal"
          />
        </div>
        <div className="space-y-1">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="md:col-span-3 space-y-1">
          <Label>Summary (optional)</Label>
          <Textarea
            rows={2} value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="A short paragraph about this day."
          />
        </div>
      </PanelBody>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */

function ItemsPanel({
  day,
  busy,
  onAdd,
  onSave,
  onDelete,
  onReorder,
}: {
  day: ItineraryDayRow;
  busy: boolean;
  onAdd: (body: Record<string, unknown>) => void;
  onSave: (itemId: string, body: Record<string, unknown>) => void;
  onDelete: (itemId: string) => void;
  onReorder: (ids: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIndex = day.items.findIndex((i) => i.id === e.active.id);
    const newIndex = day.items.findIndex((i) => i.id === e.over!.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(day.items, oldIndex, newIndex).map((i) => i.id));
  }

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Plan</PanelTitle>
        <span className="tabular text-[11px] text-ink-500">{day.items.length} item{day.items.length === 1 ? '' : 's'}</span>
      </PanelHeader>

      {day.items.length === 0 ? (
        <PanelBody className="py-6 text-center text-[12.5px] text-ink-500">
          Add the first activity below.
        </PanelBody>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={day.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="divide-y divide-ink-800/60">
              {day.items.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  busy={busy}
                  onSave={(body) => onSave(item.id, body)}
                  onDelete={() => onDelete(item.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <div className="border-t border-ink-800 p-4">
        <AddItem disabled={busy} onAdd={onAdd} />
      </div>
    </Panel>
  );
}

function SortableItem({
  item,
  busy,
  onSave,
  onDelete,
}: {
  item: ItineraryItemRow;
  busy: boolean;
  onSave: (body: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const [editing, setEditing] = useState(false);
  const kind = KIND_META[item.kind];

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-2 px-4 py-3 hover:bg-ink-850/60"
    >
      <button
        {...attributes} {...listeners}
        aria-label="Reorder item"
        className="mt-0.5 cursor-grab touch-none p-1 text-ink-500 active:cursor-grabbing hover:text-ink-200"
      >
        <GripVertical className="size-3.5" strokeWidth={1.75} />
      </button>

      <span
        className={`mt-1 rounded px-1.5 py-[3px] text-[9px] font-bold uppercase tracking-[0.09em] text-white ${kind.tone}`}
      >
        {kind.short}
      </span>

      {editing ? (
        <ItemEditor
          item={item}
          busy={busy}
          onCancel={() => setEditing(false)}
          onSave={(body) => { onSave(body); setEditing(false); }}
        />
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] text-ink-100">
              {item.time && (
                <span className="tabular mr-2 text-[11px] text-ink-500">{item.time}</span>
              )}
              {item.title}
            </p>
            {item.location && (
              <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-ink-500">
                <MapPin className="size-3" strokeWidth={1.75} /> {item.location}
              </p>
            )}
            {item.description && (
              <p className="mt-1 text-[12px] leading-relaxed text-ink-400">
                {item.description}
              </p>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="rounded px-1.5 py-1 text-[11px] text-ink-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-signal-600"
          >
            Edit
          </button>
          <button
            onClick={() => { if (confirm(`Remove "${item.title}"?`)) onDelete(); }}
            disabled={busy}
            aria-label={`Remove ${item.title}`}
            className="rounded p-1 text-ink-500 opacity-0 transition-[opacity,color,background-color] group-hover:opacity-100 hover:bg-ink-850 hover:text-loss-500"
          >
            <Trash2 className="size-3.5" strokeWidth={1.75} />
          </button>
        </>
      )}
    </li>
  );
}

function ItemEditor({
  item,
  busy,
  onCancel,
  onSave,
}: {
  item: ItineraryItemRow;
  busy: boolean;
  onCancel: () => void;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [kind, setKind] = useState<ItineraryItemKind>(item.kind);
  const [title, setTitle] = useState(item.title);
  const [time, setTime] = useState(item.time ?? '');
  const [description, setDescription] = useState(item.description ?? '');
  const [location, setLocation] = useState(item.location ?? '');

  return (
    <div className="flex-1 space-y-2">
      <div className="grid gap-2 sm:grid-cols-[112px_120px_1fr]">
        <Select value={kind} onChange={(e) => setKind(e.target.value as ItineraryItemKind)}>
          {ITINERARY_ITEM_KINDS.map((k) => (
            <option key={k} value={k}>{KIND_META[k].label}</option>
          ))}
        </Select>
        <Input
          value={time} onChange={(e) => setTime(e.target.value)}
          placeholder="09:00 or Morning"
        />
        <Input
          value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
        />
      </div>
      <Input
        value={location} onChange={(e) => setLocation(e.target.value)}
        placeholder="Location (optional)"
      />
      <Textarea
        rows={2}
        value={description} onChange={(e) => setDescription(e.target.value)}
        placeholder="Details for the client"
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button
          size="sm" disabled={busy || !title.trim()}
          onClick={() =>
            onSave({
              kind,
              title: title.trim(),
              time: time.trim() || null,
              description: description.trim() || null,
              location: location.trim() || null,
            })
          }
        >
          Save
        </Button>
      </div>
    </div>
  );
}

function AddItem({
  disabled,
  onAdd,
}: {
  disabled: boolean;
  onAdd: (body: Record<string, unknown>) => void;
}) {
  const [kind, setKind] = useState<ItineraryItemKind>('SIGHTSEEING');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');

  function submit() {
    if (!title.trim()) return;
    onAdd({
      kind,
      title: title.trim(),
      time: time.trim() || null,
    });
    setTitle('');
    setTime('');
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="w-[128px] space-y-1">
        <Label>Kind</Label>
        <Select value={kind} onChange={(e) => setKind(e.target.value as ItineraryItemKind)}>
          {ITINERARY_ITEM_KINDS.map((k) => (
            <option key={k} value={k}>{humanise(k)}</option>
          ))}
        </Select>
      </div>
      <div className="w-[120px] space-y-1">
        <Label>Time</Label>
        <Input
          value={time} onChange={(e) => setTime(e.target.value)}
          placeholder="Morning"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      <div className="min-w-[220px] flex-1 space-y-1">
        <Label>Title</Label>
        <Input
          value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Shikara ride on the Dal"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      <Button onClick={submit} disabled={disabled || !title.trim()}>
        <Plus className="size-4" strokeWidth={1.75} />
        Add item
      </Button>
    </div>
  );
}
