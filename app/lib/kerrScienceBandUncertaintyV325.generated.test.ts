import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseKerrThinDiskBandImagingViewV320 } from "./kerrThinDiskBandImagingV320";
import {
  KERR_SCIENCE_BAND_UNCERTAINTY_ARTIFACT_SHA256_V325,
  createKerrScienceBandUncertaintyViewV325,
  parseKerrScienceBandUncertaintyViewV325,
} from "./kerrScienceBandUncertaintyV325";

describe("v325 generated componentwise envelope", () => {
  it("rebuilds byte-independent canonical measurements from the locked v320 view", () => {
    const artifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-science-band-uncertainty-v325/componentwise-envelope.json"), "utf8"));
    const source = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-thin-disk-v320/fixed-band-imaging.json"), "utf8"));
    expect(artifact.artifactSha256).toBe(KERR_SCIENCE_BAND_UNCERTAINTY_ARTIFACT_SHA256_V325);
    expect(parseKerrScienceBandUncertaintyViewV325(artifact.view)).toEqual(
      createKerrScienceBandUncertaintyViewV325(parseKerrThinDiskBandImagingViewV320(source.view)),
    );
  });
});
