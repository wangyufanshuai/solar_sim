import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalShaV421,
  createKerrAxialPolarizationVectorSummaryV421,
  createKerrAxialPolarizationVectorViewV421,
  parseKerrAxialPolarizationVectorArtifactV421,
  serializeKerrAxialPolarizationVectorCsvV421,
} from "./kerrAxialPolarizationVectorCatalogV421";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("v421 WCS-aware axial polarization vectors", () => {
  it("uses the authority EVPA convention from +beta toward +alpha", () => {
    const view = createKerrAxialPolarizationVectorViewV421(
      read("dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS.json"),
      read("dist/science/kerr-sparse-polarimetric-product-v418/diagnostic-product.json"),
      read("dist/science/kerr-axial-polarization-vectors-v421/python-axial-vector-oracle.json"),
    );
    expect(view.rows).toHaveLength(4);
    for (const row of view.rows) {
      const chi = row.authorityEvpaDeg * Math.PI / 180;
      expect(row.worldDirectionUnit.alpha).toBeCloseTo(Math.sin(chi), 14);
      expect(row.worldDirectionUnit.beta).toBeCloseTo(Math.cos(chi), 14);
      expect(row.axialOrientationTensor.cosTwoChi).toBeCloseTo(Math.cos(2 * chi), 14);
      expect(row.axialOrientationTensor.sinTwoChi).toBeCloseTo(Math.sin(2 * chi), 14);
      expect(row.presentationGlyph.plus180EndpointSetResidualM).toBeLessThan(1e-12);
      expect(row.presentationGlyph.recoveredAxialEvpaResidualDeg).toBeLessThan(1e-12);
    }
    expect(view.convention.cssRotation).toBe("chi-minus-90-degrees-from-positive-screen-x");
    expect(view.convention.imageDirection).toBe("dx=sin-chi-dy=minus-cos-chi");
  });

  it("withdraws only the prior quiver display while retaining numerical qualification", () => {
    const artifact = parseKerrAxialPolarizationVectorArtifactV421(read("dist/science/kerr-axial-polarization-vectors-v421/axial-vector-catalog.json"));
    expect(canonicalShaV421(artifact)).toBe(artifact.artifactSha256);
    expect(artifact.view.priorDisplayAudit).toMatchObject({
      v419NumericalCoordinates: "qualified-preserved",
      v419NumericalEvpa: "qualified-preserved",
      v419PngQuiverOrientation: "withdrawn-display-only-90-degree-convention-mismatch",
      v420NumericalWcs: "qualified-preserved",
      v420PngQuiverOrientation: "withdrawn-display-only-90-degree-convention-mismatch",
      historicalFilesOverwritten: false,
    });
    expect(artifact.view.rows.every((row) => row.intensity === null && row.stokesAmplitude === null && !row.interpolationAllowed)).toBe(true);
    const summary = createKerrAxialPolarizationVectorSummaryV421(artifact);
    expect(summary.rows).toHaveLength(4);
    expect(summary).not.toHaveProperty("view");
    expect(serializeKerrAxialPolarizationVectorCsvV421(artifact.view)).toContain("tensor_cos_2chi");
  });
});
