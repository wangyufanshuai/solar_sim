"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";

import { resolveAtlasScienceCinematicV8V472 } from "../lib/atlasScienceCinematicV8V472";
import {
  getKerrSparseSciencePayloadSnapshotV474,
  loadKerrSparseSciencePayloadSummaryV474,
  subscribeKerrSparseSciencePayloadV474,
} from "../lib/kerrSparseSciencePayloadClientV474";

export default function KerrSparseSciencePayloadInspectorV474() {
  const state = useSyncExternalStore(
    subscribeKerrSparseSciencePayloadV474,
    getKerrSparseSciencePayloadSnapshotV474,
    getKerrSparseSciencePayloadSnapshotV474,
  );
  const [selectedId, setSelectedId] = useState("disk-00");
  const tokens = resolveAtlasScienceCinematicV8V472("science");

  useEffect(() => {
    void loadKerrSparseSciencePayloadSummaryV474().catch(() => undefined);
  }, []);

  const selected =
    state.summary?.rows.find((row) => row.rayId === selectedId) ?? state.summary?.rows[0] ?? null;
  const style = {
    "--v474-ink": tokens.researchHud.ink,
    "--v474-panel": tokens.researchHud.panel,
    "--v474-grid": tokens.researchHud.grid,
    "--v474-qualified": tokens.researchHud.shortAuthority,
    "--v474-coordinate": tokens.researchHud.coordinateAuthority,
    "--v474-open": tokens.researchHud.unavailable,
  } as CSSProperties;

  return (
    <section
      className="relative mt-6 overflow-hidden rounded-[38px] border border-white/10 bg-[radial-gradient(circle_at_86%_0%,rgba(103,232,249,.12),transparent_27%),linear-gradient(150deg,var(--v474-panel),#020607_60%,#031117)] p-5 font-mono text-[var(--v474-ink)] shadow-[0_44px_150px_rgba(0,0,0,.6)] sm:p-8"
      data-atlas-kerr-sparse-payload-v474
      data-atlas-v474-production-payload="false"
      data-atlas-v474-science-pixels="0"
      data-atlas-v474-stokes-rows="0"
      data-atlas-v474-runtime-mutation="false"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(var(--v474-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v474-grid)_1px,transparent_1px)] [background-size:48px_48px]" />
      <header className="relative grid gap-6 border-b border-white/10 pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="text-[9px] uppercase tracking-[.36em] opacity-45">
            V474 / immutable sparse Science payload
          </div>
          <h2 className="mt-3 max-w-4xl font-serif text-3xl tracking-[.06em] sm:text-5xl">
            四条真实光线，原子连接成一封不可变科研信封
          </h2>
          <p className="mt-4 max-w-3xl text-[11px] leading-6 opacity-55">
            geometry、redshift、EVPA、连续 WCS 与 q̂/û 按 rayId 连接，并绑定 uncertainty
            SHA；它仍不是 dense image、Stokes measurement 或 production pixel。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 text-center">
          <Metric label="rows" value={String(state.summary?.rows.length ?? 0)} />
          <Metric label="u refs" value={String((state.summary?.rows.length ?? 0) * 7)} />
          <Metric label="pixels" value="0" />
          <Metric label="dense" value="0/49" />
        </div>
      </header>

      {!state.summary ? (
        <div
          className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-3 text-[10px] opacity-60"
          data-atlas-v474-load-state={state.status}
        >
          {state.status === "idle" || state.status === "loading"
            ? "正在读取 sparse Science payload…"
            : "Sparse payload 不可用 / " + (state.reason ?? "request-failed")}
        </div>
      ) : (
        <>
          <div className="relative mt-7 grid gap-5 xl:grid-cols-[.6fr_1.4fr]">
            <div className="grid content-start gap-2">
              {state.summary.rows.map((row, index) => (
                <button
                  className={
                    "border p-4 text-left transition-colors " +
                    (selected?.rayId === row.rayId
                      ? "border-[var(--v474-qualified)]/35 bg-[var(--v474-qualified)]/[.05]"
                      : "border-white/8 bg-black/20 opacity-55 hover:opacity-90")
                  }
                  data-atlas-v474-ray={row.rayId}
                  key={row.rayId}
                  onClick={() => setSelectedId(row.rayId)}
                  type="button"
                >
                  <div className="flex items-center justify-between text-[8px] opacity-40">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span>a = {row.spinA}</span>
                  </div>
                  <div className="mt-3 text-lg">{row.rayId}</div>
                  <div className="mt-2 text-[8px] text-[var(--v474-qualified)]/65">
                    {row.geometry.classification} · g {row.geometry.redshiftFactor.toFixed(6)}
                  </div>
                  <div className="mt-3 truncate text-[7px] opacity-30">
                    SHA {row.rowSha256.slice(0, 18)}…
                  </div>
                </button>
              ))}
            </div>

            <article className="border border-white/10 bg-black/25 p-5">
              {selected ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[8px] uppercase tracking-[.18em] opacity-45">
                    <span>{selected.rayId} / ray {selected.rayIndex}</span>
                    <span>finite-distance ZAMO / 30M / 70°</span>
                  </div>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <Value label="classification" value={selected.geometry.classification} />
                    <Value label="emission radius" value={format(selected.geometry.emissionRadiusM) + " M"} />
                    <Value label="redshift g" value={format(selected.geometry.redshiftFactor)} />
                    <Value label="EVPA" value={format(selected.polarization.evpaDeg) + "°"} />
                    <Value label="screen alpha" value={format(selected.screen.alphaM) + " M"} />
                    <Value label="screen beta" value={format(selected.screen.betaM) + " M"} />
                    <Value label="continuous x" value={format(selected.coordinate.continuousPixelX)} />
                    <Value label="continuous y" value={format(selected.coordinate.continuousPixelY)} />
                    <Value label="q hat" value={format(selected.polarization.orientationQHat)} />
                    <Value label="u hat" value={format(selected.polarization.orientationUHat)} />
                    <Value label="intensity" value="unavailable" blocked />
                    <Value label="Stokes I/Q/U/V" value="null / null / null / null" blocked />
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-5">
                    <div className="text-[8px] uppercase tracking-[.18em] opacity-35">
                      uncertainty references / {selected.uncertainty.length}
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {selected.uncertainty.map((entry) => (
                        <div
                          className="flex items-start justify-between gap-4 border border-white/8 bg-white/[.025] px-3 py-3 text-[8px]"
                          key={entry.observableId}
                        >
                          <span className="opacity-45">{entry.observableId}</span>
                          <span className="text-right text-[var(--v474-coordinate)]">
                            {format(entry.combinedValue)} {entry.combinedUnits}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-2 border-t border-white/10 pt-5 text-[8px] sm:grid-cols-2">
                    <LedgerRow label="pixel sample" value="null" />
                    <LedgerRow label="interpolation" value="forbidden" />
                    <LedgerRow label="production payload" value="blocked" />
                    <LedgerRow label="row SHA" value={selected.rowSha256.slice(0, 24) + "…"} />
                  </div>
                </>
              ) : null}
            </article>
          </div>

          <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border border-[var(--v474-open)]/20 bg-[var(--v474-open)]/[.025] p-4 text-[8px]">
            <span>payload SHA {state.summary.payloadSha256}</span>
            <span className="text-[var(--v474-open)]">
              sparse authority qualified · dense / production / raster blocked
            </span>
          </div>

          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase tracking-[.14em] opacity-45">
            <span>atomic join 4/4 · mismatch 0 · partial publish false</span>
            <a
              className="border border-white/10 px-3 py-1.5 transition-colors hover:border-white/30 hover:opacity-90"
              href="/api/atlas/relativity-evidence/v474/sparse-science-payload?download=sparse-payload"
            >
              导出 sparse payload
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-24 bg-black/45 px-4 py-3">
      <div className="text-[7px] uppercase tracking-[.16em] opacity-35">{label}</div>
      <div className="mt-1 text-lg text-[var(--v474-open)]">{value}</div>
    </div>
  );
}

function Value({ label, value, blocked = false }: { label: string; value: string; blocked?: boolean }) {
  return (
    <div className="border border-white/8 bg-white/[.025] p-3">
      <div className="text-[7px] uppercase tracking-[.14em] opacity-35">{label}</div>
      <div
        className={
          "mt-2 text-[10px] " +
          (blocked ? "text-[var(--v474-open)]" : "text-[var(--v474-qualified)]")
        }
      >
        {value}
      </div>
    </div>
  );
}

function LedgerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/7 pb-2">
      <span className="opacity-35">{label}</span>
      <span className="max-w-[72%] text-right text-[var(--v474-open)]">{value}</span>
    </div>
  );
}

function format(value: number): string {
  if (value === 0) return "0";
  if (Math.abs(value) < 0.001 || Math.abs(value) >= 1000) return value.toExponential(4);
  return value.toPrecision(7);
}
