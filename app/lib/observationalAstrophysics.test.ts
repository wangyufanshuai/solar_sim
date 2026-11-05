import { describe, expect, it } from "vitest";
import { createRadialVelocitySamples, createTransitModelSamples, OBSERVATIONAL_ASTROPHYSICS_LAB_VERSION, type RadialVelocityModelDocument, type TransitModelDocument } from "./observationalAstrophysics";

describe("v144 observational astrophysics models", () => {
  it("produces a normalized transit with a measurable central depth", () => {
    const document: TransitModelDocument = { version: OBSERVATIONAL_ASTROPHYSICS_LAB_VERSION, systemId: "test", planetId: "test-b", periodDays: 3, radiusRatio: 0.1, scaledSemiMajorAxis: 8, inclinationDeg: 90, eccentricity: 0, argumentOfPeriastronDeg: 90, limbDarkening: [0.3, 0.2], sampleCount: 201, provenance: [], assumptions: [], boundary: "worker-display-model-never-writes-solar-nbody" };
    const samples = createTransitModelSamples(document);
    expect(Math.min(...samples.map((sample) => sample.value))).toBeLessThan(0.99);
    expect(samples[0]!.value).toBeCloseTo(1, 8);
  });
  it("produces the requested circular Keplerian RV amplitude", () => {
    const document: RadialVelocityModelDocument = { version: OBSERVATIONAL_ASTROPHYSICS_LAB_VERSION, systemId: "test", planetId: "test-b", periodDays: 4, semiAmplitudeMS: 50, eccentricity: 0, argumentOfPeriastronDeg: 0, systemicVelocityMS: 0, sampleCount: 200, provenance: [], assumptions: [], boundary: "keplerian-display-model-never-writes-solar-nbody" };
    const values = createRadialVelocitySamples(document).map((sample) => sample.value);
    expect(Math.max(...values)).toBeCloseTo(50, 1);
    expect(Math.min(...values)).toBeCloseTo(-50, 1);
  });
});
