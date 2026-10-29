import { ATLAS_CURRENT_EVIDENCE_INPUT_V233 } from "./atlasCurrentEvidenceManifestV233.generated";
import { CURRENT_SCIENTIFIC_PROMOTION_DECISION_V7 } from "./scientificPromotionDecisionV7";

export const ATLAS_CURRENT_EVIDENCE_MANIFEST_V233_VERSION =
  "v233-current-evidence-manifest" as const;

export type AtlasResearchExecutionProgressV233 = {
  plannedRayCount: number;
  plannedShardCount: number;
  completedReleaseShardCount: number;
  completedRayCount: number;
  completedExecutionCount: number;
  completedShardIndices: readonly number[];
  gatePassed: boolean;
  blocker: string | null;
};

export type AtlasCurrentEvidenceManifestV233 =
  typeof ATLAS_CURRENT_EVIDENCE_INPUT_V233 & {
    promotionDecision: typeof CURRENT_SCIENTIFIC_PROMOTION_DECISION_V7;
  };

export const ATLAS_CURRENT_EVIDENCE_MANIFEST_V233: AtlasCurrentEvidenceManifestV233 = {
  ...ATLAS_CURRENT_EVIDENCE_INPUT_V233,
  promotionDecision: CURRENT_SCIENTIFIC_PROMOTION_DECISION_V7,
};
