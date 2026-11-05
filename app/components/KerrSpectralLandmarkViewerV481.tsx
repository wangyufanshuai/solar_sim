"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";

import {
  getKerrSpectralLandmarkSnapshotV481,
  loadKerrSpectralLandmarkSummaryV481,
  subscribeKerrSpectralLandmarksV481,
} from "../lib/kerrSpectralLandmarkClientV481";

const CHART_MAX = 2.2;

export default function KerrSpectralLandmarkViewerV481() {
  const state = useSyncExternalStore(
    subscribeKerrSpectralLandmarksV481,
    getKerrSpectralLandmarkSnapshotV481,
    getKerrSpectralLandmarkSnapshotV481,
  );
  const [mode, setMode] = useState<"science" | "cinematic">("science");

  useEffect(() => {
    void loadKerrSpectralLandmarkSummaryV481().catch(() => undefined);
  }, []);

  const summary = state.summary;
  const presentation = summary?.presentation[mode];
  const style = {
    "--v481-accent": mode === "science" ? "#92efff" : "#ffae7d",
    "--v481-soft": mode === "science" ? "rgba(66,218,255,.1)" : "rgba(255,139,84,.1)",
  } as CSSProperties;

  return (
    <section
      className="relative mt-7 overflow-hidden rounded-[46px] border border-white/10 bg-[#030607] p-5 text-white shadow-[0_60px_190px_rgba(0,0,0,.76)] sm:p-8"
      data-atlas-kerr-spectral-landmarks-v481
      data-atlas-v481-mode={mode}
      data-atlas-v481-landmarks={summary?.audit.landmarkCount ?? 0}
      data-atlas-v481-payload-shared={summary?.presentation.sharedLandmarkPayloadIdentity ?? false}
      data-atlas-v481-science-writeback="false"
      data-atlas-v481-scene-revision-delta="0"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,var(--v481-soft),transparent_32%),radial-gradient(circle_at_88%_18%,rgba(255,255,255,.045),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:58px_58px]" />

      <header className="relative grid gap-6 border-b border-white/10 pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.42em] text-white/35">
            V481 / dimensionless spectral landmark transport
          </div>
          <h2 className="mt-4 max-w-4xl font-serif text-3xl tracking-[.045em] text-white/90 sm:text-5xl">
            只传播谱特征位置，不虚构一条谱线
          </h2>
          <p className="mt-4 max-w-3xl font-mono text-[11px] leading-6 text-white/45">
            每条 disk ray 的五个无量纲 landmark 按 xₒ = g·xₑ 传播，并用 log-exp
            oracle、逆变换、成对比值和相邻间距四重核对。物理线身份、线宽、振幅、等效宽度、bandpass
            与 observed spectrum 全部保持 unavailable。
          </p>
        </div>
        <div className="flex border border-white/10 bg-black/40 p-1 font-mono text-[9px] uppercase tracking-[.18em]">
          {(["science", "cinematic"] as const).map((entry) => (
            <button
              className={
                "px-4 py-2.5 transition-colors " +
                (mode === entry
                  ? "bg-[var(--v481-accent)] text-black"
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
          data-atlas-v481-load-state={state.status}
        >
          {state.status === "idle" || state.status === "loading"
            ? "正在读取 spectral landmark envelope……"
            : `Spectral landmark 不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-7 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
            <article className="border border-white/10 bg-black/30 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[8px] uppercase tracking-[.2em] text-white/35">
                <span>xobserver / unspecified reference</span>
                <span className="text-[var(--v481-accent)]">20 landmarks · 4 rays</span>
              </div>
              <div className="mt-6 space-y-6">
                {summary.rows.map((row) => (
                  <div data-atlas-v481-ray={row.rayId} key={row.rayId}>
                    <div className="flex items-end justify-between gap-3 font-mono text-[8px]">
                      <span className="text-white/65">{row.rayId}</span>
                      <span className="text-white/30">
                        g {row.redshiftFactor.toFixed(6)} · {row.shiftClass}
                      </span>
                    </div>
                    <div className="relative mt-3 h-12 border-x border-white/10 bg-[linear-gradient(90deg,rgba(255,255,255,.025),rgba(255,255,255,.055),rgba(255,255,255,.025))]">
                      <div className="absolute inset-x-0 top-1/2 border-t border-white/8" />
                      {row.features.map((feature) => (
                        <div
                          className="absolute top-1/2 h-6 w-px -translate-y-1/2 bg-[var(--v481-accent)] shadow-[0_0_14px_var(--v481-accent)]"
                          data-atlas-v481-landmark={feature.id}
                          key={feature.id}
                          style={{ left: `${(feature.observerCoordinate / CHART_MAX) * 100}%` }}
                          title={`${feature.id}: ${feature.observerCoordinate.toFixed(8)}`}
                        >
                          <span className="absolute left-1/2 top-7 -translate-x-1/2 whitespace-nowrap font-mono text-[6px] text-white/30">
                            {feature.observerCoordinate.toFixed(3)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 break-all border-t border-white/10 pt-4 font-mono text-[8px] leading-5 text-white/30">
                LANDMARK PAYLOAD SHA / {summary.payloadSha256}
              </div>
            </article>

            <aside className="border border-[var(--v481-accent)]/15 bg-[var(--v481-soft)] p-5 sm:p-6">
              <div className="font-mono text-[8px] uppercase tracking-[.2em] text-[var(--v481-accent)]">
                analytic audit
              </div>
              <div className="mt-5 space-y-3 font-mono text-[8px]">
                <Audit label="log-exp oracle" value={summary.audit.maximumDirectOracleRelativeResidual} />
                <Audit label="inverse round-trip" value={summary.audit.maximumInverseRoundTripRelativeResidual} />
                <Audit label="pairwise ratio" value={summary.audit.maximumPairwiseRatioRelativeResidual} />
                <Audit label="adjacent spacing" value={summary.audit.maximumAdjacentSpacingRelativeResidual} />
                <Audit
                  label="relative uncertainty"
                  value={summary.audit.maximumRelativeCoordinateUncertaintyUpperBound}
                />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-2 font-mono text-[8px]">
                <Metric label="ratio checks" value="40" />
                <Metric label="spacing checks" value="16" />
                <Metric label="interval checks" value="20" />
                <Metric label="mutations" value="0" />
              </div>
              <div className="mt-6 border-t border-white/10 pt-4 font-mono text-[8px] leading-5 text-white/35">
                {mode} presentation: exposure {presentation.exposure.toFixed(2)}, bloom{" "}
                {presentation.bloomIntensity.toFixed(2)}, grain {presentation.grain.toFixed(3)}.
                科学 landmark 坐标保持同一份不可变 payload。
              </div>
            </aside>
          </div>

          <div className="relative mt-5 grid gap-2 border border-amber-100/10 bg-amber-100/[.025] p-5 font-mono text-[8px] sm:grid-cols-4">
            <Boundary label="physical line identity" />
            <Boundary label="line width / amplitude" />
            <Boundary label="equivalent width" />
            <Boundary label="observed spectrum" />
          </div>

          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[8px] uppercase tracking-[.14em] text-white/35">
            <span>Science pixels 0 · images 0 · dense 0/49 · browser not-run</span>
            <a
              className="border border-white/10 px-3 py-1.5 transition-colors hover:border-[var(--v481-accent)]/50 hover:text-[var(--v481-accent)]"
              href="/api/atlas/relativity-evidence/v481/spectral-landmarks?download=landmarks"
            >
              导出 landmark envelope
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Audit({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-2">
      <span className="text-white/35">{label}</span>
      <span className="text-[var(--v481-accent)]">{value.toExponential(2)}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-white/10 pl-3">
      <div className="text-[7px] uppercase tracking-[.14em] text-white/30">{label}</div>
      <div className="mt-1 text-[10px] text-white/70">{value}</div>
    </div>
  );
}

function Boundary({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-100/8 pb-2 text-amber-50/45">
      <span>{label}</span>
      <span className="text-amber-200/65">unavailable</span>
    </div>
  );
}
