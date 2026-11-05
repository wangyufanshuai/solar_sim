import { describe, expect, it } from "vitest";
import { STELLAR_HEROES_V592, STELLAR_HERO_BY_ID_V592 } from "./stellarHeroesV592";
import {
  STELLAR_ARCHETYPE_PROFILE_V1_VERSION,
  createStellarArchetypeProfileByIdV1,
  createStellarArchetypeProfileV1,
} from "./stellarArchetypeProfileV1";

describe("post-v593 stellar archetype profile", () => {
  it("covers every first-roster hero without granting scientific authority", () => {
    const profiles = STELLAR_HEROES_V592.map(createStellarArchetypeProfileV1);
    expect(profiles).toHaveLength(24);
    expect(new Set(profiles.map((profile) => profile.heroId)).size).toBe(24);
    expect(new Set(profiles.map((profile) => profile.archetype).sort())).toEqual(
      new Set([
        "hot-radiative",
        "blue-supergiant-wind",
        "solar-like-convective",
        "cool-convective",
        "red-giant-supergiant",
        "warm-radiative-convective",
        "rapid-rotator-gravity-darkened",
      ]),
    );
    for (const profile of profiles) {
      expect(profile.version).toBe(STELLAR_ARCHETYPE_PROFILE_V1_VERSION);
      expect(profile.presentationOnly).toBe(true);
      expect(profile.scientificPayloadWriteback).toBe(false);
      expect(profile.derivation).toBe("parameter-derived-display-not-resolved-surface");
      expect(profile.pulsationAmplitude).toBe(0);
      expect(profile.deterministicSeed).toBeGreaterThanOrEqual(0);
      expect(profile.deterministicSeed).toBeLessThanOrEqual(1);
      expect(profile.visualSignature.presentationOnly).toBe(true);
      expect(profile.visualSignature.observationTexture).toBe(false);
      expect(profile.visualSignature.measurementAuthorityGranted).toBe(false);
      expect(profile.visualSignature.signatureFrequency).toBeGreaterThanOrEqual(0.88);
      expect(profile.visualSignature.signatureFrequency).toBeLessThanOrEqual(1.12);
    }
    expect(new Set(profiles.map((profile) => profile.visualSignature.signatureId)).size)
      .toBe(24);
  });

  it("preserves resolved identity and companion presentation boundaries", () => {
    const sirius = createStellarArchetypeProfileByIdV1("sirius-a", STELLAR_HERO_BY_ID_V592);
    const alpha = createStellarArchetypeProfileV1(STELLAR_HERO_BY_ID_V592["alpha-centauri-a"]);
    const achernar = createStellarArchetypeProfileV1(STELLAR_HERO_BY_ID_V592.achernar);
    expect(sirius.identityStatus).toBe("identity-bound");
    expect(sirius.binaryCompanionCount).toBe(1);
    expect(alpha.identityStatus).toBe("identity-bound");
    expect(alpha.binaryCompanionCount).toBeGreaterThan(0);
    expect(achernar.archetype).toBe("rapid-rotator-gravity-darkened");
    expect(achernar.gravityDarkening).toBeGreaterThan(0.7);
    expect(createStellarArchetypeProfileV1(STELLAR_HERO_BY_ID_V592["capella-a"]).identityStatus)
      .toBe("render-anchor-only");
  });

  it("uses only admitted primary models for the four oriented rapid rotators", () => {
    const rapidIds = ["vega", "achernar", "altair", "regulus"] as const;
    for (const id of rapidIds) {
      const first = createStellarArchetypeProfileV1(STELLAR_HERO_BY_ID_V592[id]);
      const second = createStellarArchetypeProfileV1(STELLAR_HERO_BY_ID_V592[id]);
      expect(first.archetype).toBe("rapid-rotator-gravity-darkened");
      expect(first.visualSignature.orientation).toMatchObject({
        knownState: "available",
        sourceMeasurementAdmitted: true,
        measurementAuthorityGranted: false,
        renderApplication: "metadata-only-no-camera-world-convention",
      });
      expect(first.visualSignature.orientation.inclinationDeg).not.toBeNull();
      expect(first.visualSignature.orientation.polePositionAngleEastOfNorthDeg)
        .not.toBeNull();
      expect(first.visualSignature.axisRatioBasis)
        .toBe("primary-literature-scoped-model");
      expect(first.visualSignature).toEqual(second.visualSignature);
    }
  });

  it("preserves unavailable orientation as unknown rather than synthetic zero", () => {
    const sirius = createStellarArchetypeProfileV1(
      STELLAR_HERO_BY_ID_V592["sirius-a"],
    );
    expect(sirius.visualSignature.orientation).toMatchObject({
      knownState: "unknown",
      inclinationDeg: null,
      polePositionAngleEastOfNorthDeg: null,
      sourceMeasurementAdmitted: false,
      measurementAuthorityGranted: false,
      renderApplication: "metadata-only-no-camera-world-convention",
      derivation: "unknown-axis-not-zero-default-y-presentation-only",
    });
  });

  it("does not derive morphology frequency from the hero id seed", () => {
    const profiles = STELLAR_HEROES_V592.map(createStellarArchetypeProfileV1);
    const groups = Map.groupBy(profiles, (profile) => profile.archetype);
    for (const group of groups.values()) {
      expect(new Set(group.map((profile) => profile.visualSignature.signatureFrequency)).size)
        .toBe(1);
    }
    const solarLike = groups.get("solar-like-convective") ?? [];
    expect(solarLike.length).toBeGreaterThan(1);
    expect(new Set(solarLike.map((profile) => profile.deterministicSeed)).size)
      .toBeGreaterThan(1);
    expect(new Set(solarLike.map((profile) => profile.visualSignature.signaturePhaseRad)).size)
      .toBeGreaterThan(1);
  });

  it("records Regulus range midpoint as presentation derivation, not measurement", () => {
    const orientation = createStellarArchetypeProfileV1(
      STELLAR_HERO_BY_ID_V592.regulus,
    ).visualSignature.orientation;
    expect(orientation).toMatchObject({
      inclinationDeg: 84,
      sourceMeasurementAdmitted: true,
      measurementAuthorityGranted: false,
      derivation: "primary-literature-range-midpoint-axis-metadata-for-presentation",
      derivationInputs: {
        inclinationExactDeg: null,
        inclinationLowerDeg: 78,
        inclinationUpperDeg: 90,
      },
    });
    expect(orientation.derivationFormula).toContain("/ 2");
  });
});
