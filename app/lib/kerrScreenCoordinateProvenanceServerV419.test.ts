import { describe, expect, it } from "vitest";

import { loadKerrScreenCoordinateProvenanceV419, resetKerrScreenCoordinateServerV419CacheForTests } from "./kerrScreenCoordinateProvenanceServerV419";

describe("v419 screen-coordinate server", () => {
  it("single-flights four SHA-verified coordinate exports", async () => {
    resetKerrScreenCoordinateServerV419CacheForTests();
    const first = await loadKerrScreenCoordinateProvenanceV419();
    const second = await loadKerrScreenCoordinateProvenanceV419();
    expect(second).toBe(first);
    expect(first.summary.rows).toHaveLength(4);
    expect(first.exports.fits.semantic).toBe("binary-table-not-image-HDU");
    expect(first.exports.png.semantic).toBe("sparse-quiver-diagnostic-not-science-image-map");
  });
});
