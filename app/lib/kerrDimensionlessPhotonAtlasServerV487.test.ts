import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadKerrDimensionlessPhotonAtlasV487,
  resetKerrDimensionlessPhotonAtlasServerCacheForTestsV487,
} from "./kerrDimensionlessPhotonAtlasServerV487";

afterEach(() => resetKerrDimensionlessPhotonAtlasServerCacheForTestsV487());

describe("v487 dimensionless photon atlas server", () => {
  it("single-flights bounded JSON and deterministic SVG artifacts", async () => {
    const [first, second] = await Promise.all([
      loadKerrDimensionlessPhotonAtlasV487(),
      loadKerrDimensionlessPhotonAtlasV487(),
    ]);
    expect(first).toBe(second);
    expect(first.summary.rays.flatMap((ray) => ray.landmarks)).toHaveLength(20);
    expect(first.artifactExport.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(first.svg.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(createHash("sha256").update(first.svg.bytes).digest("hex")).toBe(
      first.artifact.vectorDiagnostic.fileSha256,
    );
  });
});
