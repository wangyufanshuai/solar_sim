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
  getAtlasCalibrationReadinessSnapshotV508,
  loadAtlasCalibrationReadinessV508,
  subscribeAtlasCalibrationReadinessV508,
} from "../lib/atlasCalibrationEvidenceClientV508";

export default function KerrMeasuredCalibrationReadinessV503() {
  const state = useSyncExternalStore(
    subscribeAtlasCalibrationReadinessV508,
    getAtlasCalibrationReadinessSnapshotV508,
    getAtlasCalibrationReadinessSnapshotV508,
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
    "--v503-panel": profile.tokens.panel,
    "--v503-cyan": profile.tokens.accent,
    "--v503-wash": profile.tokens.accentWash,
    "--v503-amber": profile.tokens.warning,
    "--v503-red": profile.tokens.blocked,
    "--v503-ink": profile.tokens.ink,
    "--v503-muted": profile.tokens.mutedInk,
    "--v503-glow": profile.tokens.glowOpacity,
    "--v503-transition": `${profile.tokens.transitionMs}ms`,
  } as CSSProperties;

  return (
    <section
      className="relative mt-7 overflow-hidden rounded-[34px] border border-white/10 bg-[var(--v503-panel)] p-5 text-[var(--v503-ink)] shadow-[0_50px_180px_rgba(0,0,0,.72)] transition-colors duration-[var(--v503-transition)] sm:p-8"
      data-atlas-kerr-measured-calibration-readiness-v503
      data-atlas-v503-request-count={state.status === "idle" ? 0 : 1}
      data-atlas-v503-ready-files={summary?.decision.readyFileCount ?? 0}
      data-atlas-v503-authority-admitted="false"
      data-atlas-v503-science-writeback="false"
      data-atlas-v503-scene-revision-delta="0"
      data-atlas-v505-hud-mode={mode}
      data-atlas-v506-hud-mode-store="external"
      data-atlas-v506-hud-revision={modeSnapshot.hudRevision}
      data-atlas-v505-science-payload-reference-preserved="true"
      data-atlas-v505-scientific-field-mutation="false"
      data-atlas-v508-evidence-store="external-single-flight"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_4%,var(--v503-wash),transparent_34%)] opacity-[calc(.65+var(--v503-glow))]" />
      <header className="relative grid gap-6 border-b border-white/10 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.38em] text-[var(--v503-cyan)]/60">
            V503 / measured calibration readiness
          </div>
          <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.04em] text-white/90 sm:text-5xl">
            六个真实文件，才是探测器权威的起点
          </h2>
          <p className="mt-4 max-w-3xl font-mono text-[10px] leading-6 text-white/43">
            这里把 schema、单位、跨文件身份、SHA、许可、独立验证与 authority grant
            合并为一个可交接清单。V503 不读取 staging、不联网，也不生成任何缺失文件。
          </p>
        </div>
        <div className="border border-[var(--v503-red)]/25 bg-[var(--v503-red)]/[.045] px-5 py-4 text-right font-mono">
          <div className="text-[8px] uppercase tracking-[.2em] text-white/35">measured pack</div>
          <div className="mt-2 text-3xl text-[var(--v503-red)]">0 / 6</div>
          <div className="mt-3 flex border border-white/10 bg-black/30 p-0.5">
            {(["science", "cinematic"] as const).map((entry) => (
              <button
                className={
                  mode === entry
                    ? "bg-[var(--v503-cyan)] px-2.5 py-1 text-[7px] uppercase text-black"
                    : "px-2.5 py-1 text-[7px] uppercase text-white/35"
                }
                key={entry}
                onClick={() => setAtlasCalibrationHudModeV506(entry)}
                type="button"
              >
                {entry}
              </button>
            ))}
          </div>
        </div>
      </header>

      {state.status === "idle" ? (
        <div className="relative mt-6 border border-dashed border-[var(--v503-cyan)]/20 bg-white/[.018] p-5">
          <p className="font-mono text-[10px] leading-5 text-white/42">
            显式加载净化后的 readiness artifact；此操作只读取白名单证据，不检查或上传实测数据。
          </p>
          <button
            className="atlas-accessible-focus mt-4 border border-[var(--v503-cyan)]/35 bg-[var(--v503-cyan)]/[.06] px-4 py-2 font-mono text-[9px] uppercase tracking-[.16em] text-[var(--v503-cyan)]"
            onClick={() => void loadAtlasCalibrationReadinessV508().catch(() => undefined)}
            type="button"
          >
            Load readiness checklist
          </button>
        </div>
      ) : null}
      {state.status === "loading" ? (
        <div className="relative mt-6 font-mono text-[10px] text-white/45">
          正在校验 v458 / v464 / v465 / v501 的 SHA 链…
        </div>
      ) : null}
      {state.status === "unavailable" ? (
        <div className="relative mt-6 border-l-2 border-[var(--v503-red)] px-4 py-2 font-mono text-[10px] text-red-100/65">
          Readiness evidence unavailable / {state.reason}
        </div>
      ) : null}

      {summary ? (
        <>
          <div className="relative mt-6 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {summary.files.map((file, index) => (
              <article
                className="border border-white/10 bg-black/25 p-4"
                data-atlas-v503-file={file.id}
                data-atlas-v503-file-status={file.status}
                key={file.id}
              >
                <div className="flex justify-between font-mono text-[8px] uppercase tracking-[.16em] text-white/30">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-[var(--v503-red)]">missing</span>
                </div>
                <h3 className="mt-3 font-serif text-xl text-white/78">{file.id}</h3>
                <div className="mt-2 font-mono text-[8px] text-white/35">
                  {file.fileName} · {file.schemaVersion}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {file.unitContract.map((unit) => (
                    <span
                      className="border border-white/8 px-2 py-1 font-mono text-[7px] text-white/32"
                      key={unit}
                    >
                      {unit}
                    </span>
                  ))}
                </div>
                <details className="mt-4 border-t border-white/8 pt-3 font-mono text-[8px] text-white/38">
                  <summary className="cursor-pointer text-[var(--v503-cyan)]/60">
                    required fields · {file.requiredFields.length}
                  </summary>
                  <div className="mt-2 leading-5">{file.requiredFields.join(" · ")}</div>
                  <div className="mt-2 text-[var(--v503-amber)]/65">{file.provenanceLink}</div>
                </details>
              </article>
            ))}
          </div>
          <div className="relative mt-5 grid gap-2 lg:grid-cols-2">
            {summary.checklist.map((gate) => (
              <div
                className={
                  gate.passed
                    ? "border border-cyan-200/12 bg-cyan-200/[.025] p-4"
                    : "border border-red-200/12 bg-red-200/[.025] p-4"
                }
                key={gate.id}
              >
                <div className="flex justify-between gap-4 font-mono text-[9px] text-white/65">
                  <span>{gate.id}</span>
                  <span className={gate.passed ? "text-cyan-200/70" : "text-red-200/70"}>
                    {gate.passed ? "PASS" : "BLOCK"}
                  </span>
                </div>
                <div className="mt-2 font-mono text-[8px] leading-4 text-white/30">
                  {gate.evidence}
                </div>
              </div>
            ))}
          </div>
          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[8px] text-white/32">
            <span>
              response unavailable · intensity unavailable · science raster unavailable · FITS/PNG 0
            </span>
            <a
              className="border border-white/12 px-3 py-1.5 text-white/50"
              href="/api/atlas/relativity-evidence/v503/detector-calibration-readiness?download=readiness"
            >
              export readiness JSON
            </a>
          </footer>
        </>
      ) : null}
    </section>
  );
}
