import { CURRENT_ATLAS_EXTREME_RELEASE_V166 } from "./atlasExtremeReleaseV166";
import { CURRENT_SCIENTIFIC_EXPERIENCE_EVIDENCE_V7 } from "./scientificExperienceEvidenceV7";
import { CURRENT_SCIENTIFIC_PROMOTION_DECISION_V6 } from "./scientificPromotionDecisionV6";

export const ATLAS_PRODUCT_RELEASE_V167_VERSION =
  "v167-product-release-evidence-closure" as const;

export function createAtlasProductReleaseV167Summary() {
  const evidence = CURRENT_SCIENTIFIC_EXPERIENCE_EVIDENCE_V7;
  const promotion = CURRENT_SCIENTIFIC_PROMOTION_DECISION_V6;
  const productBlockers = [
    ...(evidence.performance.status === "verified" && evidence.performance.independent
      ? []
      : ["v166-hardware-performance-pending"]),
    ...(evidence.regression.status === "verified" && evidence.regression.independent
      ? []
      : ["v166-regression-pending"]),
  ];
  const productVerified = productBlockers.length === 0;

  return {
    ...CURRENT_ATLAS_EXTREME_RELEASE_V166,
    version: ATLAS_PRODUCT_RELEASE_V167_VERSION,
    predecessorVersion: CURRENT_ATLAS_EXTREME_RELEASE_V166.version,
    profile: "web-standalone-product-rc-verified-science-shadow-retained" as const,
    releaseStatus: productVerified
      ? "product-rc-verified-science-shadow-retained" as const
      : "blocked-pending-product-runtime-qa" as const,
    productReleaseStatus: productVerified
      ? "verified-web-standalone-release-candidate" as const
      : "blocked-pending-runtime-evidence" as const,
    scientificPromotionStatus: promotion.decision,
    productBlockers,
    scientificBlockers: promotion.blockers,
    performanceEvidence: "dist/science/performance-v166-report.json" as const,
    regressionEvidence: "dist/science/regression-v166-report.json" as const,
    promotionApplied: false as const,
    defaultScientificKernel: "legacy-eih-1pn" as const,
    shadowScientificKernel: "eih-1pn-2pn-lt" as const,
    boundary:
      "product-release-evidence-only-no-scientific-promotion-no-live-or-worker-physics-mutation" as const,
  };
}

export const CURRENT_ATLAS_PRODUCT_RELEASE_V167 =
  createAtlasProductReleaseV167Summary();
