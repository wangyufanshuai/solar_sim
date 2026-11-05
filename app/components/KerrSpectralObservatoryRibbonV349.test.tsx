import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sampleAtlasCinematicDetailV299 } from "../lib/atlasVisualProfileV299";

describe("v349 relativistic spectral observatory presentation consumer", () => {
  it("uses deterministic V8 tokens without reading or mutating scientific values", () => {
    const source = readFileSync("app/components/KerrSpectralObservatoryRibbonV349.tsx", "utf8");
    const parent = readFileSync("app/components/KerrScienceBandContrastSurfaceV348.tsx", "utf8");
    expect(source).toContain("KerrSpectralObservatoryRibbonV349");
    expect(source).toContain("tokens.spectralRibbonOpacity");
    expect(source).toContain("tokens.reticleLuminance");
    expect(source).toContain("tokens.channelSeparation");
    expect(source).toContain("tokens.diskDetailSeed");
    expect(source).toContain("data-atlas-v349-science-buffer-mutation=\"false\"");
    expect(source).toContain("group: \"strongGravity\"");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("<canvas");
    expect(source).not.toMatch(/energyRadianceRatio|redshiftFactor|walkerPenroseEvpa|intensity\[/u);
    expect(parent).toContain("<KerrSpectralObservatoryRibbonV349 />");
    expect(sampleAtlasCinematicDetailV299(349, 4, 2)).toBe(sampleAtlasCinematicDetailV299(349, 4, 2));
  });
});
