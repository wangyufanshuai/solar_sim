import { describe, expect, it } from "vitest";
import {
  loadKerrGridAxisInfluenceV533,
  resetKerrGridAxisInfluenceServerCacheForTestsV533,
} from "./kerrGridAxisInfluenceServerV533";

describe("v533 grid-axis influence server", () => {
  it("uses the bounded mtime + size + SHA fingerprint cache", async () => {
    resetKerrGridAxisInfluenceServerCacheForTestsV533();
    const first = await loadKerrGridAxisInfluenceV533();
    const second = await loadKerrGridAxisInfluenceV533();
    expect(first).toBe(second);
    expect(first.summary.displayGeometry.scientificGeometryInputCount).toBe(46);
    expect(first.summary.stochasticInfluence.singleDominantAxis).toBe("cost-ratio");
  });
});
