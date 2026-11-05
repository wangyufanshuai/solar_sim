import { describe, expect, it } from "vitest";
import review from "../data/mainlineANebulaCandidateReviewV655.generated.json";
import sky from "../data/mainlineAWebSkyAtlasV656.generated.json";
import canonical from "../data/mainlineACanonicalCoverageV622.generated.json";
import { buildWebStageFreezeDataV657,
  evaluateWebStageRuntimeEvidenceV657,
  WEB_STAGE_MIN_LONGRUN_MS_V657,
  type WebStageRuntimeEvidenceV657 } from "./mainlineAWebStageFreezeV657";
import type { CandidateReviewPackV655 } from "./mainlineANebulaReviewAssetV655";
import type { WebSkyAtlasPackV656 } from "./mainlineAWebSkyV656";
import type { CoveragePackV622 } from "./mainlineACanonicalCoverageV622";

const base = () => buildWebStageFreezeDataV657(
  review as CandidateReviewPackV655,
  sky as WebSkyAtlasPackV656,
  canonical as CoveragePackV622,
);
const SHA = "a".repeat(64);
const hypotheticalRuntime = (): WebStageRuntimeEvidenceV657 => ({
  sourceSha256: SHA, buildSourceSha256: SHA, buildStatus: "passed",
  homeStatus: 200, healthStatus: 200, skyMetadataStatus: 200,
  servedCandidateVariants: 36, servedCandidateShaMatches: 36,
  canonicalSelections: 72, candidateDetailsOpened: 24,
  browserPageErrors: 0, objectUrlsAfterClose: 0,
  longRuns: [
    { device: "desktop", durationMs: WEB_STAGE_MIN_LONGRUN_MS_V657,
      visibilityInterruptions: 0, resourceRestored: true, sourceSha256: SHA },
    { device: "mobile-viewport", durationMs: WEB_STAGE_MIN_LONGRUN_MS_V657,
      visibilityInterruptions: 0, resourceRestored: true, sourceSha256: SHA },
  ],
});

describe("V657 web-stage candidate freeze boundaries", () => {
  it("cross-checks twelve real candidate pins and independent A-line and sky counts", () => {
    const stage = base();
    expect(stage.status).toBe("candidate-data-valid");
    expect(stage.issues).toEqual([]);
    expect(stage.counts.candidateImages).toBe(12);
    expect(stage.counts.sourcePages).toBe(12);
    expect(stage.counts.officialJpegs).toBe(12);
    expect(stage.counts.decodedPixelMatches).toBe(12);
    expect(stage.counts.canonicalStars).toBe(12);
    expect(stage.counts.canonicalNebulae).toBe(12);
    expect(stage.counts.canonicalConstellations).toBe(12);
    expect(stage.counts.betaStars).toBe(24);
    expect(stage.counts.runtimeExistingStars).toBe(20);
    expect(stage.counts.identityHoldStars).toBe(4);
    expect(stage.counts.componentIdentitySigned).toBe(0);
    expect(stage.counts.imageRightsSigned).toBe(0);
    expect(stage.gates.publicRelease).toBe("blocked");
    expect(stage.gates.technicalFreeze).toBe("pending-runtime-evidence");
  });

  it("keeps each candidate as a local review route with official source identity", () => {
    const stage = base();
    expect(new Set(stage.rows.map((row) => row.id)).size).toBe(12);
    for (const row of stage.rows) {
      expect(row.sourcePageUrl).toMatch(/^https:\/\/science\.nasa\.gov\/photojournal\//);
      expect(row.officialJpegUrl).toMatch(/^https:\/\/assets\.science\.nasa\.gov\//);
      expect(row.localRoutes.raw).toBe(`/api/atlas/mainline-a-nebula-review/${row.id}/raw`);
      expect(row.rightsStatus).toBe("pending");
      expect(row.runtimeAdmission).toBe("candidate-only");
      expect(row.scientificPayloadWriteback).toBe(false);
    }
  });

  it("rejects a forged rights admission even if old data counts remain", () => {
    const changed = structuredClone(review);
    changed.rows[0].rightsStatus = "approved";
    const stage = buildWebStageFreezeDataV657(
      changed as unknown as CandidateReviewPackV655,
      sky as WebSkyAtlasPackV656,
      canonical as CoveragePackV622,
    );
    expect(stage.status).toBe("invalid");
    expect(stage.counts.imageRightsSigned).toBe(1);
    expect(stage.issues.length).toBeGreaterThan(0);
  });

  it("rejects source ID drift and duplicate candidate identity", () => {
    const changed = structuredClone(review);
    changed.rows[1].id = changed.rows[0].id;
    changed.rows[2].sourcePageUrl = "https://example.invalid/fixture";
    const stage = buildWebStageFreezeDataV657(
      changed as unknown as CandidateReviewPackV655,
      sky as WebSkyAtlasPackV656,
      canonical as CoveragePackV622,
    );
    expect(stage.status).toBe("invalid");
    expect(stage.issues).toContain("source-link-or-raw-pin-drift");
  });

  it("treats a synthetic unit-test matrix only as a contract, never as a release", () => {
    const decision = evaluateWebStageRuntimeEvidenceV657(base(), hypotheticalRuntime());
    expect(decision.status).toBe("technical-candidate-ready");
    expect(decision.publicReleaseApproved).toBe(false);
    expect(decision.copyrightApproved).toBe(false);
    expect(decision.scientificValidityApproved).toBe(false);
    expect(decision.productionPerformanceApproved).toBe(false);
    expect(decision.scientificPayloadWriteback).toBe(false);
  });

  it("refuses old-source, short, duplicated or interrupted observations", () => {
    const ready = hypotheticalRuntime();
    const changed = {
      ...ready, buildSourceSha256: "b".repeat(64),
      longRuns: [ready.longRuns[0], {
        ...ready.longRuns[0], durationMs: 1,
        visibilityInterruptions: 1, resourceRestored: false,
      }],
    } as WebStageRuntimeEvidenceV657;
    const decision = evaluateWebStageRuntimeEvidenceV657(base(), changed);
    expect(decision.status).toBe("technical-evidence-incomplete");
    expect(decision.reasons).toContain("build-source-identity-mismatch");
    expect(decision.reasons).toContain("current-source-longruns-incomplete");
  });

  it("refuses screenshot counts in place of candidate image bytes", () => {
    const changed = { ...hypotheticalRuntime(),
      servedCandidateVariants: 0, servedCandidateShaMatches: 0,
      canonicalSelections: 36, candidateDetailsOpened: 12,
      objectUrlsAfterClose: 1 };
    const decision = evaluateWebStageRuntimeEvidenceV657(base(), changed);
    expect(decision.reasons).toContain("candidate-image-bytes-incomplete");
    expect(decision.reasons).toContain("browser-route-coverage-incomplete");
    expect(decision.reasons).toContain("browser-error-or-resource-leak");
  });
});
