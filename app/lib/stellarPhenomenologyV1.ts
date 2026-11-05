import {
  getStellarProvenanceHeroV1,
  type StellarProvenanceAuthorityV1,
  type StellarProvenanceFieldStatusV2,
} from "./stellarProvenanceCandidate";
import {
  STELLAR_HEROES_V592,
  type StellarHeroIdV592,
  type StellarHeroV592,
} from "./stellarHeroesV592";
import { sha256Utf8HexV566 } from "./sha256BrowserV566";

export const STELLAR_PHENOMENOLOGY_V1_VERSION =
  "post-v593-stellar-phenomenology-v1" as const;

export type StellarPhenomenologyStateV1 =
  | "unknown"
  | "catalog-classified"
  | "pulsation-disabled-no-admitted-amplitude"
  | "binary-presentation-only";

export type StellarPhenomenologyVariabilityV1 = Readonly<{
  state: "unknown" | "catalog-classified";
  variableIdentifiers: readonly string[] | null;
  objectType: string | null;
  amplitude: null;
  periodDays: null;
  sourceKey: string;
  sourceRef: string;
  sourceVersion: string;
  sourceStatus: StellarProvenanceFieldStatusV2;
  sourceAuthority: StellarProvenanceAuthorityV1;
  measurementAdmitted: false;
  presentationOnly: true;
}>;

export type StellarPhenomenologyBinaryV1 = Readonly<{
  state: "binary-presentation-only" | "unknown";
  companionIds: readonly string[];
  sourceKey: string;
  sourceRef: string;
  sourceVersion: string;
  sourceStatus: StellarProvenanceFieldStatusV2;
  sourceAuthority: StellarProvenanceAuthorityV1;
  orbit: null;
  orbitalPeriodDays: null;
  measurementAdmitted: false;
  presentationOnly: true;
  deterministicLayout: true;
}>;

export type StellarPhenomenologyV1 = Readonly<{
  version: typeof STELLAR_PHENOMENOLOGY_V1_VERSION;
  heroId: StellarHeroIdV592;
  states: readonly StellarPhenomenologyStateV1[];
  variability: StellarPhenomenologyVariabilityV1;
  binary: StellarPhenomenologyBinaryV1;
  pulsation: Readonly<{
    state: "pulsation-disabled-no-admitted-amplitude";
    enabled: false;
    amplitude: null;
    periodDays: null;
    reason: "no-admitted-amplitude-or-period";
    presentationOnly: true;
    measurementAuthorityGranted: false;
  }>;
  presentationOnly: true;
  scientificPayloadWriteback: false;
  measurementAuthorityGranted: false;
  deterministicKey: string;
  contractSha256: string;
}>;

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

function canonicalize(value: unknown): JsonValue {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    );
  }
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new Error("v1-stellar-phenomenology-non-canonical-value");
}

function canonicalSha(value: unknown): string {
  return sha256Utf8HexV566(JSON.stringify(canonicalize(value)));
}

function sourceMetadata(field: {
  sourceKey: string;
  sourceRef: string;
  sourceVersion: string;
  status: StellarProvenanceFieldStatusV2;
  authority: StellarProvenanceAuthorityV1;
}) {
  return {
    sourceKey: field.sourceKey,
    sourceRef: field.sourceRef,
    sourceVersion: field.sourceVersion,
    sourceStatus: field.status,
    sourceAuthority: field.authority,
  } as const;
}

function variabilityFor(hero: StellarHeroV592): StellarPhenomenologyVariabilityV1 {
  const field = getStellarProvenanceHeroV1(hero.id).fields.variability;
  const raw = field.value;
  const classified = field.status === "direct"
    && isRecord(raw)
    && Array.isArray(raw.variableIdentifiers)
    && raw.variableIdentifiers.length > 0
    && raw.variableIdentifiers.every((id) => typeof id === "string" && id.length > 0)
    && (raw.objectType === null || typeof raw.objectType === "string");
  const metadata = sourceMetadata(field);
  return deepFreeze({
    state: classified ? "catalog-classified" : "unknown",
    variableIdentifiers: classified ? [...(raw as { variableIdentifiers: string[] }).variableIdentifiers] : null,
    objectType: classified && typeof (raw as { objectType?: unknown }).objectType === "string"
      ? (raw as { objectType: string }).objectType
      : null,
    amplitude: null,
    periodDays: null,
    ...metadata,
    measurementAdmitted: false,
    presentationOnly: true,
  });
}

function binaryFor(hero: StellarHeroV592): StellarPhenomenologyBinaryV1 {
  const field = getStellarProvenanceHeroV1(hero.id).fields.companions;
  const details = isRecord(field.details) ? field.details : null;
  const rawIds = details?.packetCompanionIdsPresentationOnly;
  const ids = Array.isArray(rawIds)
    && rawIds.length > 0
    && rawIds.every((id) => typeof id === "string" && id.length > 0)
    ? [...rawIds as string[]]
    : [];
  const admitted = field.status === "direct" && ids.length > 0;
  const metadata = sourceMetadata(field);
  return deepFreeze({
    state: admitted ? "binary-presentation-only" : "unknown",
    companionIds: ids,
    ...metadata,
    orbit: null,
    orbitalPeriodDays: null,
    measurementAdmitted: false,
    presentationOnly: true,
    deterministicLayout: true,
  });
}

export function computeStellarPhenomenologySha256V1(
  value: Omit<StellarPhenomenologyV1, "contractSha256">,
): string {
  return canonicalSha(value);
}

export function createStellarPhenomenologyV1(hero: StellarHeroV592): StellarPhenomenologyV1 {
  const variability = variabilityFor(hero);
  const binary = binaryFor(hero);
  const states: StellarPhenomenologyStateV1[] = [variability.state];
  if (variability.state === "unknown" && !states.includes("unknown")) states.push("unknown");
  states.push("pulsation-disabled-no-admitted-amplitude");
  if (binary.state === "binary-presentation-only") states.push(binary.state);
  const pulsation = {
    state: "pulsation-disabled-no-admitted-amplitude" as const,
    enabled: false as const,
    amplitude: null,
    periodDays: null,
    reason: "no-admitted-amplitude-or-period" as const,
    presentationOnly: true as const,
    measurementAuthorityGranted: false as const,
  };
  const deterministicKey = [
    hero.id,
    variability.sourceKey,
    variability.sourceVersion,
    variability.variableIdentifiers?.join(",") ?? "unknown",
    variability.objectType ?? "unknown",
    binary.sourceKey,
    binary.sourceVersion,
    binary.companionIds.join(",") || "unknown",
  ].join("|");
  const unsigned = {
    version: STELLAR_PHENOMENOLOGY_V1_VERSION,
    heroId: hero.id,
    states: Object.freeze(states) as readonly StellarPhenomenologyStateV1[],
    variability,
    binary,
    pulsation,
    presentationOnly: true as const,
    scientificPayloadWriteback: false as const,
    measurementAuthorityGranted: false as const,
    deterministicKey,
  } satisfies Omit<StellarPhenomenologyV1, "contractSha256">;
  return deepFreeze({ ...unsigned, contractSha256: computeStellarPhenomenologySha256V1(unsigned) });
}

export function createStellarPhenomenologyByIdV1(heroId: StellarHeroIdV592): StellarPhenomenologyV1 {
  const hero = STELLAR_HEROES_V592.find((candidate) => candidate.id === heroId);
  if (!hero) throw new Error(`v1-stellar-phenomenology-hero:${heroId}`);
  return createStellarPhenomenologyV1(hero);
}

export function createStellarPhenomenologyCatalogV1(): readonly StellarPhenomenologyV1[] {
  return deepFreeze(STELLAR_HEROES_V592.map(createStellarPhenomenologyV1));
}

export function validateStellarPhenomenologyV1(value: StellarPhenomenologyV1): void {
  if (!isRecord(value) || value.version !== STELLAR_PHENOMENOLOGY_V1_VERSION
    || !value.heroId || value.presentationOnly !== true
    || value.scientificPayloadWriteback !== false
    || value.measurementAuthorityGranted !== false) {
    throw new Error("v1-stellar-phenomenology-authority");
  }
  const unsigned = { ...value } as Record<string, unknown>;
  delete unsigned.contractSha256;
  const expected = canonicalSha(unsigned);
  if (expected !== value.contractSha256) throw new Error("v1-stellar-phenomenology-contract-sha");
  const variability = value.variability;
  if (!variability || variability.presentationOnly !== true || variability.measurementAdmitted !== false
    || variability.amplitude !== null || variability.periodDays !== null
    || (variability.state === "unknown" && variability.variableIdentifiers !== null)
    || (variability.state === "catalog-classified"
      && (!Array.isArray(variability.variableIdentifiers) || variability.variableIdentifiers.length === 0))) {
    throw new Error(`v1-stellar-phenomenology-variability:${value.heroId}`);
  }
  const binary = value.binary;
  if (!binary || binary.presentationOnly !== true || binary.deterministicLayout !== true
    || binary.measurementAdmitted !== false || binary.orbit !== null
    || binary.orbitalPeriodDays !== null
    || (binary.state === "binary-presentation-only" && binary.companionIds.length === 0)
    || (binary.state === "unknown" && binary.companionIds.length !== 0)) {
    throw new Error(`v1-stellar-phenomenology-binary:${value.heroId}`);
  }
  if (value.pulsation.state !== "pulsation-disabled-no-admitted-amplitude"
    || value.pulsation.enabled !== false || value.pulsation.amplitude !== null
    || value.pulsation.periodDays !== null || value.pulsation.presentationOnly !== true
    || value.pulsation.measurementAuthorityGranted !== false) {
    throw new Error(`v1-stellar-phenomenology-pulsation:${value.heroId}`);
  }
  if (!Array.isArray(value.states)
    || !value.states.includes(value.variability.state)
    || !value.states.includes("pulsation-disabled-no-admitted-amplitude")
    || (value.binary.state === "binary-presentation-only"
      && !value.states.includes("binary-presentation-only"))) {
    throw new Error(`v1-stellar-phenomenology-states:${value.heroId}`);
  }
}

export function validateStellarPhenomenologyCatalogV1(
  values: readonly StellarPhenomenologyV1[] = createStellarPhenomenologyCatalogV1(),
): void {
  if (values.length !== 24 || new Set(values.map((value) => value.heroId)).size !== values.length) {
    throw new Error("v1-stellar-phenomenology-catalog-roster");
  }
  for (const value of values) validateStellarPhenomenologyV1(value);
}

export function summarizeStellarPhenomenologyV1(
  values: readonly StellarPhenomenologyV1[] = createStellarPhenomenologyCatalogV1(),
) {
  validateStellarPhenomenologyCatalogV1(values);
  return Object.freeze({
    rosterCount: values.length,
    uniqueHeroCount: new Set(values.map((value) => value.heroId)).size,
    unknownVariabilityCount: values.filter((value) => value.variability.state === "unknown").length,
    catalogClassifiedVariabilityCount: values.filter((value) => value.variability.state === "catalog-classified").length,
    pulsationDisabledCount: values.filter((value) => !value.pulsation.enabled).length,
    binaryPresentationCount: values.filter((value) => value.binary.state === "binary-presentation-only").length,
    binaryUnknownCount: values.filter((value) => value.binary.state === "unknown").length,
    measurementAuthorityGrantedCount: 0 as const,
    orbitClaimCount: 0 as const,
    valid: true as const,
  });
}

validateStellarPhenomenologyCatalogV1();
