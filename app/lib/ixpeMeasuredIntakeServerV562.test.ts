import { describe, expect, it, afterEach } from "vitest";
import { loadIxpeMeasuredIntakeV562, resetIxpeMeasuredIntakeServerCacheForTestsV562 } from "./ixpeMeasuredIntakeServerV562";

describe("IXPE measured intake server v562", () => {
  afterEach(() => resetIxpeMeasuredIntakeServerCacheForTestsV562());
  it("loads only the signed blocked artifact", async () => {
    const artifact = await loadIxpeMeasuredIntakeV562();
    expect(artifact.status).toBe("blocked-public-data-package-missing");
    expect(artifact.boundary.networkAttempted).toBe(false);
  });

  it("uses the explicit project root in standalone runtimes", async () => {
    const previous = process.env.ATLAS_PROJECT_ROOT;
    process.env.ATLAS_PROJECT_ROOT = process.cwd();
    resetIxpeMeasuredIntakeServerCacheForTestsV562();
    try {
      await expect(loadIxpeMeasuredIntakeV562()).resolves.toMatchObject({
        version: "v1-orbit-atlas-ixpe-measured-intake-v562",
        qualification: { measuredAuthorityGranted: false },
      });
    } finally {
      if (previous === undefined) delete process.env.ATLAS_PROJECT_ROOT;
      else process.env.ATLAS_PROJECT_ROOT = previous;
      resetIxpeMeasuredIntakeServerCacheForTestsV562();
    }
  });
});
