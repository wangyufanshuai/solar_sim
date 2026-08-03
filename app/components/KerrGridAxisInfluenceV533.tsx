"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrGridAxisInfluenceSnapshotV533,
  loadKerrGridAxisInfluenceSummaryV533,
  subscribeKerrGridAxisInfluenceV533,
} from "../lib/kerrGridAxisInfluenceClientV533";
import {
  createKerrGridAxisInfluenceHudEncodingV533,
  resolveKerrGridAxisInfluenceHudProfileV533,
  type KerrGridAxisInfluenceHudModeV533,
  type KerrGridAxisSummaryV533,
} from "../lib/kerrGridAxisInfluenceV533";
import type { KerrRegretOmissionRowV532 } from "../lib/kerrRegretJackknifeV532";

const AXIS_LABELS = Object.freeze({
  "precision-exponent": "Precision exponent",
  "cost-ratio": "Cost ratio",
  "systematic-floor": "Systematic floor",
  "fixed-overhead": "Fixed overhead",
});

function decimal(value: string, digits = 4): string {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(digits) : "unavailable";
}

function AxisTable({ title, rows }: { title: string; rows: readonly KerrGridAxisSummaryV533[] }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[var(--v533-raised)]">
      <div className="border-b border-white/10 px-4 py-3 text-[9px] uppercase tracking-[0.24em] text-[var(--v533-muted)]">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-[9px]">
          <thead className="text-[var(--v533-muted)]">
            <tr>
              <th className="px-4 py-3 font-normal">Grid axis</th>
              <th className="px-3 py-3 font-normal">levels</th>
              <th className="px-3 py-3 font-normal">min Jaccard</th>
              <th className="px-3 py-3 font-normal">min ρ abs / rel</th>
              <th className="px-3 py-3 font-normal">max Δrank abs / rel</th>
              <th className="px-3 py-3 font-normal">winner loss abs / rel</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.axis} className="border-t border-white/[0.07]">
                <td className="px-4 py-3 text-[var(--v533-ink)]">
                  {AXIS_LABELS[row.axis]}
                  {row.axis === "cost-ratio" ? (
                    <span className="ml-2 text-[7px] uppercase tracking-[0.16em] text-[var(--v533-emphasis)]">
                      multi-metric dominant
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-3">{row.omittedLevelCount}</td>
                <td className="px-3 py-3">{decimal(row.minimumParetoJaccard)}</td>
                <td className="px-3 py-3">
                  {decimal(row.minimumAbsoluteRankSpearman)} / {decimal(row.minimumRelativeRankSpearman)}
                </td>
                <td className="px-3 py-3">{row.maximumAbsoluteRankDisplacement} / {row.maximumRelativeRankDisplacement}</td>
                <td className="px-3 py-3">{row.absoluteWinnerLossCount} / {row.relativeWinnerLossCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OmissionLedger({ title, rows }: { title: string; rows: readonly KerrRegretOmissionRowV532[] }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[var(--v533-raised)] p-4">
      <div className="text-[9px] uppercase tracking-[0.24em] text-[var(--v533-muted)]">{title}</div>
      <div className="mt-3 grid gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <div key={row.omissionIndex} className="bg-[var(--v533-panel)] px-3 py-2 text-[8px] leading-4">
            <div className="text-[var(--v533-ink)]">{row.axis} · omit {row.omittedLevel}</div>
            <div className="text-[var(--v533-muted)]">
              J={decimal(row.paretoJaccardToFullGrid, 3)} · Δrank {row.maximumAbsoluteRankDisplacement}/{row.maximumRelativeRankDisplacement}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--v533-panel)] px-4 py-3">
      <div className="text-[7px] uppercase tracking-[0.2em] text-[var(--v533-muted)]">{label}</div>
      <div className="mt-2 text-sm text-[var(--v533-ink)]">{value}</div>
    </div>
  );
}

export default function KerrGridAxisInfluenceV533() {
  const [mode, setMode] = useState<KerrGridAxisInfluenceHudModeV533>("science");
  const state = useSyncExternalStore(
    subscribeKerrGridAxisInfluenceV533,
    getKerrGridAxisInfluenceSnapshotV533,
    getKerrGridAxisInfluenceSnapshotV533,
  );
  const profile = resolveKerrGridAxisInfluenceHudProfileV533(mode);
  const summary = state.summary;
  const encoding = summary ? createKerrGridAxisInfluenceHudEncodingV533(summary, mode) : null;

  useEffect(() => {
    void loadKerrGridAxisInfluenceSummaryV533().catch(() => undefined);
  }, []);

  const style = {
    "--v533-panel": profile.panel,
    "--v533-raised": profile.panelRaised,
    "--v533-ink": profile.ink,
    "--v533-muted": profile.muted,
    "--v533-grid": profile.grid,
    "--v533-emphasis": profile.emphasis,
    "--v533-neutral": profile.neutral,
    "--v533-unavailable": profile.unavailable,
  } as CSSProperties;

  return (
    <section
      style={style}
      className="relative mt-7 overflow-hidden rounded-[48px] border border-white/10 bg-[var(--v533-panel)] p-6 font-mono text-[var(--v533-ink)]"
      data-atlas-kerr-grid-axis-influence-v533
      data-atlas-v533-mode={mode}
      data-atlas-v533-scientific-geometry-input-count={encoding?.scientificGeometryInputCount ?? 0}
      data-atlas-v533-numeric-style-input-count="0"
      data-atlas-v533-canvas-created="false"
      data-atlas-v533-scene-revision-delta="0"
    >
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(var(--v533-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v533-grid)_1px,transparent_1px)] [background-size:34px_34px]" />
      <header className="relative border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[9px] uppercase tracking-[0.44em] text-[var(--v533-muted)]">
              V533 / Science Cinematic V8.2
            </div>
            <h2 className="mt-4 max-w-4xl font-serif text-4xl leading-tight">
              哪个网格轴真正驱动了稳定性坍缩？
            </h2>
          </div>
          <div className="flex rounded-full border border-white/10 p-1">
            {(["science", "cinematic"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={mode === item ? "rounded-full bg-white/10 px-3 py-2 text-[8px]" : "px-3 py-2 text-[8px] text-[var(--v533-muted)]"}
                onClick={() => setMode(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 max-w-4xl text-[10px] leading-6 text-[var(--v533-muted)]">
          8 个轴摘要、24 个有向多指标比较与 38 个确定性删层结果。成本比在两类模型中均为唯一多指标支配轴；这不是实测优先级，也不是推荐。
        </p>
      </header>

      {!summary ? (
        <div className="relative mt-6 rounded-2xl border border-white/10 p-4 text-[10px] text-[var(--v533-muted)]">
          {state.status === "unavailable" ? `unavailable · ${state.reason ?? "unknown"}` : "loading axis influence atlas…"}
        </div>
      ) : (
        <div className="relative mt-6 space-y-4">
          <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-5">
            <Metric label="axis summaries" value="8" />
            <Metric label="directed comparisons" value="24" />
            <Metric label="geometry inputs" value="46" />
            <Metric label="measured packs" value="0 / 6" />
            <Metric label="recommendation" value="unavailable" />
          </div>
          <div className="grid gap-4 2xl:grid-cols-2">
            <AxisTable title="Stochastic variance family" rows={encoding?.scientificGeometry.stochasticAxisSummaries ?? []} />
            <AxisTable title="Deterministic bound family" rows={encoding?.scientificGeometry.deterministicAxisSummaries ?? []} />
          </div>
          <div className="grid gap-4 2xl:grid-cols-2">
            <OmissionLedger title="Stochastic omission ledger" rows={encoding?.scientificGeometry.stochasticOmissionRows ?? []} />
            <OmissionLedger title="Deterministic omission ledger" rows={encoding?.scientificGeometry.deterministicOmissionRows ?? []} />
          </div>
          <div className="rounded-2xl border border-[var(--v533-unavailable)]/25 bg-[var(--v533-unavailable)]/[0.04] p-4 text-[9px] leading-5 text-[var(--v533-muted)]">
            Boundary: deterministic grid sensitivity only. No metric utility, axis prior, probability, physical cost model, measured detector response, recommended axis, recommended allocation, or science-promotion claim exists.
          </div>
        </div>
      )}
    </section>
  );
}
