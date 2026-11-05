import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v419 observer screen coordinate plane", () => {
  it("renders after v418 without raster, pixel-WCS, mutation or Canvas claims", () => {
    const source = readFileSync("app/components/KerrScreenCoordinatePlaneV419.tsx", "utf8");
    const observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("Observer screen coordinate plane");
    expect(source).toContain("不是 raster 或 dense 偏振图");
    expect(source).toContain('data-atlas-v419-pixel-wcs="unavailable"');
    expect(source).toContain('data-atlas-v419-coordinate-mutation="false"');
    expect(source).toContain('data-atlas-v419-trajectories-in-react-state="false"');
    expect(source).not.toContain("Math.random(");
    expect(source).not.toContain("<canvas");
    expect(observatory.indexOf("<KerrScreenCoordinatePlaneV419 />")).toBeGreaterThan(observatory.indexOf("<KerrSparsePolarimetricStripV418 />"));
  });
});
