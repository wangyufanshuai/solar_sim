import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";

export const ATLAS_VISUAL_FREEZE_VERSION_V585 = "v585-stable-preview-visual-authority-v1" as const;

export const ATLAS_SCIENCE_AUTHORITY_POINTER_V585 = Object.freeze({
  formalProductPointer: "v263" as const,
  defaultScientificKernel: "legacy-eih-1pn" as const,
  visualPointerCoupled: false as const,
});

export const ATLAS_VISUAL_AUTHORITY_POINTER_V585 = Object.freeze({
  lane: "stable-v263-legacy-v9" as const,
  authorityIdentity: "Legacy V9" as const,
  assetState: "frozen-original-bytes-recovered-v585" as const,
  runtimeDefault: true as const,
  formalProductPointerAdvanced: false as const,
  productionAliasSwitchAllowed: false as const,
});

export const ATLAS_VISUAL_LANES_V585 = Object.freeze({
  stable: Object.freeze({
    id: "stable-v263-legacy-v9" as const,
    activation: "implicit-formal-default" as const,
    routes: Object.freeze(["/", "standalone", "lite"] as const),
    authority: "Legacy V9" as const,
  }),
  candidate: Object.freeze({
    id: "candidate-v562" as const,
    activation: "explicit-route-only" as const,
    routes: Object.freeze(["/local-shadow-v562"] as const),
    authority: "candidate-v562-no-legacy-authority" as const,
  }),
  experimental: Object.freeze({
    id: "experimental-hero" as const,
    activation: "explicit-hero-control-only" as const,
    routes: Object.freeze(["/local-shadow-v562#hero-scenes"] as const),
    authority: "presentation-only-no-science-writeback" as const,
  }),
});

export function stableVisualManifestV585() {
  if (ORBIT_ATLAS_SKY !== ORBIT_ATLAS_V9_SKY) throw new Error("v585-stable-sky-identity-drift");
  return ORBIT_ATLAS_SKY;
}
