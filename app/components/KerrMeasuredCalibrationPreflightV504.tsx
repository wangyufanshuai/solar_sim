"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import {
  bindAtlasCalibrationHudV505,
} from "../lib/atlasCalibrationHudProfileV505";
import {
  getAtlasCalibrationHudModeSnapshotV506,
  setAtlasCalibrationHudModeV506,
  subscribeAtlasCalibrationHudModeV506,
} from "../lib/atlasCalibrationHudModeStoreV506";
import {
  getAtlasCalibrationPreflightSnapshotV508,
  loadAtlasCalibrationPreflightV508,
  subscribeAtlasCalibrationPreflightV508,
} from "../lib/atlasCalibrationEvidenceClientV508";

export default function KerrMeasuredCalibrationPreflightV504() {
  const state = useSyncExternalStore(
    subscribeAtlasCalibrationPreflightV508,
    getAtlasCalibrationPreflightSnapshotV508,
    getAtlasCalibrationPreflightSnapshotV508,
  );
  const modeSnapshot = useSyncExternalStore(
    subscribeAtlasCalibrationHudModeV506,
    getAtlasCalibrationHudModeSnapshotV506,
    getAtlasCalibrationHudModeSnapshotV506,
  );
  const mode = modeSnapshot.mode;
  const binding = bindAtlasCalibrationHudV505(mode, state.summary);
  const profile = binding.profile;
  const summary = binding.sciencePayload;
  const style = {
    "--v504-panel": profile.tokens.panel,
    "--v504-panel-raised": profile.tokens.panelRaised,
    "--v504-ink": profile.tokens.ink,
    "--v504-muted": profile.tokens.mutedInk,
    "--v504-accent": profile.tokens.accent,
    "--v504-wash": profile.tokens.accentWash,
    "--v504-warning": profile.tokens.warning,
    "--v504-blocked": profile.tokens.blocked,
    "--v504-grid": profile.tokens.grid,
    "--v504-grid-opacity": profile.tokens.gridOpacity,
    "--v504-glow": profile.tokens.glowOpacity,
    "--v504-transition": `${profile.tokens.transitionMs}ms`,
  } as CSSProperties;
  return (
    <section
      className="relative mt-7 overflow-hidden rounded-[34px] border border-white/10 bg-[var(--v504-panel)] p-5 text-[var(--v504-ink)] shadow-[0_60px_190px_rgba(0,0,0,.74)] transition-colors duration-[var(--v504-transition)] sm:p-8"
      data-atlas-kerr-measured-calibration-preflight-v504
      data-atlas-v504-request-count={state.status === "idle" ? 0 : 1}
      data-atlas-v504-authority-granted="false"
      data-atlas-v504-runtime-projection="false"
      data-atlas-v504-science-raster="false"
      data-atlas-v504-scene-revision-delta="0"
      data-atlas-v505-hud-mode={mode}
      data-atlas-v506-hud-mode-store="external"
      data-atlas-v506-hud-revision={modeSnapshot.hudRevision}
      data-atlas-v505-science-payload-reference-preserved="true"
      data-atlas-v505-scientific-field-mutation="false"
      data-atlas-v508-evidence-store="external-single-flight"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,var(--v504-wash),transparent_33%),linear-gradient(var(--v504-grid)_1px,transparent_1px)] bg-[size:auto,44px_44px] opacity-[calc(var(--v504-grid-opacity)+var(--v504-glow))]" />
      <header className="relative grid gap-5 border-b border-white/10 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.38em] text-[var(--v504-accent)]/60">
            V504 / explicit read-only preflight
          </div>
          <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.04em] text-white/90 sm:text-5xl">
            先验收文件，再讨论探测器响应
          </h2>
          <p className="mt-4 max-w-3xl font-mono text-[10px] leading-6 text-[var(--v504-muted)]">
            统一 CLI 只读取六个白名单文件，拒绝 symlink、目录与越界大小；报告只保存状态、原因、bytes
            和 SHA，不保存文件内容，也不会授予 measured authority。
          </p>
        </div>
        <div className="flex border border-white/10 bg-black/30 p-0.5 font-mono">
          {(["science", "cinematic"] as const).map((entry) => (
            <button
              className={
                mode === entry
                  ? "bg-[var(--v504-accent)] px-3 py-2 text-[8px] uppercase text-black"
                  : "px-3 py-2 text-[8px] uppercase text-white/35"
              }
              key={entry}
              onClick={() => setAtlasCalibrationHudModeV506(entry)}
              type="button"
            >
              {entry}
            </button>
          ))}
        </div>
      </header>
      {state.status === "idle" ? (
        <div className="relative mt-6 border border-dashed border-cyan-100/20 bg-white/[.018] p-5">
          <p className="font-mono text-[10px] leading-5 text-white/42">
            加载最近一次显式 CLI preflight。这个按钮不会重新扫描 staging，也不会启动网络或计算任务。
          </p>
          <button
            className="atlas-accessible-focus mt-4 border border-cyan-100/30 bg-cyan-100/[.055] px-4 py-2 font-mono text-[9px] uppercase tracking-[.16em] text-cyan-100/75"
            onClick={() => void loadAtlasCalibrationPreflightV508().catch(() => undefined)}
            type="button"
          >
            Load latest preflight
          </button>
        </div>
      ) : null}
      {state.status === "loading" ? (
        <div className="relative mt-6 font-mono text-[10px] text-white/45">
          Verifying canonical preflight and source SHA…
        </div>
      ) : null}
      {state.status === "unavailable" ? (
        <div className="relative mt-6 border-l-2 border-red-300/70 px-4 py-2 font-mono text-[10px] text-red-100/60">
          Preflight unavailable / {state.reason}
        </div>
      ) : null}
      {summary ? (
        <>
          <div className="relative mt-6 grid grid-cols-2 gap-px border border-white/10 bg-white/10 font-mono sm:grid-cols-5">
            <Metric label="status" value={summary.status.replace("blocked-", "")} />
            <Metric label="ready" value={`${summary.observation.readyFileCount} / 6`} />
            <Metric label="bytes read" value={String(summary.observation.bytesRead)} />
            <Metric label="root safe" value={String(summary.observation.stagingRootSafe)} />
            <Metric label="authority" value="false" />
          </div>
          <div className="relative mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {summary.observation.files.map((file) => (
              <article
                className="border border-white/10 bg-black/25 p-4"
                data-atlas-v504-file={file.id}
                data-atlas-v504-file-status={file.status}
                key={file.id}
              >
                <div className="flex justify-between gap-3 font-mono text-[8px] uppercase tracking-[.16em] text-white/32">
                  <span>{file.fileName}</span>
                  <span
                    className={
                      file.status === "ready"
                        ? "text-cyan-100/70"
                        : file.status === "invalid"
                          ? "text-amber-200/75"
                          : "text-red-200/70"
                    }
                  >
                    {file.status}
                  </span>
                </div>
                <div className="mt-4 font-serif text-xl text-white/75">{file.id}</div>
                <div className="mt-3 font-mono text-[8px] leading-4 text-white/30">
                  {file.reasons.length ? file.reasons.join(" · ") : "schema and provenance checks passed"}
                </div>
                <div className="mt-3 truncate font-mono text-[7px] text-white/22">
                  {file.sha256 ?? "SHA unavailable"}
                </div>
              </article>
            ))}
          </div>
          <div className="relative mt-5 grid gap-3 border border-white/10 bg-black/25 p-5 font-mono text-[9px] sm:grid-cols-2">
            <div>
              <div className="uppercase tracking-[.18em] text-white/30">next action</div>
              <div className="mt-2 text-[var(--v504-warning)]/70">{summary.decision.nextAction}</div>
            </div>
            <div className="sm:text-right">
              <div className="uppercase tracking-[.18em] text-white/30">explicit rerun</div>
              <code className="mt-2 block text-cyan-100/55">
                npm run atlas -- relativity detector-calibration-v504-preflight
              </code>
            </div>
          </div>
          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[8px] text-white/30">
            <span>no staging write · no network · no retry · response/intensity/raster unavailable</span>
            <a
              className="border border-white/12 px-3 py-1.5 text-white/50"
              href="/api/atlas/relativity-evidence/v504/detector-calibration-preflight?download=preflight"
            >
              export preflight JSON
            </a>
          </footer>
        </>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="min-w-0 bg-[var(--v504-panel-raised)] px-3 py-3 text-center">
      <div className="truncate text-[7px] uppercase tracking-[.15em] text-white/25">{label}</div>
      <div className="mt-1 truncate text-[11px] text-white/70">{value}</div>
    </div>
  );
}
