import { afterEach, describe, expect, it } from "vitest";
import { loadKerrDetectorResponseV465, resetKerrDetectorResponseServerCacheForTestsV465 } from "./kerrDetectorResponseServerV465";
afterEach(() => resetKerrDetectorResponseServerCacheForTestsV465());
describe("v465 response server", () => { it("single-flights the bounded contract", async () => { const [left, right] = await Promise.all([loadKerrDetectorResponseV465(), loadKerrDetectorResponseV465()]); expect(left.artifact.artifactSha256).toBe(right.artifact.artifactSha256); expect(left.summary.validationFixture.scientificPixelRows).toBe(0); expect(left.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024); }); });
