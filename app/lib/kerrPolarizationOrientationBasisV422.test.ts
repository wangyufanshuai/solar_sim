import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canonicalShaV422, createKerrPolarizationOrientationBasisSummaryV422, createKerrPolarizationOrientationBasisViewV422, parseKerrPolarizationOrientationBasisArtifactV422, serializeKerrPolarizationOrientationBasisCsvV422 } from "./kerrPolarizationOrientationBasisV422";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
describe("v422 mask-aware polarization orientation basis", () => {
  it("recovers EVPA from a unit double-angle basis without creating Stokes measurements", () => {
    const view = createKerrPolarizationOrientationBasisViewV422(read("dist/science/kerr-axial-polarization-vectors-v421/axial-vector-catalog.json"), read("dist/science/kerr-polarization-orientation-basis-v422/python-orientation-basis-oracle.json"));
    expect(view.rows).toHaveLength(4);
    for (const row of view.rows) { const chi = row.authorityEvpaDeg * Math.PI / 180; expect(row.orientationBasis.qHat).toBeCloseTo(Math.cos(2 * chi), 14); expect(row.orientationBasis.uHat).toBeCloseTo(Math.sin(2 * chi), 14); expect(row.orientationBasis.normResidual).toBeLessThan(1e-12); expect(row.orientationBasis.recoveredAxialEvpaResidualDeg).toBeLessThan(1e-12); expect(Object.values(row.measurements).every((value) => value === null)).toBe(true); }
    expect(view.semantics.qHat).toContain("not-Q-over-I");
    expect(view.maskContract).toMatchObject({ orientationAvailableCount: 4, stokesMeasurementAvailableCount: 0, unavailableIsNotZero: true });
  });
  it("refuses raster, nearest-pixel and interpolation claims", () => {
    const artifact = parseKerrPolarizationOrientationBasisArtifactV422(read("dist/science/kerr-polarization-orientation-basis-v422/orientation-basis-catalog.json"));
    expect(canonicalShaV422(artifact)).toBe(artifact.artifactSha256);
    expect(artifact.view.rasterAdmission).toMatchObject({ rasterMaskGenerated: false, sciencePixelValueCount: 0, nearestPixelAssignmentAllowed: false, interpolationAllowed: false, unsampledPixelState: "unavailable-not-zero" });
    expect(createKerrPolarizationOrientationBasisSummaryV422(artifact).rows).toHaveLength(4);
    const csv = serializeKerrPolarizationOrientationBasisCsvV422(artifact.view);
    expect(csv).toContain("orientation_q_hat"); expect(csv).toContain("stokes_measurement_available"); expect(csv).not.toContain("NaN");
  });
});
