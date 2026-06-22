"use client";

import { ChevronLeft, LineChart as LineChartIcon } from "lucide-react";
import { useEffect, useMemo, useState, type MutableRefObject } from "react";
import type { TelemetrySeriesState } from "../lib/telemetryTypes";
import { telemetrySamplesChronological } from "../lib/telemetryTypes";

type ScienceTelemetryPanelProps = {
  telemetrySeriesRef: MutableRefObject<TelemetrySeriesState | null>;
  selectedBodyIndex: number | null;
  relativityEnabled: boolean;
  mainSidebarOffsetPx?: number;
};

function TinyStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 font-mono text-[12px] text-slate-200">{value}</div>
    </div>
  );
}

export default function ScienceTelemetryPanel({
  telemetrySeriesRef,
  selectedBodyIndex,
  relativityEnabled,
  mainSidebarOffsetPx = 288,
}: ScienceTelemetryPanelProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (selectedBodyIndex === null) {
      setCollapsed(true);
    }
  }, [selectedBodyIndex]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 400);
    return () => window.clearInterval(id);
  }, []);

  const series = telemetrySeriesRef.current;
  const rows = useMemo(
    () => (series ? telemetrySamplesChronological(series) : []),
    [series, tick],
  );
  const latest = rows.at(-1) ?? null;

  if (collapsed) {
    return (
      <div
        className="pointer-events-auto fixed top-1/2 z-[85] -translate-y-1/2 max-sm:!left-0"
        style={{ left: mainSidebarOffsetPx }}
      >
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex h-12 w-9 items-center justify-center rounded-r-xl border border-white/8 bg-[rgba(14,14,16,0.72)] text-slate-400 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-colors hover:bg-[rgba(20,20,24,0.84)] hover:text-white/72"
          title="Open telemetry"
          aria-label="Open telemetry"
        >
          <LineChartIcon className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    );
  }

  return (
    <aside
      className="pointer-events-auto fixed top-20 z-[85] w-[min(260px,calc(100vw-2rem))] rounded-[22px] border border-white/8 bg-[rgba(12,12,14,0.76)] shadow-[0_24px_70px_rgba(0,0,0,0.38)] backdrop-blur-2xl"
      style={{ left: Math.max(16, mainSidebarOffsetPx + 16) }}
      aria-label="Telemetry"
    >
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
            Telemetry
          </div>
          <div className="mt-1 text-[12px] text-slate-300">
            {series?.bodyId ?? "No target selected"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white/6 hover:text-white/74"
          aria-label="Collapse telemetry"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="space-y-3 px-4 py-4">
        {selectedBodyIndex === null || !series || !latest ? (
          <p className="text-[12px] leading-6 text-slate-400">
            Double-click or lock a body to show an orbit telemetry snapshot here.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <TinyStat label="Sun distance" value={`${latest.sunDistanceAu.toFixed(4)} AU`} />
              <TinyStat
                label="Radial velocity"
                value={`${(latest.radialVelocityMs / 1000).toFixed(2)} km/s`}
              />
              <TinyStat
                label="Eccentricity"
                value={
                  latest.eccentricity != null ? latest.eccentricity.toFixed(5) : "--"
                }
              />
              <TinyStat
                label="Orbit period"
                value={
                  latest.orbitalPeriodDays != null
                    ? `${latest.orbitalPeriodDays.toFixed(2)} d`
                    : "--"
                }
              />
            </div>

            <div className="rounded-[18px] bg-white/[0.03] px-3 py-3 text-[11px] leading-6 text-slate-400">
              <div>Samples {rows.length}</div>
              <div>Relativity {relativityEnabled ? "On" : "Off"}</div>
              <div>
                1PN share:{" "}
                {latest.pnAccelFraction != null
                  ? latest.pnAccelFraction.toExponential(2)
                  : "--"}
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
