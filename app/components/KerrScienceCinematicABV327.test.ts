import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v327 Science/Cinematic A/B HUD", () => {
  it("renders bounded deterministic swatches without a second canvas or direct fetch", () => {
    const source = readFileSync("app/components/KerrScienceCinematicABV327.tsx", "utf8");
    expect(source).toContain("useSyncExternalStore");
    expect(source).toContain("retainKerrScienceObservatoryV329");
    expect(source).toContain("mode !== \"science\"");
    expect(source).toContain("production v305 mapping");
    expect(source).toContain("Science RGB and measurements remain unchanged");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("Math.random");
  });
});
