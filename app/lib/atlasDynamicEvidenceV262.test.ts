import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ATLAS_DYNAMIC_EVIDENCE_V262 } from "./atlasDynamicEvidenceV262.generated";

describe("v262 dynamic local-candidate evidence", () => {
  it("retains failed science/default kernel and frozen root/claim contracts", () => {
    expect(ATLAS_DYNAMIC_EVIDENCE_V262.science).toMatchObject({ status: "science-failed-shadow-retained", defaultKernel: "legacy-eih-1pn", runtimePromotionApplied: false });
    expect(ATLAS_DYNAMIC_EVIDENCE_V262.science.v8).toMatchObject({ completedShards: 3, plannedShards: 49, failedShardIndex: 3, noAutomaticRetry: true });
    expect(ATLAS_DYNAMIC_EVIDENCE_V262.contracts).toMatchObject({ legacyRootAttributes: 603, evidenceLedgerClaims: 84, workerPhysicsMutation: "not-applied", eihOnePnMutation: "not-applied" });
  });

  it("reports actual catalog/science/cosmic rows and negative completeness evidence", () => {
    expect(ATLAS_DYNAMIC_EVIDENCE_V262.product.v257).toMatchObject({ searchableRows: 1_224_219, renderableRows: 1_221_242, spatial3dRows: 758_955 });
    expect(ATLAS_DYNAMIC_EVIDENCE_V262.product.v259).toMatchObject({ frozenSubsetRows: 200_000, gaiaSurveyCompleteness: { status: "blocked", fallbackApplied: false } });
    expect(ATLAS_DYNAMIC_EVIDENCE_V262.product.v260).toMatchObject({ openNgc: { rows: 13_962 }, cosmicflows: { rows: 55_877, publicDeploymentBlocked: true } });
  });

  it("does not mutate the legacy current science evidence while pointing product evidence forward", () => {
    const legacy = readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-evidence-v233.json"));
    expect(createHash("sha256").update(legacy).digest("hex")).toBe(ATLAS_DYNAMIC_EVIDENCE_V262.science.sourceEvidence.currentSha256);
    expect(ATLAS_DYNAMIC_EVIDENCE_V262.release).toMatchObject({ vercelApplied: false, productionApplied: false, publicDeploymentBlocked: true });
    expect(ATLAS_DYNAMIC_EVIDENCE_V262.product.v261.candidateAppliedAsDefault).toBe(false);
  });

  it("preserves the corrected fresh attempt as negative evidence without scientific mutation", () => {
    const browserQa = ATLAS_DYNAMIC_EVIDENCE_V262.validation.browserQa;
    expect(browserQa.status).toBe("blocked-fresh-matrix-not-reclosed");
    expect(browserQa.fullFresh.correctedHarness.correctedAttempt).toMatchObject({
      status: "failed",
      exitCode: 1,
      reportedDuration: "13.8m",
      results: { passed: 20, skipped: 1, failed: 1 },
      automaticRetryApplied: false,
      assertionOrThresholdRelaxationApplied: false,
      viewportRouteFix: {
        status: "prepared-not-rerun",
        productMutation: "not-applied",
        scienceMutation: "not-applied",
      },
    });
    expect(ATLAS_DYNAMIC_EVIDENCE_V262.release.localCandidateValidationStatus).toBe("blocked-fresh-matrix-not-reclosed");
  });
});
