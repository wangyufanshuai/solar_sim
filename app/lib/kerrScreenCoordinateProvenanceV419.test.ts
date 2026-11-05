import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalShaV419,
  createKerrScreenCoordinateSummaryV419,
  createKerrScreenCoordinateViewV419,
  parseKerrScreenCoordinateArtifactV419,
  serializeKerrScreenCoordinateCsvV419,
} from "./kerrScreenCoordinateProvenanceV419";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("v419 screen-coordinate provenance", () => {
  it("recovers four finite-ZAMO screen coordinates through independent authority locks", () => {
    const view = createKerrScreenCoordinateViewV419(
      read("dist/science/kerr-campaign-v314/ray-plan.json"),
      read("dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json"),
      read("dist/science/kerr-reference-v313/polarization-short-gate.json"),
      read("dist/science/kerr-sparse-polarimetric-product-v418/diagnostic-product.json"),
      read("dist/science/kerr-screen-coordinate-provenance-v419/python-oracle.json"),
    );
    expect(view.observer).toEqual({ family: "finite-distance-ZAMO", radiusM: 30, inclinationDeg: 70, azimuthDeg: 0 });
    expect(view.rows.map((row) => [row.rayIndex, row.rayId, row.alphaM, row.betaM])).toEqual([
      [12, "disk-00", -8, 9],
      [13, "disk-01", -3, 9],
      [14, "disk-02", 3, 9],
      [15, "disk-03", 8, 9],
    ]);
    expect(view.maxima.coordinateReplayResidualM).toBeLessThan(1e-12);
    expect(view.maxima.nullResidual).toBeLessThan(1e-12);
    expect(view.maxima.constantResidual).toBe(0);
    expect(view.maxima.pythonOracleDifference).toBeLessThan(1e-12);
  });

  it("qualifies screen coordinates without inventing pixel WCS or a dense image", () => {
    const artifact = parseKerrScreenCoordinateArtifactV419(
      read("dist/science/kerr-screen-coordinate-provenance-v419/screen-coordinate-provenance.json"),
    );
    expect(canonicalShaV419(artifact)).toBe(artifact.artifactSha256);
    expect(artifact.view.rows.every((row) => row.pixelCoordinate.x === null && row.pixelCoordinate.y === null)).toBe(true);
    expect(artifact.view.products.fitsImage).toBe("unavailable-sparse-four-ray-and-no-approved-pixel-WCS");
    expect(artifact.view.products.densePolarimetricImage).toBe("unavailable-campaign-incomplete-0-of-49");
    const summary = createKerrScreenCoordinateSummaryV419(artifact);
    expect(summary.rows).toHaveLength(4);
    expect(summary).not.toHaveProperty("view");
    const csv = serializeKerrScreenCoordinateCsvV419(artifact.view);
    expect(csv).toContain("alpha_M,beta_M");
    expect(csv).toContain("disk-03,0.9,8,9");
  });
});
