import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrObservationSummaryV587,
  parseKerrObservationSummaryV587,
} from "./kerrObservationV587";

function loadSummary(): Record<string, unknown> {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), "public/data/kerr-observation-v587/observation-summary.json"), "utf8"),
  ) as Record<string, unknown>;
}

describe("v587 observation web contract", () => {
  it("accepts the Python-produced summary and preserves the authority boundary", () => {
    const summary = parseKerrObservationSummaryV587(loadSummary());
    expect(summary.version).toBe("ObservationSummaryV3");
    expect(summary.fields).toHaveLength(10);
    expect(summary.status).toBe("qualified-cpu-float64-kerr-observation-reference");
    expect(summary.counts.unresolvedCellCount).toBe(0);
    expect(summary.counts.projectionMaskedCellCount).toBeGreaterThan(0);
    expect(summary.authority.geometryReferenceGranted).toBe(true);
    expect(summary.authority.polarizationTransportReferenceGranted).toBe(true);
    expect(summary.benchmarks.kerrSchildOracle).toMatchObject({
      requiredRayCount: 64,
      requestedRayCount: 64,
      executedRayCount: 64,
      classificationAgreement: true,
      parallelTransportQualified: true,
      qualified: true,
    });
    expect(summary.benchmarks.kerrSchildOracle.selection.stratificationQualified).toBe(true);
    expect(summary.benchmarks.kerrSchildOracle.maxWalkerPenroseRelativeDrift).toBeLessThanOrEqual(1e-8);
    expect(summary.authority.radiativeTransferGranted).toBe(false);
    expect(summary.authority.measuredAuthorityGranted).toBe(false);
    expect(summary.authority.gpuAuthorityGranted).toBe(false);
    expect(summary.authority.sciencePayloadMutationAllowed).toBe(false);
  });

  it("uses a stable cross-language canonical serialization", () => {
    const source = loadSummary();
    const parsed = parseKerrObservationSummaryV587(source);
    const reordered = JSON.parse(JSON.stringify(source)) as Record<string, unknown>;
    const canonical = canonicalKerrObservationSummaryV587(source);
    expect(canonicalKerrObservationSummaryV587(reordered)).toBe(canonical);
    expect(parsed.summarySha256).toBe(source.summarySha256);
    expect(parsed.summarySha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects a summary signature mutation before the scene can mount", () => {
    const mutated = { ...loadSummary(), summarySha256: "0".repeat(64) };
    expect(() => parseKerrObservationSummaryV587(mutated)).toThrow("v587-summary-sha");
  });

  it("rejects an unresolved promotion before accepting its summary signature", () => {
    const source = loadSummary();
    const counts = source.counts as Record<string, unknown>;
    expect(() => parseKerrObservationSummaryV587({
      ...source,
      counts: { ...counts, unresolvedCellCount: 1 },
    })).toThrow("v587-summary-contract");
  });
});
