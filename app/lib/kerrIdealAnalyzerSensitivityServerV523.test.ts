import { describe, expect, it } from "vitest";
import {
  loadKerrIdealAnalyzerSensitivityV523,
  resetKerrIdealAnalyzerSensitivityServerCacheForTestsV523,
} from "./kerrIdealAnalyzerSensitivityServerV523";

describe("v523 ideal analyzer sensitivity server", () => {
  it("loads the bounded full artifact through one fingerprint cache", async () => {
    resetKerrIdealAnalyzerSensitivityServerCacheForTestsV523();
    const first = await loadKerrIdealAnalyzerSensitivityV523();
    const second = await loadKerrIdealAnalyzerSensitivityV523();
    expect(first).toBe(second);
    expect(first.summary.counts).toMatchObject({
      modulationRowCount: 864,
      reconstructionCount: 216,
      channelEnvelopeCount: 96,
      expectedElectronCountRowCount: 0,
    });
    expect(first.export.bytes.byteLength).toBeGreaterThan(0);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(2 * 1024 * 1024);
  });
});
