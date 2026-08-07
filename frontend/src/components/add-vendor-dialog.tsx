'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Select, Textarea } from '@/components/ui/select';
import { VENDOR_TYPES, humanise } from '@/lib/constants';

/**
 * New supplier. Contact + bank fields are collected here because they're
 * write-once (once entered, only the owner sees them); rates get added on
 * the detail page where a live table is easier.
 */
export function AddVendorDialog({
  onCreated,
}: {
  onCreated: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<string>('HOTEL');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [starRating, setStarRating] = useState('');
  const [gstin, setGstin] = useState('');
  const [notes, setNotes] = useState('');

  function reset() {
    setName(''); setType('HOTEL'); setCity(''); setArea('');
    setContactPerson(''); setPhone(''); setEmail('');
    setStarRating(''); setGstin(''); setNotes('');
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !type) return;
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        type,
      };
      if (city.trim()) body.city = city.trim();
      if (area.trim()) body.area = area.trim();
      if (contactPerson.trim()) body.contactPerson = contactPerson.trim();
      if (phone.trim()) body.phone = phone.trim();
      if (email.trim()) body.email = email.trim();
      if (starRating) body.starRating = Number(starRating);
      if (gstin.trim()) body.gstin = gstin.trim();
      if (notes.trim()) body.notes = notes.trim();

      const res = await api.post<{ id: string }>('/vendors', body);
      setOpen(false);
      reset();
      onCreated(res.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" strokeWidth={1.75} />
          Add supplier
        </Button>
      </DialogTrigger>

      <DialogContent
        title="Add supplier"
        description="Add rates on the detail page once the vendor is saved. Bank details, GST and notes can be filled in later too."
      >
        <form onSubmit={submit} className="max-h-[70vh] overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="v-name">Name *</Label>
              <Input
                id="v-name" autoFocus required
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Hotel Grand Mumtaz"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="v-type">Type *</Label>
              <Select
                id="v-type" value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {VENDOR_TYPES.map((t) => (
                  <option key={t} value={t}>{humanise(t)}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="v-star">Star rating</Label>
              <Input
                id="v-star" type="number" min={1} max={7}
                value={starRating} onChange={(e) => setStarRating(e.target.value)}
                placeholder="3, 4, 5…"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="v-city">City</Label>
              <Input
                id="v-city" value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Srinagar"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="v-area">Area</Label>
              <Input
                id="v-area" value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Dal Gate, Boulevard…"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="v-cp">Contact person</Label>
              <Input
                id="v-cp" value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Mr Farooq"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="v-phone">Phone</Label>
              <Input
                id="v-phone" type="tel"
                value={phone} onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="v-email">Email</Label>
              <Input
                id="v-email" type="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="v-gst">GSTIN</Label>
              <Input
                id="v-gst" value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="v-notes">Notes</Label>
              <Textarea
                id="v-notes" rows={2}
                value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Union zone quirks, payment terms, anything internal"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-md border border-loss-500/40 bg-loss-500/10 px-3 py-2 text-[13px] text-loss-500">
              {error}
            </p>
          )}

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-ink-800 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={busy || !name.trim() || !type}>
              {busy ? 'Saving…' : 'Save & continue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
