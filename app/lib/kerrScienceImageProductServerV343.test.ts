import { describe, expect, it } from "vitest";
import { loadKerrScienceImageProductBytesV343, loadKerrScienceImageProductManifestV343, resetKerrScienceImageProductServerV343CacheForTests } from "./kerrScienceImageProductServerV343";
describe("v343 science image product server", () => {
  it("validates manifest and exact FITS/PNG bytes", async () => { resetKerrScienceImageProductServerV343CacheForTests(); const manifest = await loadKerrScienceImageProductManifestV343(); const [fits, png] = await Promise.all([loadKerrScienceImageProductBytesV343("fits"), loadKerrScienceImageProductBytesV343("png")]); expect(manifest.products).toHaveLength(2); expect(fits.bytes.byteLength).toBe(manifest.products[0].bytes); expect(png.bytes.byteLength).toBe(manifest.products[1].bytes); expect(fits.mimeType).toBe("application/fits"); expect(png.mimeType).toBe("image/png"); });
});
