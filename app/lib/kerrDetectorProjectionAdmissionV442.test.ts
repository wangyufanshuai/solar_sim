import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createKerrDetectorProjectionAdmissionSummaryV442, parseKerrDetectorProjectionAdmissionV442 } from "./kerrDetectorProjectionAdmissionV442";

const artifact = JSON.parse(readFileSync("dist/science/kerr-detector-projection-admission-v442/detector-projection-admission.json", "utf8"));

describe("v442 detector projection admission", () => {
  it("keeps WCS authority separate from measured projection authority", () => {
    const parsed = parseKerrDetectorProjectionAdmissionV442(artifact);
    const summary = createKerrDetectorProjectionAdmissionSummaryV442(parsed);
    expect(summary.counts).toMatchObject({ gateCount: 11, qualified: 1, partial: 1, missing: 6, blocked: 3 });
    expect(summary.gates).toHaveLength(11);
    expect(summary.wcs).toMatchObject({ authority: "qualified-linear-wcs", coordinateRows: 24, detectorProjectionAllowed: false });
    expect(summary.projection).toMatchObject({ measuredGeometryAuthority: false, psfAuthority: false, detectorProjectionAvailable: false, rasterProductAvailable: false });
  });
  it("rejects a mutation that opens runtime projection", () => {
    expect(() => parseKerrDetectorProjectionAdmissionV442({ ...artifact, projection: { ...artifact.projection, detectorProjectionAvailable: true } })).toThrow("v442-artifact-identity");
  });
});
