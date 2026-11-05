"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ObservationChartSeriesV1 } from "../lib/observationPlannerV2";

const CHART_COLORS = {
  altitude: "#67e8f9",
  azimuth: "#a5b4fc",
  sun: "#fbbf24",
  moon: "#cbd5e1",
  airmass: "#fb7185",
  cloud: "#94a3b8",
} as const;

export default function ObservationPlannerChartsV266({
  series,
}: {
  series: readonly ObservationChartSeriesV1[];
}) {
  const data = series as ObservationChartSeriesV1[];
  return (
    <div className="space-y-3" data-atlas-observation-charts="v266-lazy-recharts">
      <Chart title="目标高度 / 方位" data={data} domain={[-90, 360]}>
        <Line type="monotone" dataKey="altitudeDeg" name="高度 °" stroke={CHART_COLORS.altitude} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="azimuthDeg" name="方位 °" stroke={CHART_COLORS.azimuth} dot={false} isAnimationActive={false} />
      </Chart>
      <Chart title="暗夜与月球" data={data} domain={[-90, 90]}>
        <Line type="monotone" dataKey="sunAltitudeDeg" name="太阳高度 °" stroke={CHART_COLORS.sun} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="moonAltitudeDeg" name="月球高度 °" stroke={CHART_COLORS.moon} dot={false} isAnimationActive={false} />
      </Chart>
      <Chart title="Airmass / 可选天气" data={data}>
        <Line type="monotone" dataKey="airmass" name="Airmass" stroke={CHART_COLORS.airmass} dot={false} connectNulls={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="cloudPercent" name="云量 %" stroke={CHART_COLORS.cloud} dot={false} connectNulls={false} isAnimationActive={false} />
      </Chart>
    </div>
  );
}

function Chart({
  title,
  data,
  domain,
  children,
}: {
  title: string;
  data: ObservationChartSeriesV1[];
  domain?: [number, number];
  children: React.ReactNode;
}) {
  return (
    <figure className="rounded-xl border border-white/8 bg-black/20 p-2">
      <figcaption className="mb-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">{title}</figcaption>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 2, left: -18 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.09)" vertical={false} />
            <XAxis dataKey="hourLabel" minTickGap={36} tick={{ fill: "#64748b", fontSize: 9 }} />
            <YAxis domain={domain} tick={{ fill: "#64748b", fontSize: 9 }} width={46} />
            <Tooltip contentStyle={{ background: "#05090c", border: "1px solid rgba(148,163,184,.2)", fontSize: 10 }} />
            <Legend wrapperStyle={{ fontSize: 9 }} />
            {children}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
