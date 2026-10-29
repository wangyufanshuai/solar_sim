import { CURRENT_ATLAS_PRODUCT_RELEASE_V167 } from "./atlasProductReleaseV167";

export const ATLAS_FINAL_WEB_RELEASE_V174_VERSION =
  "v174-final-web-rc-dossier" as const;

export const ATLAS_FINAL_WEB_CAPABILITY_MATRIX = {
  "standalone-full": {
    interactiveAtlas: true,
    localContentPacks: true,
    millionStarCatalog: true,
    fullObservationFixtures: true,
    launchDemonstration: true,
    cloudDeploymentIncluded: false,
  },
  "vercel-lite": {
    interactiveAtlas: true,
    localContentPacks: false,
    millionStarCatalog: false,
    fullObservationFixtures: false,
    launchDemonstration: true,
    cloudDeploymentIncluded: false,
  },
} as const;

export function createAtlasFinalWebReleaseV174Summary() {
  return {
    ...CURRENT_ATLAS_PRODUCT_RELEASE_V167,
    version: ATLAS_FINAL_WEB_RELEASE_V174_VERSION,
    predecessorVersion: CURRENT_ATLAS_PRODUCT_RELEASE_V167.version,
    profile: "standalone-full-and-vercel-lite-web-rc" as const,
    deliveryProfiles: ["standalone-full", "vercel-lite"] as const,
    capabilityMatrix: ATLAS_FINAL_WEB_CAPABILITY_MATRIX,
    defaultScientificKernel: "legacy-eih-1pn" as const,
    shadowScientificKernel: "eih-1pn-2pn-lt" as const,
    promotionApplied: false as const,
    desktopInstallerReleased: false as const,
    cloudDeploymentPerformed: false as const,
    boundary:
      "web-rc-packaging-and-experience-only-no-scientific-promotion-no-live-or-worker-physics-mutation" as const,
  };
}

export const CURRENT_ATLAS_FINAL_WEB_RELEASE_V174 =
  createAtlasFinalWebReleaseV174Summary();
