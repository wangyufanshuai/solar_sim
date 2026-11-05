"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";

import {
  getKerrDualRenderSnapshotV475,
  loadKerrDualRenderSummaryV475,
  subscribeKerrDualRenderV475,
} from "../lib/kerrDualRenderBoundaryClientV475";
import { resolveKerrDualRenderViewV475 } from "../lib/kerrDualRenderBoundaryV475";

export default function KerrDualRenderBoundaryV475() {
  const state = useSyncExternalStore(
    subscribeKerrDualRenderV475,
    getKerrDualRenderSnapshotV475,
    getKerrDualRenderSnapshotV475,
  );
  const [mode, setMode] = useState<"science" | "cinematic">("science");

  useEffect(() => {
    void loadKerrDualRenderSummaryV475().catch(() => undefined);
  }, []);

  const scienceView = state.summary ? resolveKerrDualRenderViewV475(state.summary, "science") : null;
  const cinematicView = state.summary
    ? resolveKerrDualRenderViewV475(state.summary, "cinematic")
    : null;
  const active = mode === "science" ? scienceView : cinematicView;
  const sharedBuffer = Boolean(
    scienceView &&
      cinematicView &&
      scienceView.scienceBuffer === cinematicView.scienceBuffer &&
      scienceView.scienceBufferSha256 === cinematicView.scienceBufferSha256,
  );
  const presentation = active?.presentation;
  const style = {
    "--v475-accent": mode === "science" ? "#82f6ff" : "#ff9d69",
    "--v475-soft": mode === "science" ? "rgba(130,246,255,.13)" : "rgba(255,157,105,.13)",
  } as CSSProperties;

  return (
    <section
      className="relative mt-7 overflow-hidden rounded-[42px] border border-white/10 bg-[#030708] p-5 text-[#e6fbff] shadow-[0_54px_170px_rgba(0,0,0,.72)] sm:p-8"
      data-atlas-kerr-dual-render-v475
      data-atlas-v475-mode={mode}
      data-atlas-v475-shared-science-buffer={sharedBuffer}
      data-atlas-v475-scientific-mutation="false"
      data-atlas-v475-scene-revision-delta="0"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(130,246,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(130,246,255,.055)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full bg-[var(--v475-soft)] blur-3xl" />

      <header className="relative grid gap-7 border-b border-white/10 pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.4em] text-white/35">
            V475 / dual render boundary
          </div>
          <h2 className="mt-4 max-w-4xl font-serif text-3xl tracking-[.05em] text-white/90 sm:text-5xl">
            同一份科学缓冲区，两种不可串写的观看方式
          </h2>
          <p className="mt-4 max-w-3xl font-mono text-[11px] leading-6 text-white/45">
            Science 保持线性、无辉光、无颗粒；Cinematic 只改变展示参数。分类、发射半径、红移、EVPA、坐标和未测量的强度与 Stokes 始终来自同一个只读缓冲区。
          </p>
        </div>
        <div className="flex border border-white/10 bg-black/35 p-1 font-mono text-[9px] uppercase tracking-[.18em]">
          {(["science", "cinematic"] as const).map((entry) => (
            <button
              className={
                "px-4 py-2.5 transition-colors " +
                (mode === entry
                  ? "bg-[var(--v475-accent)] text-black"
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

      {!state.summary || !active || !presentation ? (
        <div
          className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-3 font-mono text-[10px] text-white/50"
          data-atlas-v475-load-state={state.status}
        >
          {state.status === "idle" || state.status === "loading"
            ? "正在读取双渲染边界证据……"
            : "双渲染边界不可用 / " + (state.reason ?? "request-failed")}
        </div>
      ) : (
        <>
          <div className="relative mt-7 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
            <article className="border border-white/10 bg-black/30 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[8px] uppercase tracking-[.18em] text-white/35">
                <span>immutable science buffer / 4 disk rays</span>
                <span className="text-[var(--v475-accent)]">shared identity {sharedBuffer ? "yes" : "no"}</span>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {active.scienceBuffer.rayIds.map((rayId, index) => (
                  <div className="border border-white/8 bg-white/[.025] p-4" key={rayId}>
                    <div className="flex items-center justify-between font-mono text-[8px] text-white/35">
                      <span>{rayId}</span>
                      <span>{active.scienceBuffer.classification[index]}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 font-mono">
                      <Datum label="r / M" value={format(active.scienceBuffer.emissionRadiusM[index])} />
                      <Datum label="g" value={format(active.scienceBuffer.redshiftFactor[index])} />
                      <Datum label="EVPA" value={format(active.scienceBuffer.evpaDeg[index]) + "°"} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 break-all border-t border-white/10 pt-4 font-mono text-[8px] leading-5 text-white/30">
                SCIENCE BUFFER SHA / {active.scienceBufferSha256}
              </div>
            </article>

            <aside className="border border-[var(--v475-accent)]/20 bg-[var(--v475-soft)] p-5 sm:p-6">
              <div className="font-mono text-[8px] uppercase tracking-[.2em] text-[var(--v475-accent)]">
                presentation buffer / {mode}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10">
                <Metric label="linear" value={presentation.linearDisplay ? "on" : "off"} />
                <Metric label="exposure" value={presentation.exposure.toFixed(2)} />
                <Metric label="bloom" value={presentation.bloomIntensity.toFixed(3)} />
                <Metric label="grade" value={presentation.colorGradeIntensity.toFixed(3)} />
                <Metric label="grain" value={presentation.grain.toFixed(3)} />
                <Metric label="chromatic" value={presentation.chromaticAberration.toFixed(3)} />
                <Metric label="vignette" value={presentation.vignette.toFixed(3)} />
                <Metric label="seed" value={presentation.seed ? "fixed" : "none"} />
              </div>
              <div className="mt-5 space-y-2 font-mono text-[8px]">
                <Boundary label="scientific fields in presentation" value="0" />
                <Boundary label="science writeback" value="forbidden" />
                <Boundary label="sceneRevision delta" value="0" />
                <Boundary label="new Canvas" value="0" />
              </div>
            </aside>
          </div>

          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[8px] uppercase tracking-[.14em] text-white/35">
            <span>sparse authority 4/4 · dense 0/49 · science pixels 0 · browser not-run</span>
            <a
              className="border border-white/10 px-3 py-1.5 transition-colors hover:border-[var(--v475-accent)]/50 hover:text-[var(--v475-accent)]"
              href="/api/atlas/relativity-evidence/v475/dual-render-boundary?download=dual-render"
            >
              导出边界证据
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Datum({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[7px] uppercase tracking-[.12em] text-white/25">{label}</div>
      <div className="mt-1 text-[10px] text-[var(--v475-accent)]">{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/45 px-3 py-3 font-mono">
      <div className="text-[7px] uppercase tracking-[.12em] text-white/30">{label}</div>
      <div className="mt-1 text-[10px] text-[var(--v475-accent)]">{value}</div>
    </div>
  );
}

function Boundary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-2">
      <span className="text-white/35">{label}</span>
      <span className="text-[var(--v475-accent)]">{value}</span>
    </div>
  );
}

function format(value: number): string {
  if (value === 0) return "0";
  if (Math.abs(value) < 0.001 || Math.abs(value) >= 1000) return value.toExponential(4);
  return value.toPrecision(7);
}
