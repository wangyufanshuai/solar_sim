import { describe, expect, it } from "vitest";
import { STELLAR_HERO_BY_ID_V592 } from "./stellarHeroesV592";
import {
  createStellarPhenomenologyByIdV1,
  createStellarPhenomenologyCatalogV1,
  summarizeStellarPhenomenologyV1,
  validateStellarPhenomenologyCatalogV1,
  validateStellarPhenomenologyV1,
} from "./stellarPhenomenologyV1";

describe("post-v593 stellar phenomenology contract", () => {
  it("covers all 24 heroes deterministically and freezes its outputs", () => {
    const first = createStellarPhenomenologyCatalogV1();
    const second = createStellarPhenomenologyCatalogV1();
    expect(first).toHaveLength(24);
    expect(new Set(first.map((value) => value.heroId)).size).toBe(24);
    expect(first).toEqual(second);
    expect(first.map((value) => value.contractSha256)).toEqual(
      second.map((value) => value.contractSha256),
    );
    for (const value of first) {
      expect(Object.isFrozen(value)).toBe(true);
      expect(Object.isFrozen(value.states)).toBe(true);
      expect(Object.isFrozen(value.variability)).toBe(true);
      expect(Object.isFrozen(value.binary)).toBe(true);
      expect(Object.isFrozen(value.pulsation)).toBe(true);
    }
    validateStellarPhenomenologyCatalogV1(first);
  });

  it("preserves catalog variability classification without inventing measurements", () => {
    const vega = createStellarPhenomenologyByIdV1("vega");
    const polaris = createStellarPhenomenologyByIdV1("polaris");
    const sirius = createStellarPhenomenologyByIdV1("sirius-a");
    expect(vega.variability).toMatchObject({
      state: "catalog-classified",
      variableIdentifiers: ["V* alf Lyr"],
      objectType: "dS*",
      amplitude: null,
      periodDays: null,
      measurementAdmitted: false,
    });
    expect(polaris.variability).toMatchObject({
      state: "catalog-classified",
      variableIdentifiers: ["V* alf UMi"],
      objectType: "cC*",
    });
    expect(sirius.variability.state).toBe("unknown");
    expect(sirius.variability.variableIdentifiers).toBeNull();
  });

  it("keeps pulsation disabled for every hero", () => {
    for (const value of createStellarPhenomenologyCatalogV1()) {
      expect(value.pulsation).toMatchObject({
        state: "pulsation-disabled-no-admitted-amplitude",
        enabled: false,
        amplitude: null,
        periodDays: null,
        reason: "no-admitted-amplitude-or-period",
      });
    }
  });

  it("exposes only deterministic companion presentation, never an orbit", () => {
    const sirius = createStellarPhenomenologyByIdV1("sirius-a");
    const polaris = createStellarPhenomenologyByIdV1("polaris");
    const achernar = createStellarPhenomenologyByIdV1("achernar");
    expect(sirius.binary).toMatchObject({ state: "binary-presentation-only", companionIds: ["sirius-b"] });
    expect(polaris.binary).toMatchObject({
      state: "binary-presentation-only",
      companionIds: ["polaris-ab", "polaris-b"],
    });
    expect(achernar.binary).toMatchObject({ state: "unknown", companionIds: [] });
    for (const value of createStellarPhenomenologyCatalogV1()) {
      expect(value.binary.orbit).toBeNull();
      expect(value.binary.orbitalPeriodDays).toBeNull();
    }
  });

  it("reports the sealed roster boundary", () => {
    expect(summarizeStellarPhenomenologyV1()).toEqual({
      rosterCount: 24,
      uniqueHeroCount: 24,
      unknownVariabilityCount: 12,
      catalogClassifiedVariabilityCount: 12,
      pulsationDisabledCount: 24,
      binaryPresentationCount: 12,
      binaryUnknownCount: 12,
      measurementAuthorityGrantedCount: 0,
      orbitClaimCount: 0,
      valid: true,
    });
  });

  it("fails closed on changed hash, fabricated measurements, authority, or roster", () => {
    const value = createStellarPhenomenologyByIdV1("vega");
    expect(() => validateStellarPhenomenologyV1({ ...value, contractSha256: "tampered" })).toThrow();
    expect(() => validateStellarPhenomenologyV1({
      ...value,
      measurementAuthorityGranted: true,
    } as never)).toThrow();
    expect(() => validateStellarPhenomenologyV1({
      ...value,
      pulsation: { ...value.pulsation, amplitude: 0.1 },
    } as never)).toThrow();
    expect(() => validateStellarPhenomenologyCatalogV1([
      value,
      ...createStellarPhenomenologyCatalogV1().slice(1, 23),
    ])).toThrow();
    expect(STELLAR_HERO_BY_ID_V592.vega.id).toBe("vega");
  });
});
