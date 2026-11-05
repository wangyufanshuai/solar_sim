import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  KERR_STOKES_TRANSFER_ARTIFACT_SHA256_V406,
  evaluateKerrScatteringPolarizationFractionV407,
  parseKerrScatteringAtmosphereArtifactV407,
  parseKerrScatteringAtmosphereViewV407,
} from "./kerrScatteringAtmosphereV407";

const read = () => JSON.parse(readFileSync("dist/science/kerr-scattering-atmosphere-v407/short-gate.json", "utf8"));

describe("v407 sparse Kerr scattering atmosphere", () => {
  it("derives the local emitter-frame angle instead of substituting observer or screen coordinates", () => {
    const artifact = read();
    expect(parseKerrScatteringAtmosphereArtifactV407(artifact)).toBe(artifact);
    expect(parseKerrScatteringAtmosphereViewV407(artifact.view)).toBe(artifact.view);
    expect(artifact.view.authority.v406StokesArtifactSha256).toBe(KERR_STOKES_TRANSFER_ARTIFACT_SHA256_V406);
    expect(artifact.view.angleAudit.records.map((record: { muEmission: number }) => record.muEmission)).toEqual([
      0.6273569159417479,
      0.5842069352688681,
      0.5289571519531152,
      0.4932477840976511,
    ]);
    expect(artifact.view.angleAudit.maxLocalFrameResidual).toBeLessThan(1e-12);
    expect(artifact.view.angleAudit.maxToleranceMuDifference).toBeLessThan(1e-12);
    expect(artifact.view.angleAudit.maxAbCanonicalMuDifference).toBe(0);
    expect(artifact.view.model).toMatchObject({ observerInclinationSubstituted: false, screenBetaSubstituted: false, exactHFunctionTableAccuracy: "not-qualified", historicalV406FixedFraction: 0.12 });
  });

  it("qualifies the closed-form endpoint, range and monotonic boundary without claiming exact tables", () => {
    const artifact = read();
    expect(evaluateKerrScatteringPolarizationFractionV407(0)).toBe(0.1171);
    expect(evaluateKerrScatteringPolarizationFractionV407(1)).toBe(0);
    const curve = Array.from({ length: 4097 }, (_, index) => evaluateKerrScatteringPolarizationFractionV407(index / 4096));
    expect(curve.every((value, index) => Number.isFinite(value) && value >= 0 && value <= 0.1171 && (index === 0 || value <= curve[index - 1]))).toBe(true);
    expect(artifact.view.angleAudit.minimumFraction).toBeCloseTo(0.013438225638717856, 15);
    expect(artifact.view.angleAudit.maximumFraction).toBeCloseTo(0.02144730143132292, 15);
    expect(artifact.view.references.every((reference: { verification: string }) => reference.verification.includes("no-") || reference.verification.includes("metadata-only"))).toBe(true);
    expect(() => evaluateKerrScatteringPolarizationFractionV407(-0.001)).toThrow("v407-mu-domain");
    expect(() => evaluateKerrScatteringPolarizationFractionV407(1.001)).toThrow("v407-mu-domain");
  });

  it("preserves Stokes invariants and independent WP/PT comparison at angle-dependent fractions", () => {
    const artifact = read();
    expect(artifact.view.counts).toMatchObject({ stokesSampleCount: 24, pathComparisonCount: 12, sourceGeometryDiskExecutionCount: 16 });
    expect(artifact.view.samples).toHaveLength(24);
    expect(artifact.view.pathComparisons).toHaveLength(12);
    expect(artifact.view.samples.every((sample: { linearPolarizationFraction: number; observedStokes: { linearFraction: number } }) => Math.abs(sample.linearPolarizationFraction - sample.observedStokes.linearFraction) < 1e-12)).toBe(true);
    expect(artifact.view.maxima).toMatchObject({ abCanonicalDifference: 0 });
    expect(artifact.view.maxima.intensityInvariantRelative).toBeLessThan(1e-12);
    expect(artifact.view.maxima.linearAmplitudeInvariantRelative).toBeLessThan(1e-12);
    expect(artifact.view.maxima.linearFractionAbsolute).toBeLessThan(1e-12);
    expect(artifact.view.maxima.normalizedStokesQuDifference).toBeLessThan(1e-10);
    expect(artifact.view.model).toMatchObject({ circularPolarization: "unavailable-not-modeled", faradayRotation: "unavailable-not-modeled", absorptionOpacity: "unavailable-not-modeled" });
  });

  it("fails closed when the approximation boundary is overstated", () => {
    const artifact = read();
    expect(() => parseKerrScatteringAtmosphereViewV407({ ...artifact.view, model: { ...artifact.view.model, exactHFunctionTableAccuracy: "qualified" } })).toThrow("v407-scattering-view-identity");
  });
});
