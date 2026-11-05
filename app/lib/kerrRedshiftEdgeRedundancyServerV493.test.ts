import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { loadKerrRedshiftEdgeRedundancyV493, resetKerrRedshiftEdgeRedundancyServerCacheForTestsV493 } from "./kerrRedshiftEdgeRedundancyServerV493";

afterEach(() => resetKerrRedshiftEdgeRedundancyServerCacheForTestsV493());

describe("v493 edge redundancy server", () => {
  it("single-flights bounded JSON and SVG", async () => {
    const [first, second] = await Promise.all([loadKerrRedshiftEdgeRedundancyV493(), loadKerrRedshiftEdgeRedundancyV493()]);
    expect(first).toBe(second);
    expect(first.summary.deletionCases).toHaveLength(6);
    expect(first.artifactExport.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(createHash("sha256").update(first.svg.bytes).digest("hex")).toBe(first.artifact.vectorDiagnostic.fileSha256);
  });
});
