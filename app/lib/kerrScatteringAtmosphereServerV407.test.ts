import { describe, expect, it } from "vitest";
import { loadKerrScatteringAtmosphereArtifactV407, resetKerrScatteringAtmosphereServerV407CacheForTests } from "./kerrScatteringAtmosphereServerV407";

describe("v407 scattering atmosphere server", () => {
  it("single-flights a SHA-checked artifact and emits a bounded four-ray summary", async () => {
    resetKerrScatteringAtmosphereServerV407CacheForTests();
    const first = await loadKerrScatteringAtmosphereArtifactV407();
    const second = await loadKerrScatteringAtmosphereArtifactV407();
    expect(second).toBe(first);
    expect(first.artifact.view.samples).toHaveLength(24);
    expect(first.summary.referenceRays).toHaveLength(4);
    expect(first.summary).not.toHaveProperty("samples");
    expect(first.summary.angleAudit).not.toHaveProperty("records");
    expect(first.summary.boundary).toBe("summary-only-no-angle-execution-or-full-sample-arrays-in-react-state");
  });
});
