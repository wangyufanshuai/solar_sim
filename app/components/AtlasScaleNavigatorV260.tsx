"use client";

import { useEffect, useMemo } from "react";
import { ATLAS_SCALE_BANDS_V260, ATLAS_SCALE_BAND_ORDER_V260, atlasScaleLogProgressV260 } from "../lib/atlasScaleBandsV260";
import { atlasRuntimeStore, useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import type { AtlasScaleBand } from "../lib/atlasRuntimeStateV256";

export default function AtlasScaleNavigatorV260() {
  const scaleBand = useAtlasRuntimeStore((snapshot) => snapshot.scaleBand);
  const journey = useAtlasRuntimeStore((snapshot) => snapshot.scaleJourney);
  const researchOverlayOpen = useAtlasRuntimeStore((snapshot) => snapshot.researchOverlay !== "none");
  const displayedBand = journey.lifecycle === "transition" ? journey.finalTarget : scaleBand;
  const profile = ATLAS_SCALE_BANDS_V260[displayedBand];
  const displayedIndex = ATLAS_SCALE_BAND_ORDER_V260.indexOf(displayedBand);
  const breadcrumb = useMemo(() => journey.returnPath.slice(-4).map((band) => ATLAS_SCALE_BANDS_V260[band].label).join(" / "), [journey.returnPath]);

  useEffect(() => {
    if (journey.lifecycle !== "transition") return;
    const cancel = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      atlasRuntimeStore.cancelScaleJourney(journey.requestId);
    };
    window.addEventListener("keydown", cancel);
    return () => window.removeEventListener("keydown", cancel);
  }, [journey]);

  const selectBand = (next: AtlasScaleBand) => {
    if (next === scaleBand && journey.lifecycle === "idle") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextJourney = atlasRuntimeStore.requestScaleJourney(next, undefined, reducedMotion);
    if (nextJourney.durationMs === 0 && nextJourney.lifecycle === "transition") {
      let current = nextJourney;
      while (current.lifecycle === "transition") {
        atlasRuntimeStore.completeScaleJourneyStep(current.requestId, current.requestedAtMs);
        current = atlasRuntimeStore.getSnapshot().scaleJourney;
      }
    }
  };

  return (
    <nav inert={researchOverlayOpen || undefined} className={`fixed left-1/2 top-3 z-[68] w-[min(720px,calc(100vw-1.5rem))] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#04070a]/82 px-3 py-2 shadow-xl backdrop-blur-xl max-sm:top-14 ${researchOverlayOpen ? "max-sm:hidden" : ""}`} aria-hidden={researchOverlayOpen || undefined} aria-label="宇宙尺度导航" data-atlas-scale-band={scaleBand} data-atlas-scale-journey={journey.lifecycle} data-atlas-scale-position-status={journey.positionStatus}>
      <div className="flex items-center gap-1 overflow-x-auto">{ATLAS_SCALE_BAND_ORDER_V260.map((band) => <button key={band} type="button" aria-pressed={band === displayedBand} onClick={() => selectBand(band)} className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] transition ${band === displayedBand ? "bg-cyan-200/12 text-cyan-100" : "text-slate-500 hover:text-slate-200"}`}>{ATLAS_SCALE_BANDS_V260[band].label}</button>)}</div>
      <label className="mt-1.5 block"><span className="sr-only">连续对数尺度</span><input type="range" min={0} max={ATLAS_SCALE_BAND_ORDER_V260.length - 1} step={1} value={displayedIndex} onChange={(event) => selectBand(ATLAS_SCALE_BAND_ORDER_V260[Number(event.target.value)]!)} onKeyDown={(event) => { if (event.key === "PageUp") selectBand(ATLAS_SCALE_BAND_ORDER_V260[Math.min(ATLAS_SCALE_BAND_ORDER_V260.length - 1, displayedIndex + 1)]!); if (event.key === "PageDown") selectBand(ATLAS_SCALE_BAND_ORDER_V260[Math.max(0, displayedIndex - 1)]!); }} className="h-1 w-full accent-cyan-300" /></label>
      <div className="mt-1 h-px bg-white/8"><div className="h-px bg-gradient-to-r from-cyan-400/50 to-amber-300/50 transition-[width] duration-700" style={{ width: `${atlasScaleLogProgressV260(displayedBand) * 100}%` }} /></div>
      <div className="mt-1 flex items-center justify-between gap-3 text-[9px] text-slate-600"><span>{journey.lifecycle === "transition" ? `${ATLAS_SCALE_BANDS_V260[journey.from].label} → ${ATLAS_SCALE_BANDS_V260[journey.to].label} · 900 ms log handoff` : profile.dataLayer}</span><span>{profile.referenceSpan} {profile.unit} · {profile.trust}{profile.publicDeploymentBlocked ? " · LOCAL ONLY" : ""}</span></div>
      {breadcrumb ? <p className="mt-1 truncate text-[8px] text-slate-700">return path · {breadcrumb}</p> : null}
      {journey.positionStatus === "position-unavailable" ? <p className="mt-1 text-[8px] text-amber-300/60">Selection passport retained · position unavailable in target band</p> : null}
      {journey.positionStatus === "angular-shell-only" ? <p className="mt-1 text-[8px] text-amber-300/60">Selection passport retained · angular shell only; no distance is invented</p> : null}
    </nav>
  );
}
