import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseKerrScatteringCorrectedArtifactV409, parseKerrScatteringCorrectedViewV409 } from "./kerrScatteringCorrectedV409";

const read = () => JSON.parse(readFileSync("dist/science/kerr-scattering-corrected-v409/sparse-stokes.json", "utf8"));
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

describe("v409 corrected sparse Stokes science payload", () => {
  it("replaces only the four-ray polarization fraction and preserves intensity, redshift and EVPA", () => {
    const artifact = read();
    expect(parseKerrScatteringCorrectedArtifactV409(artifact)).toBe(artifact);
    expect(parseKerrScatteringCorrectedViewV409(artifact.view)).toBe(artifact.view);
    expect(artifact.view.samples).toHaveLength(24);
    expect(new Set(artifact.view.samples.map((sample: { rayId: string }) => sample.rayId))).toEqual(new Set(["disk-00", "disk-01", "disk-02", "disk-03"]));
    expect(artifact.view.samples.every((sample: { sourceFractions: { v408DiscreteOrdinates: number; v407Approximation: number; multiplicativeCorrection: number }; observedStokes: { linearFraction: number }; emittedStokes: { linearFraction: number }; residuals: { intensityDifferenceFromV407: number } }) => sample.sourceFractions.v408DiscreteOrdinates > sample.sourceFractions.v407Approximation && sample.sourceFractions.multiplicativeCorrection > 1 && Math.abs(sample.observedStokes.linearFraction - sample.sourceFractions.v408DiscreteOrdinates) < 1e-12 && Math.abs(sample.emittedStokes.linearFraction - sample.sourceFractions.v408DiscreteOrdinates) < 1e-12 && sample.residuals.intensityDifferenceFromV407 === 0)).toBe(true);
  });

  it("propagates the v408 numerical envelope linearly without RSS", () => {
    const artifact = read();
    expect(artifact.view.samples.every((sample: { numericalUncertainty: { combination: string; polarizationFractionAbsolute: number; observedLinearAmplitudeAbsolute: number }; observedStokes: { i: number } }) => sample.numericalUncertainty.combination === "linear-no-rss-no-independence-claim" && sample.numericalUncertainty.polarizationFractionAbsolute > 0 && Math.abs(sample.numericalUncertainty.observedLinearAmplitudeAbsolute - sample.observedStokes.i * sample.numericalUncertainty.polarizationFractionAbsolute) < 1e-15)).toBe(true);
    expect(artifact.view.maxima.numericalPolarizationFractionAbsolute).toBe(6.863626880876383e-6);
  });

  it("keeps WP/PT comparisons, deterministic canonical SHA and sparse-only boundaries", () => {
    const artifact = read();
    expect(artifact.view.pathComparisons).toHaveLength(12);
    expect(artifact.view.maxima.pathEvpaDifferenceDeg).toBeLessThan(0.5);
    expect(artifact.view.maxima.normalizedStokesQuDifference).toBeLessThan(1e-10);
    expect(artifact.view.model).toMatchObject({ interpolationApplied: false, exactHFunctionTableAuthority: false, endpointMuZeroOrOneQualified: false, denseImageAuthority: false });
    expect(artifact.view.counts.curveSampleCountConsumedByPayload).toBe(0);
    expect(artifact.v407HistoricalArtifactMutated).toBe(false);
    expect(sha(artifact)).toBe(artifact.artifactSha256);
  });

  it("fails closed if sparse correction is promoted to dense authority", () => {
    const artifact = read();
    expect(() => parseKerrScatteringCorrectedViewV409({ ...artifact.view, model: { ...artifact.view.model, denseImageAuthority: true } })).toThrow("v409-corrected-view-identity");
  });
});
