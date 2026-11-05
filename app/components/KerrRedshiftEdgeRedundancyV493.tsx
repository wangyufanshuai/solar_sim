"use client";

import Image from "next/image";
import { useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrRedshiftEdgeRedundancySnapshotV493,
  loadKerrRedshiftEdgeRedundancySummaryV493,
  subscribeKerrRedshiftEdgeRedundancyV493,
} from "../lib/kerrRedshiftEdgeRedundancyClientV493";

export default function KerrRedshiftEdgeRedundancyV493() {
  const state = useSyncExternalStore(subscribeKerrRedshiftEdgeRedundancyV493, getKerrRedshiftEdgeRedundancySnapshotV493, getKerrRedshiftEdgeRedundancySnapshotV493);
  const [mode, setMode] = useState<"science" | "cinematic">("science");
  const summary = state.summary;
  const style = {
    "--v493-accent": mode === "science" ? "#71edff" : "#ffab72",
    "--v493-wash": mode === "science" ? "rgba(55,218,255,.075)" : "rgba(255,126,65,.095)",
  } as CSSProperties;
  return <section className="relative mt-7 overflow-hidden rounded-[34px] border border-white/10 bg-[#020607] p-5 text-white shadow-[0_70px_220px_rgba(0,0,0,.8)] sm:p-8" data-atlas-kerr-redshift-edge-redundancy-v493 data-atlas-v493-mode={mode} data-atlas-v493-request-count={state.requestCount} data-atlas-v493-statistical-jackknife="false" data-atlas-v493-science-writeback="false" data-atlas-v493-science-raster="false" data-atlas-v493-scene-revision-delta="0" style={style}>
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_8%,var(--v493-wash),transparent_43%)]" />
    <header className="relative flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-6">
      <div>
        <div className="font-mono text-[9px] uppercase tracking-[.42em] text-[var(--v493-accent)]/65">V493 / K4 edge redundancy</div>
        <h1 className="mt-4 font-serif text-4xl tracking-[.035em] text-white/90 sm:text-6xl">Six deletions, one connected truth</h1>
        <p className="mt-4 max-w-3xl font-mono text-[10px] leading-6 text-white/42">Each K4 contrast edge is removed in turn. The remaining five edges preserve rank three, one graph gauge and the held-edge prediction. This is deterministic algebraic consistency, not a statistical jackknife or a detector-noise claim.</p>
      </div>
      <div className="flex border border-white/12 bg-black/55 p-1 font-mono text-[8px] uppercase tracking-[.2em]">{(["science", "cinematic"] as const).map((entry) => <button className={mode === entry ? "bg-[var(--v493-accent)] px-4 py-2.5 text-black" : "px-4 py-2.5 text-white/30"} key={entry} onClick={() => setMode(entry)} type="button">{entry}</button>)}</div>
    </header>
    {state.status === "idle" ? <div className="relative mt-6 border border-dashed border-[var(--v493-accent)]/20 bg-white/[.02] p-5"><div className="font-mono text-[10px] text-white/45">Detailed incidence, Laplacian and pseudoinverse matrices remain outside React state. Load the bounded deletion summary explicitly.</div><button className="atlas-accessible-focus mt-4 border border-[var(--v493-accent)]/35 bg-[var(--v493-wash)] px-4 py-2 font-mono text-[9px] uppercase tracking-[.16em] text-[var(--v493-accent)]" onClick={() => void loadKerrRedshiftEdgeRedundancySummaryV493().catch(() => undefined)} type="button">Load edge redundancy audit</button></div> : null}
    {state.status === "loading" ? <div className="relative mt-6 font-mono text-[10px] text-white/50">Verifying numerical spectrum, Moore-Penrose residual and SVG SHA...</div> : null}
    {state.status === "unavailable" ? <div className="relative mt-6 font-mono text-[10px] text-amber-100/60">Edge redundancy unavailable / {state.reason ?? "request-failed"}</div> : null}
    {summary ? <>
      <div className="relative mt-6 grid grid-cols-2 gap-px border border-white/10 bg-white/10 font-mono sm:grid-cols-5"><Stat label="deletions" value="6" /><Stat label="edge leverage" value="0.5" /><Stat label="sum / rank" value="3 / 3" /><Stat label="gauge" value="1" /><Stat label="jackknife" value="blocked" /></div>
      <figure className="relative mt-5 overflow-hidden border border-white/10 bg-black/35 p-2 sm:p-4"><Image alt="Six leave-one-edge-out K4 redshift reconstructions with retained rank, gauge and held-edge residuals" className="block h-auto w-full" height={900} src={summary.svgHref} unoptimized width={1440} /><figcaption className="border-t border-white/8 px-2 pt-3 font-mono text-[8px] leading-4 text-white/32">Science and Cinematic shells share the same immutable SVG and payload SHA. Neither shell creates calibration, noise covariance or observed intensity.</figcaption></figure>
      <div className="relative mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{summary.deletionCases.map((entry) => <article className="border border-white/10 bg-white/[.025] p-4" key={entry.caseId}><div className="font-serif text-xl text-white/80">drop {entry.removedEdgeId}</div><div className="mt-3 font-mono text-[9px] text-[var(--v493-accent)]/70">spectrum [0, 2, 4, 4]</div><div className="mt-2 font-mono text-[8px] leading-4 text-white/30">numerical spectrum residual {entry.eigenvalueResidual.toExponential(2)}<br />node residual {entry.nodeResidual.toExponential(2)}<br />held edge {entry.removedEdgePredictionResidual.toExponential(2)}</div></article>)}</div>
      <footer className="relative mt-6 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[8px] text-white/30"><span>payload {summary.payloadSha256.slice(0, 18)}... / max spectral residual {summary.audit.maximumDeletionEigenvalueResidual.toExponential(3)}</span><span className="flex gap-2"><a className="border border-white/12 px-3 py-1.5" href={`${summary.svgHref}&download=svg`}>export SVG</a><a className="border border-white/12 px-3 py-1.5" href="/api/atlas/relativity-evidence/v493/redshift-edge-redundancy?download=audit">export provenance</a></span></footer>
    </> : null}
  </section>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="bg-[#05090a] px-4 py-3 text-center"><div className="text-[7px] uppercase tracking-[.18em] text-white/25">{label}</div><div className="mt-1 font-serif text-xl text-white/75">{value}</div></div>; }
