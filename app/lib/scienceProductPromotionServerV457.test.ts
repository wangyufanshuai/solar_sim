import { afterEach, describe, expect, it } from "vitest";
import {
  loadScienceProductPromotionV457,
  resetScienceProductPromotionServerCacheForTestsV457,
} from "./scienceProductPromotionServerV457";

afterEach(() => resetScienceProductPromotionServerCacheForTestsV457());

describe("v457 science product promotion server", () => {
  it("single-flights one bounded JSON artifact", async () => {
    const first = loadScienceProductPromotionV457();
    const second = loadScienceProductPromotionV457();
    const [left, right] = await Promise.all([first, second]);
    expect(left.artifact.artifactSha256).toBe(right.artifact.artifactSha256);
    expect(left.summary.gates).toHaveLength(10);
    expect(left.export.name).toBe("science-product-promotion-gate.json");
    expect(left.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
  });
});
