import { afterEach, describe, expect, it } from "vitest";
import { loadKerrMeasuredDetectorProvenanceV464, resetKerrMeasuredDetectorProvenanceServerCacheForTestsV464 } from "./kerrMeasuredDetectorProvenanceServerV464";
afterEach(() => resetKerrMeasuredDetectorProvenanceServerCacheForTestsV464());
describe("v464 provenance server", () => { it("single-flights the bounded observatory artifact", async () => { const [left, right] = await Promise.all([loadKerrMeasuredDetectorProvenanceV464(), loadKerrMeasuredDetectorProvenanceV464()]); expect(left.artifact.artifactSha256).toBe(right.artifact.artifactSha256); expect(left.summary.inventory.readyFileCount).toBe(0); expect(left.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024); }); });
