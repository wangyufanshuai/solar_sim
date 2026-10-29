"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import { resolveAtlasScienceCinematicV7V457 } from "../lib/atlasScienceCinematicV7V457";
import {
  getKerrMeasuredDetectorBlindValidationSnapshotV459,
  loadKerrMeasuredDetectorBlindValidationSummaryV459,
  subscribeKerrMeasuredDetectorBlindValidationV459,
} from "../lib/kerrMeasuredDetectorBlindValidationClientV459";

export default function KerrMeasuredDetectorBlindValidationV459() {
  const state = useSyncExternalStore(
    subscribeKerrMeasuredDetectorBlindValidationV459,
    getKerrMeasuredDetectorBlindValidationSnapshotV459,
    getKerrMeasuredDetectorBlindValidationSnapshotV459,
  );
  const tokens = resolveAtlasScienceCinematicV7V457("science");
  useEffect(() => {
    void loadKerrMeasuredDetectorBlindValidationSummaryV459().catch(() => undefined);
  }, []);
  const style = {
    "--v459-ink": tokens.productGate.ink,
    "--v459-panel": tokens.productGate.panel,
    "--v459-grid": tokens.productGate.grid,
    "--v459-ready": tokens.productGate.qualified,
    "--v459-blocked": tokens.productGate.blocked,
  } as CSSProperties;
  return (
    <section
      style={style}
      className="relative mt-6 overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_90%_0%,rgba(103,232,249,.08),transparent_31%),linear-gradient(145deg,var(--v459-panel),#020609_64%,#090503)] p-5 font-mono text-[var(--v459-ink)] shadow-[0_34px_120px_rgba(0,0,0,.54)] sm:p-7"
      data-atlas-kerr-blind-validation-v459
      data-atlas-v459-protocol-qualified="true"
      data-atlas-v459-measured-validation="false"
      data-atlas-v459-authority="false"
      data-atlas-v459-scientific-field-mutation="false"
    >
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(var(--v459-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v459-grid)_1px,transparent_1px)] [background-size:40px_40px]" />
      <header className="relative grid gap-5 border-b border-white/10 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="text-[9px] uppercase tracking-[.34em] opacity-45">
            V459 / blind validation observatory
          </div>
          <h2 className="mt-3 max-w-4xl font-serif text-3xl tracking-[.08em] sm:text-4xl">
            先锁住盲区，再谈像素可信度
          </h2>
          <p className="mt-3 max-w-3xl text-[11px] leading-6 opacity-55">
            train calibration 与 blind holdout 的边界、重复测量和线性误差预算已预注册；真实 detector
            输入尚未到达，因此没有执行 fit、holdout 或 authority grant。
          </p>
        </div>
        <div className="border border-[var(--v459-blocked)]/30 bg-[var(--v459-blocked)]/[.04] px-4 py-3 text-right">
          <div className="text-[8px] uppercase tracking-[.2em] opacity-45">measured validation</div>
          <div className="mt-1 text-2xl font-light text-[var(--v459-blocked)]">PENDING</div>
        </div>
      </header>
      {!state.summary ? (
        <div className="relative mt-5 border-l-2 border-white/20 bg-white/[.025] px-4 py-3 text-[10px] opacity-60">
          {state.status === "idle" || state.status === "loading"
            ? "正在读取 blind validation 证据…"
            : `Blind validation 证据不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
            <aside className="border border-white/10 bg-black/25 p-5">
              <div className="text-[9px] uppercase tracking-[.22em] opacity-45">Locked split</div>
              <div className="mt-8 flex items-end gap-3">
                <div>
                  <div className="text-5xl font-light tracking-[-.07em] text-[var(--v459-ready)]">
                    {state.summary.control.split.trainCount}
                  </div>
                  <div className="mt-1 text-[8px] uppercase tracking-[.16em] opacity-40">train</div>
                </div>
                <div className="pb-4 text-xl opacity-25">/</div>
                <div>
                  <div className="text-5xl font-light tracking-[-.07em] text-[var(--v459-ready)]">
                    {state.summary.control.split.holdoutCount}
                  </div>
                  <div className="mt-1 text-[8px] uppercase tracking-[.16em] opacity-40">holdout</div>
                </div>
              </div>
              <div className="mt-6 grid gap-3 text-[9px]">
                <Row label="overlap" value={String(state.summary.control.split.overlapIds.length)} />
                <Row label="protocol" value="qualified" good />
                <Row label="fit executed" value="no" />
                <Row label="authority" value="not granted" />
              </div>
            </aside>
            <div className="grid gap-2 sm:grid-cols-2">
              <Metric label="folds" value={String(state.summary.protocol.fixedFoldCount)} />
              <Metric label="repeats / fold" value={String(state.summary.protocol.minimumRepeatsPerFold)} />
              <Metric label="holdout target" value={`${state.summary.protocol.holdoutFractionTarget * 100}%`} />
              <Metric label="overlap tolerance" value={String(state.summary.protocol.overlapTolerance)} />
              <Metric label="RSS combination" value="linear" />
              <Metric label="thresholds" value="pre-registered" />
            </div>
          </div>
          <div className="relative mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["plate CV", `< ${state.summary.thresholds.plateScaleRepeatCvMax}`],
              ["distortion px", `< ${state.summary.thresholds.distortionHoldoutMaxResidualPx}`],
              ["PSF CV", `< ${state.summary.thresholds.psfRepeatCvMax}`],
              ["coverage", `≥ ${state.summary.thresholds.holdoutCoverageMin}`],
            ].map(([label, value]) => (
              <div key={label} className="border border-white/10 bg-black/25 p-3">
                <div className="text-[8px] uppercase tracking-[.16em] opacity-35">{label}</div>
                <div className="mt-2 text-sm text-[var(--v459-ready)]">{value}</div>
              </div>
            ))}
          </div>
          <footer className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-[8px] uppercase tracking-[.14em] opacity-45">
            <span>holdout values 0 · fit 0 · authority 0 · science pixels unavailable</span>
            <a
              className="border border-white/10 px-3 py-1.5 hover:border-white/30 hover:opacity-90"
              href="/api/atlas/relativity-evidence/v459/measured-detector-blind-validation?download=validation"
            >
              validation artifact
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Row({ label, value, good = false }: Readonly<{ label: string; value: string; good?: boolean }>) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/7 pb-2">
      <span className="opacity-35">{label}</span>
      <span className={good ? "text-[var(--v459-ready)]" : "text-[var(--v459-blocked)]"}>{value}</span>
    </div>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="border border-white/10 bg-black/25 p-4">
      <div className="text-[8px] uppercase tracking-[.18em] opacity-35">{label}</div>
      <div className="mt-3 text-xl font-light text-[var(--v459-ready)]">{value}</div>
    </div>
  );
}
