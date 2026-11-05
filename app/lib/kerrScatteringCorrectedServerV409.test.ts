import { describe, expect, it } from "vitest";
import { loadKerrScatteringCorrectedArtifactV409, resetKerrScatteringCorrectedServerV409CacheForTests } from "./kerrScatteringCorrectedServerV409";

describe("v409 corrected scattering server", () => {
  it("single-flights a canonical 24-sample artifact and emits only four ray corrections", async () => {
    resetKerrScatteringCorrectedServerV409CacheForTests();
    const first = await loadKerrScatteringCorrectedArtifactV409();
    const second = await loadKerrScatteringCorrectedArtifactV409();
    expect(second).toBe(first);
    expect(first.artifact.view.samples).toHaveLength(24);
    expect(first.summary.rayCorrections).toHaveLength(4);
    expect(first.summary).not.toHaveProperty("samples");
    expect(first.summary).not.toHaveProperty("pathComparisons");
  });
});
