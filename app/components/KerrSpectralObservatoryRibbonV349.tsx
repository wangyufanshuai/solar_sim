"use client";

import { useMemo, type CSSProperties } from "react";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V349,
  resolveAtlasVisualProfileV299,
  sampleAtlasCinematicDetailV299,
} from "../lib/atlasVisualProfileV299";
import {
  createAtlasVisualTokenSignatureV300,
  useAtlasVisualRuntimeConsumerV300,
} from "../lib/atlasVisualRuntimeConsumptionV300";

const CHANNELS = Object.freeze(["VIS", "EUV", "SXR"] as const);

export default function KerrSpectralObservatoryRibbonV349() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  const resolved = resolveAtlasVisualProfileV299(profile);
  const presentation = resolved.runtimeTokens.strongGravityV8
    ?? resolved.runtimeTokens.strongGravityV7
    ?? resolved.runtimeTokens.strongGravityV6
    ?? resolved.runtimeTokens.strongGravityV5
    ?? null;
  useAtlasVisualRuntimeConsumerV300({
    profile: resolved.id,
    group: "strongGravity",
    consumer: "KerrSpectralObservatoryRibbonV349",
    tokenSignature: createAtlasVisualTokenSignatureV300({
      base: resolved.runtimeTokens.strongGravity,
      cinematic: presentation,
    }),
  });
  const ribbons = useMemo(() => Object.freeze(Array.from({ length: 7 }, (_, index) => Object.freeze({
    left: 6 + index * 14.3,
    width: 6 + sampleAtlasCinematicDetailV299(349, index, 0) * 9,
    opacity: 0.16 + sampleAtlasCinematicDetailV299(349, index, 1) * 0.24,
    skew: -9 + sampleAtlasCinematicDetailV299(349, index, 2) * 18,
  }))), []);
  const tokens = resolved.runtimeTokens.strongGravityV8;
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V349 || !tokens) return null;
  const style = {
    "--atlas-v349-ribbon-opacity": tokens.spectralRibbonOpacity,
    "--atlas-v349-reticle-luminance": tokens.reticleLuminance,
    "--atlas-v349-channel-separation": tokens.channelSeparation,
  } as CSSProperties;
  return <aside
    style={style}
    className="relative mt-2 overflow-hidden rounded border border-fuchsia-100/15 bg-[linear-gradient(110deg,rgba(18,4,28,.78),rgba(4,12,24,.76))] px-2 py-2"
    data-atlas-kerr-spectral-observatory-v349
    data-atlas-v349-profile={profile}
    data-atlas-v349-detail-seed={tokens.diskDetailSeed}
    data-atlas-v349-presentation-only="true"
    data-atlas-v349-science-buffer-mutation="false"
  >
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v349-ribbon-opacity)]">
      {ribbons.map((ribbon, index) => <span
        key={index}
        className="absolute inset-y-0 bg-[linear-gradient(180deg,transparent,rgba(217,70,239,.38)_34%,rgba(34,211,238,.32)_58%,transparent)] blur-[0.4px]"
        style={{ left: `${ribbon.left}%`, width: `${ribbon.width}%`, opacity: ribbon.opacity, transform: `skewX(${ribbon.skew}deg)` }}
      />)}
      <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-100/[var(--atlas-v349-reticle-luminance)]" />
      <span className="absolute left-1/2 top-1/2 h-px w-14 -translate-x-1/2 bg-gradient-to-r from-cyan-200/0 via-cyan-100/70 to-fuchsia-100/0" />
    </div>
    <div className="relative flex items-center justify-between gap-2">
      <div><div className="text-[7px] uppercase tracking-[0.2em] text-fuchsia-100/55">V8 spectral observatory</div><div className="mt-0.5 text-[9px] text-fuchsia-50/82">Relativistic channel presentation</div></div>
      <div className="flex gap-1" aria-label="Presentation channels">{CHANNELS.map((channel, index) => <span key={channel} className="rounded border border-white/[0.08] px-1.5 py-0.5 text-[7px] text-white/50" style={{ transform: `translateX(${(index - 1) * tokens.channelSeparation}px)` }}>{channel}</span>)}</div>
    </div>
    <div className="relative mt-1 text-[6px] text-white/30">Seeded presentation overlay only · scientific ratios, redshift, EVPA and intensity remain unchanged</div>
  </aside>;
}
