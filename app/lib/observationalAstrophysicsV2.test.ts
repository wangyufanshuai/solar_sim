import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  OBSERVATIONAL_ASTROPHYSICS_LAB_V2_VERSION,
  createRadialVelocitySamples,
  createTransitModelSamples,
  type ObservationValue,
  type RadialVelocityModelDocumentV2,
  type TransitModelDocumentV2,
} from "./observationalAstrophysics";

type Fixture = {
  transit: { document: Record<string, number | number[]>; samples: { phase: number; value: number }[]; rmsThresholdPpm: number };
  radialVelocity: { document: Record<string, number>; samples: { phase: number; value: number }[]; rmsThresholdMS: number };
};

const observed = (field: string, value: number, unit = ""): ObservationValue<number> => ({
  value, kind: "reported", source: "fixture", field, unit,
  uncertaintyLower: null, uncertaintyUpper: null, reference: null, note: null,
});
const displayTuple = (value: readonly [number, number]): ObservationValue<readonly [number, number]> => ({
  value, kind: "display-only", source: "fixture", field: "limb_darkening", unit: "coefficient",
  uncertaintyLower: null, uncertaintyUpper: null, reference: null, note: null,
});
const rms = (left: readonly number[], right: readonly number[]) => Math.sqrt(left.reduce((sum, value, index) => sum + (value - right[index]) ** 2, 0) / left.length);

describe("v149 independent observation fixtures", () => {
  it("matches batman transit and independent Keplerian RV references", () => {
    const fixture = JSON.parse(readFileSync("public/data/observation-fixtures-v2.json", "utf8")) as Fixture;
    const transitInput = fixture.transit.document;
    const transit: TransitModelDocumentV2 = {
      version: OBSERVATIONAL_ASTROPHYSICS_LAB_V2_VERSION,
      systemId: "hd-209458", planetId: "hd-209458-b",
      periodDays: observed("pl_orbper", transitInput.periodDays as number, "day"),
      radiusRatio: observed("pl_ratror", transitInput.radiusRatio as number),
      scaledSemiMajorAxis: observed("pl_ratdor", transitInput.scaledSemiMajorAxis as number),
      inclinationDeg: observed("pl_orbincl", transitInput.inclinationDeg as number, "deg"),
      eccentricity: observed("pl_orbeccen", transitInput.eccentricity as number),
      argumentOfPeriastronDeg: observed("pl_orblper", transitInput.argumentOfPeriastronDeg as number, "deg"),
      transitMidpointBjd: observed("pl_tranmid", 0, "BJD"),
      limbDarkening: displayTuple(transitInput.limbDarkening as unknown as readonly [number, number]),
      sampleCount: transitInput.sampleCount as number,
      boundary: "worker-display-model-never-writes-solar-nbody",
    };
    const transitSamples = createTransitModelSamples(transit);
    const transitRmsPpm = rms(transitSamples.map((sample) => sample.value), fixture.transit.samples.map((sample) => sample.value)) * 1e6;
    expect(transitRmsPpm).toBeLessThan(fixture.transit.rmsThresholdPpm);

    const rvInput = fixture.radialVelocity.document;
    const rv: RadialVelocityModelDocumentV2 = {
      version: OBSERVATIONAL_ASTROPHYSICS_LAB_V2_VERSION,
      systemId: "51-peg", planetId: "51-peg-b",
      periodDays: observed("pl_orbper", rvInput.periodDays, "day"),
      semiAmplitudeMS: observed("pl_rvamp", rvInput.semiAmplitudeMS, "m/s"),
      eccentricity: observed("pl_orbeccen", rvInput.eccentricity),
      argumentOfPeriastronDeg: observed("pl_orblper", rvInput.argumentOfPeriastronDeg, "deg"),
      systemicVelocityMS: observed("systemic_velocity", rvInput.systemicVelocityMS, "m/s"),
      sampleCount: rvInput.sampleCount,
      boundary: "keplerian-display-model-never-writes-solar-nbody",
    };
    const rvSamples = createRadialVelocitySamples(rv);
    expect(rms(rvSamples.map((sample) => sample.value), fixture.radialVelocity.samples.map((sample) => sample.value))).toBeLessThan(fixture.radialVelocity.rmsThresholdMS);
  });
});
