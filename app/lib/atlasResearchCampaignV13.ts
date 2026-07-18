import { ATLAS_RESEARCH_CAMPAIGN_INPUT_V13 } from "./atlasResearchCampaignV13.generated";

export const ATLAS_RESEARCH_CAMPAIGN_V13_VERSION =
  "v241-atlas-research-campaign-manifest-v13" as const;

export type RelativityRegressionAttributionV13 =
  | "initial-state-fit-resolved"
  | "cross-solver-regression-confirmed"
  | "solver-disagreement"
  | "provenance-mismatch"
  | "inconclusive";

export type KerrDenseCampaignProgressV7 = {
  plannedRayCount: 3097;
  plannedShardCount: 49;
  completedReleaseShardCount: number;
  completedRayCount: number;
  completedExecutionCount: number;
  completedShardIndices: readonly number[];
  complete: boolean;
  gatePassed: boolean;
  blocker: string | null;
};

export type KerrDenseCampaignProgressV8 = KerrDenseCampaignProgressV7 & {
  campaignVersion: "finite-observer-v8";
  finiteObserverScreenManifestSha256: string;
  shortGatePassed: boolean;
};

export type AtlasResearchCampaignManifestV13 =
  typeof ATLAS_RESEARCH_CAMPAIGN_INPUT_V13;

export const ATLAS_RESEARCH_CAMPAIGN_MANIFEST_V13:
AtlasResearchCampaignManifestV13 = ATLAS_RESEARCH_CAMPAIGN_INPUT_V13;
