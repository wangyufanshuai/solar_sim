import { describe, expect, it } from "vitest";
import { ATLAS_RESEARCH_CAMPAIGN_MANIFEST_V13 } from "./atlasResearchCampaignV13";

describe("AtlasResearchCampaignManifestV13", () => {
  it("uses the V9 joint validation as the current weak-field authority", () => {
    const manifest = ATLAS_RESEARCH_CAMPAIGN_MANIFEST_V13;
    expect(manifest.version).toBe("v241-atlas-research-campaign-manifest-v13");
    expect(manifest.reference.coordinateFrame).toBe("ICRF-J2000-barycentric");
    expect(manifest.reference.timeScale).toBe("TDB");
    expect(manifest.reference.provenanceReady).toBe(true);
    expect(manifest.promotionInput.comparativeAggregateImprovementDemonstrated).toBe(false);
    expect(manifest.promotionInput.perBodyNoRegression).toBe(false);
    expect(manifest.weakField.historicalRegressionCount).toBe(15);
    expect(manifest.weakField.attributions).toHaveLength(15);
    expect(manifest.weakField.attributions.every((row) => row.attribution !== undefined)).toBe(true);
    expect(manifest.defaultKernel).toBe("legacy-eih-1pn");
    expect(manifest.runtimePromotionApplied).toBe(false);
  });

  it("never treats partial Kerr or smoke STM evidence as release qualification", () => {
    const manifest = ATLAS_RESEARCH_CAMPAIGN_MANIFEST_V13;
    expect(manifest.denseKerr.campaignVersion).toBe("finite-observer-v8");
    expect(manifest.denseKerr.freezeCommitSha).toMatch(/^[a-f0-9]{40}$/);
    expect(manifest.denseKerr.freezeBranch).toBe("codex/orbit-atlas-v241-science-freeze");
    expect(manifest.denseKerr.campaignStatus).toBe("failed");
    expect(manifest.denseKerr.plannedShardCount).toBe(49);
    expect(manifest.denseKerr.completedReleaseShardCount).toBe(3);
    expect(manifest.denseKerr.completedRayCount).toBe(192);
    expect(manifest.denseKerr.completedExecutionCount).toBe(1536);
    expect(manifest.denseKerr.attemptedRayCount).toBe(256);
    expect(manifest.denseKerr.attemptedExecutionCount).toBe(2048);
    expect(manifest.denseKerr.failedShardIndex).toBe(3);
    expect(manifest.denseKerr.noAutomaticRetry).toBe(true);
    expect(manifest.denseKerr.failedShardEvidence).toMatchObject({
      shardIndex: 3,
      complete: false,
      rayCount: 64,
      executionCount: 512,
      watchdogSeconds: 180,
      incompleteExecutionCount: 4,
      watchdogTimeoutExecutionCount: 4,
      affectedRayIds: ["low-discrepancy-0174", "low-discrepancy-0204"],
      retainedAsImmutableNegativeEvidence: true,
    });
    expect(manifest.denseKerr.shortGatePassed).toBe(true);
    expect(manifest.denseKerr.shortGateEvaluation.criticalTransitionCount).toBe(40);
    expect(manifest.denseKerr.shortGateEvaluation.criticalTransitionExpected).toBe(40);
    expect(manifest.denseKerr.historicalV7?.gatePassed).toBe(false);
    expect(manifest.denseKerr.historicalV7?.criticalTransitionCount).toBe(0);
    expect(manifest.denseKerr.historicalV7?.retainedAsImmutableNegativeEvidence).toBe(true);
    expect(manifest.denseKerr.partialResultsAggregated).toBe(false);
    expect(manifest.denseKerr.complete).toBe(false);
    expect(manifest.denseKerr.gatePassed).toBe(false);
    expect(manifest.variationalStm.releaseQualificationAvailable).toBe(false);
    expect(manifest.denseKerr.blocker).toBe("v8-dense-campaign-failed-no-retry-no-partial-aggregation");
    expect(manifest.outcome).toBe("relativity-v13-product-candidate-science-failed-shadow-retained");
  });
});
