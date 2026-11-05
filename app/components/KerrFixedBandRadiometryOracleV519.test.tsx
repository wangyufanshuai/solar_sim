import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrFixedBandRadiometryOracleV519.tsx",
  "utf8",
);

describe("v519 radiometry oracle surface", () => {
  it("renders the independent 4×3 oracle and all five maximum errors", () => {
    expect(source).toContain('data-atlas-v519-ray-count="4"');
    expect(source).toContain('data-atlas-v519-band-count="3"');
    expect(source).toContain('data-atlas-v519-row-count="12"');
    expect(source).toContain('data-atlas-v519-decimal-digits="80"');
    expect(source).toContain("summary.maxima.energyRadianceRelativeDifference");
    expect(source).toContain("summary.maxima.g4TransferRelativeDifference");
  });

  it("keeps model predictions separate from measured and detector authority", () => {
    expect(source).toContain('data-atlas-v519-measured-radiance-row-count="0"');
    expect(source).toContain('data-atlas-v519-detector-projected-row-count="0"');
    expect(source).toContain('data-atlas-v519-scientific-mutation="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("createObjectURL");
  });
});
