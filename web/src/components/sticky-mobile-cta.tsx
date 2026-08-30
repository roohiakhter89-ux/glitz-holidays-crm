'use client';

import { Phone, MessageCircle } from 'lucide-react';
import { SITE, inr, whatsAppLink } from '@/lib/site';

type Props = {
  packageName: string;
  priceFrom: number;
};

export function StickyMobileCta({ packageName, priceFrom }: Props) {
  return (
    <div className="sticky-mobile-cta">
      <div>
        <span className="block text-[10px] uppercase tracking-wider text-paper-200/70">From</span>
        <span className="text-[15px] font-bold text-gold-300">{inr(priceFrom)}</span>
        <span className="text-[10px] text-paper-200/60"> / person</span>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={whatsAppLink(packageName)}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 rounded-xl bg-pine-600 text-paper-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
        >
          <MessageCircle className="size-3.5" /> WhatsApp
        </a>
        <a
          href="#enquiry"
          className="px-4 py-2 rounded-xl bg-gold-400 text-ink-950 text-xs font-semibold shadow-sm active:scale-95 transition-transform"
        >
          Enquire
        </a>
      </div>
    </div>
  );
}
