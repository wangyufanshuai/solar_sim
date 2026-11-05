"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrAllocationRegretSnapshotV530,
  loadKerrAllocationRegretSummaryV530,
  subscribeKerrAllocationRegretV530,
} from "../lib/kerrAllocationRegretClientV530";
import {
  compareKerrAllocationRegretHudEncodingsV530,
  createKerrAllocationRegretHudEncodingV530,
  resolveKerrAllocationRegretHudProfileV530,
  type KerrAllocationOptimalLatticeRowV530,
  type KerrAllocationRegretCandidateV530,
  type KerrAllocationRegretHudModeV530,
} from "../lib/kerrAllocationRegretV530";

const LATTICE_COLORS = ["#70d9ff", "#81ebd9", "#ded07c", "#ffac75", "#d3a4ff"] as const;

export default function KerrAllocationRegretV530() {
  const [mode, setMode] = useState<KerrAllocationRegretHudModeV530>("science");
  const state = useSyncExternalStore(
    subscribeKerrAllocationRegretV530,
    getKerrAllocationRegretSnapshotV530,
    getKerrAllocationRegretSnapshotV530,
  );
  const profile = resolveKerrAllocationRegretHudProfileV530(mode);
  const summary = state.summary;
  const encoding = summary ? createKerrAllocationRegretHudEncodingV530(summary, mode) : null;
  useEffect(() => {
    void loadKerrAllocationRegretSummaryV530().catch(() => undefined);
  }, []);
  if (summary) {
    compareKerrAllocationRegretHudEncodingsV530(
      createKerrAllocationRegretHudEncodingV530(summary, "science"),
      createKerrAllocationRegretHudEncodingV530(summary, "cinematic"),
    );
  }
  const style = {
    "--v530-panel": profile.panel,
    "--v530-raised": profile.panelRaised,
    "--v530-ink": profile.ink,
    "--v530-muted": profile.muted,
    "--v530-grid": profile.grid,
    "--v530-relative": profile.relative,
    "--v530-absolute": profile.absolute,
    "--v530-lattice": profile.lattice,
    "--v530-conflict": profile.conflict,
    "--v530-unavailable": profile.unavailable,
    "--v530-rail-opacity": profile.railOpacity,
    "--v530-curve-glow": profile.curveGlowOpacity,
  } as CSSProperties;
  return (
    <section
      style={style}
      className="relative mt-7 overflow-hidden rounded-[46px] border border-white/10 bg-[var(--v530-panel)] p-5 font-mono text-[var(--v530-ink)] shadow-[0_78px_250px_rgba(0,0,0,.84)] sm:p-8"
      data-atlas-kerr-allocation-regret-v530
      data-atlas-v530-profile={profile.id}
      data-atlas-v530-mode={mode}
      data-atlas-v530-linear-display={profile.scienceBoundary.linearDisplay}
      data-atlas-v530-bloom-intensity={profile.scienceBoundary.bloomIntensity}
      data-atlas-v530-color-grade-intensity={profile.scienceBoundary.colorGradeIntensity}
      data-atlas-v530-cinematic-seed={profile.cinematicSeed ?? "none"}
      data-atlas-v530-numeric-scientific-style-input-count={
        profile.scienceBoundary.numericScientificStyleInputCount
      }
      data-atlas-v530-regret-drives-style={profile.scienceBoundary.regretDrivesStyle}
      data-atlas-v530-minimax-drives-style={profile.scienceBoundary.minimaxDrivesStyle}
      data-atlas-v530-fragility-drives-style={profile.scienceBoundary.fragilityDrivesStyle}
      data-atlas-v530-scientific-mutation={profile.scienceBoundary.scientificFieldMutation}
      data-atlas-v530-scientific-geometry-input-count={
        encoding?.scientificGeometryInputCount ?? 0
      }
      data-atlas-v530-canvas-created="false"
      data-atlas-v530-scene-revision-delta="0"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[var(--v530-rail-opacity)] [background-image:linear-gradient(var(--v530-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v530-grid)_1px,transparent_1px)] [background-size:34px_34px]" />
      <header className="relative border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[9px] uppercase tracking-[.42em] text-[var(--v530-muted)]">
              V530 / allocation regret & fragility atlas
            </div>
            <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.028em] sm:text-5xl">
              同一假设空间，两种 regret 定义给出不同的脆弱性中心
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
        <p className="mt-4 max-w-4xl text-[10px] leading-6 text-[var(--v530-muted)]">
          49 个候选分配在 v529 的 1,000 个参数单元上产生 49,000 次 regret 评估。
          absolute excess cost 对加性开销不变；relative regret 会被开销分母压低。数学 minimax
          仅是网格描述，不是仪器建议。
        </p>
      </header>
      {!summary ? (
        <div className="relative mt-6 text-[10px] text-[var(--v530-muted)]">
          {state.status === "loading" || state.status === "idle"
            ? "正在读取 regret atlas…"
            : `artifact unavailable / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-4 xl:grid-cols-2">
            <RegretPanel
              title="Stochastic variance"
              rows={encoding?.scientificGeometry.stochasticCandidateEnvelope ?? []}
              absoluteFraction={summary.stochasticDescriptor.descriptiveAbsoluteMinimax.scienceAllocationFraction}
              relativeFraction={summary.stochasticDescriptor.descriptiveRelativeMinimax.scienceAllocationFraction}
            />
            <RegretPanel
              title="Deterministic bound"
              rows={encoding?.scientificGeometry.deterministicCandidateEnvelope ?? []}
              absoluteFraction={summary.deterministicDescriptor.descriptiveAbsoluteMinimax.scienceAllocationFraction}
              relativeFraction={summary.deterministicDescriptor.descriptiveRelativeMinimax.scienceAllocationFraction}
            />
          </div>
          <div className="relative mt-4 grid gap-4 xl:grid-cols-2">
            <FragilityLattice
              title="Stochastic optimum lattice"
              rows={encoding?.scientificGeometry.stochasticOptimalFractionLattice ?? []}
            />
            <FragilityLattice
              title="Deterministic optimum lattice"
              rows={encoding?.scientificGeometry.deterministicOptimalFractionLattice ?? []}
            />
          </div>
          <div className="relative mt-5 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-5">
            <Metric label="regret evaluations" value="49000" />
            <Metric label="overhead audits" value="36750" />
            <Metric label="candidate fractions" value="49" />
            <Metric label="geometry" value="148" />
            <Metric label="recommended" value="none" alert />
          </div>
          <div className="relative mt-5 grid gap-px border border-white/10 bg-white/10 lg:grid-cols-3">
            <BoundaryCard
              eyebrow="Absolute"
              title="加性开销完全抵消"
              body="36,750 次比较确认 absolute excess cost 对固定加性 overhead 不变；这依赖 v529 的 allocation-independent 定义。"
            />
            <BoundaryCard
              eyebrow="Relative"
              title="分母会改变脆弱性中心"
              body="relative regret 随 overhead 非增，因此 relative minimax 与 absolute minimax 可以落在不同分配坐标。"
            />
            <BoundaryCard
              eyebrow="Decision firewall"
              title="网格覆盖率不是概率"
              body="没有模型 prior、实测成本律或效用函数；coverage count、minimax 和最优范围均不得转写成 operational recommendation。"
              alert
            />
          </div>
          <footer className="relative mt-6 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase text-[var(--v530-muted)]">
            <span>
              regret atlas qualified · prior unavailable · recommendation unavailable · measured 0/6 ·
              dense 0/49
            </span>
            <a
              className="border border-white/12 px-3 py-2"
              href="/api/atlas/relativity-evidence/v530/allocation-regret?download=atlas"
            >
              Export atlas
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function RegretPanel({
  title,
  rows,
  absoluteFraction,
  relativeFraction,
}: Readonly<{
  title: string;
  rows: readonly KerrAllocationRegretCandidateV530[];
  absoluteFraction: string;
  relativeFraction: string;
}>) {
  const relativeMax = Math.max(...rows.map((row) => Number(row.maximumRelativeRegret)));
  const absoluteLogs = rows.map((row) => Math.log10(Number(row.maximumAbsoluteExcessCost)));
  const absoluteMin = Math.min(...absoluteLogs);
  const absoluteMax = Math.max(...absoluteLogs);
  return (
    <figure className="border border-white/10 bg-[var(--v530-raised)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-[8px] uppercase text-[var(--v530-muted)]">
        <span>{title}</span>
        <span className="text-[var(--v530-conflict)]">
          abs {shortFraction(absoluteFraction)} / rel {shortFraction(relativeFraction)}
        </span>
      </div>
      <svg className="mt-3 block aspect-[5/3] w-full" viewBox="0 0 300 180" role="img" aria-label={`${title} regret envelope`}>
        <path d="M16 18V158H284" fill="none" stroke="rgba(255,255,255,.12)" />
        <polyline
          points={relativePolyline(rows, relativeMax)}
          fill="none"
          stroke="var(--v530-relative)"
          strokeWidth="1.7"
          style={{ filter: "drop-shadow(0 0 calc(6px * var(--v530-curve-glow)) currentColor)" }}
        />
        <polyline
          points={absolutePolyline(rows, absoluteMin, absoluteMax)}
          fill="none"
          stroke="var(--v530-absolute)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <Marker fraction={absoluteFraction} color="var(--v530-absolute)" label="A" />
        <Marker fraction={relativeFraction} color="var(--v530-relative)" label="R" />
        <text x="150" y="176" textAnchor="middle" fill="rgba(255,255,255,.28)" fontSize="7">
          science allocation fraction
        </text>
      </svg>
    </figure>
  );
}

function Marker({ fraction, color, label }: Readonly<{ fraction: string; color: string; label: string }>) {
  const x = 16 + ((Number(fraction) - 0.02) / 0.96) * 268;
  return (
    <g>
      <path d={`M${x.toFixed(3)} 18V158`} stroke={color} strokeWidth="0.8" opacity="0.45" />
      <text x={x.toFixed(3)} y="14" textAnchor="middle" fill={color} fontSize="7">
        {label}
      </text>
    </g>
  );
}

function FragilityLattice({ title, rows }: Readonly<{ title: string; rows: readonly KerrAllocationOptimalLatticeRowV530[] }>) {
  const groups = groupLattice(rows);
  return (
    <figure className="border border-white/10 bg-[var(--v530-raised)] p-4">
      <div className="flex items-center justify-between gap-3 text-[8px] uppercase text-[var(--v530-muted)]">
        <span>{title}</span>
        <span>floor=0 · overhead=0</span>
      </div>
      <svg className="mt-3 block aspect-[5/2] w-full" viewBox="0 0 300 120" role="img" aria-label={title}>
        <path d="M16 12V98H284" fill="none" stroke="rgba(255,255,255,.12)" />
        {groups.map(([exponent, points], index) => (
          <polyline
            key={exponent}
            points={latticePolyline(points)}
            fill="none"
            stroke={LATTICE_COLORS[index]}
            strokeWidth="1.45"
            opacity={0.62 + index * 0.075}
          />
        ))}
        <text x="150" y="116" textAnchor="middle" fill="rgba(255,255,255,.28)" fontSize="7">
          log₁₀ cost weight / optimal fraction
        </text>
      </svg>
    </figure>
  );
}

function Metric({ label, value, alert = false }: Readonly<{ label: string; value: string; alert?: boolean }>) {
  return (
    <div className="bg-[var(--v530-raised)] px-3 py-4 text-center">
      <div className="text-[7px] text-[var(--v530-muted)]">{label}</div>
      <div className={alert ? "mt-2 text-lg text-[var(--v530-unavailable)]" : "mt-2 text-lg text-[var(--v530-relative)]"}>
        {value}
      </div>
    </div>
  );
}

function BoundaryCard({ eyebrow, title, body, alert = false }: Readonly<{ eyebrow: string; title: string; body: string; alert?: boolean }>) {
  return (
    <article className="bg-[var(--v530-raised)] p-4">
      <div className={alert ? "text-[7px] uppercase tracking-[.24em] text-[var(--v530-unavailable)]" : "text-[7px] uppercase tracking-[.24em] text-[var(--v530-lattice)]"}>
        {eyebrow}
      </div>
      <h3 className="mt-2 font-serif text-xl">{title}</h3>
      <p className="mt-3 text-[8px] leading-5 text-[var(--v530-muted)]">{body}</p>
    </article>
  );
}

function relativePolyline(rows: readonly KerrAllocationRegretCandidateV530[], maximum: number) {
  return rows
    .map((row) => {
      const x = 16 + ((Number(row.scienceAllocationFraction) - 0.02) / 0.96) * 268;
      const y = 158 - (Number(row.maximumRelativeRegret) / Math.max(maximum, Number.EPSILON)) * 140;
      return `${x.toFixed(3)},${y.toFixed(3)}`;
    })
    .join(" ");
}
function absolutePolyline(rows: readonly KerrAllocationRegretCandidateV530[], minimum: number, maximum: number) {
  const span = Math.max(maximum - minimum, Number.EPSILON);
  return rows
    .map((row) => {
      const x = 16 + ((Number(row.scienceAllocationFraction) - 0.02) / 0.96) * 268;
      const y = 158 - ((Math.log10(Number(row.maximumAbsoluteExcessCost)) - minimum) / span) * 140;
      return `${x.toFixed(3)},${y.toFixed(3)}`;
    })
    .join(" ");
}
function groupLattice(rows: readonly KerrAllocationOptimalLatticeRowV530[]) {
  const groups = new Map<string, KerrAllocationOptimalLatticeRowV530[]>();
  rows.forEach((row) => groups.set(row.precisionExponent, [...(groups.get(row.precisionExponent) ?? []), row]));
  return [...groups.entries()];
}
function latticePolyline(rows: readonly KerrAllocationOptimalLatticeRowV530[]) {
  return rows
    .map((row) => {
      const x = 16 + ((Math.log10(Number(row.calibrationToScienceCostWeight)) + 2) / 4) * 268;
      const y = 98 - Number(row.scienceOptimalFraction) * 86;
      return `${x.toFixed(3)},${y.toFixed(3)}`;
    })
    .join(" ");
}
function shortFraction(value: string) {
  return Number(value).toFixed(2);
}
