"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import {
  getAtlasCalibrationHudModeSnapshotV506,
  subscribeAtlasCalibrationHudModeV506,
} from "../lib/atlasCalibrationHudModeStoreV506";
import { resolveAtlasCalibrationHudProfileV505 } from "../lib/atlasCalibrationHudProfileV505";
import {
  getKerrInstrumentAuthorityMatrixSnapshotV511,
  loadKerrInstrumentAuthorityMatrixSummaryV511,
  subscribeKerrInstrumentAuthorityMatrixV511,
} from "../lib/kerrInstrumentAuthorityMatrixClientV511";

export default function KerrInstrumentAuthorityMatrixV511() {
  const state = useSyncExternalStore(
    subscribeKerrInstrumentAuthorityMatrixV511,
    getKerrInstrumentAuthorityMatrixSnapshotV511,
    getKerrInstrumentAuthorityMatrixSnapshotV511,
  );
  const mode = useSyncExternalStore(
    subscribeAtlasCalibrationHudModeV506,
    getAtlasCalibrationHudModeSnapshotV506,
    getAtlasCalibrationHudModeSnapshotV506,
  );
  useEffect(() => {
    void loadKerrInstrumentAuthorityMatrixSummaryV511().catch(() => undefined);
  }, []);
  const profile = resolveAtlasCalibrationHudProfileV505(mode.mode);
  const style = {
    "--v511-panel": profile.tokens.panel,
    "--v511-raised": profile.tokens.panelRaised,
    "--v511-ink": profile.tokens.ink,
    "--v511-muted": profile.tokens.mutedInk,
    "--v511-accent": profile.tokens.accent,
    "--v511-wash": profile.tokens.accentWash,
    "--v511-warning": profile.tokens.warning,
    "--v511-blocked": profile.tokens.blocked,
    "--v511-grid": profile.tokens.grid,
  } as CSSProperties;
  const summary = state.summary;
  return (
    <section
      className="relative mt-7 overflow-hidden rounded-[34px] border border-white/10 bg-[var(--v511-panel)] p-5 text-[var(--v511-ink)] shadow-[0_60px_200px_rgba(0,0,0,.75)] sm:p-8"
      data-atlas-kerr-instrument-authority-matrix-v511
      data-atlas-v511-stage-count="6"
      data-atlas-v511-request-count={state.requestCount}
      data-atlas-v511-request-budget-after-explicit-detail="1"
      data-atlas-v511-solar-first-screen-request-count="0"
      data-atlas-v511-detector-authority="false"
      data-atlas-v511-observed-counts="false"
      data-atlas-v511-science-raster="false"
      data-atlas-v511-scientific-field-mutation="false"
      data-atlas-v511-canvas-created="false"
      data-atlas-v511-scene-revision-delta="0"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_0%,var(--v511-wash),transparent_32%),linear-gradient(var(--v511-grid)_1px,transparent_1px)] bg-[size:auto,52px_52px] opacity-35" />
      <header className="relative grid gap-5 border-b border-white/10 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.42em] text-[var(--v511-accent)]/65">
            V511 / instrument authority matrix
          </div>
          <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.035em] text-white/90 sm:text-5xl">
            从光子辐亮度到科学像素，每一步都必须有权威来源
          </h2>
          <p className="mt-4 max-w-3xl font-mono text-[10px] leading-6 text-[var(--v511-muted)]">
            六阶段矩阵区分计算光子观测量、验证 fixture、实测 intake 与 production response。
            缺少面积、像素立体角、曝光、实测响应、增益、PSF 或畸变时，结果保持 null，而不是用零或电影效果填补。
          </p>
        </div>
        <div className="border border-[var(--v511-blocked)]/25 bg-[var(--v511-blocked)]/[.04] px-4 py-3 text-right font-mono">
          <div className="text-[8px] uppercase tracking-[.2em] text-white/35">measured authority</div>
          <div className="mt-1 text-2xl font-light text-[var(--v511-blocked)]">BLOCKED</div>
          <div className="mt-1 text-[8px] text-white/30">0 / 6 calibration files</div>
        </div>
      </header>

      {!summary ? (
        <div className="relative mt-6 border-l-2 border-[var(--v511-warning)]/45 bg-[var(--v511-warning)]/[.035] px-4 py-4 font-mono text-[10px] text-white/50">
          {state.status === "idle" || state.status === "loading"
            ? "正在读取 bounded authority matrix…"
            : `Authority matrix 不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-2 lg:grid-cols-3">
            {summary.stages.map((stage, index) => (
              <article
                className="border border-white/10 bg-[var(--v511-raised)] p-4"
                data-atlas-v511-stage={stage.id}
                key={stage.id}
              >
                <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[.16em] text-white/30">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span className={stage.authorityGranted ? "text-[var(--v511-accent)]/75" : "text-[var(--v511-blocked)]/70"}>
                    {stage.authorityGranted ? "computational authority" : "blocked"}
                  </span>
                </div>
                <h3 className="mt-3 font-serif text-xl text-white/80">{stage.id}</h3>
                <div className="mt-2 font-mono text-[8px] text-white/38">{stage.authorityClass}</div>
                <p className="mt-3 min-h-8 font-mono text-[8px] leading-4 text-white/28">
                  {stage.reason}
                </p>
                <div className="mt-3 flex justify-between border-t border-white/8 pt-3 font-mono text-[7px] text-white/25">
                  <span>rows {stage.inputRows} → {stage.outputRows}</span>
                  <span>measured {stage.measuredRows}</span>
                </div>
                <div className="mt-2 truncate font-mono text-[7px] text-white/20">
                  {stage.sourceArtifactSha256}
                </div>
              </article>
            ))}
          </div>

          <div className="relative mt-5 grid gap-px border border-white/10 bg-white/10 lg:grid-cols-3">
            {summary.transitions.map((transition) => (
              <div className="bg-[var(--v511-raised)] p-4" key={transition.id}>
                <div className="font-mono text-[8px] uppercase tracking-[.16em] text-[var(--v511-blocked)]/75">
                  {transition.id} / {transition.status}
                </div>
                <div className="mt-3 font-mono text-[8px] leading-5 text-white/30">
                  {transition.missingAuthorities.join(" · ")}
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-5 grid gap-px border border-white/10 bg-white/10 font-mono sm:grid-cols-5">
            <Metric label="photon rows" value="4" />
            <Metric label="measured response" value="0" />
            <Metric label="electron rows" value="0" />
            <Metric label="observed counts" value="0" />
            <Metric label="science pixels" value="0" />
          </div>
          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[8px] text-white/32">
            <span>response exactly once · geometric area only · gain after electrons · null, never zero</span>
            <a
              className="border border-[var(--v511-accent)]/25 px-3 py-2 text-[var(--v511-accent)]/70"
              href="/api/atlas/relativity-evidence/v511/instrument-authority-matrix?download=matrix"
            >
              Export canonical matrix
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-[var(--v511-raised)] px-3 py-3 text-center">
      <div className="text-[7px] uppercase tracking-[.15em] text-white/25">{label}</div>
      <div className="mt-1 text-[11px] text-white/65">{value}</div>
    </div>
  );
}
