import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { KERR_SCIENCE_PHOTON_BANDS_ARTIFACT_SHA256_V328, parseKerrSciencePhotonBandViewV328 } from "./kerrSciencePhotonBandsV328";

describe("v328 generated photon-band artifact", () => {
  it("locks the fixed 512/256 photon-radiance product", () => {
    const artifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-science-photon-bands-v328/photon-radiance.json"), "utf8"));
    expect(artifact.artifactSha256).toBe(KERR_SCIENCE_PHOTON_BANDS_ARTIFACT_SHA256_V328);
    const view = parseKerrSciencePhotonBandViewV328(artifact.view);
    expect(view.counts.bandMeasurementCount).toBe(12);
    expect(view.source.denseAggregateSha256).toBeNull();
    expect(view.maxima.photonQuadratureRelativeDifference).toBeLessThan(2e-6);
  });
});
