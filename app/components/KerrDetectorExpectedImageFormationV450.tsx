"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";

import {
  getKerrDetectorExpectedImageSnapshotV450,
  loadKerrDetectorExpectedImageSummaryV450,
  subscribeKerrDetectorExpectedImageV450,
} from "../lib/kerrDetectorExpectedImageFormationClientV450";
import type { KerrDetectorExpectedImageRowV450 } from "../lib/kerrDetectorExpectedImageFormationV450";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V405,
  resolveAtlasVisualProfileV299,
} from "../lib/atlasVisualProfileV299";
import {
  createAtlasVisualTokenSignatureV300,
  useAtlasVisualRuntimeConsumerV300,
} from "../lib/atlasVisualRuntimeConsumptionV300";

const EXPORT_ROOT =
  "/api/atlas/relativity-evidence/v450/expected-image-formation?download=";

export default function KerrDetectorExpectedImageFormationV450() {
  const state = useSyncExternalStore(
    subscribeKerrDetectorExpectedImageV450,
    getKerrDetectorExpectedImageSnapshotV450,
    getKerrDetectorExpectedImageSnapshotV450,
  );
  useEffect(() => {
    void loadKerrDetectorExpectedImageSummaryV450().catch(() => undefined);
  }, []);
  const profile = resolveAtlasVisualProfileV299(
    ATLAS_VISUAL_PROFILE_CANDIDATE_V405,
  );
  const tokens = profile.runtimeTokens.hud.evidenceObservatoryV13;
  if (!tokens) throw new Error("v450-image-formation-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "KerrDetectorExpectedImageFormationV450",
    tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud),
  });
  const style = {
    "--v450-panel": tokens.panelOpacity,
    "--v450-grain": tokens.evidenceGrainOpacity,
  } as CSSProperties;
  const summary = state.summary;

  return (
    <section
      style={style}
      className="relative mt-5 overflow-hidden rounded-[26px] border border-cyan-100/15 bg-[radial-gradient(circle_at_72%_10%,rgba(103,232,249,.09),transparent_28%),radial-gradient(circle_at_13%_76%,rgba(251,191,36,.055),transparent_27%),linear-gradient(142deg,rgba(2,12,16,var(--v450-panel)),rgba(4,8,12,var(--v450-panel))_58%,rgba(11,7,3,var(--v450-panel)))] p-4 font-mono text-slate-100 shadow-[0_26px_90px_rgba(0,0,0,.42)] sm:p-6"
      data-atlas-kerr-expected-image-v450
      data-atlas-v450-fixture-authority="true"
      data-atlas-v450-detector-projection-authority="false"
      data-atlas-v450-science-raster-authority="false"
      data-atlas-v450-full-raster-materialized="false"
      data-atlas-v450-profile={profile.id}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--v450-grain)] [background-image:repeating-linear-gradient(0deg,rgba(165,243,252,.035)_0_1px,transparent_1px_5px)]"
      />
      <header className="relative grid gap-5 border-b border-cyan-50/10 pb-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.3em] text-cyan-100/50">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-200/70 shadow-[0_0_14px_rgba(165,243,252,.65)]" />
            V450 / detector formation laboratory
          </div>
          <h2 className="mt-3 max-w-4xl font-serif text-2xl font-normal tracking-[.06em] text-cyan-50/95 sm:text-3xl">
            坐标已落像素，探测器仍未获准
          </h2>
          <p className="mt-3 max-w-3xl text-[11px] leading-6 text-slate-300/55">
            这里展示的是四条权威 WCS 坐标上的确定性电子期望沉积 fixture。它验证守恒与索引，
            但不补造 PSF、像元响应、实测几何或科学图像。
          </p>
        </div>
        <div
          className="w-fit border border-cyan-100/15 bg-cyan-100/[.035] px-3 py-2 text-[9px] uppercase tracking-[.16em] text-cyan-100/70"
          data-atlas-v450-status={state.status}
        >
          {state.status}
        </div>
      </header>

      {!summary ? (
        <div className="relative mt-5 border-l-2 border-cyan-100/30 bg-cyan-100/[.025] px-4 py-3 text-[10px] text-cyan-50/55">
          {state.status === "idle" || state.status === "loading"
            ? "正在读取有界资格摘要…"
            : `资格摘要不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-5 grid gap-4 xl:grid-cols-[1.18fr_.82fr]">
            <DetectorPlane rows={summary.rows} />
            <div className="grid content-start gap-3">
              <MetricGrid
                sourceRows={summary.counts.sourceRowCount}
                deposits={summary.counts.sparseDepositRowCount}
                weightResidual={summary.maxima.weightConservationAbsolute}
                electronResidual={summary.maxima.electronConservationRelative}
              />
              <div className="border border-amber-100/15 bg-amber-100/[.025] p-4">
                <div className="text-[9px] uppercase tracking-[.22em] text-amber-100/55">
                  Authority firewall
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                  <Boundary label="WCS" value="qualified" good />
                  <Boundary label="electron fixture" value="qualified" good />
                  <Boundary label="detector geometry" value="blocked" />
                  <Boundary label="PSF / pixel response" value="unavailable" />
                  <Boundary label="science raster" value="blocked" />
                  <Boundary label="observed image" value="unavailable" />
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-4 grid gap-px overflow-hidden border border-white/7 bg-white/7 sm:grid-cols-2 xl:grid-cols-4">
            {summary.rows.map((row) => (
              <RayReadout key={row.rayId} row={row} />
            ))}
          </div>

          <footer className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-cyan-50/10 pt-4 text-[8px] uppercase tracking-[.12em] text-slate-400/45">
            <span>
              sparse fixture · no full raster · dense campaign 0/49
            </span>
            <nav className="flex flex-wrap gap-2" aria-label="V450 evidence exports">
              {(["qualification", "fixture", "oracle"] as const).map((id) => (
                <a
                  key={id}
                  className="border border-cyan-100/12 px-2 py-1 text-cyan-100/50 transition-colors hover:border-cyan-100/30 hover:text-cyan-50/80"
                  href={`${EXPORT_ROOT}${id}`}
                >
                  {id}
                </a>
              ))}
            </nav>
          </footer>
        </>
      )}
    </section>
  );
}

function DetectorPlane({ rows }: Readonly<{ rows: readonly KerrDetectorExpectedImageRowV450[] }>) {
  return (
    <div className="relative min-h-[330px] overflow-hidden border border-cyan-100/12 bg-[#02080b] p-4">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(103,232,249,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,.1)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-cyan-100/10" />
      <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-cyan-100/10" />
      <div className="relative flex items-start justify-between text-[8px] uppercase tracking-[.18em] text-cyan-100/40">
        <span>KERR-FINITE-ZAMO-LINEAR-384</span>
        <span>FITS 1-based centers</span>
      </div>
      {rows.map((row, index) => (
        <div
          key={row.rayId}
          className="absolute -translate-x-1/2 translate-y-1/2"
          style={{
            left: `${(row.continuousPixelX / 384) * 100}%`,
            bottom: `${(row.continuousPixelY / 384) * 100}%`,
          }}
          title={`${row.rayId}: (${row.continuousPixelX.toFixed(3)}, ${row.continuousPixelY.toFixed(3)})`}
        >
          <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/15" />
          <span className="block h-2.5 w-2.5 rotate-45 border border-cyan-100/75 bg-cyan-200/20 shadow-[0_0_18px_rgba(103,232,249,.5)]" />
          <span className="absolute left-4 top-[-4px] whitespace-nowrap text-[8px] text-cyan-50/65">
            D{index}
          </span>
        </div>
      ))}
      <div className="absolute bottom-3 left-4 text-[8px] text-slate-400/40">
        坐标标记，不是亮度图像
      </div>
    </div>
  );
}

function MetricGrid({
  sourceRows,
  deposits,
  weightResidual,
  electronResidual,
}: Readonly<{
  sourceRows: number;
  deposits: number;
  weightResidual: number;
  electronResidual: number;
}>) {
  const metrics = [
    ["source coordinates", String(sourceRows)],
    ["sparse deposits", String(deposits)],
    ["max Σw − 1", weightResidual.toExponential(2)],
    ["max electron Δrel", electronResidual.toExponential(2)],
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-px bg-white/7">
      {metrics.map(([label, value]) => (
        <div key={label} className="bg-[#040b0e] px-3 py-4">
          <div className="text-[8px] uppercase tracking-[.12em] text-slate-400/40">
            {label}
          </div>
          <div className="mt-1 text-sm text-cyan-100/75">{value}</div>
        </div>
      ))}
    </div>
  );
}

function Boundary({
  label,
  value,
  good = false,
}: Readonly<{ label: string; value: string; good?: boolean }>) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/6 py-1.5">
      <span className="text-slate-400/45">{label}</span>
      <span className={good ? "text-cyan-100/70" : "text-amber-100/65"}>
        {value}
      </span>
    </div>
  );
}

function RayReadout({ row }: Readonly<{ row: KerrDetectorExpectedImageRowV450 }>) {
  return (
    <article className="bg-[#03090c] p-3">
      <div className="flex items-center justify-between text-[9px] uppercase tracking-[.12em]">
        <span className="text-cyan-100/65">{row.rayId}</span>
        <span className="text-slate-400/35">ray {row.rayIndex}</span>
      </div>
      <div className="mt-3 space-y-1 text-[9px] text-slate-300/45">
        <div>x {row.continuousPixelX.toFixed(6)}</div>
        <div>y {row.continuousPixelY.toFixed(6)}</div>
        <div>{row.deposits.length} pixel deposits</div>
        <div>{row.sourceExpectedElectrons.toExponential(4)} e⁻ fixture</div>
      </div>
    </article>
  );
}
