"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";

import {
  getKerrPhotonEvidenceWorkbenchSnapshotV480,
  loadKerrPhotonEvidenceWorkbenchSummaryV480,
  subscribeKerrPhotonEvidenceWorkbenchV480,
} from "../lib/kerrPhotonEvidenceWorkbenchClientV480";

const STAGE_LABELS = Object.freeze({
  "v475-dual-render-boundary": "双渲染边界",
  "v476-product-admission": "科研产品准入",
  "v479-frequency-provenance": "频率 provenance",
});

export default function KerrPhotonEvidenceWorkbenchV480() {
  const state = useSyncExternalStore(
    subscribeKerrPhotonEvidenceWorkbenchV480,
    getKerrPhotonEvidenceWorkbenchSnapshotV480,
    getKerrPhotonEvidenceWorkbenchSnapshotV480,
  );
  const [mode, setMode] = useState<"science" | "cinematic">("science");

  useEffect(() => {
    void loadKerrPhotonEvidenceWorkbenchSummaryV480().catch(() => undefined);
  }, []);

  const summary = state.summary;
  const presentation = summary?.presentation[mode];
  const style = {
    "--v480-accent": mode === "science" ? "#9cecff" : "#ffb184",
    "--v480-glow": mode === "science" ? "rgba(89,220,255,.12)" : "rgba(255,145,96,.12)",
  } as CSSProperties;

  return (
    <section
      className="relative mt-7 overflow-hidden rounded-[42px] border border-white/10 bg-[#040708] p-5 text-slate-100 shadow-[0_56px_170px_rgba(0,0,0,.72)] sm:p-8"
      data-atlas-kerr-photon-evidence-workbench-v480
      data-atlas-v480-mode={mode}
      data-atlas-v480-stage-count={summary?.stages.length ?? 0}
      data-atlas-v480-product-count={summary?.products.length ?? 0}
      data-atlas-v480-frequency-buffer-shared={
        summary?.buffers.scienceViewAndCinematicViewShareFrequencyBuffer ? "true" : "false"
      }
      data-atlas-v480-science-writeback="false"
      data-atlas-v480-scene-revision-delta="0"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,var(--v480-glow),transparent_32%),radial-gradient(circle_at_92%_20%,rgba(255,255,255,.045),transparent_25%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:54px_54px]" />

      <header className="relative grid gap-6 border-b border-white/10 pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.42em] text-white/35">
            V480 / photon evidence observatory
          </div>
          <h2 className="mt-4 max-w-4xl font-serif text-3xl tracking-[.045em] text-white/90 sm:text-5xl">
            稀疏真值与生产边界，同屏但不混同
          </h2>
          <p className="mt-4 max-w-3xl font-mono text-[11px] leading-6 text-white/45">
            工作台同时展示双渲染隔离、九类产品准入和 frequency provenance。稀疏 Science
            buffer 与 normalized-frequency buffer 保留独立身份；Science 和 Cinematic
            只共享后者，不能写回任何科研字段。
          </p>
        </div>
        <div className="flex border border-white/10 bg-black/40 p-1 font-mono text-[9px] uppercase tracking-[.18em]">
          {(["science", "cinematic"] as const).map((entry) => (
            <button
              className={
                "px-4 py-2.5 transition-colors " +
                (mode === entry
                  ? "bg-[var(--v480-accent)] text-black"
                  : "text-white/35 hover:text-white/70")
              }
              key={entry}
              onClick={() => setMode(entry)}
              type="button"
            >
              {entry}
            </button>
          ))}
        </div>
      </header>

      {!summary || !presentation ? (
        <div
          className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-3 font-mono text-[10px] text-white/50"
          data-atlas-v480-load-state={state.status}
        >
          {state.status === "idle" || state.status === "loading"
            ? "正在读取 photon evidence workbench……"
            : `Photon evidence 不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-7 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
            <article className="border border-white/10 bg-black/30 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 font-mono text-[8px] uppercase tracking-[.2em] text-white/35">
                <span>authority chain</span>
                <span className="text-[var(--v480-accent)]">3 / 3 verified</span>
              </div>
              <div className="mt-5 space-y-3">
                {summary.stages.map((stage, index) => (
                  <div
                    className="grid grid-cols-[auto_1fr] gap-4 border-b border-white/8 pb-4"
                    data-atlas-v480-stage={stage.id}
                    key={stage.id}
                  >
                    <span className="font-serif text-3xl text-white/12">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="font-mono text-[9px] text-white/70">
                        {STAGE_LABELS[stage.id]}
                      </div>
                      <div className="mt-1 font-mono text-[8px] leading-4 text-white/30">
                        {stage.status}
                      </div>
                      <div className="mt-2 font-mono text-[8px] text-[var(--v480-accent)]/65">
                        {stage.artifactSha256.slice(0, 20)}…
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 font-mono text-[8px]">
                <Metric label="sparse buffer" value="4 rays" />
                <Metric label="frequency chart" value="20 samples" />
                <Metric label="source chain" value="5 stages" />
                <Metric label="dense campaign" value="0 / 49" />
              </div>
            </article>

            <article className="border border-white/10 bg-white/[.025] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[8px] uppercase tracking-[.2em] text-white/35">
                <span>science product admission</span>
                <span>
                  <b className="font-normal text-emerald-200/75">2 allowed</b>
                  <span className="mx-2 text-white/15">/</span>
                  <b className="font-normal text-amber-200/70">7 blocked</b>
                </span>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {summary.products.map((product) => (
                  <div
                    className={
                      "border p-3 font-mono " +
                      (product.available
                        ? "border-emerald-200/15 bg-emerald-100/[.035]"
                        : "border-amber-200/10 bg-amber-100/[.025]")
                    }
                    data-atlas-v480-product={product.id}
                    data-atlas-v480-product-available={product.available}
                    key={product.id}
                  >
                    <div className="flex items-start justify-between gap-3 text-[8px]">
                      <span className="text-white/65">{product.label}</span>
                      <span className={product.available ? "text-emerald-200/75" : "text-amber-200/65"}>
                        {product.available ? "ready" : "blocked"}
                      </span>
                    </div>
                    <div className="mt-2 text-[7px] leading-4 text-white/28">
                      {product.available ? `${product.recordCount} sparse records` : product.status}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="relative mt-5 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-stretch">
            <div className="border border-[var(--v480-accent)]/15 bg-[var(--v480-glow)] p-5 font-mono">
              <div className="text-[8px] uppercase tracking-[.2em] text-[var(--v480-accent)]">
                {mode} presentation / scientific mutation 0
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <Metric label="exposure" value={presentation.exposure.toFixed(2)} />
                <Metric label="bloom" value={presentation.bloomIntensity.toFixed(2)} />
                <Metric label="grain" value={presentation.grain.toFixed(3)} />
                <Metric label="writeback" value="forbidden" />
              </div>
              <div className="mt-4 break-all border-t border-white/10 pt-3 text-[8px] leading-5 text-white/30">
                FREQUENCY SHA / {summary.buffers.normalizedFrequencyBufferSha256}
                <br />
                SPARSE SCIENCE SHA / {summary.buffers.sparseScienceBufferSha256}
              </div>
            </div>
            <div className="grid min-w-[250px] gap-2 border border-white/10 bg-black/30 p-5 font-mono text-[8px]">
              <Boundary label="absolute frequency" value="blocked" />
              <Boundary label="physical bandpass" value="blocked" />
              <Boundary label="observed intensity" value="blocked" />
              <Boundary label="measured Stokes" value="blocked" />
              <Boundary label="science raster" value="blocked" />
              <Boundary label="browser qualification" value="not-run" />
            </div>
          </div>

          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[8px] uppercase tracking-[.14em] text-white/35">
            <span>Canvas 1 · sceneRevision Δ0 · resources baseline · images 0</span>
            <a
              className="border border-white/10 px-3 py-1.5 transition-colors hover:border-[var(--v480-accent)]/50 hover:text-[var(--v480-accent)]"
              href="/api/atlas/relativity-evidence/v480/photon-evidence-workbench?download=workbench"
            >
              导出统一 evidence envelope
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-white/10 pl-3">
      <div className="text-[7px] uppercase tracking-[.15em] text-white/30">{label}</div>
      <div className="mt-1 text-[10px] text-[var(--v480-accent)]">{value}</div>
    </div>
  );
}

function Boundary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-2">
      <span className="text-white/35">{label}</span>
      <span className="text-amber-200/65">{value}</span>
    </div>
  );
}
