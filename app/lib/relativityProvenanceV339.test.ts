import { describe, expect, it } from "vitest";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import { loadAtlasRelativityEvidenceSnapshotV338 } from "./relativityEvidenceServerV338";
import { createRelativityProvenanceBundleV339, runRelativityProvenanceObjectUrlReplayV339, serializeRelativityProvenanceCsvV339, serializeRelativityProvenanceJsonV339 } from "./relativityProvenanceV339";

describe("v339 sanitized relativity provenance", () => {
  it("exports bounded JSON/CSV summaries without ray buffers or host data", async () => {
    const snapshot = await loadAtlasRelativityEvidenceSnapshotV338();
    const bundle = createRelativityProvenanceBundleV339(snapshot);
    const json = serializeRelativityProvenanceJsonV339(bundle);
    const csv = serializeRelativityProvenanceCsvV339(bundle);
    expect(bundle).toMatchObject({ version: "v339-relativity-sanitized-provenance-v1", authority: { scienceAuthority: "v312-v313-short-gate-sparse" }, dense: { namespace: "v314", status: "incomplete-0-of-49", aggregateAvailable: false, rawRayBufferIncluded: false }, sanitization: { rawRayBufferIncluded: false, absolutePathsIncluded: false, pidIncluded: false, hostIncluded: false, transientMemoryIncluded: false } });
    expect(bundle.rows).toHaveLength(3);
    expect(json).toContain("v337");
    expect(csv.split("\n")).toHaveLength(5);
    for (const key of ["peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "absolutePath", "pid", "host", "rayBuffer"]) expect(json).not.toContain(`\"${key}\":`);
    expect(csv).not.toContain("[object Object]");
  });

  it("releases JSON and CSV object URLs in reverse order and returns the registry baseline", () => {
    const baseline = getAtlasResourceSnapshot();
    const replay = runRelativityProvenanceObjectUrlReplayV339(1024, 512);
    expect(replay).toMatchObject({ version: "v339-object-url-lifecycle-replay-v1", status: "qualified-object-url-release-baseline-return", acquiredCount: 2, idempotentRelease: true, baselineReturned: true, during: { total: 2, objectUrls: 2 }, afterFirstRelease: { status: "baseline" }, afterDuplicateRelease: { status: "baseline" } });
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe("baseline");
  });
});
