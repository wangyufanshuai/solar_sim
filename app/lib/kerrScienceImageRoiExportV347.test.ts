import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import { acquireKerrScienceImageRoiExportV347 } from "./kerrScienceImageRoiExportV347";
import { parseKerrScienceImageRoiArtifactV347 } from "./kerrScienceImageRoiV347";

describe("v347 ROI export lifecycle", () => {
  it("tracks two object URLs and returns to baseline under reverse duplicate release", () => {
    const artifact = parseKerrScienceImageRoiArtifactV347(JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-image-roi-v347/roi.json"), "utf8"))); const summary = artifact.summaries.find((entry) => entry.roiId === artifact.canonicalExport.roiId)!; const baseline = getAtlasResourceSnapshot();
    const json = acquireKerrScienceImageRoiExportV347(summary, artifact.source.probeArtifactSha256, "json"); const csv = acquireKerrScienceImageRoiExportV347(summary, artifact.source.probeArtifactSha256, "csv"); expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot())).toMatchObject({ objectUrls: 2, typedArrayCaches: 0 });
    csv.release(); json.release(); json.release(); expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe("baseline");
  });
});
