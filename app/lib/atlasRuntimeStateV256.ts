import type { AtlasRuntimeQualityTier } from "./simulationDiagnosticsTypes";
import type { GaiaCatalogSource } from "../data/gaiaStarCatalog";
import type { AtlasSceneMode } from "./atlasRuntimeSceneFocusPerformance";
import type { GalacticLodTier } from "./floatingOrigin";

export const ATLAS_RUNTIME_STATE_V256_VERSION =
  "v256-compact-runtime-state" as const;

export type AtlasExperienceModeV256 = "explore" | "research";
export type AtlasScaleBand =
  | "solar"
  | "stellar"
  | "galactic"
  | "local-group"
  | "near-universe";

export type AtlasRuntimeStateV256 = {
  version: typeof ATLAS_RUNTIME_STATE_V256_VERSION;
  scene: {
    experienceMode: AtlasExperienceModeV256;
    sceneMode: AtlasSceneMode | "scene-lab";
    scaleBand: AtlasScaleBand;
    selectedObjectId: string;
    ready: boolean;
  };
  catalog: {
    status: "idle" | "fallback-ready" | "streaming" | "ready" | "blocked";
    source: GaiaCatalogSource | "pending";
    contract: "v255-fallback" | "v257-healpix-stream";
    parentRowCount: number;
    streamedTileCount: number;
  };
  observer: {
    status: "inactive" | "offline-ready" | "weather-ready" | "blocked";
    profileId: string;
    weatherCanonical: false;
  };
  analysis: {
    status: "inactive" | "ready" | "blocked";
    qualifiedRowCount: number;
    onlineResultsCanonical: false;
  };
  evidence: {
    ledgerClaimCount: 84;
    legacyRootAttributeCount: 603;
    scienceStatus: "science-failed-shadow-retained";
    defaultKernel: "legacy-eih-1pn";
  };
  performance: {
    qualityTier: AtlasRuntimeQualityTier;
    canvasReadyTargetBytes: 604_160;
    activeCatalogBudget: number;
  };
  release: {
    profile: "local-candidate";
    vercelApplied: false;
    publicDeploymentBlocked: boolean;
    visualCandidateApplied: boolean;
  };
};

export type CreateAtlasRuntimeStateV256Input = {
  experienceMode: AtlasExperienceModeV256;
  sceneMode: AtlasSceneMode | "scene-lab";
  legacyLodTier: GalacticLodTier;
  selectedObjectId: string;
  ready: boolean;
  gaiaCatalogSource: GaiaCatalogSource | "pending";
  qualityTier: AtlasRuntimeQualityTier;
  activeCatalogBudget: number;
  scaleBand?: AtlasScaleBand;
  visualCandidateApplied?: boolean;
};

export function atlasScaleBandFromLegacyTier(
  tier: GalacticLodTier,
): AtlasScaleBand {
  if (tier === "far") return "galactic";
  if (tier === "mid") return "stellar";
  return "solar";
}

export function createAtlasRuntimeStateV256({
  experienceMode,
  sceneMode,
  legacyLodTier,
  selectedObjectId,
  ready,
  gaiaCatalogSource,
  qualityTier,
  activeCatalogBudget,
  scaleBand,
  visualCandidateApplied = false,
}: CreateAtlasRuntimeStateV256Input): AtlasRuntimeStateV256 {
  return {
    version: ATLAS_RUNTIME_STATE_V256_VERSION,
    scene: {
      experienceMode,
      sceneMode,
      scaleBand: scaleBand ?? atlasScaleBandFromLegacyTier(legacyLodTier),
      selectedObjectId,
      ready,
    },
    catalog: {
      status: gaiaCatalogSource === "pending" ? "idle" : "fallback-ready",
      source: gaiaCatalogSource,
      contract: "v255-fallback",
      parentRowCount: 1_224_219,
      streamedTileCount: 0,
    },
    observer: {
      status: "inactive",
      profileId: "",
      weatherCanonical: false,
    },
    analysis: {
      status: "inactive",
      qualifiedRowCount: 0,
      onlineResultsCanonical: false,
    },
    evidence: {
      ledgerClaimCount: 84,
      legacyRootAttributeCount: 603,
      scienceStatus: "science-failed-shadow-retained",
      defaultKernel: "legacy-eih-1pn",
    },
    performance: {
      qualityTier,
      canvasReadyTargetBytes: 604_160,
      activeCatalogBudget,
    },
    release: {
      profile: "local-candidate",
      vercelApplied: false,
      publicDeploymentBlocked: false,
      visualCandidateApplied,
    },
  };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}

export function serializeAtlasRuntimeStateV256(
  state: AtlasRuntimeStateV256,
): string {
  return JSON.stringify(canonicalize(state))
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
}
