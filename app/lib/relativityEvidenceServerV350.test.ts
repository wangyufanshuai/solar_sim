import { describe, expect, it } from "vitest";
import { loadAtlasRelativityEvidenceSnapshotV350, resetRelativityEvidenceServerV350CacheForTests } from "./relativityEvidenceServerV350";

describe("v350 observation evidence", () => {
  it("reports explicit unavailable capabilities and dense boundary", async () => {
    resetRelativityEvidenceServerV350CacheForTests();
    const snapshot = await loadAtlasRelativityEvidenceSnapshotV350();
    expect(snapshot).toMatchObject({ version: "v350-relativity-evidence-snapshot", status: "ready", current: { v350: { bandCount: 3, rayCount: 4, rowCount: 12, measuredDetectorCounts: "unavailable-synthetic-model-only", celestialWcs: "unavailable-sparse-index-grid", solidAngleIntegratedFlux: "unavailable-no-celestial-wcs", denseStatus: "incomplete-0-of-49" } } });
  });
});
