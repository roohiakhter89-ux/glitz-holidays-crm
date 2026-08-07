'use client';

import { useEffect, useState } from 'react';
import {
  Sun,
  Cloud,
  CloudSun,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  type LucideIcon,
} from 'lucide-react';

/**
 * Live weather for the three destinations Glitz sells. Uses Open-Meteo
 * (no API key, no auth) and picks a Lucide icon from the WMO weather code.
 *
 * If the fetch fails (offline, blocked) we show the destination card with a
 * dash — a broken widget must never crash the dashboard around it.
 */

interface Destination {
  name: string;
  region: string;
  lat: number;
  lon: number;
}

// Three cities the DMC actually runs: Kashmir, Ladakh, Himachal.
const DESTINATIONS: Destination[] = [
  { name: 'Srinagar', region: 'Kashmir', lat: 34.09, lon: 74.79 },
  { name: 'Leh',      region: 'Ladakh',  lat: 34.15, lon: 77.58 },
  { name: 'Manali',   region: 'Himachal', lat: 32.24, lon: 77.19 },
];

interface Reading {
  tempC: number | null;
  code: number | null;
  isDay: boolean;
  loading: boolean;
}

/** WMO weather code → icon + short label. Covers the codes real weather uses. */
function iconFor(code: number | null, isDay: boolean): {
  Icon: LucideIcon;
  label: string;
  tone: string;
} {
  if (code === null) return { Icon: Cloud, label: '—', tone: 'text-ink-500' };
  if (code === 0)   return { Icon: isDay ? Sun : Sun, label: 'Clear', tone: 'text-brand-500' };
  if (code <= 2)    return { Icon: CloudSun, label: 'Partly sunny', tone: 'text-brand-400' };
  if (code === 3)   return { Icon: Cloud, label: 'Overcast', tone: 'text-ink-500' };
  if (code <= 48)   return { Icon: CloudFog, label: 'Fog', tone: 'text-ink-500' };
  if (code <= 57)   return { Icon: CloudDrizzle, label: 'Drizzle', tone: 'text-signal-400' };
  if (code <= 67)   return { Icon: CloudRain, label: 'Rain', tone: 'text-signal-500' };
  if (code <= 77)   return { Icon: CloudSnow, label: 'Snow', tone: 'text-signal-300' };
  if (code <= 82)   return { Icon: CloudRain, label: 'Showers', tone: 'text-signal-500' };
  if (code <= 86)   return { Icon: CloudSnow, label: 'Snow', tone: 'text-signal-300' };
  if (code >= 95)   return { Icon: CloudLightning, label: 'Storm', tone: 'text-warn-500' };
  return { Icon: Cloud, label: '—', tone: 'text-ink-500' };
}

export function WeatherStrip() {
  const [readings, setReadings] = useState<Reading[]>(() =>
    DESTINATIONS.map(() => ({ tempC: null, code: null, isDay: true, loading: true })),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // One request per city — Open-Meteo doesn't need auth or batching.
      const results = await Promise.all(
        DESTINATIONS.map(async (d) => {
          try {
            const url =
              `https://api.open-meteo.com/v1/forecast` +
              `?latitude=${d.lat}&longitude=${d.lon}` +
              `&current=temperature_2m,weather_code,is_day`;
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) throw new Error(String(res.status));
            const j = await res.json();
            return {
              tempC: Math.round(j.current?.temperature_2m ?? 0),
              code: j.current?.weather_code ?? null,
              isDay: (j.current?.is_day ?? 1) === 1,
              loading: false,
            } as Reading;
          } catch {
            return { tempC: null, code: null, isDay: true, loading: false };
          }
        }),
      );
      if (!cancelled) setReadings(results);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex items-stretch gap-2">
      {DESTINATIONS.map((d, i) => {
        const r = readings[i];
        const { Icon, label, tone } = iconFor(r.code, r.isDay);
        return (
          <div
            key={d.name}
            className="rise flex min-w-[128px] items-center gap-3 rounded-xl border border-ink-800/60 bg-ink-900 px-3 py-2 shadow-[0_1px_2px_rgba(28,30,40,0.04)]"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <Icon
              aria-hidden
              strokeWidth={1.6}
              className={`size-6 float ${tone}`}
              style={{ animationDelay: `${i * 700}ms` }}
            />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.09em] text-ink-500">
                {d.name}
              </p>
              <p className="tabular text-[15px] font-semibold text-ink-100">
                {r.loading ? (
                  <span className="inline-block h-3 w-8 rounded shimmer align-middle" />
                ) : r.tempC === null ? (
                  <span className="text-ink-500">—</span>
                ) : (
                  <>
                    {r.tempC}
                    <span className="text-ink-500 font-normal text-[12px]">°C</span>
                  </>
                )}
              </p>
              <p className="text-[10px] text-ink-500">{label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
