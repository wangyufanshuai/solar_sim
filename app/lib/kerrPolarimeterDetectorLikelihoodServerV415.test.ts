import { describe, expect, it } from "vitest";

import {
  loadKerrPolarimeterDetectorLikelihoodArtifactV415,
  resetKerrPolarimeterDetectorLikelihoodServerV415CacheForTests,
} from "./kerrPolarimeterDetectorLikelihoodServerV415";

describe("v415 detector likelihood server", () => {
  it("single-flights the full fixture and emits a bounded summary", async () => {
    resetKerrPolarimeterDetectorLikelihoodServerV415CacheForTests();
    const first = await loadKerrPolarimeterDetectorLikelihoodArtifactV415();
    const second = await loadKerrPolarimeterDetectorLikelihoodArtifactV415();
    expect(second).toBe(first);
    expect(first.artifact.view.rays.flatMap((ray) => ray.rows)).toHaveLength(16);
    expect(first.summary).not.toHaveProperty("rays");
    expect(first.summary).not.toHaveProperty("view");
  });
});
