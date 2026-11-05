import { describe, expect, it } from "vitest";
import {
  KERR_REGRET_RANKING_ARTIFACT_MAX_BYTES_V531,
  loadKerrRegretRankingV531,
  resetKerrRegretRankingServerCacheForTestsV531,
} from "./kerrRegretRankingServerV531";

describe("v531 regret ranking server", () => {
  it("loads one bounded artifact through the mtime-size-sha cache", async () => {
    resetKerrRegretRankingServerCacheForTestsV531();
    const first = await loadKerrRegretRankingV531();
    const second = await loadKerrRegretRankingV531();
    expect(first).toBe(second);
    expect(first.summary.displayGeometry.scientificGeometryInputCount).toBe(300);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(
      KERR_REGRET_RANKING_ARTIFACT_MAX_BYTES_V531,
    );
  });
});
