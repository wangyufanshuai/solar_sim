"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrRegretRankingSnapshotV531,
  loadKerrRegretRankingSummaryV531,
  subscribeKerrRegretRankingV531,
} from "../lib/kerrRegretRankingClientV531";
import {
  compareKerrRegretRankingHudEncodingsV531,
  createKerrRegretRankingHudEncodingV531,
  resolveKerrRegretRankingHudProfileV531,
  type KerrRegretCandidateGeometryV531,
  type KerrRegretRankingHudModeV531,
  type KerrRegretScalarizationGeometryV531,
} from "../lib/kerrRegretRankingV531";

export default function KerrRegretRankingV531() {
  const [mode, setMode] = useState<KerrRegretRankingHudModeV531>("science");
  const state = useSyncExternalStore(
    subscribeKerrRegretRankingV531,
    getKerrRegretRankingSnapshotV531,
    getKerrRegretRankingSnapshotV531,
  );
  const profile = resolveKerrRegretRankingHudProfileV531(mode);
  const summary = state.summary;
  const encoding = summary ? createKerrRegretRankingHudEncodingV531(summary, mode) : null;
  useEffect(() => {
    void loadKerrRegretRankingSummaryV531().catch(() => undefined);
  }, []);
  if (summary) {
    compareKerrRegretRankingHudEncodingsV531(
      createKerrRegretRankingHudEncodingV531(summary, "science"),
      createKerrRegretRankingHudEncodingV531(summary, "cinematic"),
    );
  }
  const style = {
    "--v531-panel": profile.panel,
    "--v531-raised": profile.panelRaised,
    "--v531-ink": profile.ink,
    "--v531-muted": profile.muted,
    "--v531-grid": profile.grid,
    "--v531-pareto": profile.pareto,
    "--v531-dominated": profile.dominated,
    "--v531-winner": profile.winner,
    "--v531-displacement": profile.displacement,
    "--v531-unavailable": profile.unavailable,
    "--v531-rail-opacity": profile.railOpacity,
    "--v531-curve-glow": profile.curveGlowOpacity,
  } as CSSProperties;
  return (
    <section
      style={style}
      className="relative mt-7 overflow-hidden rounded-[48px] border border-white/10 bg-[var(--v531-panel)] p-5 font-mono text-[var(--v531-ink)] shadow-[0_82px_260px_rgba(0,0,0,.86)] sm:p-8"
      data-atlas-kerr-regret-ranking-v531
      data-atlas-v531-profile={profile.id}
      data-atlas-v531-mode={mode}
      data-atlas-v531-linear-display={profile.scienceBoundary.linearDisplay}
      data-atlas-v531-bloom-intensity={profile.scienceBoundary.bloomIntensity}
      data-atlas-v531-color-grade-intensity={profile.scienceBoundary.colorGradeIntensity}
      data-atlas-v531-cinematic-seed={profile.cinematicSeed ?? "none"}
      data-atlas-v531-numeric-scientific-style-input-count={
        profile.scienceBoundary.numericScientificStyleInputCount
      }
      data-atlas-v531-rank-drives-style={profile.scienceBoundary.rankDrivesStyle}
      data-atlas-v531-pareto-drives-style={profile.scienceBoundary.paretoDrivesStyle}
      data-atlas-v531-weight-drives-style={profile.scienceBoundary.weightDrivesStyle}
      data-atlas-v531-scientific-mutation={profile.scienceBoundary.scientificFieldMutation}
      data-atlas-v531-scientific-geometry-input-count={
        encoding?.scientificGeometryInputCount ?? 0
      }
      data-atlas-v531-canvas-created="false"
      data-atlas-v531-scene-revision-delta="0"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[var(--v531-rail-opacity)] [background-image:linear-gradient(var(--v531-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v531-grid)_1px,transparent_1px)] [background-size:32px_32px]" />
      <header className="relative border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[9px] uppercase tracking-[.44em] text-[var(--v531-muted)]">
              V531 / Science Cinematic V8.0
            </div>
            <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.026em] sm:text-5xl">
              Pareto 星链揭示：归一化选择会彻底重排“最优”候选
            </h2>
          </div>
          <div className="flex border border-white/10 bg-black/20 p-1">
            {(["science", "cinematic"] as const).map((candidate) => (
              <button
                key={candidate}
                type="button"
                aria-pressed={mode === candidate}
                className={
                  mode === candidate
                    ? "bg-white/10 px-3 py-2 text-[8px] uppercase text-white"
                    : "px-3 py-2 text-[8px] uppercase text-white/35"
                }
                onClick={() => setMode(candidate)}
              >
                {candidate}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 max-w-4xl text-[10px] leading-6 text-[var(--v531-muted)]">
          4,704 次 dominance、2,352 个 rank pair 与 9,898 次 scalarization 评估构成完整审计。
          权重扫描没有 utility、prior 或实测 preference；Pareto 与 winner path 都不能转写成仪器推荐。
        </p>
      </header>
      {!summary ? (
        <div className="relative mt-6 text-[10px] text-[var(--v531-muted)]">
          {state.status === "loading" || state.status === "idle"
            ? "正在读取 ranking atlas…"
            : `artifact unavailable / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-4 xl:grid-cols-2">
            <ParetoPanel
              title="Stochastic Pareto field"
              rows={encoding?.scientificGeometry.stochasticCandidateMap ?? []}
              paretoCount={summary.stochasticDescriptor.paretoFront.candidateCount}
            />
            <ParetoPanel
              title="Deterministic Pareto field"
              rows={encoding?.scientificGeometry.deterministicCandidateMap ?? []}
              paretoCount={summary.deterministicDescriptor.paretoFront.candidateCount}
            />
          </div>
          <div className="relative mt-4 grid gap-4 xl:grid-cols-2">
            <WinnerPath
              title="Stochastic scalarization path"
              rows={encoding?.scientificGeometry.stochasticScalarizationPath ?? []}
            />
            <WinnerPath
              title="Deterministic scalarization path"
              rows={encoding?.scientificGeometry.deterministicScalarizationPath ?? []}
            />
          </div>
          <div className="relative mt-5 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-5">
            <Metric label="dominance" value="4704" />
            <Metric label="rank pairs" value="2352" />
            <Metric label="scalarization" value="9898" />
            <Metric label="geometry" value="300" />
            <Metric label="selected weight" value="none" alert />
          </div>
          <div className="relative mt-5 grid gap-px border border-white/10 bg-white/10 lg:grid-cols-3">
            <BoundaryCard
              eyebrow="Stochastic fracture"
              title="16 个非支配候选"
              body={`Spearman ${shortMetric(summary.stochasticDescriptor.rankingAgreement.spearmanRankCorrelation)}；top-10 overlap = 0；最大排名位移 ${summary.stochasticDescriptor.rankingAgreement.maximumRankDisplacement}。`}
            />
            <BoundaryCard
              eyebrow="Deterministic fracture"
              title="10 个非支配候选"
              body={`Spearman ${shortMetric(summary.deterministicDescriptor.rankingAgreement.spearmanRankCorrelation)}；top-10 overlap = 0；最大排名位移 ${summary.deterministicDescriptor.rankingAgreement.maximumRankDisplacement}。`}
            />
            <BoundaryCard
              eyebrow="Preference firewall"
              title="101 个权重都不是偏好"
              body="min-max normalization 与 scalarization weight 均未被操作需求验证；winner path 只是归一化敏感度轨迹。"
              alert
            />
          </div>
          <footer className="relative mt-6 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase text-[var(--v531-muted)]">
            <span>
              Pareto qualified · preference unavailable · recommendation unavailable · measured 0/6 · dense
              0/49
            </span>
            <a
              className="border border-white/12 px-3 py-2"
              href="/api/atlas/relativity-evidence/v531/regret-ranking?download=atlas"
            >
              Export ranking atlas
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function ParetoPanel({ title, rows, paretoCount }: Readonly<{ title: string; rows: readonly KerrRegretCandidateGeometryV531[]; paretoCount: number }>) {
  const absolute = rows.map((row) => Math.log10(Number(row.maximumAbsoluteExcessCost)));
  const relative = rows.map((row) => Math.log10(Number(row.maximumRelativeRegret)));
  const xMin = Math.min(...absolute), xMax = Math.max(...absolute);
  const yMin = Math.min(...relative), yMax = Math.max(...relative);
  return (
    <figure className="border border-white/10 bg-[var(--v531-raised)] p-4">
      <div className="flex items-center justify-between gap-3 text-[8px] uppercase text-[var(--v531-muted)]">
        <span>{title}</span><span>{paretoCount} non-dominated</span>
      </div>
      <svg className="mt-3 block aspect-[5/3] w-full" viewBox="0 0 300 180" role="img" aria-label={title}>
        <path d="M16 18V158H284" fill="none" stroke="rgba(255,255,255,.12)" />
        {rows.map((row, index) => {
          const x = 16 + ((absolute[index] - xMin) / Math.max(xMax - xMin, Number.EPSILON)) * 268;
          const y = 158 - ((relative[index] - yMin) / Math.max(yMax - yMin, Number.EPSILON)) * 140;
          return <circle key={row.candidateIndex} cx={x.toFixed(3)} cy={y.toFixed(3)} r={row.paretoNonDominated ? "3" : "1.8"} fill={row.paretoNonDominated ? "var(--v531-pareto)" : "var(--v531-dominated)"} opacity={row.paretoNonDominated ? 0.95 : 0.55} />;
        })}
        <text x="150" y="176" textAnchor="middle" fill="rgba(255,255,255,.28)" fontSize="7">log maximum absolute excess</text>
      </svg>
    </figure>
  );
}

function WinnerPath({ title, rows }: Readonly<{ title: string; rows: readonly KerrRegretScalarizationGeometryV531[] }>) {
  const points = rows.map((row) => `${(16 + Number(row.absoluteObjectiveWeight) * 268).toFixed(3)},${(98 - Number(row.winnerScienceAllocationFraction) * 86).toFixed(3)}`).join(" ");
  return (
    <figure className="border border-white/10 bg-[var(--v531-raised)] p-4">
      <div className="flex items-center justify-between gap-3 text-[8px] uppercase text-[var(--v531-muted)]"><span>{title}</span><span>101 weights</span></div>
      <svg className="mt-3 block aspect-[5/2] w-full" viewBox="0 0 300 120" role="img" aria-label={title}>
        <path d="M16 12V98H284" fill="none" stroke="rgba(255,255,255,.12)" />
        <polyline points={points} fill="none" stroke="var(--v531-winner)" strokeWidth="1.7" style={{ filter: "drop-shadow(0 0 calc(6px * var(--v531-curve-glow)) currentColor)" }} />
        <text x="150" y="116" textAnchor="middle" fill="rgba(255,255,255,.28)" fontSize="7">absolute-objective scalarization weight</text>
      </svg>
    </figure>
  );
}

function Metric({ label, value, alert = false }: Readonly<{ label: string; value: string; alert?: boolean }>) {
  return <div className="bg-[var(--v531-raised)] px-3 py-4 text-center"><div className="text-[7px] text-[var(--v531-muted)]">{label}</div><div className={alert ? "mt-2 text-lg text-[var(--v531-unavailable)]" : "mt-2 text-lg text-[var(--v531-winner)]"}>{value}</div></div>;
}
function BoundaryCard({ eyebrow, title, body, alert = false }: Readonly<{ eyebrow: string; title: string; body: string; alert?: boolean }>) {
  return <article className="bg-[var(--v531-raised)] p-4"><div className={alert ? "text-[7px] uppercase tracking-[.24em] text-[var(--v531-unavailable)]" : "text-[7px] uppercase tracking-[.24em] text-[var(--v531-pareto)]"}>{eyebrow}</div><h3 className="mt-2 font-serif text-xl">{title}</h3><p className="mt-3 text-[8px] leading-5 text-[var(--v531-muted)]">{body}</p></article>;
}
function shortMetric(value: string) { return Number(value).toFixed(3); }
