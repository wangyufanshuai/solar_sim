import {
  CELESTIAL_CONVERGENCE_BASELINE_MANIFEST_SHA256_V591,
  CELESTIAL_CONVERGENCE_FREEZE_BEFORE_SHA256_V591,
  CELESTIAL_CONVERGENCE_MANIFEST_SHA256_V591,
} from "../data/celestialConvergenceManifestV591.generated";

export const CELESTIAL_CONVERGENCE_VERSION_V591 = "v591-celestial-convergence-candidate-v1" as const;
export const CELESTIAL_CONVERGENCE_ROUTE_V591 = "/local-shadow-v591" as const;
export const CELESTIAL_CONVERGENCE_FORMAL_PRODUCT_POINTER_V591 = "v263" as const;
export const CELESTIAL_CONVERGENCE_SCIENTIFIC_PAYLOAD_SHA256_V591 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674" as const;
export const CELESTIAL_CONVERGENCE_BASELINE_V591 = "v590-readonly" as const;

export {
  CELESTIAL_CONVERGENCE_BASELINE_MANIFEST_SHA256_V591,
  CELESTIAL_CONVERGENCE_FREEZE_BEFORE_SHA256_V591,
  CELESTIAL_CONVERGENCE_MANIFEST_SHA256_V591,
};

export const V591_CORE_HERO_ORDER = Object.freeze([
  "sun",
  "earth",
  "moon",
  "mars",
  "jupiter",
  "saturn",
] as const);

export const V591_ALL_HERO_IDS = Object.freeze([
  "sun", "mercury", "venus", "earth", "moon", "mars", "jupiter", "saturn",
  "uranus", "neptune", "ceres", "vesta", "bennu", "eros", "kleopatra", "tempel-1",
] as const);

export const V591_HERO_COUNT = V591_ALL_HERO_IDS.length;
export const V591_BASELINE_ADMITTED_HERO_COUNT = 3 as const;
export const V591_BASELINE_BLOCKED_NEBULA_COUNT = 6 as const;
export const V591_HERO_FRAME_MAX_WIDTH_RATIO = 0.92 as const;

export function heroFrameFitsV591(
  subjectVisible: boolean,
  pixelDiameter: number,
  viewportWidth: number,
): boolean {
  return subjectVisible
    && Number.isFinite(pixelDiameter)
    && Number.isFinite(viewportWidth)
    && pixelDiameter >= 72
    && viewportWidth > 0
    && pixelDiameter <= viewportWidth * V591_HERO_FRAME_MAX_WIDTH_RATIO;
}

export type CelestialConvergencePhaseV591 = "p0-governance" | "p1-core-heroes" | "p2-all-heroes" | "p3-stars" | "p4-deep-space" | "p5-constellations" | "p6-ui" | "qualification";

export const CELESTIAL_CONVERGENCE_BOUNDARY_V591 = Object.freeze({
  additiveOnly: true,
  formalProductPointer: CELESTIAL_CONVERGENCE_FORMAL_PRODUCT_POINTER_V591,
  runtimeBaseline: CELESTIAL_CONVERGENCE_BASELINE_V591,
  scientificPayloadSha256: CELESTIAL_CONVERGENCE_SCIENTIFIC_PAYLOAD_SHA256_V591,
  scientificPayloadWriteback: false,
  scientificAuthorityChanged: false,
  measuredAuthorityGranted: false,
  gpuAuthorityGranted: false,
  productionPromotionAllowed: false,
  gitMutationAllowed: false,
  singleCanvasRequired: true,
});

export function nextCelestialConvergencePhaseV591(completed: ReadonlySet<CelestialConvergencePhaseV591>): CelestialConvergencePhaseV591 {
  const order: readonly CelestialConvergencePhaseV591[] = [
    "p0-governance", "p1-core-heroes", "p2-all-heroes", "p3-stars",
    "p4-deep-space", "p5-constellations", "p6-ui", "qualification",
  ];
  return order.find((phase) => !completed.has(phase)) ?? "qualification";
}
