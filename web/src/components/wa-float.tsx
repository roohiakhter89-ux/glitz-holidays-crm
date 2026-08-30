'use client';

import { useEffect, useState } from 'react';
import { whatsAppLink } from '@/lib/site';

const WaGlyph = ({ className = 'size-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden>
    <path d="M17.5 14.4c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.1-.3.1-.5 0-.3-.1-1.2-.4-2.2-1.3-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.3 0-.5s-.6-1.5-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.2-.9.9-.9 2.2 0 1.3.9 2.6 1.1 2.8.1.2 1.8 2.9 4.4 4 .6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2-.1-.1-.3-.2-.5-.3zM12 2C6.5 2 2 6.5 2 12c0 1.7.4 3.4 1.3 4.9L2 22l5.3-1.3c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
  </svg>
);

/**
 * Floating WhatsApp CTA. Hidden until the user scrolls past the hero so it
 * never competes with the primary above-the-fold call to action, then
 * expands its label on hover.
 */
export function WhatsAppFloat() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setShow(window.scrollY > 520);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <a
      href={whatsAppLink('a Himalayan holiday')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={[
        'group fixed bottom-5 right-5 z-50 flex items-center gap-0 overflow-hidden rounded-full bg-[#25D366] text-white shadow-lg shadow-black/25',
        'transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:gap-2 hover:pr-5 hover:shadow-xl',
        show
          ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none translate-y-6 scale-90 opacity-0',
      ].join(' ')}
    >
      <span className="grid size-14 shrink-0 place-items-center">
        <WaGlyph className="size-6 transition-transform duration-300 group-hover:scale-110" />
      </span>
      <span className="max-w-0 whitespace-nowrap text-[13.5px] font-medium opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:max-w-[160px] group-hover:opacity-100">
        Chat with us
      </span>
    </a>
  );
}
