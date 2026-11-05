import { describe, expect, it } from "vitest";
import { loadKerrScatteringOracleArtifactV408, resetKerrScatteringOracleServerV408CacheForTests } from "./kerrScatteringOracleServerV408";

describe("v408 scattering oracle server", () => {
  it("single-flights a canonical artifact and emits a bounded four-ray summary", async () => {
    resetKerrScatteringOracleServerV408CacheForTests();
    const first = await loadKerrScatteringOracleArtifactV408();
    const second = await loadKerrScatteringOracleArtifactV408();
    expect(second).toBe(first);
    expect(first.artifact.view.curveEnvelope.samples).toHaveLength(181);
    expect(first.summary.rayComparisons).toHaveLength(4);
    expect(first.summary.curveEnvelope).not.toHaveProperty("samples");
    expect(first.summary.boundary).toBe("summary-only-no-181-point-curve-or-solver-fields-in-react-state");
  });
});
