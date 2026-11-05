import { describe, expect, it } from "vitest";

import { loadKerrResponseAwareSparseFitsV537, resetKerrResponseAwareSparseFitsServerCacheForTestsV537 } from "./kerrResponseAwareSparseFitsServerV537";

describe("v537 sparse FITS server", () => {
  it("loads exact FITS bytes through a bounded fingerprint cache", async () => {
    resetKerrResponseAwareSparseFitsServerCacheForTestsV537();
    const first = await loadKerrResponseAwareSparseFitsV537();
    const second = await loadKerrResponseAwareSparseFitsV537();
    expect(first).toBe(second);
    expect(first.exports.fits.bytes.byteLength).toBe(first.artifact.fits.bytes);
    expect(first.exports.fits.fileSha256).toBe(first.artifact.fits.fileSha256);
    expect(new TextDecoder("ascii").decode(first.exports.fits.bytes.slice(0, 9))).toBe("SIMPLE  =");
  });
});
