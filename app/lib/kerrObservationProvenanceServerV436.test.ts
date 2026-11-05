import { afterEach, describe, expect, it } from "vitest";
import { loadKerrObservationProvenanceV436, resetKerrObservationProvenanceServerCacheForTestsV436 } from "./kerrObservationProvenanceServerV436";

afterEach(() => resetKerrObservationProvenanceServerCacheForTestsV436());
describe("v436 bounded evidence server", () => {
  it("single-flights and exposes only small whitelisted exports", async () => {
    const [loaded, second] = await Promise.all([loadKerrObservationProvenanceV436(), loadKerrObservationProvenanceV436()]);
    expect(second.summary.artifactSha256).toBe(loaded.summary.artifactSha256);
    expect(loaded.summary.payloads).toHaveLength(4);
    expect(Object.keys(loaded.exports).sort()).toEqual(["contract", "oracle"]);
    expect(loaded.exports.oracle.bytes.byteLength).toBeLessThan(128 * 1024);
  });
});
