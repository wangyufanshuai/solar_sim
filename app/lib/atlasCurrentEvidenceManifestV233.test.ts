import { describe, expect, it } from "vitest";
import { ATLAS_CURRENT_EVIDENCE_MANIFEST_V233 } from "./atlasCurrentEvidenceManifestV233";

describe("AtlasCurrentEvidenceManifestV233", () => {
  it("publishes one fail-closed current evidence authority", () => {
    const manifest = ATLAS_CURRENT_EVIDENCE_MANIFEST_V233;
    expect(manifest.version).toBe("v233-current-evidence-manifest");
    expect(manifest.product.localProductGatesPassed).toBe(true);
    expect(manifest.denseKerr.campaignVersion).toBe("finite-observer-v8");
    expect(manifest.denseKerr.freezeCommitSha).toBe("8315160a6f7afd4763e3840c7b6d5bb4da0ca663");
    expect(manifest.denseKerr.campaignStatus).toBe("failed");
    expect(manifest.denseKerr.shortGatePassed).toBe(true);
    expect(manifest.denseKerr.completedReleaseShardCount).toBe(3);
    expect(manifest.denseKerr.completedRayCount).toBe(192);
    expect(manifest.denseKerr.completedExecutionCount).toBe(1536);
    expect(manifest.denseKerr.attemptedRayCount).toBe(256);
    expect(manifest.denseKerr.attemptedExecutionCount).toBe(2048);
    expect(manifest.denseKerr.failedShardEvidence?.watchdogTimeoutExecutionCount).toBe(4);
    expect(manifest.denseKerr.noAutomaticRetry).toBe(true);
    expect(manifest.denseKerr.historicalV7?.gatePassed).toBe(false);
    expect(manifest.denseKerr.partialResultsAggregated).toBe(false);
    expect(manifest.denseKerr.blocker).toBe("v8-dense-campaign-failed-no-retry-no-partial-aggregation");
    expect(manifest.variationalStm.releaseQualificationAvailable).toBe(false);
    expect(manifest.weakField.perBodyRegressionCount).toBe(15);
    expect(manifest.promotionDecision.status).toBe("shadow-retained");
    expect(manifest.promotionDecision.effectIsolationComplete).toBe(false);
    expect(manifest.promotionDecision.comparativeAggregateImprovementDemonstrated).toBe(false);
    expect(manifest.promotionDecision.independentPerBodyComparisonComplete).toBe(true);
    expect(manifest.promotionDecision.perBodyNoRegression).toBe(false);
    expect(manifest.promotionDecision.promotionApplied).toBe(false);
    expect(manifest.promotionDecision.defaultKernel).toBe("legacy-eih-1pn");
  });
});
