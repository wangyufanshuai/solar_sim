import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  STELLAR_HEROES_V592,
  STELLAR_HERO_BY_ID_V592,
} from "./stellarHeroesV592";
import { JULIAN_DATE_J2000_V592 } from "./celestialClockV592";
import { stellarMaterialProfile } from "./stellarMaterialProfile";
import {
  canonicalSerializeStellarPortraitRenderContractV594,
  createStellarPortraitProfileFromRenderContractV594,
  createStellarPortraitRenderContractV594,
  resolveStellarPortraitEvolutionPhaseV594,
  resolveStellarPortraitRotationPhaseV594,
} from "./stellarPortraitRenderContractV594";

const REPRESENTATIVE_IDS = [
  "sirius-a",
  "rigel",
  "alpha-centauri-a",
  "arcturus",
  "betelgeuse",
  "procyon-a",
  "achernar",
] as const;

function nodeCanonicalSha(value: unknown): string {
  return createHash("sha256")
    .update(canonicalSerializeStellarPortraitRenderContractV594(value))
    .digest("hex");
}

describe("v594 stellar portrait render contract", () => {
  it("builds stable browser-safe contracts for all twenty-four heroes", () => {
    for (const mode of ["science", "cinematic"] as const) {
      const contracts = STELLAR_HEROES_V592.map((hero) =>
        createStellarPortraitRenderContractV594(hero, mode),
      );
      expect(contracts).toHaveLength(24);
      expect(new Set(contracts.map((contract) => contract.heroId)).size).toBe(24);
      for (const contract of contracts) {
        const { contractSha256, ...unsigned } = contract;
        expect(contractSha256).toMatch(/^[a-f0-9]{64}$/);
        expect(contractSha256).toBe(nodeCanonicalSha(unsigned));
        expect(contract.authoritative).toBe(false);
        expect(contract.authority).toMatchObject({
          presentationOnly: true,
          resolvedSurface: false,
          observationTexture: false,
          scientificPayloadWriteback: false,
        });
        expect(Object.isFrozen(contract)).toBe(true);
        expect(Object.isFrozen(contract.fields)).toBe(true);
        expect(Object.isFrozen(contract.companions.entries)).toBe(true);
      }
    }
  });

  it("gives the seven representative archetypes distinct contract fingerprints", () => {
    const fingerprints = REPRESENTATIVE_IDS.map((id) =>
      createStellarPortraitRenderContractV594(
        STELLAR_HERO_BY_ID_V592[id],
        "cinematic",
      ).contractSha256,
    );
    expect(new Set(fingerprints).size).toBe(REPRESENTATIVE_IDS.length);
  });

  it("drives an oblate Achernar geometry and non-zero gravity darkening", () => {
    const contract = createStellarPortraitRenderContractV594(
      STELLAR_HERO_BY_ID_V592.achernar,
      "cinematic",
    );
    expect(contract.geometry.scale[0]).toBeGreaterThan(contract.geometry.scale[1]);
    expect(contract.geometry.scale[2]).toBe(contract.geometry.scale[0]);
    expect(contract.geometry.signature).toMatch(/^oblate-sphere:/);
    expect(contract.surface.gravityDarkening).toBeGreaterThan(0.7);
  });

  it("keeps exact source values separate from explicit presentation derivations", () => {
    const sirius = createStellarPortraitRenderContractV594(
      STELLAR_HERO_BY_ID_V592["sirius-a"],
      "cinematic",
    );
    expect(sirius.fields.identity.value).toBe("* alf CMa");
    expect(sirius.fields.identity.sourceKey).toBe("simbad");
    expect(sirius.fields.identity.derivation).toMatchObject({
      kind: "source-exact",
      inputs: { sourceValuePath: "value.mainId" },
      measurementAuthorityGranted: false,
    });
    expect(sirius.fields.identity.value).not.toBe(
      STELLAR_HERO_BY_ID_V592["sirius-a"].gaiaSourceId,
    );

    const vega = createStellarPortraitRenderContractV594(
      STELLAR_HERO_BY_ID_V592.vega,
      "cinematic",
    );
    expect(vega.fields.temperatureK).toMatchObject({
      value: 9360,
      knownState: "available",
      sourceKey: "vega-monnier-2012",
      derivation: {
        kind: "source-exact",
        inputs: { sourceValuePath: "value.surfaceAverageK" },
        sourceMeasurementAdmitted: true,
        measurementAuthorityGranted: false,
      },
    });
    expect(vega.fields.radiusSolar.derivation).toMatchObject({
      kind: "presentation-derived",
      inputs: { polarSolar: 2.418, equatorialSolar: 2.726 },
      sourceMeasurementAdmitted: true,
      measurementAuthorityGranted: false,
    });

    const achernar = createStellarPortraitRenderContractV594(
      STELLAR_HERO_BY_ID_V592.achernar,
      "cinematic",
    );
    expect(achernar.fields.rotationPeriodDays).toMatchObject({
      sourceKey: "achernar-domiciano-2014",
      derivation: {
        kind: "presentation-derived",
        inputs: { periodHours: 37.25, hoursPerDay: 24 },
        sourceMeasurementAdmitted: true,
        measurementAuthorityGranted: false,
      },
    });
    expect(achernar.fields.rotationPeriodDays.value).toBeCloseTo(37.25 / 24, 8);
    expect(achernar.surface.evolution.periodDays).toBeCloseTo(
      achernar.surface.rotation.periodDays * 8,
      12,
    );
    expect(achernar.fields.evolutionPeriodDays.derivation.formula)
      .toBe("evolutionPeriodDays = resolvedRotationPeriodDays * cyclesPerEvolution");
  });

  it("retains source orientation as metadata only until a camera/world convention exists", () => {
    const regulus = createStellarPortraitRenderContractV594(
      STELLAR_HERO_BY_ID_V592.regulus,
      "science",
    );
    expect(regulus.surface.rotation.orientationMetadata).toMatchObject({
      inclinationDeg: 84,
      polePositionAngleEastOfNorthDeg: 85.5,
    });
    expect(regulus.surface.rotation.orientationApplication)
      .toBe("metadata-only-no-camera-world-convention");
    expect(regulus.fields.orientation.derivation).toMatchObject({
      kind: "presentation-derived",
      sourceMeasurementAdmitted: true,
      measurementAuthorityGranted: false,
      inputs: {
        inclinationLowerDeg: 78,
        inclinationUpperDeg: 90,
        renderApplication: "metadata-only-no-camera-world-convention",
      },
    });
    expect(regulus.fields.orientation.claim).toContain("metadata-only");
  });

  it("keeps unknown variability null and closes the pulsation gate", () => {
    for (const hero of STELLAR_HEROES_V592) {
      const contract = createStellarPortraitRenderContractV594(hero, "cinematic");
      expect(contract.fields.variability.value).toBeNull();
      expect(contract.surface.pulsation.enabled).toBe(false);
      expect(contract.surface.pulsation.amplitude).toBeNull();
      expect(contract.surface.pulsation.reason).toBe(
        contract.phenomenology.variability.state === "catalog-classified"
          ? "disabled-classification-only-no-admitted-amplitude"
          : "disabled-unknown-variability",
      );
      expect(contract.phenomenology.pulsation).toMatchObject({
        enabled: false,
        amplitude: null,
        periodDays: null,
      });
    }
  });

  it("separates linear science from cinematic presentation layers", () => {
    const hero = STELLAR_HERO_BY_ID_V592["sirius-a"];
    const science = createStellarPortraitRenderContractV594(hero, "science");
    const cinematic = createStellarPortraitRenderContractV594(hero, "cinematic");
    expect(science.surface.linearOutput).toBe(true);
    expect(science.corona.enabled).toBe(false);
    expect(science.halo.enabled).toBe(false);
    expect(science.companions).toMatchObject({
      enabled: false,
      reason: "disabled-science-mode",
    });
    expect(science.companions.entries.every((entry) => !entry.enabled)).toBe(true);

    expect(cinematic.surface.linearOutput).toBe(false);
    expect(cinematic.corona.enabled).toBe(true);
    expect(cinematic.halo.enabled).toBe(true);
    expect(cinematic.companions).toMatchObject({
      enabled: true,
      reason: "enabled-curated-presentation-only",
    });
    expect(cinematic.companions.entries).toHaveLength(1);
    expect(cinematic.companions.entries[0]).toMatchObject({
      id: "sirius-b",
      enabled: true,
      presentationOnly: true,
      authoritative: false,
    });
    expect(science.authoritative).toBe(false);
    expect(cinematic.authoritative).toBe(false);
  });

  it("builds the hero portrait profile from the sealed contract inputs", () => {
    const hero = STELLAR_HERO_BY_ID_V592.rigel;
    const contract = createStellarPortraitRenderContractV594(hero, "cinematic");
    const material = stellarMaterialProfile({
      id: hero.id,
      colorBpRp: hero.colorBpRp,
      mag: hero.apparentMagnitudeV,
      parallaxMas: hero.parallaxMas,
    });
    const profile = createStellarPortraitProfileFromRenderContractV594(
      contract,
      material,
    );
    expect(profile.renderContractSha256).toBe(contract.contractSha256);
    expect(profile.seed).toBe(contract.deterministicSeed);
    expect(profile.surfaceDetailOctaves).toBe(contract.surface.granulation.octaves);
    expect(profile.visualSignature).toEqual({
      signaturePhaseRad: contract.visualSignature.signaturePhaseRad,
      signatureFrequency: contract.visualSignature.signatureFrequency,
      cellAnisotropy: contract.visualSignature.cellAnisotropy,
      radiativeBandStrength: contract.visualSignature.radiativeBandStrength,
      convectiveCellStrength: contract.visualSignature.convectiveCellStrength,
      windFilamentStrength: contract.visualSignature.windFilamentStrength,
      polarRadiance: contract.visualSignature.polarRadiance,
      equatorialShade: contract.visualSignature.equatorialShade,
    });
    expect(profile.windStrength).toBe(contract.corona.windStrength);
    expect(profile.parameterSource).toBe("v592-hero-provenance-render-contract");
    expect(profile.authoritative).toBe(false);
  });

  it("resolves absolute J2000 rotation and evolution phases reversibly", () => {
    const contract = createStellarPortraitRenderContractV594(
      STELLAR_HERO_BY_ID_V592.achernar,
      "science",
    );
    const period = contract.surface.rotation.periodDays;
    expect(resolveStellarPortraitRotationPhaseV594(
      contract,
      JULIAN_DATE_J2000_V592,
    )).toBe(0);
    expect(resolveStellarPortraitRotationPhaseV594(
      contract,
      JULIAN_DATE_J2000_V592 + period * 0.25,
    )).toBeCloseTo(Math.PI / 2, 8);
    expect(resolveStellarPortraitRotationPhaseV594(
      contract,
      JULIAN_DATE_J2000_V592 - period * 0.25,
    )).toBeCloseTo(Math.PI * 1.5, 8);

    const evolutionAtStart = resolveStellarPortraitEvolutionPhaseV594(
      contract,
      JULIAN_DATE_J2000_V592,
    );
    const evolutionAtFullCycle = resolveStellarPortraitEvolutionPhaseV594(
      contract,
      JULIAN_DATE_J2000_V592 + contract.surface.evolution.periodDays,
    );
    expect(evolutionAtFullCycle).toBeCloseTo(evolutionAtStart, 8);
  });
});
