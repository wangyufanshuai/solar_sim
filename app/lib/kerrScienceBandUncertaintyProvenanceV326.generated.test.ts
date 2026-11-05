import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  KERR_SCIENCE_BAND_UNCERTAINTY_PROVENANCE_ARTIFACT_SHA256_V326,
  parseKerrScienceBandUncertaintyProvenanceV326,
} from "./kerrScienceBandUncertaintyProvenanceV326";

describe("v326 generated uncertainty provenance", () => {
  it("locks the canonical twelve-row reference artifact", () => {
    const artifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-science-band-uncertainty-v326/provenance-reference.json"), "utf8"));
    expect(artifact.artifactSha256).toBe(KERR_SCIENCE_BAND_UNCERTAINTY_PROVENANCE_ARTIFACT_SHA256_V326);
    expect(parseKerrScienceBandUncertaintyProvenanceV326(artifact.provenance).rows).toHaveLength(12);
    expect(artifact.provenance.source.denseAggregateSha256).toBeNull();
  });
});
