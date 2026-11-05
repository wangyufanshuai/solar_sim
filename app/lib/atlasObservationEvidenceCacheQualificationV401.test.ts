import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAtlasObservationEvidenceCacheQualificationV401 } from "./atlasObservationEvidenceCacheQualificationV401";

describe("v401 observation evidence cache qualification", () => {
  it("parses only the bounded fail-closed browser-pending artifact", () => {
    const artifact = JSON.parse(readFileSync("dist/science/atlas-observation-evidence-cache-v401/cache-qualification.json", "utf8"));
    expect(parseAtlasObservationEvidenceCacheQualificationV401(artifact)).toBe(artifact);
    expect(artifact.cache).toMatchObject({ stageCount: 4, maximumEntries: 4, maximumResponseBytes: 128 * 1024, maximumRequestsPerStage: 1, initialRequestCount: 0, initialCacheEntryCount: 0, initialCachedBytes: 0, failedPromiseRetained: true, automaticRetryAllowed: false, snapshotContainsArtifacts: false, responseBytesTracked: true });
    expect(artifact.hub).toMatchObject({ dynamicStageStatus: true, externalStoreSnapshot: true, maximumMountedStageCount: 1, resourceTelemetryDirectToDom: true, resourceTelemetryStoredInReactState: false, canvasCreated: false });
    expect(artifact.runtimeBoundary).toMatchObject({ formalProductPointer: "v263", localShadowDefaultProfile: "legacy-v9", denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run" });
  });
});
