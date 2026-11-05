import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { loadKerrRedshiftDoubleEdgeIdentifiabilityV495, resetKerrRedshiftDoubleEdgeIdentifiabilityServerCacheForTestsV495 } from "./kerrRedshiftDoubleEdgeIdentifiabilityServerV495";
afterEach(() => resetKerrRedshiftDoubleEdgeIdentifiabilityServerCacheForTestsV495());
describe("v495 double-edge server", () => { it("single-flights bounded JSON and SVG", async () => { const [first, second] = await Promise.all([loadKerrRedshiftDoubleEdgeIdentifiabilityV495(), loadKerrRedshiftDoubleEdgeIdentifiabilityV495()]); expect(first).toBe(second); expect(first.summary.deletionCases).toHaveLength(15); expect(first.artifactExport.bytes.byteLength).toBeLessThanOrEqual(128 * 1024); expect(createHash("sha256").update(first.svg.bytes).digest("hex")).toBe(first.artifact.vectorDiagnostic.fileSha256); }); });
