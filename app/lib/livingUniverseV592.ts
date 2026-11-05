import {
  LIVING_UNIVERSE_FREEZE_BEFORE_SHA256_V592,
  LIVING_UNIVERSE_MANIFEST_SHA256_V592,
  LIVING_UNIVERSE_SOURCE_MANIFEST_SHA256_V592,
} from "../data/livingUniverseManifestV592.generated";

export const LIVING_UNIVERSE_VERSION_V592 = "v592-living-universe-candidate-v1" as const;
export const LIVING_UNIVERSE_ROUTE_V592 = "/local-shadow-v592" as const;
export const LIVING_UNIVERSE_FORMAL_PRODUCT_POINTER_V592 = "v263" as const;
export const LIVING_UNIVERSE_BASELINE_V592 = "v591-readonly" as const;
export const LIVING_UNIVERSE_SCIENTIFIC_PAYLOAD_SHA256_V592 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674" as const;

export {
  LIVING_UNIVERSE_FREEZE_BEFORE_SHA256_V592,
  LIVING_UNIVERSE_MANIFEST_SHA256_V592,
  LIVING_UNIVERSE_SOURCE_MANIFEST_SHA256_V592,
};

export const LIVING_UNIVERSE_BOUNDARY_V592 = Object.freeze({
  additiveOnly: true,
  formalProductPointer: LIVING_UNIVERSE_FORMAL_PRODUCT_POINTER_V592,
  baseline: LIVING_UNIVERSE_BASELINE_V592,
  scientificPayloadSha256: LIVING_UNIVERSE_SCIENTIFIC_PAYLOAD_SHA256_V592,
  scientificPayloadWriteback: false,
  scientificAuthorityChanged: false,
  measuredAuthorityGranted: false,
  gpuAuthorityGranted: false,
  productionReleaseAuthorized: false,
  gitMutationAllowed: false,
  singleCanvasRequired: true,
});
