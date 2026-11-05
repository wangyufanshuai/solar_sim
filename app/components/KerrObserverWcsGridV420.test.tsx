import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v420 observer WCS grid", () => {
  it("renders after v419 with no raster values, interpolation or Canvas", () => {
    const source = readFileSync("app/components/KerrObserverWcsGridV420.tsx", "utf8");
    const observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("Linear WCS source grid");
    expect(source).toContain("NO PIXEL VALUE");
    expect(source).toContain('data-atlas-v420-raster-values="false"');
    expect(source).toContain('data-atlas-v420-interpolation="false"');
    expect(source).toContain('data-atlas-v420-raster-array-in-react-state="false"');
    expect(source).not.toContain("Math.random(");
    expect(source).not.toContain("<canvas");
    expect(observatory.indexOf("<KerrObserverWcsGridV420 />")).toBeGreaterThan(observatory.indexOf("<KerrScreenCoordinatePlaneV419 />"));
  });
});
