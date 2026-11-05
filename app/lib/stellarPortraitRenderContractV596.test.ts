import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { stellarMaterialProfile } from "./stellarMaterialProfile";
import {
  STELLAR_HEROES_V592,
  STELLAR_HERO_BY_ID_V592,
} from "./stellarHeroesV592";
import { JULIAN_DATE_J2000_V592 } from "./celestialClockV592";
import { canonicalSerializeStellarPortraitRenderContractV594 } from "./stellarPortraitRenderContractV594";
import {
  STELLAR_MORPHOLOGY_V596_VERSION,
  STELLAR_PORTRAIT_RENDER_CONTRACT_V596_VERSION,
  assertStellarPortraitRenderContractInheritanceV596,
  computeStellarPortraitRenderContractSha256V596,
  createStellarPortraitProfileFromRenderContractV596,
  createStellarPortraitRenderContractV596,
  resolveStellarPortraitEvolutionPhaseV596,
  resolveStellarPortraitRotationPhaseV596,
} from "./stellarPortraitRenderContractV596";

const REPRESENTATIVE_IDS = [
  "sirius-a",
  "rigel",
  "alpha-centauri-a",
  "arcturus",
  "betelgeuse",
  "procyon-a",
  "achernar",
] as const;

function canonicalSha(value: unknown): string {
  return createHash("sha256")
    .update(canonicalSerializeStellarPortraitRenderContractV594(value))
    .digest("hex");
}

describe("v596 visible stellar morphology contract", () => {
  it("builds deterministic additive contracts for all 24 heroes and both modes", () => {
    for (const hero of STELLAR_HEROES_V592) {
      const science = createStellarPortraitRenderContractV596(hero, "science");
      const cinematic = createStellarPortraitRenderContractV596(hero, "cinematic");
      for (const contract of [science, cinematic]) {
        const { contractSha256, ...unsigned } = contract;
        expect(contract.version).toBe(STELLAR_PORTRAIT_RENDER_CONTRACT_V596_VERSION);
        expect(contract.formalProductPointer).toBe("v263");
        expect(contractSha256).toBe(computeStellarPortraitRenderContractSha256V596(unsigned));
        expect(contractSha256).toBe(canonicalSha(unsigned));
        expect(contract.morphology.version).toBe(STELLAR_MORPHOLOGY_V596_VERSION);
        expect(contract.morphology.heroId).toBe(hero.id);
        expect(contract.morphology.profileSha256).toMatch(/^[a-f0-9]{64}$/);
        expect(contract.baselineV594ContractSha256)
          .toBe(contract.baselineV594Contract.contractSha256);
        expect(() => assertStellarPortraitRenderContractInheritanceV596(contract))
          .not.toThrow();
        expect(Object.isFrozen(contract)).toBe(true);
        expect(Object.isFrozen(contract.morphology.surface)).toBe(true);
      }
      expect(science.morphology).toEqual(cinematic.morphology);
      expect(science.morphology.profileSha256).toBe(cinematic.morphology.profileSha256);
    }
  });

  it("keeps every authority and scientific writeback gate closed", () => {
    for (const hero of STELLAR_HEROES_V592) {
      const contract = createStellarPortraitRenderContractV596(hero, "cinematic");
      expect(contract.authoritative).toBe(false);
      expect(contract.authority).toMatchObject({
        presentationOnly: true,
        resolvedSurface: false,
        observationTexture: false,
        measuredAuthorityGranted: false,
        scientificPayloadWriteback: false,
      });
      expect(contract.extendedAuthority).toEqual({
        scientific: false,
        measured: false,
        gpu: false,
        resolvedSurface: false,
        observationTexture: false,
        radiativeTransfer: false,
        grmhd: false,
        scientificPayloadWriteback: false,
      });
      expect(contract.companions.enabled).toBe(false);
      expect(contract.companions.reason)
        .toBe("disabled-v596-primary-morphology-no-orbit-or-occultation-claim");
      expect(contract.companions.entries.every((entry) => entry.enabled === false)).toBe(true);
      expect(contract.surface.pulsation).toMatchObject({
        enabled: false,
        amplitude: null,
      });
      expect(contract.companions.entries.every((entry) => entry.authoritative === false))
        .toBe(true);
      expect(contract.companions.entries.every((entry) => entry.presentationOnly))
        .toBe(true);
    }
  });

  it("separates seven representative morphology families visibly in parameter space", () => {
    const contracts = REPRESENTATIVE_IDS.map((id) =>
      createStellarPortraitRenderContractV596(
        STELLAR_HERO_BY_ID_V592[id],
        "cinematic",
      ),
    );
    expect(new Set(contracts.map((contract) => contract.archetype)).size).toBe(7);
    expect(new Set(contracts.map((contract) => contract.morphology.profileSha256)).size)
      .toBe(7);
    expect(new Set(contracts.map((contract) => JSON.stringify(contract.morphology.surface))).size)
      .toBe(7);

    const byId = Object.fromEntries(contracts.map((contract) => [contract.heroId, contract]));
    expect(byId["sirius-a"].morphology.surface.radiativeLayerStrength)
      .toBeGreaterThan(byId["sirius-a"].morphology.surface.macroStrength * 5);
    expect(byId.rigel.morphology.corona.filamentBreakup).toBeGreaterThan(0.8);
    expect(byId["alpha-centauri-a"].morphology.surface.microScale).toBeGreaterThan(40);
    expect(byId.arcturus.morphology.surface.macroStrength)
      .toBeGreaterThan(byId["alpha-centauri-a"].morphology.surface.macroStrength * 2);
    expect(byId.betelgeuse.morphology.surface.macroScale).toBeLessThan(1.5);
    expect(byId["procyon-a"].morphology.surface.radiativeLayerStrength)
      .toBeGreaterThan(byId["procyon-a"].morphology.surface.mesoStrength * 0.9);
    expect(byId.achernar.morphology.surface.polarBrightening).toBeGreaterThan(0.7);
    expect(byId.achernar.morphology.surface.equatorialDarkening).toBeGreaterThan(0.6);
    expect(byId.achernar.geometry.scale[0]).toBeGreaterThan(byId.achernar.geometry.scale[1]);
  });

  it("keeps morphology identity shared while science closes presentation layers", () => {
    const hero = STELLAR_HERO_BY_ID_V592.rigel;
    const science = createStellarPortraitRenderContractV596(hero, "science");
    const cinematic = createStellarPortraitRenderContractV596(hero, "cinematic");
    expect(science.morphology.profileSha256).toBe(cinematic.morphology.profileSha256);
    expect(science.surface.morphology).toEqual(cinematic.surface.morphology);
    expect(science.surface.linearOutput).toBe(true);
    expect(science.corona.enabled).toBe(false);
    expect(science.halo.enabled).toBe(false);
    expect(science.companions.enabled).toBe(false);
    expect(cinematic.surface.linearOutput).toBe(false);
    expect(cinematic.corona.enabled).toBe(true);
    expect(cinematic.halo.enabled).toBe(true);
  });

  it("adapts the contract into a sealed V596 profile without changing phase policy", () => {
    const hero = STELLAR_HERO_BY_ID_V592.achernar;
    const contract = createStellarPortraitRenderContractV596(hero, "cinematic");
    const material = stellarMaterialProfile({
      id: hero.id,
      colorBpRp: hero.colorBpRp,
      mag: hero.apparentMagnitudeV,
      parallaxMas: hero.parallaxMas,
    });
    const profile = createStellarPortraitProfileFromRenderContractV596(contract, material);
    expect(profile.renderContractSha256).toBe(contract.contractSha256);
    expect(profile.baselineV594ContractSha256).toBe(contract.baselineV594ContractSha256);
    expect(profile.morphology).toBe(contract.morphology);
    expect(profile.parameterSource)
      .toBe("v596-additive-morphology-over-sealed-v594-contract");

    expect(resolveStellarPortraitRotationPhaseV596(contract, JULIAN_DATE_J2000_V592))
      .toBe(0);
    const evolution = resolveStellarPortraitEvolutionPhaseV596(
      contract,
      JULIAN_DATE_J2000_V592,
    );
    expect(resolveStellarPortraitEvolutionPhaseV596(
      contract,
      JULIAN_DATE_J2000_V592 + contract.surface.evolution.periodDays,
    )).toBeCloseTo(evolution, 8);
  });
});
