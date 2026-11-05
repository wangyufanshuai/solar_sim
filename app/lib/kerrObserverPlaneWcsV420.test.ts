import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalShaV420,
  createKerrObserverPlaneWcsSummaryV420,
  createKerrObserverPlaneWcsViewV420,
  parseKerrObserverPlaneWcsArtifactV420,
  serializeKerrObserverPlaneWcsCsvV420,
} from "./kerrObserverPlaneWcsV420";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("v420 observer-plane WCS", () => {
  it("derives a 384-square linear WCS from the complete 41-square uniform-field support", () => {
    const view = createKerrObserverPlaneWcsViewV420(
      read("dist/science/kerr-campaign-v314/ray-plan.json"),
      read("dist/science/kerr-screen-coordinate-provenance-v419/screen-coordinate-provenance.json"),
      read("dist/science/kerr-observer-plane-WCS-v420/python-wcs-oracle.json"),
    );
    expect(view.worldSupport).toEqual({ sourceStratum: "uniform-field", sourceRayCount: 1681, alphaSampleCount: 41, betaSampleCount: 41, alphaMinM: -22, alphaMaxM: 22, betaMinM: -16, betaMaxM: 16 });
    expect(view.wcs).toMatchObject({ width: 384, height: 384, crpix1: 192.5, crpix2: 192.5, ctype1: "LINEAR", ctype2: "LINEAR" });
    expect(view.catalog.rows.map((row) => [row.rayId, row.continuousPixelX, row.continuousPixelY])).toEqual([
      ["disk-00", 122.68181818181817, 300.5],
      ["disk-01", 166.3181818181818, 300.5],
      ["disk-02", 218.6818181818182, 300.5],
      ["disk-03", 262.3181818181818, 300.5],
    ]);
    expect(view.maxima.pythonAstropyPixelDifference).toBe(0);
    expect(view.maxima.tsWorldPixelWorldRoundtripResidualM).toBeLessThan(1e-12);
  });

  it("publishes source coordinates without intensity, Stokes, interpolation or raster claims", () => {
    const artifact = parseKerrObserverPlaneWcsArtifactV420(read("dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS.json"));
    expect(canonicalShaV420(artifact)).toBe(artifact.artifactSha256);
    expect(artifact.view.catalog.rows.every((row) => row.intensity === null && row.stokes === null && !row.interpolationAllowed)).toBe(true);
    expect(artifact.view.products.fitsImage).toBe("unavailable-no-raster-science-values");
    expect(artifact.view.products.polarimetricRaster).toBe("unavailable-dense-campaign-incomplete-0-of-49");
    const summary = createKerrObserverPlaneWcsSummaryV420(artifact);
    expect(summary.rows).toHaveLength(4);
    expect(summary).not.toHaveProperty("view");
    const csv = serializeKerrObserverPlaneWcsCsvV420(artifact.view);
    expect(csv).toContain("continuous_pixel_x_fits1");
    expect(csv).toContain(",false\n");
  });
});
