import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { KERR_SCIENCE_OBSERVATORY_VISUAL_CONTRACT_V333 } from "./KerrScienceObservatoryHeaderV333";

const HUD_FILES = [
  "app/components/KerrScienceObservatoryHeaderV333.tsx",
  "app/components/KerrScienceBandHudV322.tsx",
  "app/components/KerrScienceBandUncertaintyV325.tsx",
  "app/components/KerrScienceCinematicABV327.tsx",
  "app/components/KerrSciencePhotonBandsV328.tsx",
] as const;

describe("v333 Science observatory visual contract", () => {
  it("uses a precision-instrument hierarchy without mutating or duplicating science rendering", () => {
    const header = readFileSync(HUD_FILES[0], "utf8");
    const hud = readFileSync(HUD_FILES[1], "utf8");
    const all = HUD_FILES.map((path) => readFileSync(path, "utf8")).join("\n");
    expect(KERR_SCIENCE_OBSERVATORY_VISUAL_CONTRACT_V333).toEqual({
      visualDirection: "deep-space-precision-instrument",
      informationLayer: "telemetry-only-no-science-mutation",
      spectralRail: ["visible", "euv", "soft-x-ray"],
      scienceDisplay: "linear-no-grade",
      cinematicBoundary: "presentation-copy-disjoint",
      denseBoundary: "incomplete-0-of-49",
    });
    expect(header).toContain("data-kerr-science-observatory-header-v333");
    expect(header).toContain("CPU float64 authority");
    expect(header).toContain("0/49 · incomplete · aggregate unavailable");
    expect(header).toContain("aria-live=\"polite\"");
    expect(header).toContain("aria-hidden=\"true\"");
    expect(hud).toContain("KerrScienceObservatoryHeaderV333");
    expect(all).not.toMatch(/[鈥宦谓螖虅搟虏�]/u);
    expect(all).not.toContain("<canvas");
    expect(all).not.toContain("fetch(");
    expect(all).not.toContain("Math.random");
  });
});
