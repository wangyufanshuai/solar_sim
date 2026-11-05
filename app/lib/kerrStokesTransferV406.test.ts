import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseKerrStokesTransferArtifactV406, parseKerrStokesTransferViewV406 } from "./kerrStokesTransferV406";

const read = () => JSON.parse(readFileSync("dist/science/kerr-stokes-transfer-v406/short-gate.json", "utf8"));
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

describe("v406 sparse Kerr Stokes transfer", () => {
  it("qualifies 4 disk rays across 3 bands and two independent polarization transports", () => {
    const artifact = read();
    expect(parseKerrStokesTransferArtifactV406(artifact)).toBe(artifact);
    expect(parseKerrStokesTransferViewV406(artifact.view)).toBe(artifact.view);
    expect(artifact.view.counts).toEqual({ canonicalRayCount: 16, diskRayCount: 4, unavailableCaptureEscapeRayCount: 12, frequencyCount: 3, transportMethodCount: 2, stokesSampleCount: 24, pathComparisonCount: 12, sourcePolarizationExecutionCount: 16 });
    expect(new Set(artifact.view.samples.map((sample: { observedFrequencyHz: number }) => sample.observedFrequencyHz))).toEqual(new Set([1e16, 1e17, 1e18]));
    expect(new Set(artifact.view.samples.map((sample: { transportMethod: string }) => sample.transportMethod))).toEqual(new Set(["walker-penrose", "independent-ks-parallel-transport"]));
    expect(artifact.view.samples.every((sample: { observedStokes: { i: number; q: number; u: number; linearFraction: number } }) => Number.isFinite(sample.observedStokes.i) && Number.isFinite(sample.observedStokes.q) && Number.isFinite(sample.observedStokes.u) && Math.abs(sample.observedStokes.linearFraction - 0.12) < 1e-12)).toBe(true);
  });

  it("keeps invariant, method, model and dense boundaries explicit", () => {
    const artifact = read();
    expect(artifact.view.maxima).toMatchObject({ abCanonicalDifference: 0 });
    expect(artifact.view.maxima.intensityInvariantRelative).toBeLessThan(1e-12);
    expect(artifact.view.maxima.linearAmplitudeInvariantRelative).toBeLessThan(1e-12);
    expect(artifact.view.maxima.normalizedStokesQuDifference).toBeLessThan(1e-10);
    expect(artifact.view.model).toMatchObject({ circularPolarization: "unavailable-not-modeled", faradayRotation: "unavailable-not-modeled" });
    expect(artifact.view.authority.denseAggregateSha256).toBeNull();
    expect(artifact.denseShardExecuted).toBe(false);
    expect(sha(artifact)).toBe(artifact.artifactSha256);
  });

  it("rejects threshold drift instead of relabeling it", () => {
    const artifact = read();
    expect(() => parseKerrStokesTransferViewV406({ ...artifact.view, maxima: { ...artifact.view.maxima, intensityInvariantRelative: 1e-12 } })).toThrow("v406-stokes-view-identity");
  });
});
