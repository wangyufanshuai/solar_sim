import { describe, expect, it } from "vitest";

import {
  loadKerrSparsePolarimetricProductV418,
  resetKerrSparsePolarimetricProductServerV418CacheForTests,
} from "./kerrSparsePolarimetricProductServerV418";

describe("v418 sparse polarimetric product server", () => {
  it("single-flights four SHA-verified whitelisted exports", async () => {
    resetKerrSparsePolarimetricProductServerV418CacheForTests();
    const first = await loadKerrSparsePolarimetricProductV418();
    const second = await loadKerrSparsePolarimetricProductV418();
    expect(second).toBe(first);
    expect(first.summary.rows).toHaveLength(4);
    expect(first.exports.fits.semantic).toBe("binary-table-not-image-HDU");
    expect(first.exports.png.semantic).toBe("diagnostic-strip-only-not-science-image");
    expect(first.manifest.fitsImage).toBe("unavailable-dense-and-screen-coordinate-boundary");
  });
});
