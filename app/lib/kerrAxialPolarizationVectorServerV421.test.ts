import { describe, expect, it } from "vitest";

import { loadKerrAxialPolarizationVectorsV421, resetKerrAxialPolarizationVectorServerV421CacheForTests } from "./kerrAxialPolarizationVectorServerV421";

describe("v421 axial-vector server", () => {
  it("single-flights four SHA-verified exports without raster semantics", async () => {
    resetKerrAxialPolarizationVectorServerV421CacheForTests();
    const first = await loadKerrAxialPolarizationVectorsV421();
    expect(await loadKerrAxialPolarizationVectorsV421()).toBe(first);
    expect(first.summary.rows).toHaveLength(4);
    expect(first.exports.fits.semantic).toBe("primary-WCS-plus-axial-vector-binary-table-no-image-data");
    expect(first.manifest.historicalFilesOverwritten).toBe(false);
    expect(first.manifest.interpolationAllowed).toBe(false);
  });
});
