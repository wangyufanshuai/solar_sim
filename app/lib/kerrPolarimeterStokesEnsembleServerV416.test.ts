import { describe, expect, it } from "vitest";

import {
  loadKerrPolarimeterStokesEnsembleArtifactV416,
  resetKerrPolarimeterStokesEnsembleServerV416CacheForTests,
} from "./kerrPolarimeterStokesEnsembleServerV416";

describe("v416 Stokes ensemble server", () => {
  it("single-flights the full ensemble artifact and emits a bounded summary", async () => {
    resetKerrPolarimeterStokesEnsembleServerV416CacheForTests();
    const first = await loadKerrPolarimeterStokesEnsembleArtifactV416();
    const second = await loadKerrPolarimeterStokesEnsembleArtifactV416();
    expect(second).toBe(first);
    expect(first.artifact.view.rays).toHaveLength(4);
    expect(first.summary).not.toHaveProperty("rays");
    expect(first.summary).not.toHaveProperty("view");
  });
});
