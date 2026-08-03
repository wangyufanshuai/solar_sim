"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrCalibrationExcitationDesignSnapshotV525,
  loadKerrCalibrationExcitationDesignSummaryV525,
  subscribeKerrCalibrationExcitationDesignV525,
} from "../lib/kerrCalibrationExcitationDesignClientV525";
import {
  compareKerrCalibrationDesignHudEncodingsV525,
  createKerrCalibrationDesignHudEncodingV525,
  resolveKerrCalibrationDesignHudProfileV525,
  type KerrCalibrationDesignHudModeV525,
} from "../lib/kerrCalibrationExcitationDesignV525";

export default function KerrCalibrationExcitationDesignV525() {
  const [mode, setMode] = useState<KerrCalibrationDesignHudModeV525>("science");
  const state = useSyncExternalStore(
    subscribeKerrCalibrationExcitationDesignV525,
    getKerrCalibrationExcitationDesignSnapshotV525,
    getKerrCalibrationExcitationDesignSnapshotV525,
  );
  useEffect(() => {
    void loadKerrCalibrationExcitationDesignSummaryV525().catch(() => undefined);
  }, []);
  const profile = resolveKerrCalibrationDesignHudProfileV525(mode);
  const summary = state.summary;
  const encoding = summary
    ? createKerrCalibrationDesignHudEncodingV525(summary, mode)
    : null;
  if (summary) {
    compareKerrCalibrationDesignHudEncodingsV525(
      createKerrCalibrationDesignHudEncodingV525(summary, "science"),
      createKerrCalibrationDesignHudEncodingV525(summary, "cinematic"),
    );
  }
  const style = {
    "--v525-panel": profile.panel,
    "--v525-raised": profile.panelRaised,
    "--v525-ink": profile.ink,
    "--v525-muted": profile.muted,
    "--v525-grid": profile.grid,
    "--v525-base": profile.base,
    "--v525-constraint": profile.constraint,
    "--v525-qualified": profile.qualified,
    "--v525-unavailable": profile.unavailable,
    "--v525-rail-opacity": profile.railOpacity,
    "--v525-node-glow": profile.nodeGlowOpacity,
  } as CSSProperties;

  return (
    <section
      style={style}
      className="relative mt-7 overflow-hidden rounded-[42px] border border-white/10 bg-[var(--v525-panel)] p-5 font-mono text-[var(--v525-ink)] shadow-[0_70px_220px_rgba(0,0,0,.8)] sm:p-8"
      data-atlas-kerr-calibration-excitation-design-v525
      data-atlas-v525-profile={profile.id}
      data-atlas-v525-mode={mode}
      data-atlas-v525-linear-display={profile.scienceBoundary.linearDisplay}
      data-atlas-v525-bloom-intensity={profile.scienceBoundary.bloomIntensity}
      data-atlas-v525-color-grade-intensity={profile.scienceBoundary.colorGradeIntensity}
      data-atlas-v525-cinematic-seed={profile.cinematicSeed ?? "none"}
      data-atlas-v525-numeric-scientific-style-input-count={profile.scienceBoundary.numericScientificStyleInputCount}
      data-atlas-v525-rank-drives-style={profile.scienceBoundary.rankDrivesStyle}
      data-atlas-v525-condition-drives-style={profile.scienceBoundary.conditionNumberDrivesStyle}
      data-atlas-v525-determinant-drives-style={profile.scienceBoundary.determinantDrivesStyle}
      data-atlas-v525-nullity-drives-style={profile.scienceBoundary.nullityDrivesStyle}
      data-atlas-v525-scientific-mutation={profile.scienceBoundary.scientificFieldMutation}
      data-atlas-v525-scientific-row-count={encoding?.rows.length ?? 0}
      data-atlas-v525-canvas-created="false"
      data-atlas-v525-scene-revision-delta="0"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[var(--v525-rail-opacity)] [background-image:linear-gradient(var(--v525-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v525-grid)_1px,transparent_1px)] [background-size:38px_38px]" />
      <header className="relative border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[9px] uppercase tracking-[.42em] text-[var(--v525-muted)]">
              V525 / minimum calibration excitation design
            </div>
            <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.035em] sm:text-5xl">
              两条差分约束关闭零空间，但不替代六份实测文件
            </h2>
          </div>
          <div className="flex border border-white/10 bg-black/20 p-1" aria-label="V7.4 calibration HUD mode">
            {(["science", "cinematic"] as const).map((candidate) => (
              <button
                key={candidate}
                type="button"
                aria-pressed={mode === candidate}
                className={mode === candidate
                  ? "bg-white/10 px-3 py-2 text-[8px] uppercase tracking-[.16em] text-white"
                  : "px-3 py-2 text-[8px] uppercase tracking-[.16em] text-white/35"}
                onClick={() => setMode(candidate)}
              >
                {candidate}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-[10px] leading-6 text-[var(--v525-muted)]">
          80 位 SVD 穷举 8 个候选标定约束的 28 个二元组合。候选集内，a000−a090 与 a045−a135 两条差分偏置约束是唯一 D-optimal 组合；它们只定义采集需求，当前没有任何实测约束值。
        </p>
      </header>

      {!summary ? (
        <div className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-4 text-[10px] text-[var(--v525-muted)]">
          {state.status === "idle" || state.status === "loading"
            ? "正在读取标定激励设计摘要…"
            : `标定设计 artifact 不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
            <Stage label="science rows" value="rank 4 / nullity 2" tone="base" />
            <Arrow />
            <Stage label="ΔQ + ΔU constraints" value="2 scalar rows / values unavailable" tone="constraint" />
            <Arrow />
            <Stage label="combined design" value="rank 6 / nullity 0" tone="qualified" />
          </div>

          <div className="relative mt-5 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="candidates" value={String(summary.counts.candidateConstraintCount)} />
            <Metric label="pairs" value={String(summary.counts.candidatePairCount)} />
            <Metric label="full rank" value={String(summary.counts.fullRankPairCount)} />
            <Metric label="condition κ" value={Number(summary.selectedDesign.conditionNumber).toFixed(6)} />
            <Metric label="det(AᵀA)" value={Number(summary.selectedDesign.gramDeterminant).toFixed(1)} />
          </div>

          <div className="relative mt-5 grid gap-4 lg:grid-cols-2">
            <article className="border border-white/10 bg-[var(--v525-raised)] p-4">
              <div className="text-[8px] uppercase tracking-[.18em] text-[var(--v525-constraint)]">
                Selected algebraic constraints
              </div>
              <div className="mt-4 space-y-2">
                {summary.selectedDesign.constraintIds.map((id) => {
                  const constraint = summary.candidateConstraints.find((entry) => entry.id === id);
                  return (
                    <div key={id} className="border-l-2 border-[var(--v525-constraint)] bg-black/15 px-3 py-3">
                      <div className="text-[10px] text-[var(--v525-ink)]">{id}</div>
                      <div className="mt-1 text-[8px] leading-4 text-[var(--v525-muted)]">{constraint?.semantics ?? "unavailable"}</div>
                      <div className="mt-2 text-[7px] uppercase tracking-[.12em] text-[var(--v525-unavailable)]">measured value unavailable</div>
                    </div>
                  );
                })}
              </div>
            </article>
            <article className="border border-white/10 bg-black/20 p-4">
              <div className="text-[8px] uppercase tracking-[.18em] text-[var(--v525-unavailable)]">
                Six-file measured acquisition boundary
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {summary.acquisitionBoundary.requiredMeasuredFileIds.map((id) => (
                  <div key={id} className="border border-white/10 bg-[var(--v525-raised)] px-3 py-2">
                    <div className="text-[8px] text-[var(--v525-muted)]">{id}</div>
                    <div className="mt-1 text-[7px] uppercase text-[var(--v525-unavailable)]">missing</div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="relative mt-5 border-l-2 border-[var(--v525-unavailable)] bg-black/20 px-4 py-4 text-[9px] leading-5 text-[var(--v525-muted)]">
            “2 constraints”是缩减线性偏置模型的最小秩条件；“6 files”是完整实测身份、几何、PSF、像元响应和 provenance 合同。两者不是同一计数，设计不能替代采集。science recovery 仍不可执行。
          </div>
          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase tracking-[.12em] text-[var(--v525-muted)]">
            <span>design qualified · constraint values unavailable · measured 0/6 · electrons 0 · dense 0/49 · browser not-run</span>
            <a className="border border-white/12 px-3 py-2 hover:border-white/25" href="/api/atlas/relativity-evidence/v525/calibration-excitation-design?download=design">
              Export full design
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Stage({ label, value, tone }: Readonly<{
  label: string;
  value: string;
  tone: "base" | "constraint" | "qualified";
}>) {
  const color = tone === "base"
    ? "var(--v525-base)"
    : tone === "constraint"
      ? "var(--v525-constraint)"
      : "var(--v525-qualified)";
  return (
    <div className="border border-white/10 bg-[var(--v525-raised)] p-4">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: color, boxShadow: `0 0 calc(24px * var(--v525-node-glow)) ${color}` }} />
        <span className="text-[8px] uppercase tracking-[.14em]" style={{ color }}>{label}</span>
      </div>
      <div className="mt-3 text-[9px] text-[var(--v525-muted)]">{value}</div>
    </div>
  );
}

function Arrow() {
  return <div className="hidden text-center text-[var(--v525-muted)] lg:block">→</div>;
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-[var(--v525-raised)] px-3 py-4 text-center">
      <div className="text-[7px] uppercase tracking-[.14em] text-[var(--v525-muted)]">{label}</div>
      <div className="mt-1 text-lg text-[var(--v525-qualified)]">{value}</div>
    </div>
  );
}
