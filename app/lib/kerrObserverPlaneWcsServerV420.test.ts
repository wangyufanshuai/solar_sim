import { describe, expect, it } from "vitest";

import { loadKerrObserverPlaneWcsV420, resetKerrObserverPlaneWcsServerV420CacheForTests } from "./kerrObserverPlaneWcsServerV420";

describe("v420 observer-plane WCS server", () => {
  it("single-flights SHA-verified WCS exports without image semantics", async () => {
    resetKerrObserverPlaneWcsServerV420CacheForTests();
    const first = await loadKerrObserverPlaneWcsV420();
    expect(await loadKerrObserverPlaneWcsV420()).toBe(first);
    expect(first.summary.rows).toHaveLength(4);
    expect(first.exports.fits.semantic).toBe("primary-WCS-header-plus-binary-table-no-image-data");
    expect(first.manifest.interpolationAllowed).toBe(false);
  });
});
