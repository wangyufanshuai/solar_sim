import { describe, expect, it } from "vitest";
import {
  KERR_ANALYZER_IDENTIFIABILITY_ARTIFACT_MAX_BYTES_V524,
  loadKerrAnalyzerIdentifiabilityV524,
  resetKerrAnalyzerIdentifiabilityServerCacheForTestsV524,
} from "./kerrAnalyzerIdentifiabilityServerV524";

describe("v524 analyzer identifiability server", () => {
  it("loads one bounded artifact through the mtime-size-sha cache", async () => {
    resetKerrAnalyzerIdentifiabilityServerCacheForTestsV524();
    const first = await loadKerrAnalyzerIdentifiabilityV524();
    const second = await loadKerrAnalyzerIdentifiabilityV524();
    expect(first).toBe(second);
    expect(first.summary.diagnostics.uncalibratedBiasAugmented4x6).toMatchObject({
      rank: 4,
      nullity: 2,
      jointScienceAndBiasIdentifiable: false,
    });
    expect(first.export.bytes.byteLength).toBeGreaterThan(0);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(
      KERR_ANALYZER_IDENTIFIABILITY_ARTIFACT_MAX_BYTES_V524,
    );
  });
});
