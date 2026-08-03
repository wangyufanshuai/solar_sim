"use client";

import Image from "next/image";
import { useState, useSyncExternalStore, type CSSProperties } from "react";

import {
  getKerrDimensionlessPhotonAtlasSnapshotV487,
  loadKerrDimensionlessPhotonAtlasSummaryV487,
  subscribeKerrDimensionlessPhotonAtlasV487,
} from "../lib/kerrDimensionlessPhotonAtlasClientV487";

export default function KerrDimensionlessPhotonAtlasV487() {
  const state = useSyncExternalStore(
    subscribeKerrDimensionlessPhotonAtlasV487,
    getKerrDimensionlessPhotonAtlasSnapshotV487,
    getKerrDimensionlessPhotonAtlasSnapshotV487,
  );
  const [mode, setMode] = useState<"science" | "cinematic">("science");
  const summary = state.summary;
  const style = {
    "--v487-accent": mode === "science" ? "#75ecff" : "#ffb66f",
    "--v487-wash": mode === "science" ? "rgba(68,214,255,.07)" : "rgba(255,130,70,.09)",
  } as CSSProperties;

  return (
    <section
      className="relative mt-7 overflow-hidden rounded-[32px] border border-white/10 bg-[#020607] p-5 text-white shadow-[0_70px_220px_rgba(0,0,0,.8)] sm:p-8"
      data-atlas-kerr-dimensionless-photon-atlas-v487
      data-atlas-v487-mode={mode}
      data-atlas-v487-request-count={state.requestCount}
      data-atlas-v487-science-writeback="false"
      data-atlas-v487-science-raster="false"
      data-atlas-v487-canvas-created="false"
      data-atlas-v487-scene-revision-delta="0"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,var(--v487-wash),transparent_42%)]" />
      <header className="relative grid gap-6 border-b border-white/10 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.42em] text-[var(--v487-accent)]/60">
            V487 / sparse photon coordinate atlas
          </div>
          <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.035em] text-white/90 sm:text-6xl">
            Redshift rails without invented light
          </h2>
          <p className="mt-4 max-w-3xl font-mono text-[10px] leading-6 text-white/42">
            Twenty dimensionless landmarks show coordinate transport across four verified disk rays.
            The reference frequency, line identity, bandpass, throughput, intensity and likelihood remain unavailable.
          </p>
        </div>
        <div className="flex border border-white/12 bg-black/55 p-1 font-mono text-[8px] uppercase tracking-[.2em]">
          {(["science", "cinematic"] as const).map((entry) => (
            <button
              className={mode === entry
                ? "bg-[var(--v487-accent)] px-4 py-2.5 text-black"
                : "px-4 py-2.5 text-white/30 transition-colors hover:text-white/70"}
              key={entry}
              onClick={() => setMode(entry)}
              type="button"
            >
              {entry}
            </button>
          ))}
        </div>
      </header>

      {state.status === "idle" ? (
        <div className="relative mt-6 border border-dashed border-[var(--v487-accent)]/20 bg-white/[.02] p-5">
          <div className="font-mono text-[10px] leading-5 text-white/45">
            The bounded 4-ray / 20-landmark artifact is not auto-loaded. Explicit intent is required.
          </div>
          <button
            className="atlas-accessible-focus mt-4 border border-[var(--v487-accent)]/35 bg-[var(--v487-wash)] px-4 py-2 font-mono text-[9px] uppercase tracking-[.16em] text-[var(--v487-accent)]"
            onClick={() => void loadKerrDimensionlessPhotonAtlasSummaryV487().catch(() => undefined)}
            type="button"
          >
            Load bounded coordinate atlas
          </button>
        </div>
      ) : null}

      {state.status === "loading" ? (
        <div className="relative mt-6 border-l-2 border-[var(--v487-accent)]/45 bg-white/[.025] px-4 py-3 font-mono text-[10px] text-white/50">
          Verifying artifact and SVG SHA...
        </div>
      ) : null}

      {state.status === "unavailable" ? (
        <div className="relative mt-6 border-l-2 border-amber-200/35 bg-amber-100/[.025] px-4 py-3 font-mono text-[10px] text-amber-50/55">
          Coordinate atlas unavailable / {state.reason ?? "request-failed"}
        </div>
      ) : null}

      {summary ? (
        <>
          <div className="relative mt-6 grid grid-cols-2 gap-px border border-white/10 bg-white/10 font-mono sm:grid-cols-4">
            <Stat label="verified rays" value="4" />
            <Stat label="landmarks" value="20" />
            <Stat label="identifiable" value="1 / 5" />
            <Stat label="science pixels" value="0" />
          </div>
          <figure className="relative mt-5 overflow-hidden border border-white/10 bg-black/35 p-2 sm:p-4">
            {/* The same immutable science SVG is used in both shells. Cinematic mode changes only this surrounding frame. */}
            <Image
              alt="Four sparse Kerr disk-ray rails comparing dimensionless emitter and observer frequency landmarks; no intensity is encoded"
              className="block h-auto w-full"
              height={900}
              src={summary.svgHref}
              unoptimized
              width={1440}
            />
            <figcaption className="border-t border-white/8 px-2 pt-3 font-mono text-[8px] leading-4 text-white/32">
              Marker position encodes only normalized coordinate. Color encodes redshift/blueshift class, never intensity.
              Uncertainty is a deterministic correlated upper bound, not a statistical 1-sigma interval.
            </figcaption>
          </figure>
          <div className="relative mt-5 grid gap-2 lg:grid-cols-4">
            {summary.rays.map((ray) => (
              <article className="border border-white/10 bg-white/[.025] p-4" key={ray.rayId}>
                <div className="flex items-center justify-between gap-3 font-mono text-[9px]">
                  <span className="text-white/75">{ray.rayId}</span>
                  <span className={ray.shiftClass === "blueshift" ? "text-cyan-200/70" : "text-orange-200/70"}>
                    {ray.shiftClass}
                  </span>
                </div>
                <div className="mt-5 font-serif text-3xl text-[var(--v487-accent)]/80">g {ray.redshiftFactor.toFixed(6)}</div>
                <div className="mt-4 space-y-1 font-mono text-[8px] text-white/30">
                  <div>coordinates {ray.landmarks.length}</div>
                  <div>rank {ray.identifiability.identifiableDimension} / nullity {ray.identifiability.unidentifiableDimension}</div>
                  <div>condition {ray.identifiability.fullConditionNumber}</div>
                  <div>likelihood unavailable</div>
                </div>
              </article>
            ))}
          </div>
          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[8px] uppercase tracking-[.13em] text-white/30">
            <span>payload {summary.payloadSha256.slice(0, 18)}... / SVG {summary.svgSha256.slice(0, 18)}...</span>
            <span className="flex gap-2">
              <a className="border border-white/12 px-3 py-1.5 hover:border-[var(--v487-accent)]/45" href={`${summary.svgHref}&download=svg`}>export SVG</a>
              <a className="border border-white/12 px-3 py-1.5 hover:border-[var(--v487-accent)]/45" href="/api/atlas/relativity-evidence/v487/dimensionless-photon-atlas?download=atlas">export provenance</a>
            </span>
          </footer>
        </>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#05090a] px-4 py-3 text-center">
      <div className="text-[7px] uppercase tracking-[.18em] text-white/25">{label}</div>
      <div className="mt-1 font-serif text-xl text-white/75">{value}</div>
    </div>
  );
}
