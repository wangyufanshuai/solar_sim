import type { CSSProperties, HTMLAttributes } from "react";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V285 } from "./atlasVisualProfileV274";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300, resolveAtlasVisualProfileV299, type AtlasVisualProfileV299 } from "./atlasVisualProfileV299";

export type AtlasVisualShellPropsV285R1 = Pick<HTMLAttributes<HTMLDivElement>, "style"> & {
  "data-atlas-v4-runtime-profile"?: string;
  "data-atlas-v4-runtime-token-groups"?: string;
  "data-atlas-v6-runtime-profile"?: string;
  "data-atlas-v6-runtime-token-groups"?: string;
};

export function resolveAtlasVisualShellPropsV285R1(profile: AtlasVisualProfileV299): AtlasVisualShellPropsV285R1 {
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V285 && profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V299 && profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V300) return {};
  const resolved = resolveAtlasVisualProfileV299(profile);
  const tokenGroups = "sky solar catalog postFx strongGravity launch exoplanet hud";
  return {
    style: {
      "--atlas-v4-measurement": resolved.runtimeTokens.hud.scienceMeasurementColor,
      "--atlas-v4-risk": resolved.runtimeTokens.hud.riskBoundaryColor,
      "--atlas-v4-border-opacity": resolved.runtimeTokens.hud.borderOpacity,
      "--atlas-v4-backdrop-opacity": resolved.runtimeTokens.hud.backdropOpacity,
    } as CSSProperties,
    "data-atlas-v4-runtime-profile": profile,
    "data-atlas-v4-runtime-token-groups": tokenGroups,
    "data-atlas-v6-runtime-profile": profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V300 ? profile : undefined,
    "data-atlas-v6-runtime-token-groups": profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V300 ? tokenGroups : undefined,
  };
}
