"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import {
  getKerrAnalyzerIdentifiabilitySnapshotV524,
  loadKerrAnalyzerIdentifiabilitySummaryV524,
  subscribeKerrAnalyzerIdentifiabilityV524,
} from "../lib/kerrAnalyzerIdentifiabilityClientV524";
import {
  compareKerrInstrumentHudEncodingsV524,
  createKerrInstrumentHudEncodingV524,
  resolveKerrInstrumentHudProfileV524,
  type KerrAnalyzerDiagnosticV524,
  type KerrInstrumentHudModeV524,
} from "../lib/kerrAnalyzerIdentifiabilityV524";

export default function KerrAnalyzerIdentifiabilityV524() {
  const [mode, setMode] = useState<KerrInstrumentHudModeV524>("science");
  const state = useSyncExternalStore(
    subscribeKerrAnalyzerIdentifiabilityV524,
    getKerrAnalyzerIdentifiabilitySnapshotV524,
    getKerrAnalyzerIdentifiabilitySnapshotV524,
  );
  useEffect(() => {
    void loadKerrAnalyzerIdentifiabilitySummaryV524().catch(() => undefined);
  }, []);
  const profile = resolveKerrInstrumentHudProfileV524(mode);
  const summary = state.summary;
  const encoding = summary
    ? createKerrInstrumentHudEncodingV524(summary, mode)
    : null;
  if (summary) {
    compareKerrInstrumentHudEncodingsV524(
      createKerrInstrumentHudEncodingV524(summary, "science"),
      createKerrInstrumentHudEncodingV524(summary, "cinematic"),
    );
  }
  const style = {
    "--v524-panel": profile.panel,
    "--v524-raised": profile.panelRaised,
    "--v524-ink": profile.ink,
    "--v524-muted": profile.muted,
    "--v524-grid": profile.grid,
    "--v524-identifiable": profile.identifiable,
    "--v524-nullspace": profile.nullspace,
    "--v524-blocked": profile.blocked,
    "--v524-rail-opacity": profile.railOpacity,
    "--v524-node-glow": profile.nodeGlowOpacity,
  } as CSSProperties;

  return (
    <section
      style={style}
      className="relative mt-7 overflow-hidden rounded-[40px] border border-white/10 bg-[var(--v524-panel)] p-5 font-mono text-[var(--v524-ink)] shadow-[0_70px_220px_rgba(0,0,0,.78)] sm:p-8"
      data-atlas-kerr-analyzer-identifiability-v524
      data-atlas-v524-profile={profile.id}
      data-atlas-v524-mode={mode}
      data-atlas-v524-linear-display={profile.scienceBoundary.linearDisplay}
      data-atlas-v524-bloom-intensity={profile.scienceBoundary.bloomIntensity}
      data-atlas-v524-color-grade-intensity={profile.scienceBoundary.colorGradeIntensity}
      data-atlas-v524-cinematic-seed={profile.cinematicSeed ?? "none"}
      data-atlas-v524-numeric-scientific-style-input-count={profile.scienceBoundary.numericScientificStyleInputCount}
      data-atlas-v524-rank-drives-style={profile.scienceBoundary.rankDrivesStyle}
      data-atlas-v524-condition-drives-style={profile.scienceBoundary.conditionNumberDrivesStyle}
      data-atlas-v524-nullity-drives-style={profile.scienceBoundary.nullityDrivesStyle}
      data-atlas-v524-scientific-mutation={profile.scienceBoundary.scientificFieldMutation}
      data-atlas-v524-scientific-row-count={encoding?.rows.length ?? 0}
      data-atlas-v524-canvas-created="false"
      data-atlas-v524-scene-revision-delta="0"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[var(--v524-rail-opacity)] [background-image:linear-gradient(var(--v524-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v524-grid)_1px,transparent_1px)] [background-size:36px_36px]" />
      <header className="relative border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[9px] uppercase tracking-[.42em] text-[var(--v524-muted)]">
              V524 / analyzer rank · SVD · calibration nullspace
            </div>
            <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.035em] sm:text-5xl">
              理想偏振可辨识，实测标定仍缺两维约束
            </h2>
          </div>
          <div className="flex border border-white/10 bg-black/20 p-1" aria-label="V7.3 instrument HUD mode">
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
        <p className="mt-4 max-w-3xl text-[10px] leading-6 text-[var(--v524-muted)]">
          80 位 SVD 与解析 Gram oracle 验证理想双束和归一化差分算子；加入四路未知偏置后，联合科学量与标定参数出现二维零空间。Science 与 Cinematic 只改变 V7.3 显示 token，矩阵、秩、条件数和零空间逐项保持相同。
        </p>
      </header>

      {!summary ? (
        <div className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-4 text-[10px] text-[var(--v524-muted)]">
          {state.status === "idle" || state.status === "loading"
            ? "正在读取分析器可辨识性摘要…"
            : `可辨识性 artifact 不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-3 lg:grid-cols-3">
            <MatrixCard
              title="Ideal dual beam · 8×3"
              diagnostic={summary.diagnostics.idealDualBeam8x3}
              tone="identifiable"
              verdict="I/Q/U identifiable"
            />
            <MatrixCard
              title="Normalized difference · 4×2"
              diagnostic={summary.diagnostics.normalizedDifference4x2}
              tone="identifiable"
              verdict="Q/I and U/I identifiable"
            />
            <MatrixCard
              title="Unknown channel bias · 4×6"
              diagnostic={summary.diagnostics.uncalibratedBiasAugmented4x6}
              tone="nullspace"
              verdict="joint model not identifiable"
            />
          </div>

          <div className="relative mt-5 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
            <div className="border border-white/10 bg-[var(--v524-raised)] p-4">
              <div className="text-[8px] uppercase tracking-[.2em] text-[var(--v524-nullspace)]">
                Calibration nullspace · dimension 2
              </div>
              <div className="mt-4 space-y-3">
                {summary.nullspace.interpretation.map((statement, index) => (
                  <div key={statement} className="border-l-2 border-[var(--v524-nullspace)] bg-black/15 px-3 py-2 text-[9px] leading-5 text-[var(--v524-muted)]">
                    N{index + 1} · {statement}
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto border border-white/10 bg-black/20 p-4">
              <div className="grid min-w-[520px] grid-cols-[1.3fr_1fr_1fr] gap-px bg-white/10 text-[8px]">
                <Cell value="parameter" header />
                <Cell value="basis N1" header />
                <Cell value="basis N2" header />
                {summary.nullspace.parameterLabels.flatMap((label, rowIndex) => [
                  <Cell key={`${label}-label`} value={label} />,
                  <Cell key={`${label}-n1`} value={compact(summary.nullspace.basis[rowIndex]?.[0])} />,
                  <Cell key={`${label}-n2`} value={compact(summary.nullspace.basis[rowIndex]?.[1])} />,
                ])}
              </div>
            </div>
          </div>

          <div className="relative mt-5 border-l-2 border-[var(--v524-blocked)] bg-black/20 px-4 py-4 text-[9px] leading-5 text-[var(--v524-muted)]">
            实测 Mueller 标定 0/6；expected electrons、observed counts 与 science raster 均不可用。本页只证明理想算子秩和校准退化结构，不签发实测仪器资格。
          </div>
          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase tracking-[.12em] text-[var(--v524-muted)]">
            <span>matrix 3 · SVD 3 · singular values 9 · measured calibration 0/6 · dense 0/49 · browser not-run</span>
            <a
              className="border border-white/12 px-3 py-2 hover:border-white/25"
              href="/api/atlas/relativity-evidence/v524/analyzer-identifiability?download=identifiability"
            >
              Export identifiability artifact
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function MatrixCard({
  title,
  diagnostic,
  tone,
  verdict,
}: Readonly<{
  title: string;
  diagnostic: KerrAnalyzerDiagnosticV524;
  tone: "identifiable" | "nullspace";
  verdict: string;
}>) {
  const accent = tone === "identifiable" ? "var(--v524-identifiable)" : "var(--v524-nullspace)";
  return (
    <article className="border border-white/10 bg-[var(--v524-raised)] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[8px] uppercase tracking-[.12em] text-[var(--v524-muted)]">{title}</span>
        <span className="size-2 rounded-full" style={{ background: accent, boxShadow: `0 0 calc(22px * var(--v524-node-glow)) ${accent}` }} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-px bg-white/10 text-center">
        <Metric label="rank" value={String(diagnostic.rank)} accent={accent} />
        <Metric label="columns" value={String(diagnostic.columnCount)} accent={accent} />
        <Metric label="nullity" value={String(diagnostic.nullity)} accent={accent} />
      </div>
      <div className="mt-3 text-[8px] text-[var(--v524-muted)]">
        κ = {compact(diagnostic.conditionNumber ?? diagnostic.conditionNumberOnRowSpace)}
      </div>
      <div className="mt-2 text-[8px]" style={{ color: accent }}>{verdict}</div>
    </article>
  );
}

function Metric({ label, value, accent }: Readonly<{ label: string; value: string; accent: string }>) {
  return (
    <div className="bg-black/20 px-2 py-3">
      <div className="text-[7px] uppercase tracking-[.12em] text-[var(--v524-muted)]">{label}</div>
      <div className="mt-1 text-lg" style={{ color: accent }}>{value}</div>
    </div>
  );
}

function Cell({ value, header = false }: Readonly<{ value: string; header?: boolean }>) {
  return (
    <div className={header ? "bg-white/[.06] px-3 py-2 uppercase tracking-[.14em] text-white/45" : "bg-[var(--v524-raised)] px-3 py-2 text-[var(--v524-muted)]"}>
      {value}
    </div>
  );
}

const compact = (value: string | undefined) =>
  value === undefined ? "unavailable" : Number(value).toExponential(4);
