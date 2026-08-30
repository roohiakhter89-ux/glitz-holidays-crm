/**
 * Brand mark, drawn inline as SVG rather than imported as a raster.
 * Echoes the Glitz logo — gold sun disc, pine ridge, a lone figure on the
 * crest. Retints instantly from the two props, stays crisp at any size, and
 * costs about 1KB instead of a network request.
 *
 * Drop-in replacement: when the real logo file lands in /public, swap the
 * <Mark> body for <Image src="/logo.svg" …> and leave everything else.
 */
export function Mark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      {/* sun disc */}
      <circle cx="34" cy="26" r="15" fill="var(--color-gold-400)" />
      {/* far ridge */}
      <path
        d="M4 47c6-9 11-14 16-14s8 4 12 9 7 6 11 3 9-8 17-11v13H4Z"
        fill="var(--color-pine-600)"
        opacity="0.55"
      />
      {/* near ridge */}
      <path
        d="M2 50c8-6 14-10 20-10 5 0 9 3 14 7 4 4 9 4 14 1 4-2 8-5 12-6v8H2Z"
        fill="var(--color-pine-700)"
      />
      {/* pines */}
      <path d="M13 44l3-8 3 8h-6ZM12.5 48l3.5-7 3.5 7h-7Z" fill="var(--color-pine-800)" />
      {/* figure on the crest */}
      <circle cx="34" cy="27" r="2.1" fill="var(--color-pine-900)" />
      <path
        d="M34 29.4v6m0-4.2 3 2m-3-2-3 1.8M34 35.4l2.4 5m-2.4-5-2.6 5"
        stroke="var(--color-pine-900)"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
      {/* trekking pole */}
      <path
        d="M38.6 28.6v12"
        stroke="var(--color-pine-900)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({
  light = false,
  className = '',
}: {
  light?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Mark className="size-9 shrink-0" />
      <span className="flex flex-col leading-none">
        <span
          className="text-[19px] font-bold tracking-tight"
          style={{ color: 'var(--color-gold-500)' }}
        >
          GLITZ
        </span>
        <span
          className="text-[10.5px] font-semibold tracking-[0.22em]"
          style={{
            color: light ? 'var(--color-paper-200)' : 'var(--color-pine-700)',
          }}
        >
          HOLIDAYS
        </span>
      </span>
    </span>
  );
}
