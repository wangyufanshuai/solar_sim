import { describe, expect, it } from "vitest";
import { loadOrbitRelativityEngineV561, resetOrbitRelativityEngineServerCacheForTestsV561 } from "./orbitRelativityEngineServerV561";

describe("Orbit Relativity Engine V561 server loader", () => {
  it("loads the imported manifest and shares the in-flight cache", async () => {
    resetOrbitRelativityEngineServerCacheForTestsV561();
    const first = await loadOrbitRelativityEngineV561();
    const second = await loadOrbitRelativityEngineV561();
    expect(first.artifact.sourceEngineVersion).toBe("v1-kerr-reference");
    expect(first.artifact.qualification.measuredAuthority).toBe(false);
    expect(first.exports.summary.fileSha256).toBe(second.exports.summary.fileSha256);
    expect(first.exports.transportSummary.contentType).toContain("application/json");
    expect(first.artifact.boundary.transportStatus).toBe("qualified-cpu-kerr-walker-penrose-independent-parallel-transport");
  });
});
