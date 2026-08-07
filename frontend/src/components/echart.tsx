'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

/**
 * Thin ECharts wrapper. Deliberately not using `echarts-for-react` — that
 * package lags on React peer versions and this is 30 lines.
 */
export function EChart({
  option,
  height = 260,
  className,
}: {
  option: echarts.EChartsOption;
  height?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chart.current = echarts.init(ref.current, undefined, { renderer: 'canvas' });

    const onResize = () => chart.current?.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      chart.current?.dispose();
      chart.current = null;
    };
  }, []);

  useEffect(() => {
    chart.current?.setOption(option, true);
  }, [option]);

  return <div ref={ref} style={{ height }} className={className} />;
}

/** Shared axis/tooltip styling so every chart in the product matches. */
export const chartBase: Pick<
  echarts.EChartsOption,
  'grid' | 'textStyle' | 'tooltip'
> = {
  grid: { left: 8, right: 12, top: 16, bottom: 4, containLabel: true },
  textStyle: { fontFamily: 'var(--font-geist-mono), monospace', fontSize: 11 },
  tooltip: {
    backgroundColor: '#171b22',
    borderColor: '#333b4a',
    borderWidth: 1,
    textStyle: { color: '#dfe3ea', fontSize: 12 },
    padding: [8, 10],
  },
};

export const axisStyle = {
  axisLine: { lineStyle: { color: '#262c38' } },
  axisTick: { show: false },
  axisLabel: { color: '#6b7688', fontSize: 10 },
  splitLine: { lineStyle: { color: '#1c212a' } },
};
