"use client";

import type { LocalTelemetry } from "../lib/localLaunchPhysics";
import { getAtlasRuntimeQualityProfile, getLaunchSequenceDirectorPhaseV118, launchDirectorPhaseLabelV118 } from "../lib/launchSequenceDirector";
import type { AtlasRuntimeQualityTier } from "../lib/simulationDiagnosticsTypes";
import { createPortal } from "react-dom";
import { LAUNCH_CINEMATIC_PHASES_V3, LAUNCH_CINEMATIC_V3_VERSION, launchPhaseProgressV3 } from "../lib/launchCinematicV3";

export default function LaunchDirectorOverlay({ telemetry, qualityTier }: { telemetry: LocalTelemetry | null; qualityTier: AtlasRuntimeQualityTier }) {
  const phase = getLaunchSequenceDirectorPhaseV118(telemetry);
  const quality = getAtlasRuntimeQualityProfile(qualityTier);
  const missionTime = telemetry?.missionTimeS ?? 0;
  const phaseIndex = launchPhaseProgressV3(phase);
  if (typeof document === "undefined") return null;
  return createPortal(
    <section className="pointer-events-none fixed left-3 top-3 z-[145] w-[min(22rem,calc(100vw-1.5rem))] border-l-2 border-orange-300/75 bg-black/90 px-3 py-2 font-mono text-white shadow-[0_10px_32px_rgba(0,0,0,0.58)] sm:left-5 sm:top-5" data-launch-screen-overlay="fixed-screen-space" data-launch-cinematic-version={LAUNCH_CINEMATIC_V3_VERSION} data-launch-director-phase={phase} data-launch-runtime-quality={qualityTier} data-launch-plume-budget={quality.particleBudget} data-launch-plume-profile={quality.plumeBudget} data-launch-telemetry-source="local-default" data-launch-openrocket-import-status="offline-import-ready">
      <div className="flex items-center justify-between gap-4 text-[9px] uppercase text-orange-100/65"><span>Launch Sequence Director</span><span>T+{Math.max(0, missionTime).toFixed(1)} s</span></div>
      <div className="mt-1 text-[14px] font-semibold text-white/90">{launchDirectorPhaseLabelV118(phase)}</div>
      <div className="mt-1 grid grid-cols-3 gap-2 text-[9px] text-white/46"><span>{(telemetry?.altitudeKm ?? 0).toFixed(1)} km</span><span>Mach {(telemetry?.mach ?? 0).toFixed(2)}</span><span>{((telemetry?.dynamicPressurePa ?? 0) / 1000).toFixed(1)} kPa</span></div>
      <div className="mt-2 grid grid-cols-8 gap-1" aria-hidden>
        {LAUNCH_CINEMATIC_PHASES_V3.map((item, index) => (
          <span key={item} className={`h-0.5 ${index <= phaseIndex ? "bg-orange-300/85" : "bg-white/12"}`} />
        ))}
      </div>
    </section>,
    document.body,
  );
}
