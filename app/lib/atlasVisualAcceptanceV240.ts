import type { AtlasVisualViewportId } from "./atlasVisualJourneyManifestV193";

export const ATLAS_VISUAL_ACCEPTANCE_V240_VERSION =
  "v240-forty-frame-visual-acceptance" as const;

export type AtlasVisualRiskFrameIdV240 =
  | "mobile-launch-telemetry"
  | "mobile-kerr"
  | "desktop-overview"
  | "desktop-saturn-rings";

export type AtlasVisualRiskFrameV240 = {
  id: AtlasVisualRiskFrameIdV240;
  viewport: AtlasVisualViewportId;
  stateId: string;
  review: readonly string[];
};

export const ATLAS_VISUAL_RISK_FRAMES_V240: readonly AtlasVisualRiskFrameV240[] = [
  {
    id: "mobile-launch-telemetry",
    viewport: "mobile-390x844",
    stateId: "launch-active-telemetry-two-tier",
    review: ["46dvh sheet", "40px controls", "rocket unobscured", "telemetry non-overlap"],
  },
  {
    id: "mobile-kerr",
    viewport: "mobile-390x844",
    stateId: "kerr-interactive-mobile-safe",
    review: ["shadow visible", "research label visible", "no horizontal overflow"],
  },
  {
    id: "desktop-overview",
    viewport: "desktop-1440x900",
    stateId: "overview-orbit-hierarchy",
    review: ["selected orbit dominant", "secondary labels subdued", "visual center clear"],
  },
  {
    id: "desktop-saturn-rings",
    viewport: "desktop-1440x900",
    stateId: "saturn-ring-occlusion",
    review: ["ring/body occlusion", "body disc 38-48%", "silhouette at most 65%"],
  },
] as const;

export const ATLAS_VISUAL_ACCEPTANCE_V240 = {
  version: ATLAS_VISUAL_ACCEPTANCE_V240_VERSION,
  journeyFrameCount: 36,
  riskFrameCount: ATLAS_VISUAL_RISK_FRAMES_V240.length,
  totalFrameCount: 36 + ATLAS_VISUAL_RISK_FRAMES_V240.length,
  baselineUpdateEnvironmentVariable: "ATLAS_UPDATE_VISUAL_BASELINES",
  automaticBaselineReplacement: false,
  boundary:
    "Review-only visual evidence. Risk frames do not add root attributes, alter scientific coordinates, replace V9 assets, or authorize automatic baseline promotion.",
} as const;

export function atlasVisualRiskFramesForViewportV240(viewport: AtlasVisualViewportId) {
  return ATLAS_VISUAL_RISK_FRAMES_V240.filter((frame) => frame.viewport === viewport);
}

