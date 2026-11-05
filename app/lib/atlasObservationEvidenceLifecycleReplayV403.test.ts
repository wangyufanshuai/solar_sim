import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAtlasObservationEvidenceLifecycleReplayV403 } from "./atlasObservationEvidenceLifecycleReplayV403";

describe("v403 observation evidence lifecycle replay", () => {
  it("parses the deterministic 30-cycle fixture campaign without promoting browser soak", () => {
    const artifact = JSON.parse(readFileSync("dist/science/atlas-observation-evidence-lifecycle-v403/replay-campaign.json", "utf8"));
    expect(parseAtlasObservationEvidenceLifecycleReplayV403(artifact)).toBe(artifact);
    expect(artifact.campaign).toMatchObject({ cycleCount: 30, deterministicExecutionCount: 2, successfulCycleCount: 24, unavailableCycleCount: 4, releasedPendingCycleCount: 2, totalRequestCount: 114, successCount: 108, failureCount: 4, releasedPendingRequestCount: 2, baselineCycleCount: 30, maximumCacheEntryCount: 4, deterministicReplay: true, networkAttempted: false });
    expect(artifact.finalLifecycle).toMatchObject({ activeScopeCount: 0, releaseCount: 30, cacheEntryCount: 0, cachedBytes: 0, cacheAtBaseline: true });
    expect(artifact.qualification).toEqual({ fixtureReplayQualified: true, browserSoakQualified: false, productionLifecycleQualified: false, scientificAuthorityChanged: false });
  });
});
