import { describe, expect, it } from "vitest";
import { inferStellarDataTier, normalizeCatalogFtsQuery } from "./catalogV5";
import { createAtlasVisualDirectorV3 } from "./atlasVisualDirectorV3";
import { createStellarPortraitProfileV4 } from "./stellarPortraitProfileV4";
import { stellarMaterialProfile } from "./stellarMaterialProfile";
import { compareSceneLabDocuments, createSceneLabDocument, updateSceneLabParameter } from "./sceneLab";
import { createAtlasFinalReleaseGate } from "./atlasFinalReleaseGate";

describe("v133-v140 final program foundations", () => {
  it("directs inspect and launch exposure independently", () => {
    expect(createAtlasVisualDirectorV3("inspect", "closeup-inspect").orbitDensity).toBe("selected-only");
    expect(createAtlasVisualDirectorV3("launch", "launch-cinematic").exposure).toBeLessThan(createAtlasVisualDirectorV3("atlas", "balanced").exposure);
  });
  it("distinguishes physical portrait completeness", () => {
    expect(inferStellarDataTier({ teffK: 5772, logg: 4.44, radiusSolar: 1, bpRp: 0.82, spectralType: "G2V" })).toBe("parameter-rich");
    expect(inferStellarDataTier({ teffK: null, logg: null, radiusSolar: null, bpRp: null, spectralType: null })).toBe("catalog-basic");
    expect(normalizeCatalogFtsQuery("Barnard’s Star")).toBe("barnard s star");
  });
  it("creates deterministic V4 atmosphere art", () => {
    const material = stellarMaterialProfile({ id: "v4-star", colorBpRp: 1.8, mag: 4, parallaxMas: 20 });
    const first = createStellarPortraitProfileV4({ material, spectralType: "K2III", radiusSolar: 18, logg: 2.1, colorIndexAvailable: true });
    const second = createStellarPortraitProfileV4({ material, spectralType: "K2III", radiusSolar: 18, logg: 2.1, colorIndexAvailable: true });
    expect(first).toEqual(second);
    expect(first.surfaceRegime).toBe("giant");
    expect(first.derivation).toContain("not-resolved-surface");
  });
  it("keeps scene experiments isolated and range checked", () => {
    const base = createSceneLabDocument({ id: "a", title: "Mercury", sourceSceneId: "mercury", createdAt: "2026-01-01T00:00:00Z", parameters: { timeScale: 1 } });
    const changed = updateSceneLabParameter(base, { id: "timeScale", label: "Time scale", minimum: 0.25, maximum: 4, step: 0.25, defaultValue: 1, unit: "x" }, 9);
    expect(changed.parameters.timeScale).toBe(4);
    expect(base.parameters.timeScale).toBe(1);
    expect(compareSceneLabDocuments(base, changed).changedParameterIds).toEqual(["timeScale"]);
  });
  it("blocks release and science independently", () => {
    const gate = createAtlasFinalReleaseGate({ catalogRows: 224_361, coreInstalledBytes: 0, consoleErrors: 0, rendererFaults: 0, resourceLeaks: 0, desktopOverviewMedianFps: 60, desktopSceneMedianFps: 50, idleWorkingSetMb: 900, peakWorkingSetMb: 2_500 });
    expect(gate.ready).toBe(false);
    expect(gate.blockers).toContain("catalog-below-one-million");
    expect(gate.science.defaultKernel).toBe("legacy-eih-1pn");
  });
});
