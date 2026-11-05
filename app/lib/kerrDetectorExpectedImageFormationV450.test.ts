import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalPayloadV450,
  createKerrDetectorExpectedImageSummaryV450,
  formKerrDetectorExpectedImageFixtureV450,
  parseKerrDetectorExpectedImageArtifactV450,
} from "./kerrDetectorExpectedImageFormationV450";

const artifact = JSON.parse(
  readFileSync(
    "dist/science/kerr-detector-image-formation-v450/image-formation-qualification.json",
    "utf8",
  ),
);

describe("v450 expected-electron image formation", () => {
  it("conserves one source across exactly four in-bounds pixels", () => {
    const row = formKerrDetectorExpectedImageFixtureV450({
      sourceKind: "test-fixture",
      fixtureId: "unit-ray-12",
      rayId: "disk-00",
      rayIndex: 12,
      width: 384,
      height: 384,
      pixelConvention: "FITS-one-based-continuous-pixel-centers",
      continuousPixelX: 122.68181818181817,
      continuousPixelY: 300.5,
      sourceExpectedElectrons: 1_000,
    });
    expect(row.deposits).toHaveLength(4);
    expect(row.deposits.map(({ pixelX, pixelY }) => [pixelX, pixelY])).toEqual([
      [122, 300],
      [123, 300],
      [122, 301],
      [123, 301],
    ]);
    expect(row.depositWeightSum).toBe(1);
    expect(row.depositElectronSum).toBe(1_000);
    expect(row.scienceRasterAuthority).toBe(false);
  });

  it("rejects a coordinate whose four-pixel footprint crosses the frame", () => {
    expect(() =>
      formKerrDetectorExpectedImageFixtureV450({
        sourceKind: "test-fixture",
        fixtureId: "edge",
        rayId: "disk-edge",
        rayIndex: 12,
        width: 384,
        height: 384,
        pixelConvention: "FITS-one-based-continuous-pixel-centers",
        continuousPixelX: 384,
        continuousPixelY: 2,
        sourceExpectedElectrons: 1,
      }),
    ).toThrow("v450-image-formation-input-boundary");
  });

  it("parses the qualified sparse fixture without granting raster authority", () => {
    const parsed = parseKerrDetectorExpectedImageArtifactV450(artifact);
    const summary = createKerrDetectorExpectedImageSummaryV450(parsed);
    expect(summary.counts).toMatchObject({
      sourceRowCount: 4,
      sparseDepositRowCount: 16,
      scienceRasterRows: 0,
      observedImageRows: 0,
    });
    expect(summary.qualification).toMatchObject({
      expectedElectronFormationFixtureQualified: true,
      detectorProjectionAuthority: false,
      psfAuthority: false,
      pixelResponseAuthority: false,
      scienceRasterAuthority: false,
    });
    expect(summary.boundary.fullRasterMaterialized).toBe(false);
  });

  it("rejects a forged detector authority and preserves canonical SHA", () => {
    expect(() =>
      parseKerrDetectorExpectedImageArtifactV450({
        ...artifact,
        qualification: {
          ...artifact.qualification,
          detectorProjectionAuthority: true,
        },
      }),
    ).toThrow("v450-image-formation-artifact-identity");
    expect(
      createHash("sha256").update(canonicalPayloadV450(artifact)).digest("hex"),
    ).toBe(artifact.artifactSha256);
  });
});
