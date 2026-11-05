import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalShaV418,
  createKerrSparsePolarimetricProductV418,
  createKerrSparsePolarimetricSummaryV418,
  parseKerrSparsePolarimetricArtifactV418,
  serializeKerrSparsePolarimetricCsvV418,
} from "./kerrSparsePolarimetricProductV418";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("v418 sparse polarimetric diagnostic product", () => {
  it("keeps canonical key ordering and transient-field semantics byte-identical", () => {
    const first = {
      z: 1,
      generatedAt: "first-build",
      a: { y: 2, artifactSha256: "first-seal", x: 3 },
    };
    const reordered = {
      a: { x: 3, y: 2, artifactSha256: "second-seal" },
      artifactSha256: "outer-seal",
      z: 1,
      generatedAt: "second-build",
    };
    expect(canonicalShaV418(first)).toBe(canonicalShaV418(reordered));
    expect(canonicalShaV418(first)).toBe("8dfc9dd8cb7fcc89c0a2770f644dd4a70d8e86394b12bc56c624e86e7e294974");
  });

  it("maps four authority disk rays without inventing image-plane coordinates", () => {
    const product = createKerrSparsePolarimetricProductV418(
      read("dist/science/kerr-reference-v297/polarization-short-gate.json"),
      read("dist/science/kerr-science-photon-bands-v328/photon-radiance.json"),
      read("dist/science/kerr-polarimeter-nonlinear-observables-v417/nonlinear-observables.json"),
    );
    expect(product.rows.map((row) => [row.rayIndex, row.rayId, row.spinA])).toEqual([
      [12, "disk-00", -0.9],
      [13, "disk-01", 0],
      [14, "disk-02", 0],
      [15, "disk-03", 0.9],
    ]);
    expect(product.rows.map((row) => row.authorityPolarization.walkerPenroseEvpaDeg)).toEqual([
      174.163203570581,
      170.3532162918377,
      167.95332308982285,
      167.3402923264045,
    ]);
    expect(product.rows.every((row) => row.imagePlane.alpha === null && row.imagePlane.beta === null)).toBe(true);
    expect(product.products.fitsImage).toBe("unavailable-dense-and-screen-coordinate-boundary");
    expect(product.products.fitsBinaryTable).toContain("not-image-HDU");
  });

  it("keeps authority EVPA separate from instrument fixture uncertainty", () => {
    const product = createKerrSparsePolarimetricProductV418(
      read("dist/science/kerr-reference-v297/polarization-short-gate.json"),
      read("dist/science/kerr-science-photon-bands-v328/photon-radiance.json"),
      read("dist/science/kerr-polarimeter-nonlinear-observables-v417/nonlinear-observables.json"),
    );
    for (const row of product.rows) {
      expect(row.instrumentFixture.fixtureEvpaDeg).toBeCloseTo(-16.002691604041747, 12);
      expect(row.authorityPolarization.walkerPenroseEvpaDeg).toBeGreaterThan(160);
      expect(row.instrumentFixture.authorityEvpaReplacementAllowed).toBe(false);
      expect(row.instrumentFixture.counting.standardizedSemiMajorSigma).toBeGreaterThan(
        row.instrumentFixture.counting.standardizedSemiMinorSigma,
      );
      expect(row.instrumentFixture.calibration.marginalSigmaEvpaDeg).toBeGreaterThan(0);
    }
  });

  it("parses the sealed artifact and emits bounded summary and CSV", () => {
    const artifact = parseKerrSparsePolarimetricArtifactV418(
      read("dist/science/kerr-sparse-polarimetric-product-v418/diagnostic-product.json"),
    );
    expect(canonicalShaV418(artifact)).toBe(artifact.artifactSha256);
    const summary = createKerrSparsePolarimetricSummaryV418(artifact);
    expect(summary.rows).toHaveLength(4);
    expect(summary).not.toHaveProperty("view");
    expect(JSON.stringify(summary)).not.toContain("countingObservableCovariance");
    const csv = serializeKerrSparsePolarimetricCsvV418(artifact.view);
    expect(csv.split("\n")).toHaveLength(6);
    expect(csv).toContain("image_plane_status");
    expect(csv).toContain("disk-03");
  });
});
