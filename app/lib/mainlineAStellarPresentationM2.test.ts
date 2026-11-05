import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { getMainlineA1CatalogId, getMainlineA1ObjectByCatalogId } from "../data/mainlineARegistryV607";
import { STELLAR_HEROES_V592, STELLAR_HERO_BY_ID_V592 } from "./stellarHeroesV592";
import { stellarMaterialProfile } from "./stellarMaterialProfile";
import { canonicalSerializeStellarPortraitRenderContractV594 } from "./stellarPortraitRenderContractV594";
import {
  assertStellarPortraitRenderContractInheritanceV596,
  computeStellarPortraitRenderContractSha256V596,
  createStellarPortraitProfileFromRenderContractV596,
  createStellarPortraitRenderContractV596,
} from "./stellarPortraitRenderContractV596";
import {
  MAINLINE_A_STELLAR_PRESENTATION_M2_IDS,
  computeMainlineAStellarAppearanceSignatureM2,
  createMainlineAStellarAppearanceM2,
  resolveMainlineAStellarPresentationM2,
} from "./mainlineAStellarPresentationM2";

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16)) as [number, number, number];
}

describe("Mainline A M2 shared stellar presentation", () => {
  it("connects all A12 exact identities and registry navigation aliases to the same display seal", () => {
    expect(MAINLINE_A_STELLAR_PRESENTATION_M2_IDS).toHaveLength(12);
    for (const id of MAINLINE_A_STELLAR_PRESENTATION_M2_IDS) {
      const canonical = resolveMainlineAStellarPresentationM2(id)!;
      const catalogId = getMainlineA1CatalogId(id)!;
      expect(getMainlineA1ObjectByCatalogId(catalogId)?.id).toBe(id);
      for (const alias of [catalogId, `stellar-hero:${id}`, `star:${id}`, `bright-star:${id}`]) {
        const resolved = resolveMainlineAStellarPresentationM2(alias)!;
        expect(resolved.hero.id).toBe(id);
        expect(resolved.appearance.signatureSha256).toBe(canonical.appearance.signatureSha256);
      }
    }
  });

  it("never admits the other twelve heroes, held components, Gaia anchors, or ambiguous names", () => {
    const permitted = new Set<string>(MAINLINE_A_STELLAR_PRESENTATION_M2_IDS);
    for (const hero of STELLAR_HEROES_V592.filter((entry) => !permitted.has(entry.id))) {
      for (const id of [hero.id, `stellar-hero:${hero.id}`, `nearby-star:${hero.id}`, `star:${hero.id}`]) {
        expect(resolveMainlineAStellarPresentationM2(id)).toBeNull();
      }
    }
    for (const id of [
      "acrux", "spica", "regulus", "polaris", "Sirius A", "sirius", "bright-star:sirius",
      "stellar-hero:sirius", "stellar-hero:Sirius-A", "nearby-star:sirius:extra", " star:sirius-a",
      `gaia-dr3:${STELLAR_HERO_BY_ID_V592["sirius-a"].gaiaSourceId}`,
      "nebula:sirius-a", "constellation:sirius-a", "__proto__", "nearby-star:constructor", "",
    ]) expect(resolveMainlineAStellarPresentationM2(id)).toBeNull();
  });

  it("reuses the original hero material inputs and sealed v596 profile without changing contract semantics", () => {
    for (const id of MAINLINE_A_STELLAR_PRESENTATION_M2_IDS) {
      const presentation = resolveMainlineAStellarPresentationM2(id)!;
      const { hero, material, contract, portrait, appearance } = presentation;
      const originalMaterial = stellarMaterialProfile({
        id: `stellar-hero:${hero.id}`, colorBpRp: hero.colorBpRp,
        mag: hero.apparentMagnitudeV, parallaxMas: hero.parallaxMas, fallbackColor: "#ffd891",
      });
      const originalContract = createStellarPortraitRenderContractV596(hero, "cinematic");
      expect(material).toEqual(originalMaterial);
      expect(contract).toEqual(originalContract);
      expect(portrait).toEqual(createStellarPortraitProfileFromRenderContractV596(originalContract, originalMaterial));
      expect(contract.contractSha256).toBe(computeStellarPortraitRenderContractSha256V596(contract));
      expect(() => assertStellarPortraitRenderContractInheritanceV596(contract)).not.toThrow();
      expect(appearance.surface).toBe(contract.morphology.surface);
      expect(appearance.corona).toBe(contract.morphology.corona);
      expect(appearance.halo).toBe(contract.morphology.halo);
      expect(appearance.geometryScale).toBe(contract.geometry.scale);
      expect(appearance.sceneLinearColor).toEqual(portrait.sceneLinearColor);
    }
    expect(resolveMainlineAStellarPresentationM2("sirius-a")!.contract.contractSha256)
      .toBe("278e44bd1f07c439ac28455c7ca33f8cd24ec400f5ebcdc15a3ba6945e791d87");
    expect(resolveMainlineAStellarPresentationM2("achernar")!.contract.contractSha256)
      .toBe("d828100e1ac542c26cb5892f78ebbd8de7571d305172ca8febae523fb0f2b886");
  });

  it("keeps blue giant colors blue and red supergiant colors warm despite legacy class palettes", () => {
    for (const id of ["sirius-a", "rigel", "achernar", "vega"]) {
      const { appearance } = resolveMainlineAStellarPresentationM2(id)!;
      for (const color of [appearance.baseColor, appearance.coreColor, appearance.limbColor, appearance.haloColor]) {
        const [red, green, blue] = rgb(color);
        expect(blue).toBeGreaterThan(green);
        expect(green).toBeGreaterThan(red);
      }
    }
    const rigel = resolveMainlineAStellarPresentationM2("rigel")!;
    expect(rigel.portrait.displayColor).toBe("#ff9b54");
    expect(rigel.appearance.baseColor).not.toBe(rigel.portrait.displayColor);
    for (const id of ["betelgeuse", "antares", "aldebaran"]) {
      const [red, green, blue] = rgb(resolveMainlineAStellarPresentationM2(id)!.appearance.baseColor);
      expect(red).toBeGreaterThan(green);
      expect(green).toBeGreaterThan(blue);
    }
  });

  it("preserves seven morphology families and the sealed rotator geometry while leaving catalog values intact", () => {
    const representatives = ["sirius-a", "rigel", "alpha-centauri-a", "arcturus", "betelgeuse", "procyon-a", "achernar"];
    const appearances = representatives.map((id) => resolveMainlineAStellarPresentationM2(id)!.appearance);
    expect(new Set(appearances.map((entry) => entry.family)).size).toBe(7);
    expect(new Set(appearances.map((entry) => entry.topology)).size).toBe(7);
    const achernar = resolveMainlineAStellarPresentationM2("achernar")!;
    expect(achernar.appearance.axisRatio).toBe(1.352);
    expect(achernar.appearance.colorTemperatureK).toBe(14898.5);
    expect(achernar.hero.equatorialPolarRadiusRatio).toBe(1.35);
    expect(achernar.hero.temperatureK).toBe(15000);
    expect(achernar.appearance.polarBrightening).toBeGreaterThan(0.7);
    expect(achernar.appearance.equatorialDarkening).toBeGreaterThan(0.6);
    const vega = resolveMainlineAStellarPresentationM2("vega")!;
    expect(vega.appearance.axisRatio).toBe(1.127378);
    expect(vega.hero.equatorialPolarRadiusRatio).toBe(1.12);
    expect(vega.hero.temperatureK).toBe(9602);
    expect(vega.appearance.colorTemperatureK).toBe(9360);
  });

  it("shares morphology across modes and closes science-mode halo and corona", () => {
    for (const id of MAINLINE_A_STELLAR_PRESENTATION_M2_IDS) {
      const cinematic = resolveMainlineAStellarPresentationM2(id, "cinematic")!;
      const science = resolveMainlineAStellarPresentationM2(id, "science")!;
      expect(science.appearance.morphologySha256).toBe(cinematic.appearance.morphologySha256);
      expect(science.appearance.baseColor).toBe(cinematic.appearance.baseColor);
      expect(science.appearance.haloEnabled).toBe(false);
      expect(science.appearance.coronaEnabled).toBe(false);
      expect(science.appearance.haloStrength).toBe(0);
      expect(science.appearance.coronaStrength).toBe(0);
      expect(science.appearance.signatureSha256).not.toBe(cinematic.appearance.signatureSha256);
    }
  });

  it("binds the consumed appearance fields in a separate deterministic SHA and rejects mixed profiles", () => {
    const sirius = resolveMainlineAStellarPresentationM2("sirius-a")!;
    const { signatureSha256, ...unsigned } = sirius.appearance;
    const independentSha = createHash("sha256")
      .update(canonicalSerializeStellarPortraitRenderContractV594(unsigned)).digest("hex");
    expect(signatureSha256).toBe(independentSha);
    expect(computeMainlineAStellarAppearanceSignatureM2(sirius.appearance)).toBe(signatureSha256);
    for (const changed of [
      { ...sirius.appearance, baseColor: "#ffffff" },
      { ...sirius.appearance, axisRatio: 1.4 },
      { ...sirius.appearance, haloEnabled: false },
      { ...sirius.appearance, contractSha256: "0".repeat(64) },
      { ...sirius.appearance, surface: { ...sirius.appearance.surface, macroScale: 0.1 } },
    ]) expect(computeMainlineAStellarAppearanceSignatureM2(changed)).not.toBe(signatureSha256);
    const betelgeuse = resolveMainlineAStellarPresentationM2("betelgeuse")!;
    expect(() => createMainlineAStellarAppearanceM2(sirius.contract, betelgeuse.portrait))
      .toThrow("mainline-a-m2-profile-contract-mismatch");
  });

  it("bounds the display color transform and fails closed for nonfinite input", () => {
    const { contract, portrait } = resolveMainlineAStellarPresentationM2("sirius-a")!;
    const bounded = createMainlineAStellarAppearanceM2(contract, { ...portrait, sceneLinearColor: [-1, 0, 2] });
    expect(bounded.sceneLinearColor).toEqual([0, 0, 1]);
    expect(bounded.baseColor).toBe("#0000ff");
    const gray = createMainlineAStellarAppearanceM2(contract, { ...portrait, sceneLinearColor: [0.2158605, 0.2158605, 0.2158605] });
    expect(gray.baseColor).toBe("#808080");
    expect(() => createMainlineAStellarAppearanceM2(contract, { ...portrait, sceneLinearColor: [NaN, 0, 1] }))
      .toThrow("mainline-a-m2-nonfinite-display-color");
  });

  it("keeps display output immutable and authority/writeback closed", () => {
    const result = resolveMainlineAStellarPresentationM2("nearby-star:sirius")!;
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.material)).toBe(true);
    expect(Object.isFrozen(result.appearance)).toBe(true);
    expect(Object.isFrozen(result.appearance.sceneLinearColor)).toBe(true);
    expect(Object.isFrozen(result.appearance.surface)).toBe(true);
    expect(result).toMatchObject({ presentationOnly: true, scientificPayloadWriteback: false });
    expect(result.appearance).toMatchObject({
      presentationOnly: true, resolvedSurface: false, observationTexture: false,
      measuredAuthorityGranted: false, scientificPayloadWriteback: false,
    });
    expect(Object.values(result.contract.extendedAuthority).some(Boolean)).toBe(false);
  });
});
