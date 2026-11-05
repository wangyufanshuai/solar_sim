import { describe, expect, it } from "vitest";
import { loadAtlasRelativityEvidenceSnapshotV338, resetRelativityEvidenceServerV338CacheForTests } from "./relativityEvidenceServerV338";

describe("v338 evidence server", () => {
  it("loads only the v336/v337 allowlist and keeps the v314 dense boundary", async () => {
    resetRelativityEvidenceServerV338CacheForTests();
    const snapshot = await loadAtlasRelativityEvidenceSnapshotV338();
    expect(snapshot).toMatchObject({ version: "v338-relativity-evidence-snapshot", status: "ready", current: { v336: { transitionCount: 3 }, v337: { sampleCount: 16 }, v314: { status: "incomplete-0-of-49" } } });
    expect(JSON.stringify(snapshot)).not.toMatch(/(?:absolutePath|peakRssGiB|freeMemoryGiB|freeDiskGiB|pid|host)/);
  });
});
