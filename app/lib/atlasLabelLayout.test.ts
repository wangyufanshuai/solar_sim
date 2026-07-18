import { describe, expect, it } from "vitest";
import { solveAtlasLabelLayout } from "./atlasLabelLayout";

describe("atlas label layout", () => {
  it("preserves the selected label and suppresses a lower-priority collision", () => {
    const result = solveAtlasLabelLayout({
      candidates: [
        { id: "selected", priority: 100, selected: true, rect: { left: 40, top: 40, right: 90, bottom: 60 } },
        { id: "minor", priority: 10, selected: false, rect: { left: 40, top: 40, right: 90, bottom: 60 } },
      ],
      occluders: [],
      viewportWidth: 120,
      viewportHeight: 100,
    });
    expect(result.find((row) => row.id === "selected")?.visible).toBe(true);
    const minor = result.find((row) => row.id === "minor")!;
    expect(minor.visible || minor.shiftX !== 0 || minor.shiftY !== 0).toBe(true);
  });

  it("moves a high-priority label away from a UI occluder", () => {
    const [result] = solveAtlasLabelLayout({
      candidates: [
        { id: "earth", priority: 80, selected: false, rect: { left: 70, top: 40, right: 110, bottom: 56 } },
      ],
      occluders: [{ left: 66, top: 32, right: 120, bottom: 64 }],
      viewportWidth: 180,
      viewportHeight: 120,
    });
    expect(result?.visible).toBe(true);
    expect(Math.abs(result?.shiftX ?? 0) + Math.abs(result?.shiftY ?? 0)).toBeGreaterThan(0);
  });

  it("hides non-selected labels that cannot fit inside the safe viewport", () => {
    const [result] = solveAtlasLabelLayout({
      candidates: [
        { id: "edge", priority: 10, selected: false, rect: { left: -80, top: -40, right: -20, bottom: -10 } },
      ],
      occluders: [],
      viewportWidth: 100,
      viewportHeight: 80,
    });
    expect(result).toMatchObject({ visible: false, reason: "viewport" });
  });

  it("clamps a selected mobile label into the safe viewport", () => {
    const [result] = solveAtlasLabelLayout({
      candidates: [
        { id: "mars", priority: 100, selected: true, rect: { left: 368, top: 180, right: 422, bottom: 204 } },
      ],
      occluders: [],
      viewportWidth: 390,
      viewportHeight: 844,
      marginPx: 12,
    });
    expect(result).toMatchObject({ visible: true, shiftX: -44, shiftY: 0, reason: "placed" });
  });
});
