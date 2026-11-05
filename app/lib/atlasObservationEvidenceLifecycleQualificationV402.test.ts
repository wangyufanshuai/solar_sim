import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAtlasObservationEvidenceLifecycleQualificationV402 } from "./atlasObservationEvidenceLifecycleQualificationV402";

describe("v402 observation evidence lifecycle qualification", () => {
  it("parses only the baseline-returning audit-retaining artifact", () => {
    const artifact = JSON.parse(readFileSync("dist/science/atlas-observation-evidence-lifecycle-v402/lifecycle-qualification.json", "utf8"));
    expect(parseAtlasObservationEvidenceLifecycleQualificationV402(artifact)).toBe(artifact);
    expect(artifact.lifecycle).toMatchObject({ initialActiveScopeCount: 0, initialCacheEntryCount: 0, initialCachedBytes: 0, finalScopeReleasesPayloads: true, releaseDeferredToMicrotask: true, strictModeReacquireStable: true, releaseIdempotent: true, pendingRequestsAbortedOnRelease: true, requestGenerationIsolation: true, cacheEntriesReturnToZero: true, cachedBytesReturnToZero: true, auditRetainedAfterRelease: true, automaticRetryOnRelease: false });
    expect(artifact.runtimeBoundary).toMatchObject({ formalProductPointer: "v263", localShadowDefaultProfile: "legacy-v9", denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run" });
  });
});
