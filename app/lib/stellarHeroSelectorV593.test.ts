import { describe, expect, it } from "vitest";
import { STELLAR_HEROES_V592 } from "../data/stellarHeroesV592.generated";
import {
  STELLAR_HERO_SELECTOR_BY_ID_V593,
  STELLAR_HERO_SELECTOR_IDS_V593,
  STELLAR_HERO_SELECTOR_V593,
  STELLAR_HERO_SELECTOR_VERSION_V593,
  resolveStellarHeroSelectorV593,
  validateStellarHeroSelectorV593,
} from "./stellarHeroSelectorV593";

describe("v593 stellar hero selector provenance adapter", () => {
  it("exposes the complete v592 roster without changing its source identity", () => {
    expect(() => validateStellarHeroSelectorV593()).not.toThrow();
    expect(STELLAR_HERO_SELECTOR_VERSION_V593).toBe(
      "v593-stellar-hero-selector-provenance-adapter-v1",
    );
    expect(STELLAR_HERO_SELECTOR_IDS_V593).toEqual(
      STELLAR_HEROES_V592.map((hero) => hero.id),
    );
    expect(STELLAR_HERO_SELECTOR_V593).toHaveLength(24);
    expect(new Set(STELLAR_HERO_SELECTOR_IDS_V593).size).toBe(24);
  });

  it("keeps identity and presentation authority fail-closed", () => {
    const entries = STELLAR_HERO_SELECTOR_V593;
    expect(entries.filter((entry) => entry.identityStatus === "identity-bound")).toHaveLength(20);
    expect(entries.filter((entry) => entry.identityStatus === "render-anchor-only").map((entry) => entry.id))
      .toEqual(["capella-a", "spica", "regulus", "polaris"]);
    expect(entries.every((entry) => entry.provenanceAdmission === "blocked-incomplete-field-provenance")).toBe(true);
    expect(entries.every((entry) => entry.presentationOnly === true)).toBe(true);
    expect(entries.every((entry) => entry.observationTextureClaim === false)).toBe(true);
    expect(entries.every((entry) => entry.scientificPayloadWriteback === false)).toBe(true);
    expect(entries.every((entry) => entry.packetSha256.length === 64 && entry.provenanceManifestSha256.length === 64)).toBe(true);
    expect(STELLAR_HERO_SELECTOR_BY_ID_V593["sirius-a"].gaiaCrossmatchStatus)
      .toBe("gaia-render-anchor-only-not-identity-claim");
  });

  it("distinguishes the four signed archetype overrides from catalog presentation profiles", () => {
    const overrideIds = STELLAR_HERO_SELECTOR_V593
      .filter((entry) => entry.signatureOverrideId !== null)
      .map((entry) => entry.id);
    expect(overrideIds).toEqual(["sirius-a", "rigel", "betelgeuse", "antares"]);
    expect(STELLAR_HERO_SELECTOR_BY_ID_V593["sirius-a"].presentationProfile)
      .toBe("hot-radiative-main-sequence");
    expect(STELLAR_HERO_SELECTOR_BY_ID_V593["betelgeuse"].presentationProfile)
      .toBe("cool-convective-supergiant");
    expect(STELLAR_HERO_SELECTOR_BY_ID_V593["vega"].profileAdmission)
      .toBe("catalog-profile-presentation-only");
    expect(STELLAR_HERO_SELECTOR_BY_ID_V593["vega"].presentationProfile)
      .toBe("catalog-hot-radiative-photosphere");
  });

  it("resolves known IDs and fails closed for unknown focus values", () => {
    expect(resolveStellarHeroSelectorV593("alnilam")?.label).toBe("Alnilam");
    expect(resolveStellarHeroSelectorV593("not-a-v592-hero")).toBeNull();
    expect(resolveStellarHeroSelectorV593(null)).toBeNull();
  });
});
