import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseKerrScienceBandObservationArtifactV350 } from "./kerrScienceBandObservationV350";

describe("v350 read-only band observation layer", () => {
  it("keeps units, applicability and provenance explicit", () => {
    const artifact = parseKerrScienceBandObservationArtifactV350(JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-band-observation-v350/observation.json"), "utf8")));
    expect(artifact).toMatchObject({ version: "v350-kerr-science-band-observation-v1", status: "qualified-read-only-band-observation-provenance", counts: { bandCount: 3, rayCount: 4, rowCount: 12 }, availability: { measuredDetectorCounts: "unavailable-synthetic-model-only", celestialWcs: "unavailable-sparse-index-grid", solidAngleIntegratedFlux: "unavailable-no-celestial-wcs", spectralTemperature: "unavailable-no-physical-fit" }, units: { energyRadiance: "W m^-2 sr^-1", photonRadiance: "photons s^-1 m^-2 sr^-1", syntheticExpectation: "photons pixel^-1 exposure^-1" }, denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run" });
    expect(artifact.rows.every((row) => row.measuredCountsAvailable === false && row.celestialWcs === "unavailable" && /^[a-f0-9]{64}$/.test(row.provenance.bandContrastArtifactSha256))).toBe(true);
  });
});
