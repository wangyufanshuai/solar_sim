import { describe, expect, it } from "vitest";
import { stellarMaterialProfile } from "./stellarMaterialProfile";
import { createStellarPortraitProfile } from "./stellarPortraitProfile";
import { createAtlasScientificCinematicArtSummary } from "./atlasScientificCinematicArt";

describe("v117 scientific cinematic art", () => {
  it("derives deterministic photosphere controls from catalog material", () => {
    const material = stellarMaterialProfile({ id: "Gaia DR3 1", colorBpRp: 2.2, mag: 4, parallaxMas: 5 });
    const a = createStellarPortraitProfile({ material, logg: 2.1, radiusSolar: 30, variable: true });
    const b = createStellarPortraitProfile({ material, logg: 2.1, radiusSolar: 30, variable: true });
    expect(a).toEqual(b);
    expect(a.activity).toBeGreaterThan(0.5);
    expect(a.derivation).toBe("gaia-derived-presentation-not-resolved-surface");
  });

  it("locks the derived portrait truth boundary", () => {
    const summary = createAtlasScientificCinematicArtSummary();
    expect(summary.materialBudgetMb).toBe(8);
    expect(summary.portraitViews).toBe("portrait-spectrum-data");
  });
});
