import { describe, expect, it } from "vitest";
import { loadAtlasRelativityEvidenceSnapshotV341, resetRelativityEvidenceServerV341CacheForTests } from "./relativityEvidenceServerV341";

describe("v341 evidence server", () => {
  it("exposes the bounded observation summary without host or dense claims", async () => {
    resetRelativityEvidenceServerV341CacheForTests();
    const snapshot = await loadAtlasRelativityEvidenceSnapshotV341();
    expect(snapshot).toMatchObject({ version: "v341-relativity-evidence-snapshot", status: "ready", current: { v340: { runtimeMatrixRows: 24 }, v341: { bandMeasurementCount: 12, applicableDiskRayCount: 4, denseStatus: "incomplete-0-of-49", browserQualification: "not-run" } } });
    expect(JSON.stringify(snapshot)).not.toMatch(/(?:absolutePath|peakRssGiB|freeMemoryGiB|freeDiskGiB|pid|host)/);
  });
});
