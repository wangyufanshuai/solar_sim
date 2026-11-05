import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseKerrDetectorProjectionAdmissionV442 } from "../lib/kerrDetectorProjectionAdmissionV442";
describe("v442 admission panel", () => {
  it("exposes measured gate state without enabling raster or payload mutation", () => {
    const artifact = parseKerrDetectorProjectionAdmissionV442(JSON.parse(readFileSync("dist/science/kerr-detector-projection-admission-v442/detector-projection-admission.json", "utf8")));
    expect(artifact.contract.runtimeProjectionAllowed).toBe(false);
    expect(artifact.contract.scienceRasterAllowed).toBe(false);
    expect(artifact.contract.cinematicScienceWritebackAllowed).toBe(false);
    expect(artifact.qualification.measuredAuthorityGranted).toBe(false);
    expect(artifact.qualification.runtimeGeometryPublished).toBe(false);
  });
});
