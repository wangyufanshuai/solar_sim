import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  KERR_SCATTERING_ORACLE_PYTHON_SHA256_V408,
  createKerrScatteringOracleViewV408,
  createKerrScatteringOracleSummaryV408,
  parseKerrScatteringOracleArtifactV408,
  parseKerrScatteringOraclePythonResultV408,
  parseKerrScatteringOracleViewV408,
} from "./kerrScatteringOracleV408";

const raw = () => JSON.parse(readFileSync("dist/science/kerr-scattering-oracle-v408/numerical-oracle.json", "utf8"));
const portable = () => JSON.parse(readFileSync("dist/science/kerr-scattering-oracle-v408/portable-envelope.json", "utf8"));
const transient = new Set(["generatedAt", "artifactSha256", "observedPeakRssGiB"]);
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

describe("v408 independent polarized-scattering numerical oracle", () => {
  it("locks the Python authority and creates a transient-free portable view", () => {
    const source = raw();
    expect(parseKerrScatteringOraclePythonResultV408(source)).toBe(source);
    expect(source.evidenceSha256).toBe(KERR_SCATTERING_ORACLE_PYTHON_SHA256_V408);
    const view = createKerrScatteringOracleViewV408(source);
    expect(parseKerrScatteringOracleViewV408(view)).toBe(view);
    expect(view.resource).toEqual({ maximumPeakRssGiB: 2, qualified: true });
    expect(view.resource).not.toHaveProperty("availableMemoryGiBBefore");
    expect(view.resource).not.toHaveProperty("freeDiskGiBBefore");
    expect(view.resource).not.toHaveProperty("peakRssGiB");
  });

  it("preserves the 181-point envelope and measured four-ray underestimation", () => {
    const artifact = portable();
    expect(parseKerrScatteringOracleArtifactV408(artifact)).toBe(artifact);
    expect(artifact.view.curveEnvelope.samples).toHaveLength(181);
    expect(artifact.view.curveEnvelope).toMatchObject({ muDomain: [0.05, 0.95], sampleCount: 181, approximationUnderestimatesAllSamples: false });
    expect(artifact.view.rayComparisons.map((ray: { relativeApproximationError: number }) => ray.relativeApproximationError)).toEqual([
      -0.09018867051606459,
      -0.08355975201699618,
      -0.07426486450796176,
      -0.06770856613204639,
    ]);
    expect(artifact.view.maxima.rayNumericalUncertaintyLinearSumAbsolute).toBe(6.863626880876383e-6);
    expect(artifact.view.maxima.linearSystemResidual).toBeLessThan(1e-10);
    expect(artifact.view.maxima.relativeFluxDrift).toBeLessThan(1e-10);
    expect(artifact.view.maxima.kernelEquilibriumResidual).toBeLessThan(1e-13);
  });

  it("keeps the portable SHA deterministic and excludes the 181-point curve from the React summary", () => {
    const artifact = portable();
    expect(canonicalSha(artifact)).toBe(artifact.artifactSha256);
    const summary = createKerrScatteringOracleSummaryV408(artifact);
    expect(summary.rayComparisons).toHaveLength(4);
    expect(summary.curveEnvelope.sampleCount).toBe(181);
    expect(summary.curveEnvelope).not.toHaveProperty("samples");
    expect(summary.boundary).toBe("summary-only-no-181-point-curve-or-solver-fields-in-react-state");
  });

  it("fails closed on exact-table or endpoint promotion", () => {
    const artifact = portable();
    expect(() => parseKerrScatteringOracleViewV408({ ...artifact.view, authorityBoundary: { ...artifact.view.authorityBoundary, exactChandrasekharHFunctionTableAuthority: true } })).toThrow("v408-oracle-view-identity");
    expect(() => parseKerrScatteringOracleViewV408({ ...artifact.view, authorityBoundary: { ...artifact.view.authorityBoundary, limbEndpointMuZeroQualified: true } })).toThrow("v408-oracle-view-identity");
  });
});
