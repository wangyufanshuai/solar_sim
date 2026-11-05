import { describe, expect, it } from "vitest";
import { loadAtlasRelativityEvidenceSnapshotV346, resetRelativityEvidenceServerV346CacheForTests } from "./relativityEvidenceServerV346";
describe("v346 image probe evidence", () => {
  it("returns bounded probe, coordinate and lifecycle truth", async () => {
    resetRelativityEvidenceServerV346CacheForTests(); const snapshot = await loadAtlasRelativityEvidenceSnapshotV346();
    expect(snapshot).toMatchObject({ version: "v346-relativity-evidence-snapshot", status: "ready", current: { v346: { hitCount: 12, uniqueHitCount: 12, orientationInvariant: true, singleFlightRequests: 1, typedArrayCacheDelta: 1, releaseBaseline: true, corruptBaseline: true, celestialWcs: "unavailable", denseStatus: "incomplete-0-of-49" } } });
  });
});
