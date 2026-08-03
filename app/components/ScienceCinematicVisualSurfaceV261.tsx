"use client";

import type { CSSProperties } from "react";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V269 } from "../lib/atlasVisualProfileV269";
import { ATLAS_VISUAL_PROFILE_LEGACY_V261 } from "../lib/atlasVisualProfileV261";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V274, ATLAS_VISUAL_PROFILE_CANDIDATE_V285 } from "../lib/atlasVisualProfileV274";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300, ATLAS_VISUAL_PROFILE_CANDIDATE_V340, ATLAS_VISUAL_PROFILE_CANDIDATE_V349, ATLAS_VISUAL_PROFILE_CANDIDATE_V362, resolveAtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";
import { createAtlasVisualTokenSignatureV300, useAtlasVisualRuntimeConsumerV300 } from "../lib/atlasVisualRuntimeConsumptionV300";

export default function ScienceCinematicVisualSurfaceV261() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  const rendererProfile = resolveAtlasVisualProfileV299(profile);
  useAtlasVisualRuntimeConsumerV300({
    profile: rendererProfile.id,
    group: "hud",
    consumer: "ScienceCinematicVisualSurfaceV261",
    tokenSignature: createAtlasVisualTokenSignatureV300(rendererProfile.runtimeTokens.hud),
  });
  const candidate = profile !== ATLAS_VISUAL_PROFILE_LEGACY_V261;
  const v2 = profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V269;
  const v3 = profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V274;
  const v4 = profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V285;
  const v5 = profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V299;
  const v6 = profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V300;
  const v7 = profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V340;
  const v8 = profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V349;
  const v9 = profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V362;
  const advanced = v4 || v5 || v6 || v7 || v8 || v9;
  const hudDensity = rendererProfile.runtimeTokens.hud.density;
  const hudGridSizePx = hudDensity === "cinematic-instrument" ? 44 : hudDensity === "instrument" ? 48 : 56;
  const v4Style = advanced ? {
    "--atlas-v4-measurement": rendererProfile.runtimeTokens.hud.scienceMeasurementColor,
    "--atlas-v4-risk": rendererProfile.runtimeTokens.hud.riskBoundaryColor,
    "--atlas-hud-measurement-base": rendererProfile.runtimeTokens.hud.measurementColor,
    "--atlas-hud-risk-base": rendererProfile.runtimeTokens.hud.riskColor,
    "--atlas-v4-border-opacity": rendererProfile.runtimeTokens.hud.borderOpacity,
    "--atlas-v4-backdrop-opacity": rendererProfile.runtimeTokens.hud.backdropOpacity,
    "--atlas-hud-grid-size": `${hudGridSizePx}px`,
  } as CSSProperties : undefined;
  if (!candidate) return null;
  return (
    <div style={v4Style} className="pointer-events-none fixed inset-0 z-[8]" data-atlas-science-cinematic="visual-only-not-grmhd-or-physics" data-atlas-science-cinematic-profile={profile} data-atlas-hud-density={hudDensity} data-atlas-hud-grid-size={hudGridSizePx} data-atlas-science-cinematic-v3={v3 || undefined} data-atlas-science-cinematic-v4={v4 || undefined} data-atlas-science-cinematic-v5={v5 || undefined} data-atlas-science-cinematic-v6={v6 || undefined} data-atlas-science-cinematic-v7={v7 || undefined} data-atlas-science-cinematic-v8={v8 || undefined} data-atlas-science-cinematic-v9-instrument-lab={v9 || undefined} data-atlas-v4-token-boundary={rendererProfile.v4TokensApplied ? rendererProfile.scienceBufferIsolation : undefined} data-atlas-v5-token-boundary={rendererProfile.v5TokensApplied ? rendererProfile.scienceBufferIsolation : undefined} data-atlas-v6-token-boundary={rendererProfile.v6TokensApplied ? rendererProfile.scienceBufferIsolation : undefined} data-atlas-v7-token-boundary={rendererProfile.v7TokensApplied ? rendererProfile.scienceBufferIsolation : undefined} data-atlas-v8-token-boundary={rendererProfile.v8TokensApplied ? rendererProfile.scienceBufferIsolation : undefined} data-atlas-v9-token-boundary={rendererProfile.v9TokensApplied ? rendererProfile.scienceBufferIsolation : undefined} data-atlas-v4-token-groups={advanced ? "sky solar catalog postFx strongGravity launch exoplanet hud" : undefined}>
      <div className={`absolute inset-0 ${v9 ? "bg-[radial-gradient(circle_at_48%_35%,transparent_0%,transparent_31%,rgba(4,24,31,0.32)_60%,rgba(1,4,12,0.82)_100%)]" : v8 ? "bg-[radial-gradient(circle_at_48%_36%,transparent_0%,transparent_32%,rgba(22,4,34,0.34)_61%,rgba(1,5,14,0.8)_100%)]" : v7 ? "bg-[radial-gradient(circle_at_48%_36%,transparent_0%,transparent_33%,rgba(3,14,24,0.38)_63%,rgba(0,3,10,0.78)_100%)]" : v5 ? "bg-[radial-gradient(circle_at_48%_37%,transparent_0%,transparent_34%,rgba(2,9,13,0.4)_65%,rgba(0,0,0,0.76)_100%)]" : v4 ? "bg-[radial-gradient(circle_at_48%_38%,transparent_0%,transparent_36%,rgba(1,8,12,0.36)_67%,rgba(0,0,0,0.72)_100%)]" : v3 ? "bg-[radial-gradient(circle_at_48%_38%,transparent_0%,transparent_38%,rgba(1,7,10,0.34)_68%,rgba(0,0,0,0.7)_100%)]" : v2 ? "bg-[radial-gradient(circle_at_48%_40%,transparent_0%,transparent_40%,rgba(1,7,10,0.3)_70%,rgba(0,0,0,0.62)_100%)]" : "bg-[radial-gradient(circle_at_50%_42%,transparent_0%,transparent_46%,rgba(0,4,7,0.22)_74%,rgba(0,0,0,0.48)_100%)]"}`} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/20 to-transparent" />
      <div className="absolute bottom-[var(--ui-dock-height)] left-1/2 h-20 w-[min(70vw,900px)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(74,151,166,0.045),transparent_70%)]" />
      {v2 || v3 || advanced ? <div style={{ backgroundSize: `${hudGridSizePx}px ${hudGridSizePx}px` }} className={`absolute inset-0 [background-image:linear-gradient(rgba(114,196,212,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(114,196,212,.12)_1px,transparent_1px)] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)] ${v9 ? "opacity-[0.01]" : v8 ? "opacity-[0.012]" : v7 ? "opacity-[0.015]" : v6 ? "opacity-[0.018]" : v5 ? "opacity-[0.02]" : v4 ? "opacity-[0.024]" : v3 ? "opacity-[0.028]" : "opacity-[0.035]"}`} /> : null}
    </div>
  );
}
