"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import { getKerrObservationProvenanceSnapshotV436, loadKerrObservationProvenanceSummaryV436, subscribeKerrObservationProvenanceV436 } from "../lib/kerrObservationProvenanceClientV436";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V405, resolveAtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";
import { createAtlasVisualTokenSignatureV300, useAtlasVisualRuntimeConsumerV300 } from "../lib/atlasVisualRuntimeConsumptionV300";

export default function KerrObservationProvenanceV436() {
  const state = useSyncExternalStore(subscribeKerrObservationProvenanceV436, getKerrObservationProvenanceSnapshotV436, getKerrObservationProvenanceSnapshotV436);
  useEffect(() => { void loadKerrObservationProvenanceSummaryV436().catch(() => undefined); }, []);
  const profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V405);
  const tokens = profile.runtimeTokens.hud.evidenceObservatoryV13;
  if (!tokens) throw new Error("v436-provenance-token-boundary");
  useAtlasVisualRuntimeConsumerV300({ profile: profile.id, group: "hud", consumer: "KerrObservationProvenanceV436", tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud) });
  const style = { "--v436-panel": tokens.panelOpacity, "--v436-grain": tokens.evidenceGrainOpacity } as CSSProperties;
  return <section style={style} className="relative mt-3 overflow-hidden rounded-[18px] border border-cyan-100/12 bg-[radial-gradient(circle_at_88%_12%,rgba(34,211,238,.08),transparent_32%),linear-gradient(140deg,rgba(2,10,12,var(--v436-panel)),rgba(3,7,10,var(--v436-panel))_62%,rgba(13,8,3,var(--v436-panel)))] p-3 font-mono text-white/55" data-atlas-kerr-observation-provenance-v436 data-atlas-v436-summary-only-in-react-state="true" data-atlas-v436-science-payload-mutation="false" data-atlas-v436-cinematic-writeback="false" data-atlas-v436-canvas-created="false" data-atlas-v436-profile={profile.id}>
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[var(--v436-grain)] [background-image:repeating-linear-gradient(118deg,transparent_0_8px,rgba(165,243,252,.07)_9px,transparent_10px_19px)]" />
    <header className="relative flex flex-wrap items-start justify-between gap-3 border-b border-white/7 pb-3">
      <div><div className="text-[6px] uppercase tracking-[.32em] text-cyan-100/48">V436 / observation provenance</div><h4 className="mt-1 text-[21px] font-light uppercase tracking-[.16em] text-cyan-50/90">Science payload boundary</h4><p className="mt-1 max-w-[96ch] text-[6px] leading-relaxed text-white/35">Four immutable disk observations join qualified v296 geometry with v297 polarization. Cinematic presentation can decorate the view, never the measurement.</p></div>
      <div className="border border-cyan-100/14 bg-cyan-100/[.025] px-2.5 py-1.5 text-[6px] uppercase tracking-[.12em] text-cyan-100/60" data-atlas-v436-status={state.status}>{state.status}</div>
    </header>
    {!state.summary ? <div className="relative mt-3 border-l-2 border-amber-100/25 bg-amber-100/[.025] px-3 py-2 text-[7px] text-amber-50/48" aria-live="polite">{state.status === "loading" || state.status === "idle" ? "Reading bounded provenance artifact..." : `Provenance unavailable / ${state.reason ?? "request-failed"}`}</div> : <>
      <div className="relative mt-3 grid gap-px bg-white/6 sm:grid-cols-4"><Metric label="disk payloads" value="4 / 4" tone="cyan" /><Metric label="geometry" value="QUALIFIED" tone="lime" /><Metric label="polarization" value="QUALIFIED" tone="lime" /><Metric label="dense authority" value="INCOMPLETE" tone="amber" /></div>
      <div className="relative mt-3 grid gap-2 md:grid-cols-2">{state.summary.payloads.map((payload) => <article key={payload.rayId} className="border border-white/8 bg-black/30 p-2.5" data-atlas-v436-payload={payload.rayId}><div className="flex items-center justify-between text-[7px] text-cyan-50/72"><span>{payload.rayId}</span><span>spin {payload.spin.toFixed(1)}</span></div><div className="mt-2 grid grid-cols-3 gap-px bg-white/7 text-[6px]"><Metric label="r_em" value={payload.emissionRadiusM.toFixed(3)} tone="cyan" /><Metric label="redshift" value={payload.redshift.toFixed(6)} tone="lime" /><Metric label="EVPA Δ" value={`${payload.evpaDifferenceDeg.toExponential(2)}°`} tone="lime" /></div><div className="mt-2 text-[5px] uppercase tracking-[.12em] text-lime-100/48">WP / parallel transport · applicable disk-hit</div></article>)}</div>
      <footer className="relative mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-2 text-[5px] uppercase tracking-[.08em] text-white/28"><span>linear science display · no bloom · no random noise · no writeback</span><span className="text-amber-100/45">measured import pending · browser not run</span></footer>
    </>}
  </section>;
}

function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "lime" | "cyan" | "amber" }>) { const color = tone === "lime" ? "text-lime-100/60" : tone === "cyan" ? "text-cyan-100/60" : "text-amber-100/58"; return <div className="bg-black/35 px-2 py-2"><div className="text-[5px] uppercase tracking-[.1em] text-white/24">{label}</div><div className={`mt-0.5 text-[7px] ${color}`}>{value}</div></div>; }
