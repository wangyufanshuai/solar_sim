import { describe, expect, it } from "vitest";
import gaugeWave from "../data/s3GaugeWave.generated.json";

describe("S3 B1 analytic gauge-wave export", () => {
  it("retains the reference and registered finite gates", () => {
    expect(gaugeWave.registration).toBe("d5ac32a");
    expect(gaugeWave.reference).toContain("H = 1 - A sin");
    expect(gaugeWave.convergence).toHaveLength(4);
    expect(gaugeWave.convergence.every((item) => item.passed)).toBe(true);
    expect(gaugeWave.longSmall.passed).toBe(true);
    expect(gaugeWave.longSmall.complete).toBe(true);
    expect(gaugeWave.longSmall.samples).toHaveLength(100);
    expect(gaugeWave.longLarge.reportedOnly).toBe(true);
    expect(gaugeWave.longLarge.complete).toBe(false);
    expect(gaugeWave.longLarge.samples.at(-1)?.[0]).toBe(22);
  });

  it("keeps the finite-time boundary visible", () => {
    expect(gaugeWave.note).toContain("not a new evolution");
    expect(gaugeWave.passed).toBe(true);
    expect(gaugeWave.longSmall.lateLogSlope).toBeLessThanOrEqual(gaugeWave.acceptance.longMaxSlope);
    expect(gaugeWave.longSmall.samples.at(-1)?.[1]).toBeLessThanOrEqual(gaugeWave.acceptance.longMaxError);
  });
});
