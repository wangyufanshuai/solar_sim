"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import {
  getAtlasCalibrationHudModeSnapshotV506,
  subscribeAtlasCalibrationHudModeV506,
} from "../lib/atlasCalibrationHudModeStoreV506";
import { resolveAtlasScienceCinematicV7V457 } from "../lib/atlasScienceCinematicV7V457";
import {
  getKerrScienceProductEligibilityGraphSnapshotV512,
  loadKerrScienceProductEligibilityGraphSummaryV512,
  subscribeKerrScienceProductEligibilityGraphV512,
} from "../lib/kerrScienceProductEligibilityGraphClientV512";

export default function KerrScienceProductEligibilityGraphV512() {
  const state = useSyncExternalStore(
    subscribeKerrScienceProductEligibilityGraphV512,
    getKerrScienceProductEligibilityGraphSnapshotV512,
    getKerrScienceProductEligibilityGraphSnapshotV512,
  );
  const mode = useSyncExternalStore(
    subscribeAtlasCalibrationHudModeV506,
    getAtlasCalibrationHudModeSnapshotV506,
    getAtlasCalibrationHudModeSnapshotV506,
  );
  useEffect(() => {
    void loadKerrScienceProductEligibilityGraphSummaryV512().catch(() => undefined);
  }, []);
  const tokens = resolveAtlasScienceCinematicV7V457(mode.mode);
  const style = {
    "--v512-panel": tokens.productGate.panel,
    "--v512-ink": tokens.productGate.ink,
    "--v512-grid": tokens.productGate.grid,
    "--v512-qualified": tokens.productGate.qualified,
    "--v512-blocked": tokens.productGate.blocked,
    "--v512-rail": tokens.productGate.railOpacity,
    "--v512-glow": tokens.productGate.blockerGlow,
  } as CSSProperties;
  const summary = state.summary;
  return (
    <section
      className="relative mt-7 overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_86%_0%,color-mix(in_srgb,var(--v512-blocked)_10%,transparent),transparent_30%),linear-gradient(145deg,var(--v512-panel),#020609_62%,#090503)] p-5 font-mono text-[var(--v512-ink)] shadow-[0_60px_200px_rgba(0,0,0,.75)] sm:p-8"
      data-atlas-kerr-science-product-eligibility-v512
      data-atlas-v512-node-count="10"
      data-atlas-v512-product-count="6"
      data-atlas-v512-request-budget-after-explicit-detail="1"
      data-atlas-v512-solar-first-screen-request-count="0"
      data-atlas-v512-visual-profile="science-cinematic-v7-v457"
      data-atlas-v512-mode={mode.mode}
      data-atlas-v512-detector-image-authority="false"
      data-atlas-v512-fits-write="false"
      data-atlas-v512-png-write="false"
      data-atlas-v512-scientific-field-mutation="false"
      data-atlas-v512-canvas-created="false"
      data-atlas-v512-scene-revision-delta="0"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(var(--v512-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v512-grid)_1px,transparent_1px)] [background-size:42px_42px]" />
      <header className="relative grid gap-5 border-b border-white/10 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="text-[9px] uppercase tracking-[.42em] opacity-50">
            V512 / Science Product Eligibility Graph
          </div>
          <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.035em] sm:text-5xl">
            坐标可以成为证据，缺失的像素不能成为图像
          </h2>
          <p className="mt-4 max-w-3xl text-[10px] leading-6 opacity-55">
            图结构连接 FITS header、WCS 坐标、稀疏 photon observable、detector response、dense campaign
            与重型资格。Science 允许展示坐标和光子表；Cinematic 可用固定 seed 风格化坐标，但两者都不得宣称 detector image。
          </p>
        </div>
        <div className="border border-[var(--v512-blocked)]/25 bg-[var(--v512-blocked)]/[.04] px-5 py-4 text-right">
          <div className="text-[8px] uppercase tracking-[.2em] opacity-40">product promotion</div>
          <div className="mt-1 text-3xl font-light text-[var(--v512-blocked)]">HOLD</div>
          <div className="mt-1 text-[8px] opacity-35">FITS 0 · PNG 0 · pixels 0</div>
        </div>
      </header>

      {!summary ? (
        <div className="relative mt-6 border-l-2 border-[var(--v512-blocked)]/50 bg-white/[.025] px-4 py-4 text-[10px] opacity-60">
          {state.status === "idle" || state.status === "loading"
            ? "正在读取 bounded eligibility graph…"
            : `Eligibility graph 不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            {summary.nodes.map((node, index) => {
              const qualified = node.status === "qualified";
              return (
                <article
                  className="relative overflow-hidden border border-white/10 bg-black/25 p-4"
                  data-atlas-v512-node={node.id}
                  data-atlas-v512-node-status={node.status}
                  key={node.id}
                >
                  <div
                    className={`absolute inset-y-0 left-0 w-px ${qualified ? "bg-[var(--v512-qualified)]" : "bg-[var(--v512-blocked)]"}`}
                    style={{ opacity: qualified ? 0.75 : "var(--v512-rail)" }}
                  />
                  <div className="flex justify-between text-[8px] uppercase tracking-[.16em] opacity-40">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span className={qualified ? "text-[var(--v512-qualified)]" : "text-[var(--v512-blocked)]"}>
                      {node.status}
                    </span>
                  </div>
                  <h3 className="mt-3 min-h-10 text-[11px] leading-5">{node.id}</h3>
                  <div className="mt-2 text-[7px] uppercase tracking-[.12em] opacity-35">
                    {node.authorityClass}
                  </div>
                  <p className="mt-3 min-h-12 text-[8px] leading-4 opacity-30">{node.reason}</p>
                  <div className="mt-3 border-t border-white/8 pt-3 text-[7px] opacity-30">
                    rows {node.availableRows} · measured {node.measuredRows}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="relative mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {summary.products.map((product) => (
              <article className="border border-white/10 bg-black/20 p-4" key={product.id}>
                <div className="flex items-center justify-between gap-3 text-[8px] uppercase tracking-[.14em]">
                  <span>{product.id}</span>
                  <span className={product.availability === "blocked" ? "text-[var(--v512-blocked)]" : "text-[var(--v512-qualified)]"}>
                    {product.availability}
                  </span>
                </div>
                <p className="mt-3 text-[8px] leading-4 opacity-35">{product.reason}</p>
                <div className="mt-3 flex gap-3 border-t border-white/8 pt-3 text-[7px] opacity-30">
                  <span>science {String(product.scienceAuthority)}</span>
                  <span>detector image false</span>
                </div>
              </article>
            ))}
          </div>

          <div className="relative mt-5 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-6">
            <Metric label="header cards" value="22" />
            <Metric label="coordinates" value="4" />
            <Metric label="photon rows" value="4" />
            <Metric label="pixel values" value="0" />
            <Metric label="FITS HDU" value="0" />
            <Metric label="PNG" value="0" />
          </div>
          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase tracking-[.12em] opacity-40">
            <span>Science linear · bloom 0 · grade 0 · Cinematic seeded · scientific fields immutable</span>
            <a
              className="border border-white/12 px-3 py-2 hover:border-white/30"
              href="/api/atlas/relativity-evidence/v512/science-product-eligibility?download=graph"
            >
              Export eligibility graph
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-black/35 px-3 py-3 text-center">
      <div className="text-[7px] uppercase tracking-[.14em] opacity-30">{label}</div>
      <div className="mt-1 text-[11px] opacity-75">{value}</div>
    </div>
  );
}
