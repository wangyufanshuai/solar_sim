import type { NebulaObservationEncodingV607 } from "../lib/celestialObjectContractV607";
import { getMainlineANebulaVisualAssetV607 } from "./mainlineANebulaVisualAssetsV607.generated";

export type MainlineANebulaAssetCandidateV607 = {
  objectId: string;
  catalogNames: readonly string[];
  sourcePage: string;
  imageId: string;
  credit: string;
  rightsStatus: "cleared";
  rightsReview: { policyId: "esa-hubble-cc-by-4.0"; status: "cleared"; fullCreditRequired: true; thirdPartyReviewRequired: true; thirdPartyReviewCompleted: true; evidencePath: string };
  /** The local delivery is distinct from the historical in-memory acquisition receipt. */
  imageManifest: MainlineANebulaImageManifestV607;
  observationEncoding: NebulaObservationEncodingV607;
};

export type MainlineANebulaImageManifestV607 = {
  status: "local-asset-acquired";
  imageUrl: string;
  localPath: string;
  byteSize: number;
  sha256: string;
  dimensions: { width: number; height: number };
  retrievedAt: string;
};

const clearedRightsReview = { policyId: "esa-hubble-cc-by-4.0", status: "cleared", fullCreditRequired: true, thirdPartyReviewRequired: true, thirdPartyReviewCompleted: true, evidencePath: "docs/release/v607/mainline-a-stage-a3-rights-review.json" } as const;
function localImageManifest(objectId: string): MainlineANebulaImageManifestV607 {
  const asset = getMainlineANebulaVisualAssetV607(objectId);
  if (!asset) throw new Error(`Missing delivered A3 image: ${objectId}`);
  return { status: "local-asset-acquired", imageUrl: asset.imageUrl, localPath: asset.localPath, byteSize: asset.byteSize, sha256: asset.sha256, dimensions: asset.dimensions, retrievedAt: asset.retrievedAt };
}

/**
 * The original six candidate identities now have reviewed CC BY 4.0 image
 * rights and exact local JPEG deliveries. Keep full credits visible on use.
 */
export const MAINLINE_A3_NEBULA_ASSET_CANDIDATES: readonly MainlineANebulaAssetCandidateV607[] = Object.freeze([
  {
    objectId: "m42",
    catalogNames: ["M 42", "Messier 42", "NGC 1976", "Orion Nebula"],
    sourcePage: "https://esahubble.org/images/opo0205d/",
    imageId: "opo0205d",
    credit: "NASA/ESA and C.R. O'Dell (Vanderbilt University)",
    rightsStatus: "cleared",
    rightsReview: clearedRightsReview,
    imageManifest: localImageManifest("m42"),
    observationEncoding: { bands: ["OIII", "H-alpha", "NII"], colorPolicy: "mapped-observation-color-not-naked-eye", nakedEyeRepresentationClaimed: false, scienceModePolicy: "catalog-marker-with-separate-observation-image", cinematicModePolicy: "licensed-observation-image-with-band-and-credit" },
  },
  {
    objectId: "m1",
    catalogNames: ["M 1", "Messier 1", "NGC 1952", "Crab Nebula"],
    sourcePage: "https://esahubble.org/images/potw1644a/",
    imageId: "potw1644a",
    credit: "ESA/Hubble & NASA. Acknowledgement: Judy Schmidt (Geckzilla)",
    rightsStatus: "cleared",
    rightsReview: clearedRightsReview,
    imageManifest: localImageManifest("m1"),
    observationEncoding: { bands: ["Optical V"], colorPolicy: "mapped-observation-color-not-naked-eye", nakedEyeRepresentationClaimed: false, scienceModePolicy: "catalog-marker-with-separate-observation-image", cinematicModePolicy: "licensed-observation-image-with-band-and-credit" },
  },
  {
    objectId: "m8",
    catalogNames: ["M 8", "Messier 8", "NGC 6523", "Lagoon Nebula"],
    sourcePage: "https://esahubble.org/images/heic1517b/",
    imageId: "heic1517b",
    credit: "NASA, ESA, Digitized Sky Survey 2 (Acknowledgement: Davide De Martin)",
    rightsStatus: "cleared",
    rightsReview: clearedRightsReview,
    imageManifest: localImageManifest("m8"),
    observationEncoding: { bands: ["Optical B", "Optical R"], colorPolicy: "mapped-observation-color-not-naked-eye", nakedEyeRepresentationClaimed: false, scienceModePolicy: "catalog-marker-with-separate-observation-image", cinematicModePolicy: "licensed-observation-image-with-band-and-credit" },
  },
  {
    objectId: "m16",
    catalogNames: ["M 16", "Messier 16", "NGC 6611", "Eagle Nebula"],
    sourcePage: "https://esahubble.org/images/heic1501e/",
    imageId: "heic1501e",
    credit: "ESO/Digitized Sky Survey 2. Acknowledgment: Davide De Martin.",
    rightsStatus: "cleared",
    rightsReview: clearedRightsReview,
    imageManifest: localImageManifest("m16"),
    observationEncoding: { bands: ["Optical B", "Infrared I"], colorPolicy: "mapped-observation-color-not-naked-eye", nakedEyeRepresentationClaimed: false, scienceModePolicy: "catalog-marker-with-separate-observation-image", cinematicModePolicy: "licensed-observation-image-with-band-and-credit" },
  },
  {
    objectId: "m20",
    catalogNames: ["M 20", "Messier 20", "NGC 6514", "Trifid Nebula"],
    sourcePage: "https://esahubble.org/images/opo0417c/",
    imageId: "opo0417c",
    credit: "NASA, ESA, and The Hubble Heritage Team (AURA/STScI)",
    rightsStatus: "cleared",
    rightsReview: clearedRightsReview,
    imageManifest: localImageManifest("m20"),
    observationEncoding: { bands: ["OIII", "H-alpha", "SII"], colorPolicy: "mapped-observation-color-not-naked-eye", nakedEyeRepresentationClaimed: false, scienceModePolicy: "catalog-marker-with-separate-observation-image", cinematicModePolicy: "licensed-observation-image-with-band-and-credit" },
  },
  {
    objectId: "m57",
    catalogNames: ["M 57", "Messier 57", "NGC 6720", "Ring Nebula"],
    sourcePage: "https://esahubble.org/images/heic1310a/",
    imageId: "heic1310a",
    credit: "NASA, ESA, and C. Robert O’Dell (Vanderbilt University).",
    rightsStatus: "cleared",
    rightsReview: clearedRightsReview,
    imageManifest: localImageManifest("m57"),
    observationEncoding: { bands: ["Optical Hβ", "Optical H II", "Optical OIII", "Optical Continuum", "Optical H-alpha", "Optical S II", "Optical NII"], colorPolicy: "mapped-observation-color-not-naked-eye", nakedEyeRepresentationClaimed: false, scienceModePolicy: "catalog-marker-with-separate-observation-image", cinematicModePolicy: "licensed-observation-image-with-band-and-credit" },
  },
]);
