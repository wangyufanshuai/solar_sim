import { describe, expect, it } from "vitest";
import {
  loadKerrInstrumentAuthorityMatrixV511,
  resetKerrInstrumentAuthorityMatrixServerCacheForTestsV511,
} from "./kerrInstrumentAuthorityMatrixServerV511";

describe("v511 instrument authority matrix server", () => {
  it("loads a bounded canonical artifact and reuses the fingerprint cache", async () => {
    resetKerrInstrumentAuthorityMatrixServerCacheForTestsV511();
    const first = await loadKerrInstrumentAuthorityMatrixV511();
    const second = await loadKerrInstrumentAuthorityMatrixV511();
    expect(first).toBe(second);
    expect(first.summary.counts).toMatchObject({
      stageCount: 6,
      measuredCalibrationFiles: 0,
      measuredResponseRows: 0,
      observedCountRows: 0,
      sciencePixelRows: 0,
    });
    expect(first.export.name).toBe(
      "orbit-atlas-kerr-instrument-authority-matrix-v511.json",
    );
    expect(first.export.fileSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(first.export.bytes.byteLength).toBeGreaterThan(0);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
  });
});
