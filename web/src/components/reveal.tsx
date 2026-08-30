'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * One IntersectionObserver for the whole page. Mounted once in the root
 * layout; every element carrying [data-reveal] or [data-reveal-group] gets
 * a [data-visible] attribute the first time it enters the viewport, which
 * is what the CSS in globals.css transitions on.
 *
 * Elements are un-observed after firing — reveals happen once, they do not
 * replay on scroll-up. That reads as polish; replaying reads as a gimmick.
 *
 * A MutationObserver picks up nodes added after hydration (accordion bodies,
 * filtered lists) so nothing added later stays permanently invisible.
 */
export function RevealProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const SEL = '[data-reveal], [data-reveal-group]';

    // Respect the OS setting — reveal everything immediately, no observer.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      document.querySelectorAll(SEL).forEach((el) => {
        el.setAttribute('data-visible', '');
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-visible', '');
          io.unobserve(entry.target);
        }
      },
      // Fire slightly before the element is fully in view so the transition
      // is already running by the time the user's eye reaches it.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );

    const observeAll = (root: ParentNode) => {
      root.querySelectorAll(SEL).forEach((el) => {
        if (!el.hasAttribute('data-visible')) io.observe(el);
      });
    };

    observeAll(document);

    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(SEL)) io.observe(node);
          observeAll(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}

/**
 * Thin scroll-progress bar pinned to the top of the viewport. Uses
 * requestAnimationFrame-throttled scroll rather than a scroll-linked
 * animation so it works in every browser.
 */
export function ScrollProgress() {
  useEffect(() => {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = `scaleX(${pct})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]"
    >
      <div
        id="scroll-progress"
        className="scroll-bar h-full w-full"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}
