import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("v117 scientific cinematic art integration", () => {
  it("uses one photosphere shader and tabbed passport with release wiring", () => {
    const portrait = read("app/components/SelectedSkyTargetProxy.tsx");
    const shader = read("app/components/StellarPortraitMaterial.tsx");
    const passport = read("app/components/CelestialObjectPassportPanel.tsx");
    const page = read("app/UniverseRuntimeController.tsx");
    const docs = `${read("README.md")}\n${read("docs/TECHNICAL_OVERVIEW.md")}`;
    expect(portrait).toContain("StellarPortraitMaterial");
    expect(portrait).not.toContain("torusGeometry");
    expect(shader).toContain("uGranulation");
    expect(shader).toContain("uLimb");
    expect(passport).toContain('"portrait", "spectrum", "data"');
    expect(page).toContain("data-atlas-scientific-cinematic-art-version");
    expect(docs).toContain("v117 Scientific Cinematic Art Direction");
  });
});
