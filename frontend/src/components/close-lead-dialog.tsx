'use client';

import { useState } from 'react';
import { api, ApiError, tokenStore } from '@/lib/api';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/input';
import { Textarea } from '@/components/ui/select';

export function CloseLeadDialog({
  leadId,
  leadName,
  onClosed,
  children,
}: {
  leadId: string;
  leadName: string;
  onClosed: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const user = tokenStore.user();
  const isManager = user?.role === 'SALES_MANAGER';

  function reset() {
    setReason('');
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setError('Please provide a more detailed reason (at least 10 characters).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.post(`/leads/${leadId}/${isManager ? 'close-request' : 'close'}`, { reason: reason.trim() });
      setOpen(false);
      reset();
      onClosed();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not close the lead.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>

      <DialogContent
        title={isManager ? `Request to close ${leadName}` : `Close ${leadName}`}
        description={isManager ? "This will send a close request to the owner. Please explain why this lead should be closed." : "This will mark the lead as LOST. Please explain why this lead didn't convert."}
      >
        <form onSubmit={submit} className="p-5">
          <div className="space-y-1">
            <Label htmlFor="close-reason">Reason for closing *</Label>
            <Textarea
              id="close-reason"
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Client found a cheaper quote elsewhere, or stopped responding after 3 follow-ups."
              rows={4}
              required
            />
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-md border border-loss-500/40 bg-loss-500/10 px-3 py-2 text-[13px] text-loss-400"
            >
              {error}
            </p>
          )}

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-ink-800 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              variant="danger"
              disabled={busy || reason.trim().length < 10}
            >
              {busy ? (isManager ? 'Requesting...' : 'Closing...') : (isManager ? 'Request close' : 'Close lead')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
