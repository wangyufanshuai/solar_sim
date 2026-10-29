"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";

import {
  getKerrSpectralSensitivitySnapshotV483,
  loadKerrSpectralSensitivitySummaryV483,
  subscribeKerrSpectralSensitivityV483,
} from "../lib/kerrSpectralSensitivityClientV483";

export default function KerrSpectralSensitivityViewerV483() {
  const state = useSyncExternalStore(
    subscribeKerrSpectralSensitivityV483,
    getKerrSpectralSensitivitySnapshotV483,
    getKerrSpectralSensitivitySnapshotV483,
  );
  const [mode, setMode] = useState<"science" | "cinematic">("science");
  useEffect(() => {
    void loadKerrSpectralSensitivitySummaryV483().catch(() => undefined);
  }, []);
  const summary = state.summary;
  const presentation = summary?.presentation[mode];
  const style = {
    "--v483-signal": mode === "science" ? "#bcff72" : "#ffb06f",
    "--v483-ghost": mode === "science" ? "rgba(188,255,114,.10)" : "rgba(255,176,111,.10)",
    "--v483-ink": mode === "science" ? "#e9ffd3" : "#fff0e3",
  } as CSSProperties;

  return (
    <section
      className="relative mt-7 overflow-hidden rounded-[8px] border border-white/12 bg-[#050706] p-4 text-[var(--v483-ink)] shadow-[0_70px_220px_rgba(0,0,0,.82)] sm:p-7"
      data-atlas-kerr-spectral-sensitivity-v483
      data-atlas-v483-mode={mode}
      data-atlas-v483-projection-count={summary?.audit.projectionCount ?? 0}
      data-atlas-v483-nullspace-count={summary?.audit.nullspaceProjectionCount ?? 0}
      data-atlas-v483-payload-shared={summary?.presentation.sharedSensitivityPayloadIdentity ?? false}
      data-atlas-v483-science-writeback="false"
      data-atlas-v483-scene-revision-delta="0"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:100%_24px]" />
      <div className="pointer-events-none absolute -right-20 -top-40 h-[520px] w-[520px] rounded-full border border-[var(--v483-signal)]/10 shadow-[inset_0_0_120px_var(--v483-ghost)]" />

      <header className="relative grid gap-6 border-b border-white/12 pb-6 lg:grid-cols-[auto_1fr_auto] lg:items-end">
        <div className="hidden border-r border-white/10 pr-4 font-mono text-[8px] uppercase tracking-[.35em] text-white/25 lg:block [writing-mode:vertical-rl]">
          sensitivity laboratory / v483
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.36em] text-[var(--v483-signal)]/55">
            rank-1 spectral mode analyzer
          </div>
          <h2 className="mt-3 max-w-5xl font-serif text-3xl tracking-[.035em] text-white/92 sm:text-5xl">
            一条敏感轴，四条沉默方向
          </h2>
          <p className="mt-4 max-w-3xl font-mono text-[10px] leading-6 text-white/42">
            五维 landmark 空间被分解为 common-scale 模态与四维正交 nullspace。零投影只表示当前共同 g 上界模型不敏感，绝不代表真实测量无误差；detector 权重、独立噪声和统计 likelihood 仍不可用。
          </p>
        </div>
        <div className="flex border border-white/12 bg-black/55 p-1 font-mono text-[8px] uppercase tracking-[.2em]">
          {(["science", "cinematic"] as const).map((entry) => (
            <button
              className={
                "px-4 py-2.5 transition-colors " +
                (mode === entry
                  ? "bg-[var(--v483-signal)] text-black"
                  : "text-white/30 hover:text-white/70")
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
          data-atlas-v483-load-state={state.status}
        >
          {state.status === "idle" || state.status === "loading"
            ? "正在校准 sensitivity basis……"
            : `Sensitivity modes 不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-4 xl:grid-cols-[1.12fr_.88fr]">
            <article className="border border-white/10 bg-black/35 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3 font-mono text-[8px] uppercase tracking-[.2em] text-white/30">
                <span>orthonormal basis / ℝ⁵</span>
                <span className="text-[var(--v483-signal)]">QᵀQ = I</span>
              </div>
              <div className="mt-5 grid gap-2">
                {summary.basis.modes.map((basisMode, index) => (
                  <div
                    className={
                      "relative overflow-hidden border px-4 py-3 font-mono " +
                      (index === 0
                        ? "border-[var(--v483-signal)]/40 bg-[var(--v483-ghost)]"
                        : "border-white/8 bg-white/[.015]")
                    }
                    data-atlas-v483-basis-mode={basisMode.id}
                    key={basisMode.id}
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-[var(--v483-signal)]/12"
                      style={{ width: index === 0 ? "100%" : `${18 + index * 8}%` }}
                    />
                    <div className="relative grid grid-cols-[105px_1fr_auto] items-center gap-4">
                      <div>
                        <div className="text-[9px] text-white/75">{basisMode.id}</div>
                        <div className="mt-1 text-[7px] uppercase tracking-[.12em] text-white/25">
                          {index === 0 ? "sensitive" : "nullspace"}
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {basisMode.vector.map((value, component) => (
                          <div
                            className="border border-white/8 bg-black/35 px-1 py-2 text-center text-[7px] text-white/45"
                            key={component}
                          >
                            {value.toFixed(3)}
                          </div>
                        ))}
                      </div>
                      <div className="text-right text-[8px] text-[var(--v483-signal)]/75">
                        {Math.abs(basisMode.sensitivityDotEmitter).toExponential(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 font-mono text-[8px]">
                <Audit
                  label="orthonormal"
                  value={summary.basis.audit.maximumOrthonormalityAbsoluteResidual}
                />
                <Audit
                  label="completeness"
                  value={summary.basis.audit.maximumCompletenessAbsoluteResidual}
                />
                <Audit
                  label="null · emitter"
                  value={summary.basis.audit.maximumNullspaceEmitterDotAbsoluteResidual}
                />
              </div>
            </article>

            <aside className="grid gap-3">
              {summary.rows.map((row) => {
                const common = row.projections[0];
                return (
                  <div
                    className="border border-white/10 bg-[#090d09] p-4 font-mono"
                    data-atlas-v483-ray={row.rayId}
                    key={row.rayId}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] text-white/75">{row.rayId}</div>
                        <div className="mt-1 text-[7px] uppercase tracking-[.16em] text-white/25">
                          common projection
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg text-[var(--v483-signal)]">
                          {common.projectedCoordinate.toFixed(6)}
                        </div>
                        <div className="mt-1 text-[7px] text-white/25">
                          u ≤ {common.standardDeviationUpperBoundDisplayOnly.toExponential(2)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-1">
                      {row.projections.slice(1).map((projection) => (
                        <div
                          className="border-t border-white/8 pt-2 text-center"
                          key={projection.modeId}
                        >
                          <div className="text-[7px] text-white/22">{projection.modeId.slice(-1)}</div>
                          <div className="mt-1 text-[8px] text-white/45">
                            {projection.projectedCoordinate.toExponential(1)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </aside>
          </div>

          <div className="relative mt-4 grid gap-4 border border-[var(--v483-signal)]/15 bg-[var(--v483-ghost)] p-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="grid gap-2 font-mono text-[8px] sm:grid-cols-4">
              <Metric label="projections" value="20" />
              <Metric label="common scale" value="4" />
              <Metric label="nullspace" value="16" />
              <Metric label="roundoff clamps" value={String(summary.audit.directRoundoffClampCount)} />
            </div>
            <div className="font-mono text-[8px] leading-5 text-white/35 lg:max-w-sm">
              {mode} presentation / exposure {presentation.exposure.toFixed(2)} / bloom{" "}
              {presentation.bloomIntensity.toFixed(2)}. Sensitivity payload remains immutable.
            </div>
          </div>

          <div className="relative mt-4 grid gap-2 border border-amber-100/10 bg-amber-100/[.025] p-4 font-mono text-[8px] sm:grid-cols-4">
            <Boundary label="detector weight vector" />
            <Boundary label="independent noise" />
            <Boundary label="statistical likelihood" />
            <Boundary label="observed spectrum" />
          </div>

          <footer className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[8px] uppercase tracking-[.14em] text-white/30">
            <span>zero under model ≠ exact measurement · pixels 0 · dense 0/49</span>
            <a
              className="border border-white/12 px-3 py-1.5 transition-colors hover:border-[var(--v483-signal)]/45 hover:text-[var(--v483-signal)]"
              href="/api/atlas/relativity-evidence/v483/spectral-sensitivity-modes?download=sensitivity-modes"
            >
              export sensitivity envelope
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Audit({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-l border-white/10 pl-3">
      <div className="text-[7px] uppercase tracking-[.12em] text-white/25">{label}</div>
      <div className="mt-1 text-[9px] text-[var(--v483-signal)]/70">{value.toExponential(2)}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-white/10 pl-3">
      <div className="text-[7px] uppercase tracking-[.12em] text-white/25">{label}</div>
      <div className="mt-1 text-[10px] text-white/70">{value}</div>
    </div>
  );
}

function Boundary({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-100/8 pb-2 text-amber-50/40">
      <span>{label}</span>
      <span className="text-amber-200/60">unavailable</span>
    </div>
  );
}
