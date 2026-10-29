import type { AtlasSceneMode } from "./atlasRuntimeSceneFocusPerformance";
import type { AtlasSceneModeV2 } from "./atlasRuntimeStore";

export const ATLAS_PRODUCT_SCENE_FAMILY_CONTRACT_V595_VERSION =
  "v595-product-scene-family-contract-v1" as const;

export type AtlasProductSceneFamilyIdV595 =
  | "orbit-atlas-overview"
  | "object-inspect"
  | "stellar-exoplanet-systems"
  | "mission-launch"
  | "relativity-lab"
  | "scene-lab";

export type AtlasProductSceneFamilyStageV595 =
  | "entry"
  | "hero"
  | "exit";

export type AtlasProductSceneFamilyDefinitionV595 = Readonly<{
  id: AtlasProductSceneFamilyIdV595;
  label: string;
  journeyStages: readonly AtlasProductSceneFamilyStageV595[];
  runtimeModeSequence: readonly AtlasSceneModeV2[];
  underlyingCanvasModeSequence: readonly AtlasSceneMode[];
  requiredPreflightPanel: string | null;
  requiredPanel: string | null;
  requiredMarker: string;
  sharedMainCanvas: true;
  singleCanvasPolicy: "one-shared-main-canvas";
  exitPolicy: "returns-to-orbit-atlas-overview";
  lifecyclePolicy: "release-temporary-resources-on-exit";
  authority: Readonly<{
    scientific: false;
    measured: false;
    gpu: false;
  }>;
}>;

export const ATLAS_PRODUCT_SCENE_FAMILY_ORDER_V595 = Object.freeze([
  "orbit-atlas-overview",
  "object-inspect",
  "stellar-exoplanet-systems",
  "mission-launch",
  "relativity-lab",
  "scene-lab",
] as const satisfies readonly AtlasProductSceneFamilyIdV595[]);

const common = {
  journeyStages: ["entry", "hero", "exit"] as const,
  sharedMainCanvas: true as const,
  singleCanvasPolicy: "one-shared-main-canvas" as const,
  exitPolicy: "returns-to-orbit-atlas-overview" as const,
  lifecyclePolicy: "release-temporary-resources-on-exit" as const,
  requiredPreflightPanel: null,
  authority: { scientific: false as const, measured: false as const, gpu: false as const },
};

export const ATLAS_PRODUCT_SCENE_FAMILY_CONTRACT_V595 = Object.freeze([
  {
    ...common,
    id: "orbit-atlas-overview",
    label: "Orbit Atlas overview",
    runtimeModeSequence: ["atlas"],
    underlyingCanvasModeSequence: ["atlas"],
    requiredPanel: null,
    requiredMarker: "single-webgl-canvas-ready",
  },
  {
    ...common,
    id: "object-inspect",
    label: "Object inspection",
    runtimeModeSequence: ["inspect"],
    underlyingCanvasModeSequence: ["inspect"],
    requiredPanel: null,
    requiredMarker: "object-inspect-ready",
  },
  {
    ...common,
    id: "stellar-exoplanet-systems",
    label: "Stellar and exoplanet systems",
    runtimeModeSequence: ["inspect", "exoplanet-system"],
    underlyingCanvasModeSequence: ["inspect", "exoplanet-system"],
    requiredPanel: null,
    requiredMarker: "stellar-portrait-or-exoplanet-system-ready",
  },
  {
    ...common,
    id: "mission-launch",
    label: "Mission launch",
    runtimeModeSequence: ["launch"],
    underlyingCanvasModeSequence: ["launch"],
    requiredPreflightPanel: "launch-control-panel",
    requiredPanel: "launch-telemetry-dock",
    requiredMarker: "launch-telemetry-director-composition-and-asset-ready",
  },
  {
    ...common,
    id: "relativity-lab",
    label: "Weak-field and Kerr relativity",
    runtimeModeSequence: ["inspect", "kerr", "relativity-lab"],
    underlyingCanvasModeSequence: ["inspect", "kerr"],
    requiredPanel: "panel:kerr-relativity-lab",
    requiredMarker: "kerr-geodesics-settled",
  },
  {
    ...common,
    id: "scene-lab",
    label: "Scene Lab controlled copy",
    runtimeModeSequence: ["scene-lab"],
    underlyingCanvasModeSequence: ["atlas"],
    requiredPanel: "data-atlas-scene-lab",
    requiredMarker: "scene-lab-panel-ready",
  },
] as const satisfies readonly AtlasProductSceneFamilyDefinitionV595[]);

export type AtlasProductSceneFamilyResolutionV595 = Readonly<{
  familyId: AtlasProductSceneFamilyIdV595;
  underlyingCanvasMode: AtlasSceneMode;
  matchedBy: "scene-lab" | "relativity" | "launch" | "exoplanet-system" | "stellar-hero" | "inspect" | "atlas";
}>;

const isStellarHero = (selectedObjectId: string): boolean =>
  /^(?:stellar-hero|stellar|nearby-star|bright-star):/.test(selectedObjectId);

/**
 * Shell-only product modes share an existing Canvas scene. Resource ownership
 * must therefore be recorded against the underlying Canvas mode, never the
 * transient shell label.
 */
export function resolveAtlasUnderlyingCanvasModeV595(
  sceneMode: AtlasSceneModeV2,
): AtlasSceneMode {
  if (sceneMode === "scene-lab") return "atlas";
  if (sceneMode === "relativity-lab") return "kerr";
  return sceneMode;
}

export function deriveAtlasProductSceneFamilyV595(
  sceneMode: AtlasSceneModeV2,
  selectedObjectId = "",
): AtlasProductSceneFamilyResolutionV595 {
  if (sceneMode === "scene-lab") {
    return { familyId: "scene-lab", underlyingCanvasMode: "atlas", matchedBy: "scene-lab" };
  }
  if (sceneMode === "kerr" || sceneMode === "relativity-lab") {
    return { familyId: "relativity-lab", underlyingCanvasMode: "kerr", matchedBy: "relativity" };
  }
  if (sceneMode === "launch") {
    return { familyId: "mission-launch", underlyingCanvasMode: "launch", matchedBy: "launch" };
  }
  if (sceneMode === "exoplanet-system") {
    return { familyId: "stellar-exoplanet-systems", underlyingCanvasMode: "exoplanet-system", matchedBy: "exoplanet-system" };
  }
  if (isStellarHero(selectedObjectId)) {
    return { familyId: "stellar-exoplanet-systems", underlyingCanvasMode: "inspect", matchedBy: "stellar-hero" };
  }
  if (sceneMode === "inspect") {
    return { familyId: "object-inspect", underlyingCanvasMode: "inspect", matchedBy: "inspect" };
  }
  return { familyId: "orbit-atlas-overview", underlyingCanvasMode: "atlas", matchedBy: "atlas" };
}

export function getAtlasProductSceneFamilyDefinitionV595(
  familyId: AtlasProductSceneFamilyIdV595,
): AtlasProductSceneFamilyDefinitionV595 {
  const definition = ATLAS_PRODUCT_SCENE_FAMILY_CONTRACT_V595.find((entry) => entry.id === familyId);
  if (!definition) throw new Error(`v595-product-scene-family-unknown:${familyId}`);
  return definition;
}
