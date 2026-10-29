import type { AtlasVisualProfileV274 } from "./atlasVisualProfileV274";

export const ATLAS_VISUAL_PROFILE_CANDIDATE_V280 = "science-cinematic-v4-v280" as const;
export type AtlasVisualProfileV280 = AtlasVisualProfileV274 | typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V280;

export type AtlasVisualProfileResolutionV280 = {
  profile: AtlasVisualProfileV280;
  formalDefault: "legacy-v9";
  localShadowEligible: boolean;
  publicDeploymentBlocked: true;
  boundary: "visual-profile-only-no-physics-mutation";
};

export function resolveAtlasInitialVisualProfileV280(args: {
  build: "formal" | "standalone" | "vercel-lite" | "local-shadow";
  qualified: boolean;
}): AtlasVisualProfileResolutionV280 {
  const eligible = args.build === "local-shadow" && args.qualified;
  return {
    profile: eligible ? ATLAS_VISUAL_PROFILE_CANDIDATE_V280 : "legacy-v9",
    formalDefault: "legacy-v9",
    localShadowEligible: eligible,
    publicDeploymentBlocked: true,
    boundary: "visual-profile-only-no-physics-mutation",
  };
}
