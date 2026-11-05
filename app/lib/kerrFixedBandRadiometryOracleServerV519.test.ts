import { describe, expect, it } from "vitest";
import {
  loadKerrFixedBandRadiometryOracleV519,
  resetKerrFixedBandRadiometryOracleServerCacheForTestsV519,
} from "./kerrFixedBandRadiometryOracleServerV519";

describe("v519 radiometry oracle server", () => {
  it("loads a bounded canonical artifact and reuses its fingerprint cache", async () => {
    resetKerrFixedBandRadiometryOracleServerCacheForTestsV519();
    const first = await loadKerrFixedBandRadiometryOracleV519();
    const second = await loadKerrFixedBandRadiometryOracleV519();
    expect(first).toBe(second);
    expect(first.summary.counts).toMatchObject({
      rayCount: 4,
      bandCount: 3,
      rowCount: 12,
      measuredRadianceRowCount: 0,
      detectorProjectedRowCount: 0,
    });
    expect(first.export.bytes.byteLength).toBeGreaterThan(0);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
  });
});
