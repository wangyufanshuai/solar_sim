"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";

import {
  getKerrSpectralLandmarkCovarianceSnapshotV482,
  loadKerrSpectralLandmarkCovarianceSummaryV482,
  subscribeKerrSpectralLandmarkCovarianceV482,
} from "../lib/kerrSpectralLandmarkCovarianceClientV482";

export default function KerrSpectralLandmarkCovarianceViewerV482() {
  const state = useSyncExternalStore(
    subscribeKerrSpectralLandmarkCovarianceV482,
    getKerrSpectralLandmarkCovarianceSnapshotV482,
    getKerrSpectralLandmarkCovarianceSnapshotV482,
  );
  const [mode, setMode] = useState<"science" | "cinematic">("science");
  useEffect(() => {
    void loadKerrSpectralLandmarkCovarianceSummaryV482().catch(() => undefined);
  }, []);
  const summary = state.summary;
  const presentation = summary?.presentation[mode];
  const style = {
    "--v482-accent": mode === "science" ? "#a3edff" : "#ffb383",
    "--v482-soft": mode === "science" ? "rgba(70,220,255,.1)" : "rgba(255,145,91,.1)",
  } as CSSProperties;
  const matrix = summary?.rows[0]?.covarianceUpperBound ?? [];
  const scale = summary?.rows[0]?.commonScaleUncertaintyUpperBound ?? 0;

  return (
    <section
      className="relative mt-7 overflow-hidden rounded-[46px] border border-white/10 bg-[#030607] p-5 text-white shadow-[0_60px_190px_rgba(0,0,0,.76)] sm:p-8"
      data-atlas-kerr-spectral-landmark-covariance-v482
      data-atlas-v482-mode={mode}
      data-atlas-v482-matrix-count={summary?.audit.covarianceMatrixCount ?? 0}
      data-atlas-v482-rank-one={summary?.audit.rankOneMatrixCount ?? 0}
      data-atlas-v482-payload-shared={summary?.presentation.sharedCovariancePayloadIdentity ?? false}
      data-atlas-v482-science-writeback="false"
      data-atlas-v482-scene-revision-delta="0"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,var(--v482-soft),transparent_32%),radial-gradient(circle_at_92%_10%,rgba(255,255,255,.045),transparent_28%)]" />
      <header className="relative grid gap-6 border-b border-white/10 pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.42em] text-white/35">
            V482 / correlated landmark uncertainty
          </div>
          <h2 className="mt-4 max-w-4xl font-serif text-3xl tracking-[.045em] text-white/90 sm:text-5xl">
            一个共同尺度，五个相关误差
          </h2>
          <p className="mt-4 max-w-3xl font-mono text-[11px] leading-6 text-white/45">
            这是由共同 g 上界构成的 rank-1 外积上界，不是五个独立噪声的 1σ covariance。主特征值、零特征值、对角投影和完全相关结构全部显式记录；没有独立噪声或 detector 统计 authority。
          </p>
        </div>
        <div className="flex border border-white/10 bg-black/40 p-1 font-mono text-[9px] uppercase tracking-[.18em]">
          {(["science", "cinematic"] as const).map((entry) => (
            <button
              className={
                "px-4 py-2.5 transition-colors " +
                (mode === entry
                  ? "bg-[var(--v482-accent)] text-black"
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
          data-atlas-v482-load-state={state.status}
        >
          {state.status === "idle" || state.status === "loading"
            ? "正在读取 correlated uncertainty envelope……"
            : `Covariance envelope 不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-7 grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
            <aside className="border border-[var(--v482-accent)]/15 bg-[var(--v482-soft)] p-5 sm:p-6">
              <div className="font-mono text-[8px] uppercase tracking-[.2em] text-[var(--v482-accent)]">
                common-scale model
              </div>
              <div className="mt-5 space-y-3 font-mono text-[8px]">
                <Audit label="scale upper bound" value={scale} />
                <Audit label="scale consistency" value={summary.audit.maximumScaleConsistencyRelativeResidual} />
                <Audit label="diagonal projection" value={summary.audit.maximumDiagonalProjectionRelativeResidual} />
                <Audit label="eigenvalue / trace" value={summary.audit.maximumPrincipalEigenvalueTraceRelativeResidual} />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-2 font-mono text-[8px]">
                <Metric label="matrices" value="4" />
                <Metric label="rank" value="≤ 1" />
                <Metric label="zero eigenvalues" value="16" />
                <Metric label="independent noise" value="no" />
              </div>
              <div className="mt-6 border-t border-white/10 pt-4 font-mono text-[8px] leading-5 text-white/35">
                {mode} presentation: exposure {presentation.exposure.toFixed(2)}, bloom{" "}
                {presentation.bloomIntensity.toFixed(2)}. Covariance payload identity remains shared and immutable.
              </div>
            </aside>

            <article className="border border-white/10 bg-black/30 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 font-mono text-[8px] uppercase tracking-[.2em] text-white/35">
                <span>disk-00 / deterministic upper-bound covariance matrix</span>
                <span className="text-[var(--v482-accent)]">5 × 5</span>
              </div>
              <div className="mt-6 grid grid-cols-5 gap-1">
                {matrix.flatMap((row, rowIndex) =>
                  row.map((value, columnIndex) => (
                    <div
                      className="flex aspect-square items-center justify-center border border-white/8 bg-[var(--v482-soft)] p-1 font-mono text-[7px] text-[var(--v482-accent)]/75"
                      data-atlas-v482-covariance-cell={`${rowIndex}-${columnIndex}`}
                      key={`${rowIndex}-${columnIndex}`}
                      title={`C[${rowIndex},${columnIndex}] = ${value}`}
                    >
                      {value.toExponential(1)}
                    </div>
                  )),
                )}
              </div>
              <div className="mt-5 grid gap-2 font-mono text-[8px] sm:grid-cols-3">
                <Metric label="symmetric" value="yes" />
                <Metric label="PSD outer product" value="yes" />
                <Metric label="interpretation" value="upper-bound" />
              </div>
              <div className="mt-5 break-all border-t border-white/10 pt-4 font-mono text-[8px] leading-5 text-white/30">
                COVARIANCE PAYLOAD SHA / {summary.payloadSha256}
              </div>
            </article>
          </div>

          <div className="relative mt-5 grid gap-2 border border-amber-100/10 bg-amber-100/[.025] p-5 font-mono text-[8px] sm:grid-cols-4">
            <Boundary label="statistical 1σ authority" />
            <Boundary label="independent noise model" />
            <Boundary label="physical line identity" />
            <Boundary label="observed spectrum" />
          </div>

          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[8px] uppercase tracking-[.14em] text-white/35">
            <span>Science pixels 0 · images 0 · dense 0/49 · browser not-run</span>
            <a
              className="border border-white/10 px-3 py-1.5 transition-colors hover:border-[var(--v482-accent)]/50 hover:text-[var(--v482-accent)]"
              href="/api/atlas/relativity-evidence/v482/spectral-landmark-covariance?download=covariance"
            >
              导出 covariance envelope
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
      <span className="text-[var(--v482-accent)]">{value.toExponential(2)}</span>
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
