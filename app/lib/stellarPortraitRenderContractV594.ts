import type { StellarMaterialProfile } from "./stellarMaterialProfile";
import {
  createStellarPortraitProfileV7,
  type StellarPortraitProfileV7,
} from "./stellarPortraitProfileV7";
import {
  createStellarArchetypeProfileV1,
  type StellarArchetypeV1,
  type StellarSurfaceTopologyV1,
  type StellarVisualSignatureV1,
} from "./stellarArchetypeProfileV1";
import {
  createStellarPhenomenologyV1,
  STELLAR_PHENOMENOLOGY_V1_VERSION,
  type StellarPhenomenologyV1,
} from "./stellarPhenomenologyV1";
import {
  getStellarProvenanceHeroV1,
  STELLAR_PROVENANCE_CANDIDATE_SHA256,
  type StellarProvenanceAuthorityV1,
  type StellarProvenanceFieldNameV1,
  type StellarProvenanceFieldV1,
} from "./stellarProvenanceCandidate";
import {
  STELLAR_HERO_PACKET_SHA256_V592,
  type StellarHeroV592,
  type StellarHeroIdV592,
} from "./stellarHeroesV592";
import { JULIAN_DATE_J2000_V592 } from "./celestialClockV592";
import { sha256Utf8HexV566 } from "./sha256BrowserV566";

export const STELLAR_PORTRAIT_RENDER_CONTRACT_V594_VERSION =
  "v594-stellar-portrait-render-contract-v1" as const;
export const STELLAR_PORTRAIT_PROFILE_V594_VERSION =
  "v594-stellar-portrait-profile-v1" as const;

export type StellarPortraitRenderModeV594 = "science" | "cinematic";
export type StellarPortraitRenderKnownStateV594 =
  | "available"
  | "unknown"
  | "derived-presentation";

export type StellarPortraitFieldDerivationV594 = Readonly<{
  kind: "source-exact" | "presentation-derived" | "unknown";
  inputs: Readonly<Record<string, string | number | boolean | null>>;
  formula: string | null;
  sourceMeasurementAdmitted: boolean;
  measurementAuthorityGranted: false;
}>;

export type StellarPortraitRenderFieldV594<Value> = Readonly<{
  value: Value | null;
  knownState: StellarPortraitRenderKnownStateV594;
  authority: StellarProvenanceAuthorityV1;
  sourceKey: string;
  sourceRef: string;
  sourceVersion: string;
  claim: string;
  derivation: StellarPortraitFieldDerivationV594;
}>;

export type StellarPortraitOrientationV594 = Readonly<{
  inclinationDeg: number;
  polePositionAngleEastOfNorthDeg: number;
  modelScope: "primary-literature-scoped-axis-metadata-for-presentation";
}>;

export type StellarPortraitCompanionEntryV594 = Readonly<{
  id: string;
  enabled: boolean;
  presentationOnly: true;
  authoritative: false;
  positionNormalized: readonly [number, number, number];
  radiusScale: number;
  derivation: "deterministic-layout-without-orbital-claim";
}>;

export type StellarPortraitRenderContractV594 = Readonly<{
  version: typeof STELLAR_PORTRAIT_RENDER_CONTRACT_V594_VERSION;
  heroId: StellarHeroIdV592;
  heroName: string;
  archetype: StellarArchetypeV1;
  mode: StellarPortraitRenderModeV594;
  authoritative: false;
  authority: Readonly<{
    presentationOnly: true;
    resolvedSurface: false;
    observationTexture: false;
    measuredAuthorityGranted: false;
    scientificPayloadWriteback: false;
    boundary: "parameter-derived-display-not-resolved-surface";
  }>;
  identity: Readonly<{
    stellarHeroPacketSha256: string;
    provenanceCandidateSha256: string;
    identityStatus: "identity-bound" | "render-anchor-only";
    provenanceAdmission: "admitted" | "blocked-incomplete-field-provenance";
    presentationAdmission: "presentation-only-allowed";
  }>;
  fields: Readonly<{
    identity: StellarPortraitRenderFieldV594<string>;
    temperatureK: StellarPortraitRenderFieldV594<number>;
    radiusSolar: StellarPortraitRenderFieldV594<number>;
    spectralType: StellarPortraitRenderFieldV594<string>;
    rotationPeriodDays: StellarPortraitRenderFieldV594<number>;
    orientation: StellarPortraitRenderFieldV594<StellarPortraitOrientationV594>;
    variability: StellarPortraitRenderFieldV594<boolean>;
    companions: StellarPortraitRenderFieldV594<readonly string[]>;
    photosphere: StellarPortraitRenderFieldV594<string>;
    equatorialPolarRadiusRatio: StellarPortraitRenderFieldV594<number>;
    gravityDarkening: StellarPortraitRenderFieldV594<number>;
    granulationOctaves: StellarPortraitRenderFieldV594<3 | 4 | 5>;
    windStrength: StellarPortraitRenderFieldV594<number>;
    evolutionPeriodDays: StellarPortraitRenderFieldV594<number>;
  }>;
  classificationMetadata: Readonly<{
    metadataOnly: true;
    sourceShaderProfile: string;
    granulationArchetype: StellarArchetypeV1;
    phenomenologyVersion: string;
  }>;
  /** Cross-cutting variable/pulsation/binary state; never scientific authority. */
  phenomenology: StellarPhenomenologyV1;
  deterministicSeed: number;
  geometry: Readonly<{
    primitive: "oblate-sphere";
    scale: readonly [number, number, number];
    signature: string;
    axisRatio: number;
    axisRatioBasis:
      | "primary-literature-scoped-model"
      | "v592-presentation-fallback";
    radiusPolicy: "inspection-normalized-not-physical-distance-scale";
  }>;
  visualSignature: Readonly<{
    id: string;
    topology: StellarSurfaceTopologyV1;
    signaturePhaseRad: number;
    signatureFrequency: number;
    cellAnisotropy: number;
    radiativeBandStrength: number;
    convectiveCellStrength: number;
    windFilamentStrength: number;
    polarRadiance: number;
    equatorialShade: number;
    presentationOnly: true;
    observationTexture: false;
    measurementAuthorityGranted: false;
    derivation: "archetype-and-source-scoped-presentation-visual-signature";
  }>;
  surface: Readonly<{
    enabled: true;
    linearOutput: boolean;
    hotFactor: number;
    giantFactor: number;
    rapidRotatorFactor: number;
    granulation: Readonly<{
      octaves: 3 | 4 | 5;
      scale: number;
      contrast: number;
      spotCoverage: number;
      faculaStrength: number;
      limbDarkening: number;
    }>;
    gravityDarkening: number;
    rotation: Readonly<{
      periodDays: number;
      j2000PhaseRad: 0;
      phasePolicy: "absolute-julian-date-relative-to-j2000-reversible";
      orientationMetadata: StellarPortraitOrientationV594 | null;
      orientationApplication: "metadata-only-no-camera-world-convention";
    }>;
    evolution: Readonly<{
      periodDays: number;
      j2000PhaseRad: number;
      phasePolicy: "absolute-julian-date-deterministic-presentation-evolution";
    }>;
    pulsation: Readonly<{
      enabled: boolean;
      amplitude: number | null;
      reason:
        | "disabled-unknown-variability"
        | "disabled-classification-only-no-admitted-amplitude"
        | "disabled-no-admitted-amplitude"
        | "enabled-admitted-variability";
    }>;
  }>;
  corona: Readonly<{
    enabled: boolean;
    windEnabled: boolean;
    strength: number;
    falloff: number;
    windStrength: number;
    presentationOnly: true;
  }>;
  halo: Readonly<{
    enabled: boolean;
    strength: number;
    presentationOnly: true;
  }>;
  companions: Readonly<{
    enabled: boolean;
    presentationOnly: true;
    entries: readonly StellarPortraitCompanionEntryV594[];
    reason:
      | "enabled-curated-presentation-only"
      | "disabled-science-mode"
      | "disabled-unknown-companions"
      | "disabled-no-companions";
  }>;
  contractSha256: string;
}>;

export type StellarPortraitVisualSignatureProfileV594 = Readonly<{
  signaturePhaseRad: number;
  signatureFrequency: number;
  cellAnisotropy: number;
  radiativeBandStrength: number;
  convectiveCellStrength: number;
  windFilamentStrength: number;
  polarRadiance: number;
  equatorialShade: number;
}>;

export type StellarPortraitProfileV594 = Omit<
  StellarPortraitProfileV7,
  | "version"
  | "surfaceDetailOctaves"
  | "drawCallBudget"
  | "parameterSource"
  | "derivation"
> & Readonly<{
  version: typeof STELLAR_PORTRAIT_PROFILE_V594_VERSION;
  surfaceDetailOctaves: 3 | 4 | 5;
  drawCallBudget: number;
  parameterSource: "v592-hero-provenance-render-contract";
  gravityDarkening: number;
  hotFactor: number;
  giantFactor: number;
  rapidRotatorFactor: number;
  windStrength: number;
  visualSignature: StellarPortraitVisualSignatureProfileV594;
  pulsationAmplitude: number;
  renderContractSha256: string;
  renderMode: StellarPortraitRenderModeV594;
  authoritative: false;
  derivation: "v594-contract-driven-parameter-display-not-resolved-surface";
}>;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, digits = 8): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function stableUnitInterval(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0) / 0xffff_ffff;
}

function canonicalize(value: unknown): unknown {
  if (value === undefined) throw new Error("v594-stellar-contract-undefined");
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error("v594-stellar-contract-non-finite");
  }
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => [
        key,
        canonicalize((value as Record<string, unknown>)[key]),
      ]),
  );
}

function deepFreeze<Value>(value: Value): Value {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const entry of Object.values(value as Record<string, unknown>)) {
    deepFreeze(entry);
  }
  return Object.freeze(value);
}

export function canonicalSerializeStellarPortraitRenderContractV594(
  value: unknown,
): string {
  return JSON.stringify(canonicalize(value));
}

export function computeStellarPortraitRenderContractSha256V594(
  value: Omit<StellarPortraitRenderContractV594, "contractSha256">
    | StellarPortraitRenderContractV594,
): string {
  const unsigned = { ...value } as Record<string, unknown>;
  delete unsigned.contractSha256;
  return sha256Utf8HexV566(
    canonicalSerializeStellarPortraitRenderContractV594(unsigned),
  );
}

function sourceValueAvailable(source: StellarProvenanceFieldV1): boolean {
  return source.authority !== "unknown"
    && source.status !== "unknown"
    && source.status !== "search-not-found";
}

function exactSourceField<Value>(
  source: StellarProvenanceFieldV1,
  value: Value | null,
  sourceValuePath = "value",
): StellarPortraitRenderFieldV594<Value> {
  const available = sourceValueAvailable(source) && value !== null;
  return Object.freeze({
    value: available ? value : null,
    knownState: available ? "available" : "unknown",
    authority: source.authority,
    sourceKey: source.sourceKey,
    sourceRef: source.sourceRef,
    sourceVersion: source.sourceVersion,
    claim: source.claim,
    derivation: Object.freeze({
      kind: available ? "source-exact" : "unknown",
      inputs: Object.freeze({ sourceValuePath }),
      formula: null,
      sourceMeasurementAdmitted: available && source.measurementAdmitted,
      measurementAuthorityGranted: false,
    }),
  });
}

function presentationField<Value>(
  value: Value,
  claim: string,
  sourceVersion: string,
  inputs: Readonly<Record<string, string | number | boolean | null>>,
  formula: string,
  sourceMeasurementAdmitted = false,
): StellarPortraitRenderFieldV594<Value> {
  return Object.freeze({
    value,
    knownState: "derived-presentation",
    authority: "presentation-only",
    sourceKey: "v594-stellar-render-model",
    sourceRef: "v592-hero-packet+post-v593-archetype-profile",
    sourceVersion,
    claim,
    derivation: Object.freeze({
      kind: "presentation-derived",
      inputs: Object.freeze({ ...inputs }),
      formula,
      sourceMeasurementAdmitted,
      measurementAuthorityGranted: false,
    }),
  });
}

function sourcedPresentationField<Value>(
  value: Value,
  source: StellarProvenanceFieldV1,
  claim: string,
  inputs: Readonly<Record<string, string | number | boolean | null>>,
  formula: string,
): StellarPortraitRenderFieldV594<Value> {
  return Object.freeze({
    value,
    knownState: "derived-presentation",
    authority: "presentation-only",
    sourceKey: source.sourceKey,
    sourceRef: source.sourceRef,
    sourceVersion: source.sourceVersion,
    claim,
    derivation: Object.freeze({
      kind: "presentation-derived",
      inputs: Object.freeze({ ...inputs }),
      formula,
      sourceMeasurementAdmitted: source.measurementAdmitted,
      measurementAuthorityGranted: false,
    }),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function portraitTemperatureField(
  hero: StellarHeroV592,
  source: StellarProvenanceFieldV1,
): StellarPortraitRenderFieldV594<number> {
  if (sourceValueAvailable(source) && finiteNumber(source.value)) {
    return exactSourceField(source, source.value);
  }
  if (sourceValueAvailable(source) && isRecord(source.value)) {
    const surfaceAverageK = source.value.surfaceAverageK;
    if (finiteNumber(surfaceAverageK)) {
      return exactSourceField(source, surfaceAverageK, "value.surfaceAverageK");
    }
    const polarK = source.value.polarK;
    const equatorialK = source.value.equatorialK;
    if (finiteNumber(polarK) && finiteNumber(equatorialK)) {
      return sourcedPresentationField(
        round((polarK + equatorialK) / 2),
        source,
        "primary-literature-polar-equatorial-mean-temperature-for-presentation",
        { polarK, equatorialK },
        "temperatureK = (polarK + equatorialK) / 2",
      );
    }
  }
  return presentationField(
    hero.temperatureK,
    "v592-temperature-presentation-fallback",
    STELLAR_HERO_PACKET_SHA256_V592,
    { heroTemperatureK: hero.temperatureK },
    "temperatureK = heroTemperatureK",
  );
}

function portraitRadiusField(
  hero: StellarHeroV592,
  source: StellarProvenanceFieldV1,
): StellarPortraitRenderFieldV594<number> {
  if (sourceValueAvailable(source) && finiteNumber(source.value)) {
    return exactSourceField(source, source.value);
  }
  if (sourceValueAvailable(source) && isRecord(source.value)) {
    const polarSolar = source.value.polarSolar;
    const equatorialSolar = source.value.equatorialSolar;
    if (finiteNumber(polarSolar) && finiteNumber(equatorialSolar)) {
      return sourcedPresentationField(
        round(Math.cbrt(equatorialSolar * equatorialSolar * polarSolar)),
        source,
        "primary-literature-volume-equivalent-radius-for-presentation",
        { polarSolar, equatorialSolar },
        "radiusSolar = cbrt(equatorialSolar^2 * polarSolar)",
      );
    }
  }
  return presentationField(
    hero.radiusSolar,
    "v592-radius-presentation-fallback",
    STELLAR_HERO_PACKET_SHA256_V592,
    { heroRadiusSolar: hero.radiusSolar },
    "radiusSolar = heroRadiusSolar",
  );
}

function portraitIdentityField(
  provenance: ReturnType<typeof getStellarProvenanceHeroV1>,
): StellarPortraitRenderFieldV594<string> {
  const source = provenance.fields.identity;
  const sourceMainId = isRecord(source.value) && typeof source.value.mainId === "string"
    ? source.value.mainId
    : null;
  if (sourceMainId && sourceMainId !== provenance.identityBinding.resolvedMainId) {
    throw new Error(`v594-stellar-identity-binding:${provenance.id}`);
  }
  if (sourceMainId && sourceValueAvailable(source)) {
    return exactSourceField(source, sourceMainId, "value.mainId");
  }
  return sourcedPresentationField(
    provenance.identityBinding.resolvedMainId,
    source,
    "resolved-main-id-selected-from-sealed-identity-binding",
    {
      resolvedMainId: provenance.identityBinding.resolvedMainId,
      queryId: provenance.identityBinding.queryId,
    },
    "identity = identityBinding.resolvedMainId",
  );
}

function sourceStringOrPresentationField(
  source: StellarProvenanceFieldV1,
  fallbackValue: string,
  fallbackClaim: string,
): StellarPortraitRenderFieldV594<string> {
  if (sourceValueAvailable(source) && typeof source.value === "string") {
    return exactSourceField(source, source.value);
  }
  return presentationField(
    fallbackValue,
    fallbackClaim,
    STELLAR_HERO_PACKET_SHA256_V592,
    { fallbackValue },
    "value = v592 presentation fallback",
  );
}

function portraitRotationPeriodField(
  hero: StellarHeroV592,
  visualSignature: StellarVisualSignatureV1,
  source: StellarProvenanceFieldV1,
): StellarPortraitRenderFieldV594<number> {
  if (sourceValueAvailable(source)
    && visualSignature.rotationPeriodBasis === "primary-literature-scoped-model"
    && isRecord(source.value)) {
    const periodDays = source.value.periodDays;
    if (finiteNumber(periodDays)) {
      if (Math.abs(periodDays - visualSignature.rotationPeriodDays) > 1e-8) {
        throw new Error(`v594-stellar-rotation-source-days:${hero.id}`);
      }
      return exactSourceField(source, periodDays, "value.periodDays");
    }
    const periodHours = source.value.periodHours;
    if (finiteNumber(periodHours)) {
      const convertedDays = round(periodHours / 24);
      if (Math.abs(convertedDays - visualSignature.rotationPeriodDays) > 1e-8) {
        throw new Error(`v594-stellar-rotation-source-hours:${hero.id}`);
      }
      return sourcedPresentationField(
        convertedDays,
        source,
        "primary-literature-model-period-hours-converted-to-days-for-presentation",
        { periodHours, hoursPerDay: 24 },
        "rotationPeriodDays = periodHours / hoursPerDay",
      );
    }
  }
  return presentationField(
    hero.rotationPeriodDays,
    "v592-rotation-period-presentation-fallback",
    STELLAR_HERO_PACKET_SHA256_V592,
    { heroRotationPeriodDays: hero.rotationPeriodDays },
    "rotationPeriodDays = heroRotationPeriodDays",
  );
}

function portraitAxisRatioField(
  hero: StellarHeroV592,
  visualSignature: StellarVisualSignatureV1,
  source: StellarProvenanceFieldV1,
): StellarPortraitRenderFieldV594<number> {
  if (sourceValueAvailable(source)
    && visualSignature.axisRatioBasis === "primary-literature-scoped-model"
    && isRecord(source.value)) {
    const polarSolar = source.value.polarSolar;
    const equatorialSolar = source.value.equatorialSolar;
    const sealedRatio = source.value.equatorialPolarRatio;
    if (finiteNumber(sealedRatio)) {
      if (Math.abs(sealedRatio - visualSignature.axisRatio) > 1e-8) {
        throw new Error(`v594-stellar-axis-ratio-sealed:${hero.id}`);
      }
      return exactSourceField(source, sealedRatio, "value.equatorialPolarRatio");
    }
    if (finiteNumber(polarSolar) && finiteNumber(equatorialSolar)) {
      const ratio = round(equatorialSolar / polarSolar);
      if (Math.abs(ratio - visualSignature.axisRatio) > 1e-5) {
        throw new Error(`v594-stellar-axis-ratio-source:${hero.id}`);
      }
      return sourcedPresentationField(
        visualSignature.axisRatio,
        source,
        "primary-literature-axis-ratio-projected-to-inspection-geometry",
        {
          polarSolar,
          equatorialSolar,
          sealedEquatorialPolarRatio: null,
        },
        "axisRatio = equatorialSolar / polarSolar",
      );
    }
  }
  return presentationField(
    visualSignature.axisRatio,
    "v592-axis-ratio-inspection-geometry-fallback",
    STELLAR_HERO_PACKET_SHA256_V592,
    { heroAxisRatio: hero.equatorialPolarRadiusRatio },
    "axisRatio = heroAxisRatio",
  );
}

function granulationScale(archetype: StellarArchetypeV1): number {
  switch (archetype) {
    case "blue-supergiant-wind": return 8.5;
    case "red-giant-supergiant": return 7;
    case "cool-convective": return 10.5;
    case "solar-like-convective": return 17;
    case "warm-radiative-convective": return 22;
    case "rapid-rotator-gravity-darkened": return 27;
    case "hot-radiative": return 31;
  }
}

function geometrySignature(scale: readonly [number, number, number]): string {
  return `oblate-sphere:${scale.map((value) => value.toFixed(9)).join(":")}`;
}

function inspectionScaleFromAxisRatio(
  ratio: number,
): readonly [number, number, number] {
  if (!Number.isFinite(ratio) || ratio < 1 || ratio > 2) {
    throw new Error("v594-stellar-contract-axis-ratio");
  }
  const normalization = ratio ** (-2 / 3);
  return Object.freeze([
    ratio * normalization,
    normalization,
    ratio * normalization,
  ]) as readonly [number, number, number];
}

function companionEntries(
  hero: StellarHeroV592,
  mode: StellarPortraitRenderModeV594,
  admitted: boolean,
): readonly StellarPortraitCompanionEntryV594[] {
  return Object.freeze(hero.companions.map((id, index) => {
    const seed = stableUnitInterval(`${hero.id}:${id}:${index}`);
    const angle = seed * Math.PI * 2;
    const orbitRadius = 1.55 + seed * 0.5;
    const vertical = (stableUnitInterval(`${id}:inclination`) - 0.5) * 0.36;
    return Object.freeze({
      id,
      enabled: mode === "cinematic" && admitted,
      presentationOnly: true,
      authoritative: false,
      positionNormalized: Object.freeze([
        round(Math.cos(angle) * orbitRadius, 6),
        round(vertical, 6),
        round(Math.sin(angle) * orbitRadius, 6),
      ]) as readonly [number, number, number],
      radiusScale: round(0.08 + seed * 0.06, 6),
      derivation: "deterministic-layout-without-orbital-claim",
    });
  }));
}

function requireFieldValue<Value>(
  fieldName: StellarProvenanceFieldNameV1 | string,
  field: StellarPortraitRenderFieldV594<Value>,
): Value {
  if (field.value === null) throw new Error(`v594-stellar-contract-field:${fieldName}`);
  return field.value;
}

export function createStellarPortraitRenderContractV594(
  hero: StellarHeroV592,
  mode: StellarPortraitRenderModeV594,
): StellarPortraitRenderContractV594 {
  const provenance = getStellarProvenanceHeroV1(hero.id);
  const archetype = createStellarArchetypeProfileV1(hero);
  const phenomenology = createStellarPhenomenologyV1(hero);
  const visualSignature = archetype.visualSignature;
  const scale = inspectionScaleFromAxisRatio(visualSignature.axisRatio);
  const identity = portraitIdentityField(provenance);
  const temperatureK = portraitTemperatureField(hero, provenance.fields.temperature);
  const radiusSolar = portraitRadiusField(hero, provenance.fields.radius);
  const spectralType = sourceStringOrPresentationField(
    provenance.fields.spectralType,
    hero.spectralType,
    "v592-spectral-type-presentation-fallback",
  );
  const rotationPeriodDays = portraitRotationPeriodField(
    hero,
    visualSignature,
    provenance.fields.rotation,
  );
  const companionIds = phenomenology.binary.companionIds;
  const companions = phenomenology.binary.state === "binary-presentation-only"
    ? sourcedPresentationField(
        Object.freeze([...companionIds]) as readonly string[],
        provenance.fields.companions,
        "identity-bound-companion-identifiers-retained-for-presentation-only",
        {
          companionCount: companionIds.length,
          orbitClaim: false,
          deterministicLayout: true,
        },
        "companions = admitted provenance companion presentation IDs; no orbital solution",
      )
    : presentationField(
        Object.freeze([]) as readonly string[],
        "companions-unknown-no-presentation-identifiers-admitted",
        STELLAR_PHENOMENOLOGY_V1_VERSION,
        { companionCount: 0, orbitClaim: false },
        "companions = [] when component/presentation identity is not admitted",
      );
  const orientationValue = visualSignature.orientation.knownState === "available"
    && visualSignature.orientation.inclinationDeg !== null
    && visualSignature.orientation.polePositionAngleEastOfNorthDeg !== null
    ? Object.freeze({
        inclinationDeg: visualSignature.orientation.inclinationDeg,
        polePositionAngleEastOfNorthDeg:
          visualSignature.orientation.polePositionAngleEastOfNorthDeg,
        modelScope: "primary-literature-scoped-axis-metadata-for-presentation" as const,
      })
    : null;
  const orientation = orientationValue
    ? sourcedPresentationField(
        orientationValue,
        provenance.fields.orientation,
        "primary-literature-axis-retained-as-metadata-only-for-presentation",
        {
          inclinationExactDeg:
            visualSignature.orientation.derivationInputs.inclinationExactDeg,
          inclinationLowerDeg:
            visualSignature.orientation.derivationInputs.inclinationLowerDeg,
          inclinationUpperDeg:
            visualSignature.orientation.derivationInputs.inclinationUpperDeg,
          polePositionAngleEastOfNorthDeg:
            visualSignature.orientation.derivationInputs.polePositionAngleEastOfNorthDeg,
          renderApplication: visualSignature.orientation.renderApplication,
        },
        visualSignature.orientation.derivationFormula
          ?? "preserve admitted source axis as metadata only",
      )
    : exactSourceField<StellarPortraitOrientationV594>(
        provenance.fields.orientation,
        null,
      );
  // The current packet has no explicit boolean or cited amplitude.  A future
  // non-unknown authority alone must not silently become `true`.
  const variability = typeof provenance.fields.variability.value === "boolean"
    ? exactSourceField(
        provenance.fields.variability,
        provenance.fields.variability.value,
      )
    : exactSourceField<boolean>(provenance.fields.variability, null);
  const photosphere = sourceStringOrPresentationField(
    provenance.fields.photosphere,
    hero.shaderProfile,
    "v592-photosphere-classification-presentation-fallback",
  );
  const ratio = portraitAxisRatioField(hero, visualSignature, provenance.fields.radius);
  const gravityDarkening = presentationField(
    archetype.gravityDarkening,
    "archetype-derived-gravity-darkening-display-parameter",
    archetype.version,
    {
      axisRatio: visualSignature.axisRatio,
      axisRatioBasis: visualSignature.axisRatioBasis,
    },
    "gravityDarkening = bounded archetype display function of axis ratio and admitted beta",
  );
  const octaves = presentationField(
    archetype.granulationOctaves,
    "archetype-derived-granulation-octave-budget",
    archetype.version,
    { archetype: archetype.archetype },
    "granulationOctaves = archetype octave budget",
  );
  const windStrength = presentationField(
    archetype.windStrength,
    "archetype-derived-wind-display-strength",
    archetype.version,
    {
      archetype: archetype.archetype,
      coronaModel: hero.coronaModel,
    },
    "windStrength = archetype presentation wind strength",
  );
  const resolvedRotationPeriodDays = requireFieldValue("rotation", rotationPeriodDays);
  const evolutionPeriodDays = presentationField(
    resolvedRotationPeriodDays * 8,
    "deterministic-presentation-evolution-period-eight-rotation-periods",
    STELLAR_PORTRAIT_RENDER_CONTRACT_V594_VERSION,
    {
      resolvedRotationPeriodDays,
      cyclesPerEvolution: 8,
      sourceMeasurementAdmitted:
        rotationPeriodDays.derivation.sourceMeasurementAdmitted,
    },
    "evolutionPeriodDays = resolvedRotationPeriodDays * cyclesPerEvolution",
    rotationPeriodDays.derivation.sourceMeasurementAdmitted,
  );
  const companionFieldAvailable = phenomenology.binary.state === "binary-presentation-only"
    && companionIds.length > 0;
  const entries = companionEntries(hero, mode, companionFieldAvailable);
  const companionRenderEnabled = mode === "cinematic"
    && companionFieldAvailable
    && entries.length > 0;
  const cinematic = mode === "cinematic";
  const resolvedTemperatureK = requireFieldValue("temperature", temperatureK);
  const resolvedRadiusSolar = requireFieldValue("radius", radiusSolar);
  const hotFactor = clamp((resolvedTemperatureK - 5_300) / (18_000 - 5_300), 0, 1);
  const giantFactor = clamp(
    (Math.log10(Math.max(1, resolvedRadiusSolar)) - 0.72) / 2.2,
    0,
    1,
  );
  const coronaEnabled = cinematic;
  const windEnabled = coronaEnabled
    && hero.coronaModel.includes("wind")
    && archetype.windStrength > 0;
  const surfaceActivity = clamp(
    0.14 + archetype.spotStrength * 0.32 + archetype.windStrength * 0.16,
    0,
    1,
  );

  const unsigned: Omit<StellarPortraitRenderContractV594, "contractSha256"> = {
    version: STELLAR_PORTRAIT_RENDER_CONTRACT_V594_VERSION,
    heroId: hero.id,
    heroName: hero.name,
    archetype: archetype.archetype,
    mode,
    authoritative: false,
    authority: {
      presentationOnly: true,
      resolvedSurface: false,
      observationTexture: false,
      measuredAuthorityGranted: false,
      scientificPayloadWriteback: false,
      boundary: "parameter-derived-display-not-resolved-surface",
    },
    identity: {
      stellarHeroPacketSha256: STELLAR_HERO_PACKET_SHA256_V592,
      provenanceCandidateSha256: STELLAR_PROVENANCE_CANDIDATE_SHA256,
      identityStatus: provenance.identityStatus,
      provenanceAdmission: provenance.provenanceAdmission,
      presentationAdmission: provenance.presentationAdmission,
    },
    fields: {
      identity,
      temperatureK,
      radiusSolar,
      spectralType,
      rotationPeriodDays,
      orientation,
      variability,
      companions,
      photosphere,
      equatorialPolarRadiusRatio: ratio,
      gravityDarkening,
      granulationOctaves: octaves,
      windStrength,
      evolutionPeriodDays,
    },
    classificationMetadata: {
      metadataOnly: true,
      sourceShaderProfile: archetype.shaderProfile,
      granulationArchetype: archetype.archetype,
      phenomenologyVersion: STELLAR_PHENOMENOLOGY_V1_VERSION,
    },
    phenomenology,
    deterministicSeed: archetype.deterministicSeed,
    geometry: {
      primitive: "oblate-sphere",
      scale,
      signature: geometrySignature(scale),
      axisRatio: visualSignature.axisRatio,
      axisRatioBasis: visualSignature.axisRatioBasis,
      radiusPolicy: "inspection-normalized-not-physical-distance-scale",
    },
    visualSignature: {
      id: visualSignature.signatureId,
      topology: visualSignature.topology,
      signaturePhaseRad: visualSignature.signaturePhaseRad,
      signatureFrequency: visualSignature.signatureFrequency,
      cellAnisotropy: visualSignature.cellAnisotropy,
      radiativeBandStrength: visualSignature.radiativeBandStrength,
      convectiveCellStrength: visualSignature.convectiveCellStrength,
      windFilamentStrength: visualSignature.windFilamentStrength,
      polarRadiance: visualSignature.polarRadiance,
      equatorialShade: visualSignature.equatorialShade,
      presentationOnly: true,
      observationTexture: false,
      measurementAuthorityGranted: false,
      derivation: "archetype-and-source-scoped-presentation-visual-signature",
    },
    surface: {
      enabled: true,
      linearOutput: mode === "science",
      hotFactor: round(hotFactor),
      giantFactor: round(giantFactor),
      rapidRotatorFactor: archetype.archetype === "rapid-rotator-gravity-darkened" ? 1 : 0,
      granulation: {
        octaves: archetype.granulationOctaves,
        scale: granulationScale(archetype.archetype),
        contrast: archetype.granulationContrast,
        spotCoverage: round(archetype.spotStrength * 0.18),
        faculaStrength: archetype.faculaStrength,
        limbDarkening: archetype.limbDarkening,
      },
      gravityDarkening: archetype.gravityDarkening,
      rotation: {
        periodDays: requireFieldValue("rotation", rotationPeriodDays),
        j2000PhaseRad: 0,
        phasePolicy: "absolute-julian-date-relative-to-j2000-reversible",
        orientationMetadata: orientation.value,
        orientationApplication: "metadata-only-no-camera-world-convention",
      },
      evolution: {
        periodDays: requireFieldValue("evolutionPeriodDays", evolutionPeriodDays),
        j2000PhaseRad: round(archetype.deterministicSeed * Math.PI * 2),
        phasePolicy: "absolute-julian-date-deterministic-presentation-evolution",
      },
      pulsation: {
        enabled: phenomenology.pulsation.enabled,
        amplitude: phenomenology.pulsation.amplitude,
        reason: phenomenology.variability.state === "catalog-classified"
          ? "disabled-classification-only-no-admitted-amplitude"
          : "disabled-unknown-variability",
      },
    },
    corona: {
      enabled: coronaEnabled,
      windEnabled,
      strength: round(0.2 + surfaceActivity * 0.34),
      falloff: archetype.coronaFalloff,
      windStrength: archetype.windStrength,
      presentationOnly: true,
    },
    halo: {
      enabled: cinematic,
      strength: round(0.48 + surfaceActivity * 0.22),
      presentationOnly: true,
    },
    companions: {
      enabled: companionRenderEnabled,
      presentationOnly: true,
      entries,
      reason: mode === "science"
        ? "disabled-science-mode"
        : !companionFieldAvailable
          ? "disabled-unknown-companions"
          : entries.length === 0
            ? "disabled-no-companions"
            : "enabled-curated-presentation-only",
    },
  };
  const contractSha256 = computeStellarPortraitRenderContractSha256V594(unsigned);
  return deepFreeze({ ...unsigned, contractSha256 });
}

export function createStellarPortraitProfileFromRenderContractV594(
  contract: StellarPortraitRenderContractV594,
  material: StellarMaterialProfile,
): StellarPortraitProfileV594 {
  const base = createStellarPortraitProfileV7({
    material,
    teffK: requireFieldValue("temperature", contract.fields.temperatureK),
    radiusSolar: requireFieldValue("radius", contract.fields.radiusSolar),
    spectralType: requireFieldValue("spectralType", contract.fields.spectralType),
    logg: null,
    metallicityDex: null,
    dataTier: "catalog-basic",
    variable: contract.surface.pulsation.enabled,
    colorIndexAvailable: true,
  });
  const companionDrawCalls = contract.companions.enabled
    ? contract.companions.entries.filter((entry) => entry.enabled).length
    : 0;
  return deepFreeze({
    ...base,
    version: STELLAR_PORTRAIT_PROFILE_V594_VERSION,
    seed: contract.deterministicSeed,
    parameterSource: "v592-hero-provenance-render-contract",
    dataTier: "catalog-basic",
    surfaceDetailOctaves: contract.surface.granulation.octaves,
    granulationScale: contract.surface.granulation.scale,
    granulationContrast: contract.surface.granulation.contrast,
    spotCoverage: contract.surface.granulation.spotCoverage,
    faculaStrength: contract.surface.granulation.faculaStrength,
    limbDarkening: contract.surface.granulation.limbDarkening,
    coronaStrength: contract.corona.enabled ? contract.corona.strength : 0,
    coronaFalloff: contract.corona.falloff,
    haloStrength: contract.halo.enabled ? contract.halo.strength : 0,
    prominenceBudget: contract.mode === "cinematic" ? base.prominenceBudget : 0,
    gravityDarkening: contract.surface.gravityDarkening,
    hotFactor: contract.surface.hotFactor,
    giantFactor: contract.surface.giantFactor,
    rapidRotatorFactor: contract.surface.rapidRotatorFactor,
    windStrength: contract.corona.windEnabled ? contract.corona.windStrength : 0,
    visualSignature: {
      signaturePhaseRad: contract.visualSignature.signaturePhaseRad,
      signatureFrequency: contract.visualSignature.signatureFrequency,
      cellAnisotropy: contract.visualSignature.cellAnisotropy,
      radiativeBandStrength: contract.visualSignature.radiativeBandStrength,
      convectiveCellStrength: contract.visualSignature.convectiveCellStrength,
      windFilamentStrength: contract.visualSignature.windFilamentStrength,
      polarRadiance: contract.visualSignature.polarRadiance,
      equatorialShade: contract.visualSignature.equatorialShade,
    },
    pulsationAmplitude: contract.surface.pulsation.enabled
      ? contract.surface.pulsation.amplitude ?? 0
      : 0,
    drawCallBudget: 1
      + (contract.corona.enabled ? 1 : 0)
      + (contract.halo.enabled ? 1 : 0)
      + companionDrawCalls,
    renderContractSha256: contract.contractSha256,
    renderMode: contract.mode,
    authoritative: false,
    derivation: "v594-contract-driven-parameter-display-not-resolved-surface",
  });
}

function wrapRadians(value: number): number {
  const turn = Math.PI * 2;
  const wrapped = value % turn;
  return wrapped < 0 ? wrapped + turn : wrapped;
}

export function resolveStellarPortraitRotationPhaseV594(
  contract: StellarPortraitRenderContractV594,
  julianDate: number,
): number {
  if (!Number.isFinite(julianDate)) throw new Error("v594-stellar-julian-date");
  const periodDays = contract.surface.rotation.periodDays;
  if (!Number.isFinite(periodDays) || periodDays <= 0) {
    throw new Error(`v594-stellar-rotation-period:${contract.heroId}`);
  }
  const turns = (julianDate - JULIAN_DATE_J2000_V592) / periodDays;
  return wrapRadians(contract.surface.rotation.j2000PhaseRad + turns * Math.PI * 2);
}

export function resolveStellarPortraitEvolutionPhaseV594(
  contract: StellarPortraitRenderContractV594,
  julianDate: number,
): number {
  if (!Number.isFinite(julianDate)) throw new Error("v594-stellar-evolution-julian-date");
  const evolutionPeriodDays = contract.surface.evolution.periodDays;
  if (!Number.isFinite(evolutionPeriodDays) || evolutionPeriodDays <= 0) {
    throw new Error(`v594-stellar-evolution-period:${contract.heroId}`);
  }
  return wrapRadians(
    contract.surface.evolution.j2000PhaseRad
      + (julianDate - JULIAN_DATE_J2000_V592) / evolutionPeriodDays * Math.PI * 2,
  );
}
