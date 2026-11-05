"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";

import { resolveAtlasScienceCinematicV7V457 } from "../lib/atlasScienceCinematicV7V457";
import {
  getKerrObservableProvenanceSnapshotV471,
  loadKerrObservableProvenanceSummaryV471,
  subscribeKerrObservableProvenanceV471,
} from "../lib/kerrObservableProvenanceClientV471";

const STATUS_LABELS = Object.freeze({
  "available-short-authority": "SHORT AUTHORITY",
  "available-coordinate-authority": "COORDINATE",
  "available-analytic-fixture": "ANALYTIC FIXTURE",
  "unavailable-production-authority": "UNAVAILABLE",
});

export default function KerrObservableProvenanceMatrixV471() {
  const state = useSyncExternalStore(
    subscribeKerrObservableProvenanceV471,
    getKerrObservableProvenanceSnapshotV471,
    getKerrObservableProvenanceSnapshotV471,
  );
  const tokens = resolveAtlasScienceCinematicV7V457("science");

  useEffect(() => {
    void loadKerrObservableProvenanceSummaryV471().catch(() => undefined);
  }, []);

  const style = {
    "--v471-ink": tokens.productGate.ink,
    "--v471-panel": tokens.productGate.panel,
    "--v471-grid": tokens.productGate.grid,
    "--v471-qualified": tokens.productGate.qualified,
    "--v471-blocked": tokens.productGate.blocked,
  } as CSSProperties;
  const summary = state.summary;

  return (
    <section
      className="relative mt-6 overflow-hidden rounded-[38px] border border-white/10 bg-[radial-gradient(ellipse_at_0%_0%,rgba(56,189,248,.13),transparent_30%),radial-gradient(ellipse_at_100%_100%,rgba(249,115,22,.08),transparent_34%),linear-gradient(150deg,var(--v471-panel),#020607_55%,#071014)] p-5 font-mono text-[var(--v471-ink)] shadow-[0_42px_150px_rgba(0,0,0,.6)] sm:p-8"
      data-atlas-kerr-observable-provenance-v471
      data-atlas-v471-row-count={summary?.rows.length ?? 0}
      data-atlas-v471-production-authority={
        summary?.summary.productionAuthorityGrantedRowCount ?? 0
      }
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(90deg,var(--v471-grid)_1px,transparent_1px)] [background-size:72px_100%]" />

      <header className="relative grid gap-6 border-b border-white/10 pb-7 xl:grid-cols-[1fr_auto] xl:items-end">
        <div>
          <div className="text-[9px] uppercase tracking-[.36em] opacity-45">
            V471 / observable provenance matrix
          </div>
          <h2 className="mt-3 max-w-5xl font-serif text-3xl tracking-[.055em] sm:text-5xl">
            一个数值，必须带着它的来源、适用性与边界出现
          </h2>
          <p className="mt-4 max-w-3xl text-[11px] leading-6 opacity-55">
            连续坐标不是像素，方向基不是 Stokes，解析辐射不是 measured detector
            authority；unavailable 永远不被写成零。
          </p>
        </div>
        <div className="grid grid-cols-4 gap-px overflow-hidden border border-white/10 bg-white/10 text-center">
          <Metric label="available" value={String(summary?.summary.availableRowCount ?? 0)} />
          <Metric label="blocked" value={String(summary?.summary.unavailableRowCount ?? 0)} />
          <Metric label="pixels" value="0" />
          <Metric label="prod auth" value="0" />
        </div>
      </header>

      {!summary ? (
        <div
          className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-3 text-[10px] opacity-60"
          data-atlas-v471-load-state={state.status}
        >
          {state.status === "idle" || state.status === "loading"
            ? "正在读取 observable provenance…"
            : "Observable provenance 不可用 / " + (state.reason ?? "request-failed")}
        </div>
      ) : (
        <>
          <div className="relative mt-7 overflow-hidden border border-white/10 bg-black/20">
            <div className="hidden grid-cols-[1.05fr_1.35fr_.7fr_.65fr_.85fr] gap-4 border-b border-white/10 px-4 py-3 text-[8px] uppercase tracking-[.18em] opacity-35 lg:grid">
              <span>observable</span>
              <span>semantics / units</span>
              <span>scope</span>
              <span>source</span>
              <span>verification</span>
            </div>
            {summary.rows.map((row, index) => (
              <article
                className="grid gap-3 border-b border-white/8 px-4 py-4 last:border-b-0 lg:grid-cols-[1.05fr_1.35fr_.7fr_.65fr_.85fr] lg:items-center lg:gap-4"
                data-atlas-v471-observable={row.id}
                data-atlas-v471-observable-available={row.available ? "true" : "false"}
                key={row.id}
              >
                <div>
                  <div className="flex items-center gap-3 text-[8px] opacity-35">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span>{row.domain}</span>
                  </div>
                  <div className="mt-2 text-[11px] leading-5">{row.label}</div>
                  <div
                    className={
                      "mt-2 inline-block border px-2 py-1 text-[7px] tracking-[.14em] " +
                      (row.available
                        ? "border-[var(--v471-qualified)]/25 text-[var(--v471-qualified)]/70"
                        : "border-[var(--v471-blocked)]/25 text-[var(--v471-blocked)]/75")
                    }
                  >
                    {STATUS_LABELS[row.status]}
                  </div>
                </div>
                <div className="text-[9px] leading-5 opacity-55">
                  {row.semantics}
                  <div className="mt-1 text-[8px] text-cyan-100/40">{row.units}</div>
                </div>
                <div className="text-[8px] leading-4 opacity-50">
                  {row.applicability}
                  <div className="mt-1">
                    records {row.recordCount} · N/A {row.notApplicableCount}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[8px]">
                  {row.sourceIds.map((sourceId) => (
                    <span className="border border-white/10 px-2 py-1 opacity-50" key={sourceId}>
                      {sourceId}
                    </span>
                  ))}
                </div>
                <div className="text-[8px] leading-4">
                  {row.verification ? (
                    <>
                      <div className="opacity-45">{row.verification.metric}</div>
                      <div className="mt-1 text-[var(--v471-qualified)]/70">
                        {formatMetric(row.verification.observed)}
                        {row.verification.limit === null
                          ? " · source-qualified"
                          : " " +
                            row.verification.relation +
                            " " +
                            formatMetric(row.verification.limit)}
                      </div>
                    </>
                  ) : (
                    <div className="text-[var(--v471-blocked)]/75">
                      {row.unavailableReason}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="relative mt-6 grid gap-3 md:grid-cols-3">
            <Boundary title="Sparse authority" detail="v312/v313 short gate；不是 49/49 dense transfer map。" />
            <Boundary title="Coordinate authority" detail="连续 WCS 与方向基可审计；没有 raster sample 或 Stokes 幅值。" />
            <Boundary title="Production boundary" detail="detector、science pixel 与 FITS image 保持 unavailable。" />
          </div>

          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase tracking-[.14em] opacity-45">
            <span>Science immutable · Cinematic writeback forbidden · Canvas +0 · sceneRevision Δ0</span>
            <a
              className="border border-white/10 px-3 py-1.5 transition-colors hover:border-white/30 hover:opacity-90"
              href="/api/atlas/relativity-evidence/v471/observable-provenance?download=observable-matrix"
            >
              导出观测量矩阵
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-20 bg-black/45 px-3 py-3">
      <div className="text-[7px] uppercase tracking-[.16em] opacity-35">{label}</div>
      <div className="mt-1 text-lg text-[var(--v471-blocked)]">{value}</div>
    </div>
  );
}

function Boundary({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="border border-white/10 bg-black/20 p-4">
      <div className="text-[8px] uppercase tracking-[.18em] opacity-45">{title}</div>
      <p className="mt-2 text-[9px] leading-5 opacity-50">{detail}</p>
    </div>
  );
}

function formatMetric(value: number): string {
  if (value === 0) return "0";
  if (Math.abs(value) < 0.001 || Math.abs(value) >= 1000) return value.toExponential(3);
  return value.toPrecision(5);
}
