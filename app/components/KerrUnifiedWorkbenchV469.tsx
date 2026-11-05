"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";

import { resolveAtlasScienceCinematicV7V457 } from "../lib/atlasScienceCinematicV7V457";
import {
  getKerrUnifiedWorkbenchSnapshotV469,
  loadKerrUnifiedWorkbenchSummaryV469,
  subscribeKerrUnifiedWorkbenchV469,
} from "../lib/kerrUnifiedWorkbenchClientV469";

const STAGE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  "v463-payload-admission": "Payload admission",
  "v464-provenance": "Measured provenance",
  "v465-response": "Detector response",
  "v466-radiative-transfer": "Radiative transfer",
  "v467-thin-disk": "Analytic thin disk",
  "v468-coupling": "Emission coupling",
});

const STATUS_COPY = Object.freeze({
  idle: "正在准备 unified workbench evidence…",
  loading: "正在读取 unified workbench evidence…",
});

export default function KerrUnifiedWorkbenchV469() {
  const state = useSyncExternalStore(
    subscribeKerrUnifiedWorkbenchV469,
    getKerrUnifiedWorkbenchSnapshotV469,
    getKerrUnifiedWorkbenchSnapshotV469,
  );
  const tokens = resolveAtlasScienceCinematicV7V457("science");

  useEffect(() => {
    void loadKerrUnifiedWorkbenchSummaryV469().catch(() => undefined);
  }, []);

  const style = {
    "--v469-ink": tokens.productGate.ink,
    "--v469-panel": tokens.productGate.panel,
    "--v469-grid": tokens.productGate.grid,
    "--v469-ready": tokens.productGate.qualified,
    "--v469-blocked": tokens.productGate.blocked,
  } as CSSProperties;
  const summary = state.summary;

  return (
    <section
      className="relative mt-6 overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_92%_0%,rgba(34,211,238,.12),transparent_28%),linear-gradient(145deg,var(--v469-panel),#020609_58%,#041014)] p-5 font-mono text-[var(--v469-ink)] shadow-[0_34px_120px_rgba(0,0,0,.56)] sm:p-7"
      data-atlas-unified-kerr-workbench-v469
      data-atlas-v469-stage-count={summary?.stages.length ?? 0}
      data-atlas-v469-lifecycle-baseline={
        summary?.lifecycle.allResourcesAtBaseline ? "true" : "false"
      }
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(var(--v469-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v469-grid)_1px,transparent_1px)] [background-size:44px_44px]" />

      <header className="relative grid gap-5 border-b border-white/10 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="text-[9px] uppercase tracking-[.34em] opacity-45">
            V469 / unified Kerr observatory
          </div>
          <h2 className="mt-3 max-w-4xl font-serif text-3xl tracking-[.08em] sm:text-4xl">
            六道证据，一条可追溯的轨道
          </h2>
          <p className="mt-3 max-w-3xl text-[11px] leading-6 opacity-55">
            只读汇总 v463–v468 的资格、SHA、失败原因与生命周期基线；完整
            ray/pixel 数组留在白名单 artifact，不进入 React 状态。
          </p>
        </div>
        <div className="border border-[var(--v469-blocked)]/30 bg-[var(--v469-blocked)]/[.04] px-4 py-3 text-right">
          <div className="text-[8px] uppercase tracking-[.2em] opacity-45">authority</div>
          <div className="mt-1 text-2xl font-light text-[var(--v469-blocked)]">
            NOT GRANTED
          </div>
        </div>
      </header>

      {!summary ? (
        <div
          className="relative mt-5 border-l-2 border-white/20 bg-white/[.025] px-4 py-3 text-[10px] opacity-60"
          data-atlas-v469-load-state={state.status}
        >
          {state.status === "idle" || state.status === "loading"
            ? STATUS_COPY[state.status]
            : `Workbench evidence 不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {summary.stages.map((stage, index) => (
              <article
                className="group border border-white/10 bg-black/25 p-4 transition-colors hover:border-cyan-100/20"
                data-atlas-v469-stage={stage.id}
                data-atlas-v469-stage-status={stage.status}
                key={stage.id}
              >
                <div className="flex items-center justify-between gap-3 text-[8px] uppercase tracking-[.15em] opacity-45">
                  <span>
                    {String(index + 1).padStart(2, "0")} / {STAGE_LABELS[stage.id] ?? stage.id}
                  </span>
                  <span className="text-[var(--v469-blocked)]">blocked</span>
                </div>
                <div className="mt-3 text-[10px] leading-5 opacity-60">{stage.reason}</div>
                <div className="mt-3 text-[8px] tracking-[.08em] text-cyan-100/45">
                  SHA {stage.artifactSha256.slice(0, 12)}… · pixels {stage.sciencePixelRows}
                </div>
              </article>
            ))}
          </div>

          <div className="relative mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="border border-white/10 bg-black/25 p-5">
              <div className="text-[9px] uppercase tracking-[.22em] opacity-45">
                lifecycle baseline
              </div>
              <p className="mt-2 text-[10px] leading-5 opacity-45">
                新 Canvas = {summary.lifecycle.newCanvasCreated ? "yes" : "no"} ·
                sceneRevision Δ = {summary.lifecycle.sceneRevisionDelta} · Worker {summary.lifecycle.workers}
                {" · "}texture {summary.lifecycle.textures} · GPU buffer {summary.lifecycle.gpuBuffers}
                {" · "}object URL {summary.lifecycle.objectUrls} · camera lease {summary.lifecycle.cameraLeases}
              </p>
            </div>
            <div className="grid min-w-[220px] gap-2 text-[9px]">
              <QualificationRow label="stage summary" value="qualified" />
              <QualificationRow label="SHA chain" value="qualified" />
              <QualificationRow label="dense" value="0 / 49" />
              <QualificationRow label="browser" value="not-run" />
            </div>
          </div>

          <footer className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-[8px] uppercase tracking-[.14em] opacity-45">
            <span>science/cinematic separated · Lite unavailable · pixel rows 0</span>
            <a
              className="border border-white/10 px-3 py-1.5 transition-colors hover:border-white/30 hover:opacity-90"
              href="/api/atlas/relativity-evidence/v469/unified-workbench?download=workbench"
            >
              导出统一证据
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function QualificationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/7 pb-2">
      <span className="opacity-35">{label}</span>
      <span className="text-[var(--v469-blocked)]">{value}</span>
    </div>
  );
}
