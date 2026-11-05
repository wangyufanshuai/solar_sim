import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/KerrIdealAnalyzerSensitivityV523.tsx", "utf8");

describe("v523 ideal analyzer sensitivity surface", () => {
  it("renders all analyzer, modulation, reconstruction and envelope counts", () => {
    expect(source).toContain('data-atlas-v523-analyzer-state-count="4"');
    expect(source).toContain('data-atlas-v523-modulation-row-count="864"');
    expect(source).toContain('data-atlas-v523-reconstruction-count="216"');
    expect(source).toContain('data-atlas-v523-channel-envelope-count="96"');
    expect(source).toContain("summary.maxima.energyQReconstructionRelative");
    expect(source).toContain("summary.maxima.photonUReconstructionRelative");
  });

  it("keeps ideal algebra outside detector and measurement authority", () => {
    expect(source).toContain('data-atlas-v523-electron-count-row-count="0"');
    expect(source).toContain('data-atlas-v523-detector-projection-qualified="false"');
    expect(source).toContain('data-atlas-v523-scientific-mutation="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("createObjectURL");
    expect(source).not.toContain("�");
  });
});
