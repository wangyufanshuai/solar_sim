import { describe, expect, it } from "vitest";

import {
  loadKerrPolarimeterNonlinearObservablesArtifactV417,
  resetKerrPolarimeterNonlinearObservablesServerV417CacheForTests,
} from "./kerrPolarimeterNonlinearObservablesServerV417";

describe("v417 nonlinear observables server", () => {
  it("single-flights the full nonlinear artifact and emits a bounded summary", async () => {
    resetKerrPolarimeterNonlinearObservablesServerV417CacheForTests();
    const first = await loadKerrPolarimeterNonlinearObservablesArtifactV417();
    const second = await loadKerrPolarimeterNonlinearObservablesArtifactV417();
    expect(second).toBe(first);
    expect(first.artifact.view.rays).toHaveLength(4);
    expect(first.summary).not.toHaveProperty("rays");
    expect(first.summary).not.toHaveProperty("view");
  });
});
