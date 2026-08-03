"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrCostLawRobustnessSnapshotV529,
  loadKerrCostLawRobustnessSummaryV529,
  subscribeKerrCostLawRobustnessV529,
} from "../lib/kerrCostLawRobustnessClientV529";
import {
  compareKerrCostLawHudEncodingsV529,
  createKerrCostLawHudEncodingV529,
  resolveKerrCostLawHudProfileV529,
  type KerrCostLawDisplayRowV529,
  type KerrCostLawHudModeV529,
} from "../lib/kerrCostLawRobustnessV529";

const EXPONENT_CURVES = ["#72d9ff", "#80edda", "#ddd07d", "#ffad75", "#d7a4ff"] as const;

export default function KerrCostLawRobustnessV529() {
  const [mode, setMode] = useState<KerrCostLawHudModeV529>("science");
  const state = useSyncExternalStore(
    subscribeKerrCostLawRobustnessV529,
    getKerrCostLawRobustnessSnapshotV529,
    getKerrCostLawRobustnessSnapshotV529,
  );
  const profile = resolveKerrCostLawHudProfileV529(mode);
  const summary = state.summary;
  const encoding = summary ? createKerrCostLawHudEncodingV529(summary, mode) : null;
  useEffect(() => {
    void loadKerrCostLawRobustnessSummaryV529().catch(() => undefined);
  }, []);
  if (summary) {
    compareKerrCostLawHudEncodingsV529(
      createKerrCostLawHudEncodingV529(summary, "science"),
      createKerrCostLawHudEncodingV529(summary, "cinematic"),
    );
  }
  const style = {
    "--v529-panel": profile.panel,
    "--v529-raised": profile.panelRaised,
    "--v529-ink": profile.ink,
    "--v529-muted": profile.muted,
    "--v529-grid": profile.grid,
    "--v529-stochastic": profile.stochastic,
    "--v529-deterministic": profile.deterministic,
    "--v529-floor": profile.floor,
    "--v529-overhead": profile.overhead,
    "--v529-unavailable": profile.unavailable,
    "--v529-rail-opacity": profile.railOpacity,
    "--v529-curve-glow": profile.curveGlowOpacity,
  } as CSSProperties;
  return (
    <section
      style={style}
      className="relative mt-7 overflow-hidden rounded-[44px] border border-white/10 bg-[var(--v529-panel)] p-5 font-mono text-[var(--v529-ink)] shadow-[0_76px_240px_rgba(0,0,0,.82)] sm:p-8"
      data-atlas-kerr-cost-law-robustness-v529
      data-atlas-v529-profile={profile.id}
      data-atlas-v529-mode={mode}
      data-atlas-v529-linear-display={profile.scienceBoundary.linearDisplay}
      data-atlas-v529-bloom-intensity={profile.scienceBoundary.bloomIntensity}
      data-atlas-v529-color-grade-intensity={profile.scienceBoundary.colorGradeIntensity}
      data-atlas-v529-cinematic-seed={profile.cinematicSeed ?? "none"}
      data-atlas-v529-numeric-scientific-style-input-count={
        profile.scienceBoundary.numericScientificStyleInputCount
      }
      data-atlas-v529-exponent-drives-style={profile.scienceBoundary.exponentDrivesStyle}
      data-atlas-v529-floor-drives-style={profile.scienceBoundary.floorDrivesStyle}
      data-atlas-v529-overhead-drives-style={profile.scienceBoundary.overheadDrivesStyle}
      data-atlas-v529-scientific-mutation={profile.scienceBoundary.scientificFieldMutation}
      data-atlas-v529-scientific-geometry-input-count={
        encoding?.scientificGeometryInputCount ?? 0
      }
      data-atlas-v529-canvas-created="false"
      data-atlas-v529-scene-revision-delta="0"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[var(--v529-rail-opacity)] [background-image:linear-gradient(var(--v529-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v529-grid)_1px,transparent_1px)] [background-size:36px_36px]" />
      <header className="relative border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[9px] uppercase tracking-[.42em] text-[var(--v529-muted)]">
              V529 / cost-law robustness envelope
            </div>
            <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.03em] sm:text-5xl">
              指数、底噪与固定开销的全因子鲁棒性星图
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
        <p className="mt-4 max-w-4xl text-[10px] leading-6 text-[var(--v529-muted)]">
          5 个 precision exponent × 5 个 calibration/science 权重 × 5 个 hypothetical
          systematic floor × 4 个 allocation-independent overhead，分别覆盖随机方差与确定性界限。
          这些坐标用于压力测试，不是实测成本模型。
        </p>
      </header>
      {!summary ? (
        <div className="relative mt-6 text-[10px] text-[var(--v529-muted)]">
          {state.status === "loading" || state.status === "idle"
            ? "正在读取鲁棒性包络…"
            : `artifact unavailable / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-4 xl:grid-cols-2">
            <ExponentFan
              title="Stochastic allocation fan"
              rows={encoding?.scientificGeometry.stochasticExponentRatioSurface ?? []}
            />
            <ExponentFan
              title="Deterministic allocation fan"
              rows={encoding?.scientificGeometry.deterministicExponentRatioSurface ?? []}
            />
          </div>
          <div className="relative mt-4 grid gap-4 xl:grid-cols-2">
            <StressRail
              title="Systematic-floor cost escalation"
              xLabel="floor fraction"
              stochastic={encoding?.scientificGeometry.stochasticFloorEnvelope ?? []}
              deterministic={encoding?.scientificGeometry.deterministicFloorEnvelope ?? []}
              xKey="systematicFloorFraction"
            />
            <StressRail
              title="Fixed-overhead translation"
              xLabel="normalized overhead"
              stochastic={encoding?.scientificGeometry.stochasticOverheadTranslation ?? []}
              deterministic={encoding?.scientificGeometry.deterministicOverheadTranslation ?? []}
              xKey="fixedNormalizedOverhead"
            />
          </div>
          <div className="relative mt-5 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-5">
            <Metric label="factorial cells" value="1000" />
            <Metric label="optimizer steps" value="512000" />
            <Metric label="geometry" value="68" />
            <Metric label="overhead drift" value="0" />
            <Metric label="selected model" value="none" alert />
          </div>
          <div className="relative mt-5 grid gap-px border border-white/10 bg-white/10 lg:grid-cols-3">
            <BoundaryCard
              eyebrow="Invariant"
              title="固定开销只平移成本"
              body="在明确的 allocation-independent 定义下，750 次比较中最优分配漂移为零；它不证明真实采集开销与分配无关。"
            />
            <BoundaryCard
              eyebrow="Monotone"
              title="系统底噪压缩随机预算"
              body="800 次相邻比较全部严格增大成本；floor fraction 是假设坐标，不是测量得到的仪器底噪。"
            />
            <BoundaryCard
              eyebrow="Firewall"
              title="禁止自动选型"
              body="真实 exponent、cost ratio、floor 与 overhead 均 unavailable，因此 recommended model、allocation 与 schedule 仍为空。"
              alert
            />
          </div>
          <footer className="relative mt-6 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase text-[var(--v529-muted)]">
            <span>
              parametric envelope qualified · operational model unavailable · measured 0/6 · dense
              0/49
            </span>
            <a
              className="border border-white/12 px-3 py-2"
              href="/api/atlas/relativity-evidence/v529/cost-law-robustness?download=envelope"
            >
              Export envelope
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function ExponentFan({ title, rows }: Readonly<{ title: string; rows: readonly KerrCostLawDisplayRowV529[] }>) {
  const groups = groupByExponent(rows);
  return (
    <figure className="border border-white/10 bg-[var(--v529-raised)] p-4">
      <div className="flex items-center justify-between gap-3 text-[8px] uppercase text-[var(--v529-muted)]">
        <span>{title}</span>
        <span>p = 1…3</span>
      </div>
      <svg className="mt-3 block aspect-[5/3] w-full" viewBox="0 0 300 180" role="img" aria-label={title}>
        <path d="M16 18V158H284" fill="none" stroke="rgba(255,255,255,.12)" />
        <path d="M16 88H284" fill="none" stroke="rgba(255,255,255,.07)" strokeDasharray="3 5" />
        {groups.map(([exponent, points], index) => (
          <g key={exponent}>
            <polyline
              points={allocationPolyline(points)}
              fill="none"
              stroke={EXPONENT_CURVES[index]}
              strokeWidth="1.5"
              opacity={0.62 + index * 0.075}
              style={{ filter: "drop-shadow(0 0 calc(6px * var(--v529-curve-glow)) currentColor)" }}
            />
            {points.map((point) => {
              const [cx, cy] = allocationPoint(point);
              return <circle key={point.sourceIndex} cx={cx} cy={cy} r="1.7" fill={EXPONENT_CURVES[index]} />;
            })}
          </g>
        ))}
        <text x="150" y="176" textAnchor="middle" fill="rgba(255,255,255,.28)" fontSize="7">
          log₁₀ calibration/science cost weight
        </text>
      </svg>
    </figure>
  );
}

function StressRail({
  title,
  xLabel,
  stochastic,
  deterministic,
  xKey,
}: Readonly<{
  title: string;
  xLabel: string;
  stochastic: readonly KerrCostLawDisplayRowV529[];
  deterministic: readonly KerrCostLawDisplayRowV529[];
  xKey: "systematicFloorFraction" | "fixedNormalizedOverhead";
}>) {
  const all = [...stochastic, ...deterministic];
  const xValues = all.map((row) => Number(row[xKey]));
  const yValues = all.map((row) => Math.log10(Number(row.minimumNormalizedCost)));
  const domain = {
    xMin: Math.min(...xValues),
    xMax: Math.max(...xValues),
    yMin: Math.min(...yValues),
    yMax: Math.max(...yValues),
  };
  return (
    <figure className="border border-white/10 bg-[var(--v529-raised)] p-4">
      <div className="flex items-center justify-between gap-3 text-[8px] uppercase text-[var(--v529-muted)]">
        <span>{title}</span>
        <span>p=2 · weight=1</span>
      </div>
      <svg className="mt-3 block aspect-[5/2] w-full" viewBox="0 0 300 120" role="img" aria-label={title}>
        <path d="M16 12V98H284" fill="none" stroke="rgba(255,255,255,.12)" />
        <polyline
          points={stressPolyline(stochastic, xKey, domain)}
          fill="none"
          stroke="var(--v529-stochastic)"
          strokeWidth="1.7"
        />
        <polyline
          points={stressPolyline(deterministic, xKey, domain)}
          fill="none"
          stroke="var(--v529-deterministic)"
          strokeWidth="1.7"
          strokeDasharray="4 3"
        />
        <text x="150" y="116" textAnchor="middle" fill="rgba(255,255,255,.28)" fontSize="7">
          {xLabel}
        </text>
      </svg>
    </figure>
  );
}

function Metric({ label, value, alert = false }: Readonly<{ label: string; value: string; alert?: boolean }>) {
  return (
    <div className="bg-[var(--v529-raised)] px-3 py-4 text-center">
      <div className="text-[7px] text-[var(--v529-muted)]">{label}</div>
      <div className={alert ? "mt-2 text-lg text-[var(--v529-unavailable)]" : "mt-2 text-lg text-[var(--v529-stochastic)]"}>
        {value}
      </div>
    </div>
  );
}

function BoundaryCard({ eyebrow, title, body, alert = false }: Readonly<{ eyebrow: string; title: string; body: string; alert?: boolean }>) {
  return (
    <article className="bg-[var(--v529-raised)] p-4">
      <div className={alert ? "text-[7px] uppercase tracking-[.24em] text-[var(--v529-unavailable)]" : "text-[7px] uppercase tracking-[.24em] text-[var(--v529-overhead)]"}>
        {eyebrow}
      </div>
      <h3 className="mt-2 font-serif text-xl">{title}</h3>
      <p className="mt-3 text-[8px] leading-5 text-[var(--v529-muted)]">{body}</p>
    </article>
  );
}

function groupByExponent(rows: readonly KerrCostLawDisplayRowV529[]) {
  const groups = new Map<string, KerrCostLawDisplayRowV529[]>();
  rows.forEach((row) => groups.set(row.precisionExponent, [...(groups.get(row.precisionExponent) ?? []), row]));
  return [...groups.entries()];
}
function allocationPoint(row: KerrCostLawDisplayRowV529) {
  const x = 16 + ((Math.log10(Number(row.calibrationToScienceCostWeight)) + 2) / 4) * 268;
  const y = 158 - Number(row.scienceFractionOfRandomBudget) * 140;
  return [x.toFixed(3), y.toFixed(3)] as const;
}
function allocationPolyline(rows: readonly KerrCostLawDisplayRowV529[]) {
  return rows.map((row) => allocationPoint(row).join(",")).join(" ");
}
function stressPolyline(
  rows: readonly KerrCostLawDisplayRowV529[],
  xKey: "systematicFloorFraction" | "fixedNormalizedOverhead",
  domain: Readonly<{ xMin: number; xMax: number; yMin: number; yMax: number }>,
) {
  const xSpan = Math.max(domain.xMax - domain.xMin, Number.EPSILON);
  const ySpan = Math.max(domain.yMax - domain.yMin, Number.EPSILON);
  return rows
    .map((row) => {
      const x = 16 + ((Number(row[xKey]) - domain.xMin) / xSpan) * 268;
      const y = 98 - ((Math.log10(Number(row.minimumNormalizedCost)) - domain.yMin) / ySpan) * 86;
      return `${x.toFixed(3)},${y.toFixed(3)}`;
    })
    .join(" ");
}
