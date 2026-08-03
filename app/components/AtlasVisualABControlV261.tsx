"use client";

import { atlasRuntimeStore, useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V261, ATLAS_VISUAL_PROFILE_LEGACY_V261 } from "../lib/atlasVisualProfileV261";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V269 } from "../lib/atlasVisualProfileV269";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V274, ATLAS_VISUAL_PROFILE_CANDIDATE_V285 } from "../lib/atlasVisualProfileV274";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V299,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V300,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V340,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V349,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V362,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V370,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V400,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V405,
} from "../lib/atlasVisualProfileV299";

const PROFILES = [
  [ATLAS_VISUAL_PROFILE_LEGACY_V261, "Legacy V9", "white"],
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V261, "Cinematic V1", "cyan"],
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V269, "Cinematic V2", "amber"],
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V274, "Cinematic V3", "teal"],
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V285, "V4 Shadow", "violet"],
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V299, "V5 Shadow", "rose"],
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V300, "V6 Shadow", "orange"],
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V340, "V7 Observatory", "sky"],
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V349, "V8 Spectral", "fuchsia"],
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V362, "V9 Instrument Lab · Shadow", "emerald"],
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V370, "V10 Observatory · Shadow", "blue"],
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V377, "V11 Measurement Lab · Shadow", "ice"],
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V400, "V12 Observation Hub · Shadow", "mint"],
  [ATLAS_VISUAL_PROFILE_CANDIDATE_V405, "V13 Evidence Observatory · Shadow", "phosphor"],
] as const;

export default function AtlasVisualABControlV261() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  const researchOverlayOpen = useAtlasRuntimeStore((snapshot) => snapshot.researchOverlay !== "none");
  const deliveryProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  const showV4 = deliveryProfile !== "vercel-lite" && (
    process.env.NODE_ENV !== "production" || deliveryProfile === "standalone-full" || deliveryProfile === "local-shadow"
  );
  const localShadow = deliveryProfile === "local-shadow";
  const profiles = PROFILES.filter(([id]) => (
    (id !== ATLAS_VISUAL_PROFILE_CANDIDATE_V285 || showV4)
    && (id !== ATLAS_VISUAL_PROFILE_CANDIDATE_V299 || localShadow)
    && (id !== ATLAS_VISUAL_PROFILE_CANDIDATE_V300 || localShadow)
    && (id !== ATLAS_VISUAL_PROFILE_CANDIDATE_V340 || localShadow)
    && (id !== ATLAS_VISUAL_PROFILE_CANDIDATE_V349 || localShadow)
    && (id !== ATLAS_VISUAL_PROFILE_CANDIDATE_V362 || localShadow)
    && (id !== ATLAS_VISUAL_PROFILE_CANDIDATE_V370 || localShadow)
    && (id !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377 || localShadow)
    && (id !== ATLAS_VISUAL_PROFILE_CANDIDATE_V400 || localShadow)
    && (id !== ATLAS_VISUAL_PROFILE_CANDIDATE_V405 || localShadow)
  ));
  return (
    <div
      inert={researchOverlayOpen || undefined}
      className={`fixed bottom-[calc(var(--ui-dock-height)+0.75rem)] right-3 z-[69] flex max-w-[calc(100vw-1.5rem)] items-center overflow-x-auto rounded-full border border-white/10 bg-black/75 p-1 text-[9px] shadow-xl backdrop-blur-xl ${researchOverlayOpen ? "max-sm:hidden" : ""}`}
      aria-hidden={researchOverlayOpen || undefined}
      aria-label="Local visual A/B: Legacy, V1-V12 and V12 Observation Hub Shadow; V13 Evidence Observatory Shadow"
      data-atlas-visual-ab="v405-fourteen-way-local-shadow"
      data-atlas-v4-ab-visible={showV4 || undefined}
      data-atlas-v5-ab-visible={localShadow || undefined}
      data-atlas-v6-ab-visible={localShadow || undefined}
      data-atlas-v7-ab-visible={localShadow || undefined}
      data-atlas-v8-ab-visible={localShadow || undefined}
      data-atlas-v9-instrument-lab-ab-visible={localShadow || undefined}
      data-atlas-v9-instrument-lab-default-applied="false"
      data-atlas-v10-observatory-ab-visible={localShadow || undefined}
      data-atlas-v10-observatory-default-applied="false"
      data-atlas-v11-measurement-lab-ab-visible={localShadow || undefined}
      data-atlas-v11-measurement-lab-default-applied="false"
      data-atlas-v12-observation-hub-ab-visible={localShadow || undefined}
      data-atlas-v12-observation-hub-default-applied="false"
      data-atlas-v13-evidence-observatory-ab-visible={localShadow || undefined}
      data-atlas-v13-evidence-observatory-default-applied="false"
    >
      {profiles.map(([id, label, tone]) => {
        const active = profile === id;
        const activeClass = tone === "cyan"
          ? "bg-cyan-200/12 text-cyan-100"
          : tone === "amber"
            ? "bg-amber-200/12 text-amber-100"
            : tone === "teal"
              ? "bg-teal-200/12 text-teal-100"
              : tone === "violet"
                ? "bg-violet-200/12 text-violet-100"
                : tone === "rose"
                  ? "bg-rose-200/12 text-rose-100"
                  : tone === "orange"
                    ? "bg-orange-200/12 text-orange-100"
                    : tone === "sky"
                      ? "bg-sky-200/14 text-sky-50 shadow-[inset_0_0_0_1px_rgba(186,230,253,0.16),0_0_18px_rgba(56,189,248,0.08)]"
                      : tone === "fuchsia"
                        ? "bg-fuchsia-200/14 text-fuchsia-50 shadow-[inset_0_0_0_1px_rgba(245,208,254,0.18),0_0_20px_rgba(217,70,239,0.1)]"
                        : tone === "emerald"
                          ? "bg-emerald-200/14 text-emerald-50 shadow-[inset_0_0_0_1px_rgba(167,243,208,0.18),0_0_20px_rgba(16,185,129,0.1)]"
                          : tone === "blue"
                            ? "bg-blue-200/14 text-blue-50 shadow-[inset_0_0_0_1px_rgba(191,219,254,0.18),0_0_22px_rgba(59,130,246,0.12)]"
                            : tone === "ice"
                              ? "bg-cyan-100/12 text-cyan-50 shadow-[inset_0_0_0_1px_rgba(207,250,254,0.24),0_0_24px_rgba(103,232,249,0.13)]"
                              : tone === "mint"
                                ? "bg-emerald-100/14 text-emerald-50 shadow-[inset_0_0_0_1px_rgba(209,250,229,0.24),0_0_26px_rgba(52,211,153,0.14)]"
                                : tone === "phosphor"
                                  ? "bg-lime-100/12 text-lime-50 shadow-[inset_0_0_0_1px_rgba(236,252,203,0.22),0_0_28px_rgba(163,230,53,0.13)]"
                          : "bg-white/10 text-white";
        return <button key={id} type="button" aria-pressed={active} onClick={() => atlasRuntimeStore.setVisualProfile(id)} className={`shrink-0 rounded-full px-2.5 py-1.5 ${active ? activeClass : "text-slate-500"}`}>{label}</button>;
      })}
    </div>
  );
}
