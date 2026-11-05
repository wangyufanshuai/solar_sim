import {
  STELLAR_PROVENANCE_CANDIDATE as GENERATED_STELLAR_PROVENANCE_CANDIDATE,
  STELLAR_PROVENANCE_CANDIDATE_SHA256,
} from "../data/stellarProvenanceCandidate.generated";
import type { StellarHeroIdV592 } from "./stellarHeroesV592";

export const STELLAR_PROVENANCE_CANDIDATE_VERSION =
  "post-v593-stellar-provenance-candidate-v1" as const;

export type StellarProvenanceAuthorityV1 =
  | "catalog-anchor"
  | "curated"
  | "derived"
  | "estimated"
  | "meta-resolver-basic-data"
  | "primary-literature"
  | "presentation-only"
  | "unknown";

export type StellarProvenanceFieldStatusV2 =
  | "direct"
  | "derived"
  | "estimated"
  | "presentation-only"
  | "unknown"
  | "search-not-found";

export type StellarProvenanceFieldNameV1 =
  | "identity"
  | "raDec"
  | "epoch"
  | "distance"
  | "spectralType"
  | "temperature"
  | "logg"
  | "radius"
  | "luminosity"
  | "rotation"
  | "orientation"
  | "variability"
  | "companions"
  | "photometry"
  | "photosphere";

export type StellarProvenanceFieldV1 = Readonly<{
  status: StellarProvenanceFieldStatusV2;
  authority: StellarProvenanceAuthorityV1;
  claim: string;
  value: unknown;
  unit: string | null;
  epoch: string | null;
  sourceKey: string;
  sourceRef: string;
  sourceUrl: string | null;
  doi: string | null;
  sourceVersion: string;
  uncertainty: Readonly<{
    status: string;
    value: unknown;
    unit: string | null;
    note: string | null;
  }>;
  license: string;
  citationStatus: string;
  citations: readonly Readonly<{
    sourceKey: string;
    role: string;
  }>[];
  measurementAdmitted: boolean;
  details: unknown;
}>;

export type StellarProvenanceSourceV1 = Readonly<{
  sourceRef: string;
  sourceUrl: string | null;
  doi: string | null;
  dataRelease: string;
  license: string;
  retrievedAt: string | null;
  citationStatus: string;
  authorityScope: string;
  snapshotPath?: string;
  snapshotSha256?: string;
  ledgerPath?: string;
  ledgerSha256?: string;
  bibcode?: string;
  registryUse: readonly Readonly<{
    kind: string;
    [key: string]: unknown;
  }>[];
}>;

export type StellarProvenanceIdentityStatusV1 = "identity-bound" | "render-anchor-only";
export type StellarProvenanceAdmissionV1 = "admitted" | "blocked-incomplete-field-provenance";
export type StellarProvenancePresentationAdmissionV1 = "presentation-only-allowed";
export type StellarProvenanceSchemaAdmissionV2 = "schema-complete";
export type StellarProvenanceMeasurementAdmissionV2 =
  | "measurement-admitted"
  | "blocked-incomplete-measurement-provenance";

export type StellarProvenanceHeroV1 = Readonly<{
  id: StellarHeroIdV592;
  name: string;
  identityStatus: StellarProvenanceIdentityStatusV1;
  identityBinding: Readonly<{
    method: string;
    confidence: "high" | "insufficient-component-specific";
    resolvedMainId: string;
    queryId: string;
    gaiaRenderAnchorUsedForIdentity: false;
  }>;
  gaiaSourceId: string;
  gaiaAnchorAngularDistanceDeg: number;
  fields: Readonly<Record<StellarProvenanceFieldNameV1, StellarProvenanceFieldV1>>;
  schemaAdmission: StellarProvenanceSchemaAdmissionV2;
  measurementAdmission: StellarProvenanceMeasurementAdmissionV2;
  presentationOnly: true;
  scientificPayloadWriteback: false;
  presentationAdmission: StellarProvenancePresentationAdmissionV1;
  provenanceAdmission: StellarProvenanceAdmissionV1;
  blockingReasons: readonly string[];
}>;

export type StellarProvenanceCandidateSourceV1 = Readonly<{
  packetPath: string;
  packetSha256: string;
  packetVersion: string;
  simbadSnapshotPath: string;
  simbadSnapshotSha256: string;
  literatureSnapshotPath: string;
  literatureSnapshotSha256: string;
  exaSearchLedgerPath: string;
  exaSearchLedgerSha256: string;
}>;

export type StellarProvenanceSearchAuditV1 = Readonly<{
  provider: string;
  ledgerPath: string;
  ledgerSha256: string;
  replayStatus: "sealed-replay-replaces-unverifiable-historical-aggregate";
  workstreamCount: number;
  queryCount: number;
  sourcesReviewed: number;
  returnedResultSlots: number;
  uniqueNormalizedUrls: number;
  duplicateResultSlots: number;
  uniqueAdmittedSources: number;
  historicalAggregateStatus: "unverifiable-historical-aggregate";
  policy: string;
}>;

export type StellarProvenancePolicyV1 = Readonly<{
  firstRosterCount: 24;
  renderAnchorIdentityClaimAllowed: false;
  simbadSystemResolutionMayNotBindComponentIdentity: true;
  simbadIsMetaResolverNotCatalogue: true;
  simbadBasicDataMeasurementAdmissionAllowed: false;
  upstreamBibcodeIsNotIndependentMeasurementAdmission: true;
  schemaCompleteDoesNotImplyMeasurementAdmission: true;
  unknownFieldsBlockMeasurementAdmission: true;
  unknownAndSearchNotFoundAreNotZeroOrFalse: true;
  zeroParallaxIsNotPhysicalDistance: true;
  presentationOnly: true;
  scientificPayloadWriteback: false;
  observationTextureClaim: false;
  remotePsfRemainsPointLike: true;
  noRandomTwinkle: true;
}>;

type StellarProvenanceCandidateDocumentV1 = Readonly<{
  version: typeof STELLAR_PROVENANCE_CANDIDATE_VERSION;
  provenanceSchemaVersion: "post-v593-stellar-field-provenance-v2";
  source: StellarProvenanceCandidateSourceV1;
  searchAudit: StellarProvenanceSearchAuditV1;
  policy: StellarProvenancePolicyV1;
  fieldStatuses: readonly StellarProvenanceFieldStatusV2[];
  requiredFields: readonly StellarProvenanceFieldNameV1[];
  sourceRegistry: Readonly<Record<string, StellarProvenanceSourceV1>>;
  registryUseAudit: Readonly<{
    sourceCount: number;
    sourcesWithUseCount: number;
    removedUnusedAdsSourceCount: number;
    removedUnusedAdsSourceKeys: readonly string[];
    unusedSourceCount: number;
  }>;
  heroes: readonly StellarProvenanceHeroV1[];
}>;

const STELLAR_PROVENANCE_DOCUMENT =
  GENERATED_STELLAR_PROVENANCE_CANDIDATE as unknown as StellarProvenanceCandidateDocumentV1;

export const STELLAR_PROVENANCE_HERO_IDS_V1 = Object.freeze(
  STELLAR_PROVENANCE_DOCUMENT.heroes.map((hero) => hero.id),
);

export const STELLAR_PROVENANCE_HERO_BY_ID_V1 = Object.freeze(
  Object.fromEntries(STELLAR_PROVENANCE_DOCUMENT.heroes.map((hero) => [hero.id, hero])),
) as Readonly<Record<StellarHeroIdV592, StellarProvenanceHeroV1>>;

export const STELLAR_PROVENANCE_CANDIDATE = STELLAR_PROVENANCE_DOCUMENT;
export { STELLAR_PROVENANCE_CANDIDATE_SHA256 };
export const STELLAR_PROVENANCE_SOURCE_REGISTRY_V1 =
  STELLAR_PROVENANCE_DOCUMENT.sourceRegistry;

const REQUIRED_FIELDS = STELLAR_PROVENANCE_DOCUMENT.requiredFields;

export function isStellarHeroIdentityBoundV1(
  heroId: StellarHeroIdV592,
): boolean {
  return STELLAR_PROVENANCE_HERO_BY_ID_V1[heroId]?.identityStatus === "identity-bound";
}

export function getStellarProvenanceHeroV1(
  heroId: StellarHeroIdV592,
): StellarProvenanceHeroV1 {
  const hero = STELLAR_PROVENANCE_HERO_BY_ID_V1[heroId];
  if (!hero) throw new Error(`post-v593-stellar-provenance-hero:${heroId}`);
  return hero;
}

export function summarizeStellarProvenanceCandidateV1() {
  const heroes = STELLAR_PROVENANCE_DOCUMENT.heroes;
  const unknownRequiredFieldCount = heroes.reduce(
    (count, hero) => count + REQUIRED_FIELDS.filter((field) => hero.fields[field].status === "unknown").length,
    0,
  );
  const searchNotFoundRequiredFieldCount = heroes.reduce(
    (count, hero) => count + REQUIRED_FIELDS.filter((field) => hero.fields[field].status === "search-not-found").length,
    0,
  );
  return Object.freeze({
    version: STELLAR_PROVENANCE_CANDIDATE_VERSION,
    manifestSha256: STELLAR_PROVENANCE_CANDIDATE_SHA256,
    rosterCount: heroes.length,
    identityBoundCount: heroes.filter((hero) => hero.identityStatus === "identity-bound").length,
    renderAnchorOnlyCount: heroes.filter((hero) => hero.identityStatus === "render-anchor-only").length,
    schemaCompleteCount: heroes.filter((hero) => hero.schemaAdmission === "schema-complete").length,
    measurementAdmittedCount: heroes.filter((hero) => hero.measurementAdmission === "measurement-admitted").length,
    provenanceAdmittedCount: heroes.filter((hero) => hero.provenanceAdmission === "admitted").length,
    presentationAdmittedCount: heroes.filter((hero) => hero.presentationAdmission === "presentation-only-allowed").length,
    unknownRequiredFieldCount,
    searchNotFoundRequiredFieldCount,
    unknownOrSearchNotFoundRequiredFieldCount:
      unknownRequiredFieldCount + searchNotFoundRequiredFieldCount,
    scientificPayloadWriteback: false as const,
    measuredAuthorityGranted: false as const,
    productionReleaseAuthorized: false as const,
  });
}

export function validateStellarProvenanceCandidateV1(): void {
  if (STELLAR_PROVENANCE_DOCUMENT.version !== STELLAR_PROVENANCE_CANDIDATE_VERSION) {
    throw new Error("post-v593-stellar-provenance-version");
  }
  if (STELLAR_PROVENANCE_DOCUMENT.heroes.length !== 24) {
    throw new Error("post-v593-stellar-provenance-roster-count");
  }
  if (new Set(STELLAR_PROVENANCE_HERO_IDS_V1).size !== 24) {
    throw new Error("post-v593-stellar-provenance-duplicate-id");
  }
  if (
    STELLAR_PROVENANCE_DOCUMENT.provenanceSchemaVersion !==
      "post-v593-stellar-field-provenance-v2"
    || new Set(STELLAR_PROVENANCE_DOCUMENT.fieldStatuses).size !== 6
    || STELLAR_PROVENANCE_DOCUMENT.policy.simbadIsMetaResolverNotCatalogue !== true
    || STELLAR_PROVENANCE_DOCUMENT.policy.simbadBasicDataMeasurementAdmissionAllowed !== false
    || STELLAR_PROVENANCE_DOCUMENT.policy.upstreamBibcodeIsNotIndependentMeasurementAdmission !== true
  ) {
    throw new Error("post-v593-stellar-provenance-field-schema");
  }
  const sourceIdentities = new Set<string>();
  for (const [sourceKey, source] of Object.entries(STELLAR_PROVENANCE_SOURCE_REGISTRY_V1)) {
    if (
      !source.sourceRef
      || !source.dataRelease
      || !source.license
      || !source.citationStatus
      || !source.authorityScope
      || !Array.isArray(source.registryUse)
      || source.registryUse.length === 0
      || /wikipedia/i.test(`${source.sourceRef} ${source.sourceUrl ?? ""}`)
    ) {
      throw new Error(`post-v593-stellar-provenance-source:${sourceKey}`);
    }
    const identity = source.doi
      ? `doi:${source.doi.toLowerCase()}`
      : source.sourceUrl
        ? `url:${source.sourceUrl.toLowerCase()}`
        : `ref:${source.sourceRef}`;
    if (sourceIdentities.has(identity)) {
      throw new Error(`post-v593-stellar-provenance-duplicate-source:${sourceKey}`);
    }
    sourceIdentities.add(identity);
  }
  if (
    STELLAR_PROVENANCE_DOCUMENT.registryUseAudit.sourceCount
      !== Object.keys(STELLAR_PROVENANCE_SOURCE_REGISTRY_V1).length
    || STELLAR_PROVENANCE_DOCUMENT.registryUseAudit.sourcesWithUseCount
      !== STELLAR_PROVENANCE_DOCUMENT.registryUseAudit.sourceCount
    || STELLAR_PROVENANCE_DOCUMENT.registryUseAudit.unusedSourceCount !== 0
  ) {
    throw new Error("post-v593-stellar-provenance-registry-use-audit");
  }
  const fieldReferencedSourceKeys = new Set<string>();
  for (const hero of STELLAR_PROVENANCE_DOCUMENT.heroes) {
    if (hero.presentationOnly !== true || hero.scientificPayloadWriteback !== false) {
      throw new Error(`post-v593-stellar-provenance-authority:${hero.id}`);
    }
    if (
      hero.schemaAdmission !== "schema-complete"
      || hero.measurementAdmission !== "blocked-incomplete-measurement-provenance"
      || hero.identityBinding.gaiaRenderAnchorUsedForIdentity !== false
    ) {
      throw new Error(`post-v593-stellar-provenance-admission:${hero.id}`);
    }
    if (
      hero.identityStatus === "identity-bound"
      && hero.fields.identity.claim !== "identity-bound-simbad-exact-name-or-component-resolution"
    ) {
      throw new Error(`post-v593-stellar-provenance-identity-claim:${hero.id}`);
    }
    if (
      hero.identityStatus === "render-anchor-only"
      && (
        hero.fields.identity.status !== "search-not-found"
        || hero.fields.identity.value !== null
        || hero.identityBinding.confidence !== "insufficient-component-specific"
      )
    ) {
      throw new Error(`post-v593-stellar-provenance-anchor-claim:${hero.id}`);
    }
    for (const requiredField of REQUIRED_FIELDS) {
      if (!hero.fields[requiredField]) {
        throw new Error(`post-v593-stellar-provenance-required-field:${hero.id}:${requiredField}`);
      }
    }
    for (const [fieldName, field] of Object.entries(hero.fields)) {
      const source = STELLAR_PROVENANCE_SOURCE_REGISTRY_V1[field.sourceKey];
      fieldReferencedSourceKeys.add(field.sourceKey);
      if (
        !source
        || !field.sourceRef
        || !field.sourceVersion
        || !field.license
        || !field.citationStatus
        || !STELLAR_PROVENANCE_DOCUMENT.fieldStatuses.includes(field.status)
        || !Object.hasOwn(field, "value")
        || !Object.hasOwn(field, "unit")
        || !Object.hasOwn(field, "epoch")
        || !field.uncertainty
        || !Array.isArray(field.citations)
        || field.citations.length === 0
      ) {
        throw new Error(`post-v593-stellar-provenance-field-source:${hero.id}:${fieldName}`);
      }
      if (source.sourceRef !== field.sourceRef || source.dataRelease !== field.sourceVersion) {
        throw new Error(`post-v593-stellar-provenance-field-source-drift:${hero.id}:${fieldName}`);
      }
      if (
        String(field.authority) === "catalog"
        || (
          field.sourceKey === "simbad"
          && (
            field.measurementAdmitted
            || (field.status === "direct" && field.authority !== "meta-resolver-basic-data")
          )
        )
      ) {
        throw new Error(`post-v593-stellar-provenance-meta-resolver-authority:${hero.id}:${fieldName}`);
      }
      if (
        (field.status === "unknown" || field.status === "search-not-found")
        && field.value !== null
      ) {
        throw new Error(`post-v593-stellar-provenance-unknown-value:${hero.id}:${fieldName}`);
      }
      if (
        (field.status === "unknown"
          || field.status === "search-not-found"
          || field.status === "presentation-only")
        && field.measurementAdmitted
      ) {
        throw new Error(`post-v593-stellar-provenance-field-admission:${hero.id}:${fieldName}`);
      }
      for (const entry of field.citations) {
        if (!entry.sourceKey || !entry.role || !STELLAR_PROVENANCE_SOURCE_REGISTRY_V1[entry.sourceKey]) {
          throw new Error(`post-v593-stellar-provenance-field-citation:${hero.id}:${fieldName}`);
        }
        fieldReferencedSourceKeys.add(entry.sourceKey);
      }
    }
  }
  const allowedNonFieldRegistryUse = new Set([
    "derivation",
    "license-policy",
    "presentation-policy",
    "resolver-policy",
    "search-policy",
  ]);
  for (const [sourceKey, source] of Object.entries(STELLAR_PROVENANCE_SOURCE_REGISTRY_V1)) {
    if (
      !fieldReferencedSourceKeys.has(sourceKey)
      && !source.registryUse.some((use) => allowedNonFieldRegistryUse.has(use.kind))
    ) {
      throw new Error(`post-v593-stellar-provenance-unused-source:${sourceKey}`);
    }
  }
  const acrux = STELLAR_PROVENANCE_HERO_BY_ID_V1.acrux;
  if (
    acrux.fields.distance.status !== "search-not-found"
    || acrux.fields.distance.value !== null
    || !String(acrux.fields.distance.uncertainty.note).includes("zero")
  ) {
    throw new Error("post-v593-stellar-provenance-zero-parallax-boundary");
  }
  const achernarLuminosity = STELLAR_PROVENANCE_HERO_BY_ID_V1.achernar.fields.luminosity;
  const achernarLuminosityValue = achernarLuminosity.value as Readonly<Record<string, unknown>>;
  if (
    achernarLuminosity.unit !== "log10-solar-luminosity"
    || achernarLuminosityValue.log10Solar !== 3.48
    || Object.keys(achernarLuminosityValue).length !== 1
  ) {
    throw new Error("post-v593-stellar-provenance-achernar-luminosity-unit");
  }
}

validateStellarProvenanceCandidateV1();
