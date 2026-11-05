import {
  STELLAR_HEROES_V592,
  STELLAR_HERO_PACKET_SHA256_V592,
  STELLAR_HERO_PACKET_URL_V592,
  type StellarHeroIdV592,
  type StellarHeroV592,
} from "./stellarHeroesV592";
import {
  STELLAR_PROVENANCE_CANDIDATE_SHA256,
  getStellarProvenanceHeroV1,
  type StellarProvenanceAdmissionV1,
  type StellarProvenanceIdentityStatusV1,
} from "./stellarProvenanceCandidate";

/**
 * Selector-facing provenance adapter for the v593 observatory.
 *
 * This module deliberately exposes presentation metadata only.  It does not
 * promote a Gaia render anchor to a named-star identity, and it does not grant
 * scientific or measured authority to any shader/profile consumer.
 */
export const STELLAR_HERO_SELECTOR_VERSION_V593 =
  "v593-stellar-hero-selector-provenance-adapter-v1" as const;

export const STELLAR_PROVENANCE_MANIFEST_URL_V1 =
  "/data/post-v593-stellar-relativity/stellar-provenance-v1.json" as const;

export type StellarHeroSignatureOverrideIdV593 =
  | "sirius-a"
  | "rigel"
  | "betelgeuse"
  | "antares";

export type StellarHeroPresentationProfileV593 =
  | "hot-radiative-main-sequence"
  | "hot-radiative-supergiant"
  | "cool-convective-supergiant"
  | `catalog-${StellarHeroV592["shaderProfile"]}`;

export type StellarHeroSelectorEntryV593 = Readonly<{
  id: StellarHeroIdV592;
  label: string;
  pass: string;
  presentationProfile: StellarHeroPresentationProfileV593;
  signatureOverrideId: StellarHeroSignatureOverrideIdV593 | null;
  profileAdmission: "signature-profile" | "catalog-profile-presentation-only";
  identityStatus: StellarProvenanceIdentityStatusV1;
  gaiaSourceId: string;
  gaiaCrossmatchStatus: StellarHeroV592["gaiaCrossmatchStatus"];
  gaiaAnchorAngularDistanceDeg: number;
  provenanceAdmission: StellarProvenanceAdmissionV1;
  packetUrl: typeof STELLAR_HERO_PACKET_URL_V592;
  packetSha256: typeof STELLAR_HERO_PACKET_SHA256_V592;
  provenanceManifestUrl: typeof STELLAR_PROVENANCE_MANIFEST_URL_V1;
  provenanceManifestSha256: typeof STELLAR_PROVENANCE_CANDIDATE_SHA256;
  presentationOnly: true;
  observationTextureClaim: false;
  scientificPayloadWriteback: false;
}>;

const SIGNATURE_OVERRIDES_V593 = Object.freeze({
  "sirius-a": {
    presentationProfile: "hot-radiative-main-sequence",
    pass: "radiative photosphere",
  },
  rigel: {
    presentationProfile: "hot-radiative-supergiant",
    pass: "hot supergiant",
  },
  betelgeuse: {
    presentationProfile: "cool-convective-supergiant",
    pass: "giant convection",
  },
  antares: {
    presentationProfile: "cool-convective-supergiant",
    pass: "cool supergiant",
  },
} as const satisfies Readonly<Record<StellarHeroSignatureOverrideIdV593, Readonly<{
  presentationProfile: Exclude<StellarHeroPresentationProfileV593, `catalog-${string}`>;
  pass: string;
}>>>);

const SIGNATURE_OVERRIDE_IDS_V593 = new Set<string>(
  Object.keys(SIGNATURE_OVERRIDES_V593),
);

function catalogProfileV593(hero: StellarHeroV592): StellarHeroPresentationProfileV593 {
  return `catalog-${hero.shaderProfile}` as StellarHeroPresentationProfileV593;
}

function humanizeShaderProfileV593(profile: StellarHeroV592["shaderProfile"]): string {
  return profile.replaceAll("-", " ");
}

function selectorEntryV593(hero: StellarHeroV592): StellarHeroSelectorEntryV593 {
  const provenance = getStellarProvenanceHeroV1(hero.id);
  const overrideId = SIGNATURE_OVERRIDE_IDS_V593.has(hero.id)
    ? hero.id as StellarHeroSignatureOverrideIdV593
    : null;
  const override = overrideId ? SIGNATURE_OVERRIDES_V593[overrideId] : null;

  return Object.freeze({
    id: hero.id,
    label: hero.name,
    pass: override?.pass ?? `catalog · ${humanizeShaderProfileV593(hero.shaderProfile)}`,
    presentationProfile: override?.presentationProfile ?? catalogProfileV593(hero),
    signatureOverrideId: overrideId,
    profileAdmission: overrideId ? "signature-profile" : "catalog-profile-presentation-only",
    identityStatus: provenance.identityStatus,
    gaiaSourceId: provenance.gaiaSourceId,
    gaiaCrossmatchStatus: hero.gaiaCrossmatchStatus,
    gaiaAnchorAngularDistanceDeg: hero.gaiaAnchorAngularDistanceDeg,
    provenanceAdmission: provenance.provenanceAdmission,
    packetUrl: STELLAR_HERO_PACKET_URL_V592,
    packetSha256: STELLAR_HERO_PACKET_SHA256_V592,
    provenanceManifestUrl: STELLAR_PROVENANCE_MANIFEST_URL_V1,
    provenanceManifestSha256: STELLAR_PROVENANCE_CANDIDATE_SHA256,
    presentationOnly: true,
    observationTextureClaim: false,
    scientificPayloadWriteback: false,
  });
}

export const STELLAR_HERO_SELECTOR_V593 = Object.freeze(
  STELLAR_HEROES_V592.map(selectorEntryV593),
) as readonly StellarHeroSelectorEntryV593[];

export const STELLAR_HERO_SELECTOR_IDS_V593 = Object.freeze(
  STELLAR_HERO_SELECTOR_V593.map((entry) => entry.id),
);

export const STELLAR_HERO_SELECTOR_BY_ID_V593 = Object.freeze(
  Object.fromEntries(STELLAR_HERO_SELECTOR_V593.map((entry) => [entry.id, entry])),
) as Readonly<Record<StellarHeroIdV592, StellarHeroSelectorEntryV593>>;

export function resolveStellarHeroSelectorV593(
  id: string | null | undefined,
): StellarHeroSelectorEntryV593 | null {
  if (!id) return null;
  return STELLAR_HERO_SELECTOR_BY_ID_V593[id as StellarHeroIdV592] ?? null;
}

export function validateStellarHeroSelectorV593(): void {
  if (STELLAR_HERO_SELECTOR_V593.length !== STELLAR_HEROES_V592.length) {
    throw new Error("v593-stellar-selector-roster-count");
  }
  if (new Set(STELLAR_HERO_SELECTOR_IDS_V593).size !== STELLAR_HEROES_V592.length) {
    throw new Error("v593-stellar-selector-duplicate-id");
  }
  for (const entry of STELLAR_HERO_SELECTOR_V593) {
    const hero = STELLAR_HEROES_V592.find((candidate) => candidate.id === entry.id);
    if (!hero || entry.gaiaSourceId !== hero.gaiaSourceId) {
      throw new Error(`v593-stellar-selector-source:${entry.id}`);
    }
    if (
      entry.presentationOnly !== true
      || entry.observationTextureClaim !== false
      || entry.scientificPayloadWriteback !== false
      || entry.packetSha256 !== STELLAR_HERO_PACKET_SHA256_V592
      || entry.provenanceManifestSha256 !== STELLAR_PROVENANCE_CANDIDATE_SHA256
    ) {
      throw new Error(`v593-stellar-selector-authority:${entry.id}`);
    }
    const provenance = getStellarProvenanceHeroV1(entry.id);
    if (entry.identityStatus !== provenance.identityStatus || entry.provenanceAdmission !== provenance.provenanceAdmission) {
      throw new Error(`v593-stellar-selector-provenance:${entry.id}`);
    }
    if (entry.signatureOverrideId === null && entry.profileAdmission !== "catalog-profile-presentation-only") {
      throw new Error(`v593-stellar-selector-profile-admission:${entry.id}`);
    }
  }
}

validateStellarHeroSelectorV593();
