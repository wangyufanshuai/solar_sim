import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalKerrObservableProvenancePayloadV471,
  createKerrObservableProvenanceSummaryV471,
  parseKerrObservableProvenanceArtifactV471,
} from "./kerrObservableProvenanceV471";

const input = JSON.parse(
  readFileSync("dist/science/kerr-observable-provenance-v471/observable-matrix.json", "utf8"),
);

describe("v471 Kerr observable provenance", () => {
  it("parses the canonical 13-row, 11-source matrix", () => {
    const artifact = parseKerrObservableProvenanceArtifactV471(input);
    const sha = createHash("sha256")
      .update(canonicalKerrObservableProvenancePayloadV471(artifact))
      .digest("hex");

    expect(sha).toBe(artifact.artifactSha256);
    expect(artifact.rows).toHaveLength(13);
    expect(artifact.sources).toHaveLength(11);
    expect(Object.isFrozen(artifact)).toBe(true);
  });

  it("separates sparse, coordinate, analytic and unavailable observables", () => {
    const artifact = parseKerrObservableProvenanceArtifactV471(input);

    expect(artifact.summary).toEqual({
      availableRowCount: 9,
      unavailableRowCount: 4,
      shortAuthorityRowCount: 4,
      coordinateAuthorityRowCount: 3,
      analyticFixtureRowCount: 2,
      productionAuthorityGrantedRowCount: 0,
      sciencePixelRows: 0,
      stokesMeasurementRows: 0,
      fitsImageRows: 0,
    });
    expect(artifact.rows.every((row) => !row.productionAuthorityGranted)).toBe(true);
    expect(artifact.rows.find((row) => row.id === "orientation-basis")).toMatchObject({
      available: true,
      semantics: "q-hat-cos-2chi-u-hat-sin-2chi-not-Stokes-measurement",
    });
    expect(artifact.rows.find((row) => row.id === "stokes-iquv")).toMatchObject({
      available: false,
      recordCount: 0,
      unavailableReason: "no-I-Q-U-V-measurements",
    });
  });

  it("keeps the bounded summary free of execution and raster arrays", () => {
    const summary = createKerrObservableProvenanceSummaryV471(input);
    const serialized = JSON.stringify(summary);

    expect(new TextEncoder().encode(serialized).byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(serialized).not.toMatch(/"(?:executions|payloads|pixels|rasterValues|trajectories)"\s*:/);
  });
});
