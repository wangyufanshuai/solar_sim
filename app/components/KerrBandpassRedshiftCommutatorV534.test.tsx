import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/KerrBandpassRedshiftCommutatorV534.tsx", "utf8");

describe("v534 Science Cinematic V8.3 HUD", () => {
  it("renders exact and frozen response rows without visual mutation", () => {
    expect(source).toContain("observerBandpassPhotonRadiancePerSM2Sr");
    expect(source).toContain("frozenEmitterBandpassPhotonRadiancePerSM2Sr");
    expect(source).toContain("redshiftBandpassCommutatorRelative");
    expect(source).toContain('data-atlas-v534-numeric-style-input-count="0"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
  });

  it("states the measured-authority boundary in valid UTF-8", () => {
    expect(source).toContain("红移与仪器带通不能交换顺序");
    expect(source).toContain("No collecting area, exposure, electrons, counts");
  });
});
