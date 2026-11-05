import { atlasPublicAssetUrl } from "./atlasDeliveryProfile";

export const ATLAS_GAIA_STARFIELD_EXPANSION_VERSION =
  "v255-catalog-expansion" as const;

export const ATLAS_GAIA_STARFIELD_EXPANSION_PROFILE =
  "v255-gaia-asterism-deep-sky-expansion" as const;

export const ATLAS_GAIA_STARFIELD_EXPANSION_RENDER_BUDGET = {
  mobile: 1_000,
  balanced: 4_000,
  dense: 8_000,
  closeup: 1_200,
} as const;

export const GAIA_DR3_NEARBY_V255_URL = atlasPublicAssetUrl(
  "data/gaia-dr3-nearby-46000-v255.json",
);

export const ATLAS_GAIA_STARFIELD_EXPANSION_COUNTS = {
  gaiaRows: 46_000,
  iauConstellations: 88,
  asterisms: 32,
  starClusters: 96,
  nebulae: 128,
} as const;

export type AtlasGaiaStarfieldExpansionQualityTier = "mobile" | "balanced" | "dense";

export type AtlasGaiaStarfieldExpansionSummary = {
  version: typeof ATLAS_GAIA_STARFIELD_EXPANSION_VERSION;
  profile: typeof ATLAS_GAIA_STARFIELD_EXPANSION_PROFILE;
  status: "ready" | "blocked" | "not-run";
  renderBudget: typeof ATLAS_GAIA_STARFIELD_EXPANSION_RENDER_BUDGET;
  counts: typeof ATLAS_GAIA_STARFIELD_EXPANSION_COUNTS;
  activeQualityTier: AtlasGaiaStarfieldExpansionQualityTier;
  activeRenderBudget: number;
  closeupRenderBudget: number;
  gaiaAssetUrl: string;
  fallbackAssetUrl: string;
  sourceSha256: string;
  outputSha256: string;
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  trustedBoundary: string;
};

export const ATLAS_GAIA_STARFIELD_EXPANSION_BOUNDARY =
  "v255 is an offline presentation/catalog expansion. Gaia rows, asterisms, nebulae and clusters remain visual/navigation markers; they are not a complete Gaia archive, formal IAU constellations, a scientific gate, live physics input, worker physics input or an astrophysical evolution simulation.";

export function createAtlasGaiaStarfieldExpansionSummary(args: {
  qualityTier?: AtlasGaiaStarfieldExpansionQualityTier;
  status?: AtlasGaiaStarfieldExpansionSummary["status"];
  sourceSha256?: string;
  outputSha256?: string;
} = {}): AtlasGaiaStarfieldExpansionSummary {
  const qualityTier = args.qualityTier ?? "balanced";
  return {
    version: ATLAS_GAIA_STARFIELD_EXPANSION_VERSION,
    profile: ATLAS_GAIA_STARFIELD_EXPANSION_PROFILE,
    status: args.status ?? "not-run",
    renderBudget: ATLAS_GAIA_STARFIELD_EXPANSION_RENDER_BUDGET,
    counts: ATLAS_GAIA_STARFIELD_EXPANSION_COUNTS,
    activeQualityTier: qualityTier,
    activeRenderBudget: ATLAS_GAIA_STARFIELD_EXPANSION_RENDER_BUDGET[qualityTier],
    closeupRenderBudget: ATLAS_GAIA_STARFIELD_EXPANSION_RENDER_BUDGET.closeup,
    gaiaAssetUrl: GAIA_DR3_NEARBY_V255_URL,
    fallbackAssetUrl: atlasPublicAssetUrl("data/gaia-dr3-bright-5000.json"),
    sourceSha256: args.sourceSha256 ?? "",
    outputSha256: args.outputSha256 ?? "",
    livePhysicsMutation: "not-applied",
    workerPhysicsMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    trustedBoundary: ATLAS_GAIA_STARFIELD_EXPANSION_BOUNDARY,
  };
}
