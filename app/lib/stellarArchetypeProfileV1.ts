import type { StellarHeroV592, StellarHeroIdV592 } from "./stellarHeroesV592";
import {
  getStellarProvenanceHeroV1,
  type StellarProvenanceAdmissionV1,
  type StellarProvenanceFieldV1,
  type StellarProvenanceIdentityStatusV1,
} from "./stellarProvenanceCandidate";
import {
  createStellarPhenomenologyV1,
  type StellarPhenomenologyStateV1,
  type StellarPhenomenologyV1,
} from "./stellarPhenomenologyV1";

/**
 * Presentation archetypes are a rendering vocabulary, not a claim that a
 * star's surface has been resolved.  The profile deliberately carries the
 * provenance/admission state so callers cannot silently turn a visual model
 * into a scientific observation.
 */
export const STELLAR_ARCHETYPE_PROFILE_V1_VERSION =
  "post-v593-stellar-archetype-profile-v1" as const;

export type StellarArchetypeV1 =
  | "hot-radiative"
  | "blue-supergiant-wind"
  | "solar-like-convective"
  | "cool-convective"
  | "red-giant-supergiant"
  | "warm-radiative-convective"
  | "rapid-rotator-gravity-darkened";

/**
 * Morphology and phenomenology are intentionally separate dimensions.  A
 * variable or binary classification must not replace the photospheric
 * morphology selected from temperature/rotation evidence, while still being
 * available to the renderer and the browser evidence contract.
 */
export type StellarArchetypeTagV1 = StellarArchetypeV1 | StellarPhenomenologyStateV1;

export type StellarSurfaceTopologyV1 =
  | "radiative-silk"
  | "radiative-wind-strata"
  | "solar-cellular"
  | "deep-convective-cellular"
  | "supergiant-supercells"
  | "radiative-convective-hybrid"
  | "gravity-darkened-latitudinal";

export type StellarOrientationSignatureV1 = Readonly<{
  knownState: "available" | "unknown";
  inclinationDeg: number | null;
  polePositionAngleEastOfNorthDeg: number | null;
  sourceKey: string;
  sourceVersion: string;
  sourceMeasurementAdmitted: boolean;
  measurementAuthorityGranted: false;
  renderApplication: "metadata-only-no-camera-world-convention";
  derivationInputs: Readonly<{
    inclinationExactDeg: number | null;
    inclinationLowerDeg: number | null;
    inclinationUpperDeg: number | null;
    polePositionAngleEastOfNorthDeg: number | null;
  }>;
  derivationFormula: string | null;
  derivation:
    | "primary-literature-exact-axis-metadata-for-presentation"
    | "primary-literature-range-midpoint-axis-metadata-for-presentation"
    | "unknown-axis-not-zero-default-y-presentation-only";
}>;

export type StellarVisualSignatureV1 = Readonly<{
  signatureId: string;
  topology: StellarSurfaceTopologyV1;
  axisRatio: number;
  axisRatioBasis:
    | "primary-literature-scoped-model"
    | "v592-presentation-fallback";
  rotationPeriodDays: number;
  rotationPeriodBasis:
    | "primary-literature-scoped-model"
    | "v592-presentation-fallback";
  signaturePhaseRad: number;
  signatureFrequency: number;
  cellAnisotropy: number;
  radiativeBandStrength: number;
  convectiveCellStrength: number;
  windFilamentStrength: number;
  polarRadiance: number;
  equatorialShade: number;
  orientation: StellarOrientationSignatureV1;
  presentationOnly: true;
  observationTexture: false;
  measurementAuthorityGranted: false;
  derivation: "archetype-and-source-scoped-presentation-visual-signature";
}>;

export type StellarArchetypeProfileV1 = Readonly<{
  version: typeof STELLAR_ARCHETYPE_PROFILE_V1_VERSION;
  heroId: StellarHeroIdV592;
  archetype: StellarArchetypeV1;
  archetypeTags: readonly StellarArchetypeTagV1[];
  shaderProfile: string;
  coronaModel: string;
  deterministicSeed: number;
  granulationOctaves: 3 | 4 | 5;
  granulationContrast: number;
  spotStrength: number;
  faculaStrength: number;
  limbDarkening: number;
  gravityDarkening: number;
  coronaFalloff: number;
  windStrength: number;
  pulsationAmplitude: number;
  binaryCompanionCount: number;
  visualSignature: StellarVisualSignatureV1;
  variableStatus: "unknown" | "not-recorded" | "catalog-classified";
  phenomenology: StellarPhenomenologyV1;
  identityStatus: StellarProvenanceIdentityStatusV1;
  provenanceAdmission: StellarProvenanceAdmissionV1;
  presentationOnly: true;
  scientificPayloadWriteback: false;
  derivation: "parameter-derived-display-not-resolved-surface";
}>;

function stableSeed(id: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0) / 0xffff_ffff;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function directPrimaryModelField(
  field: StellarProvenanceFieldV1,
): boolean {
  return field.status === "direct"
    && field.authority === "primary-literature"
    && field.measurementAdmitted === true;
}

function numberFromRecord(
  value: unknown,
  key: string,
): number | null {
  if (!isRecord(value)) return null;
  const candidate = value[key];
  return finiteNumber(candidate) ? candidate : null;
}

function midpointFromRange(value: unknown): number | null {
  if (finiteNumber(value)) return value;
  if (!isRecord(value)) return null;
  const lower = value.lower;
  const upper = value.upper;
  return finiteNumber(lower) && finiteNumber(upper) && lower <= upper
    ? (lower + upper) / 2
    : null;
}

function resolveAdmittedOrientation(
  field: StellarProvenanceFieldV1,
): StellarOrientationSignatureV1 {
  const value = isRecord(field.value) ? field.value : null;
  const inclinationValue = value?.inclinationDeg;
  const inclinationExactDeg = finiteNumber(inclinationValue)
    ? inclinationValue
    : null;
  const inclinationLowerDeg = isRecord(inclinationValue)
    && finiteNumber(inclinationValue.lower)
    ? inclinationValue.lower
    : null;
  const inclinationUpperDeg = isRecord(inclinationValue)
    && finiteNumber(inclinationValue.upper)
    ? inclinationValue.upper
    : null;
  const inclinationDeg = midpointFromRange(inclinationValue);
  const polePositionAngleEastOfNorthDeg = finiteNumber(
    value?.polePositionAngleEastOfNorthDeg,
  )
    ? value.polePositionAngleEastOfNorthDeg
    : null;
  const sourceMeasurementAdmitted = directPrimaryModelField(field);
  const available = sourceMeasurementAdmitted
    && inclinationDeg !== null
    && inclinationDeg >= 0
    && inclinationDeg <= 90
    && polePositionAngleEastOfNorthDeg !== null;
  if (!available) {
    return Object.freeze({
      knownState: "unknown",
      inclinationDeg: null,
      polePositionAngleEastOfNorthDeg: null,
      sourceKey: field.sourceKey,
      sourceVersion: field.sourceVersion,
      sourceMeasurementAdmitted,
      measurementAuthorityGranted: false,
      renderApplication: "metadata-only-no-camera-world-convention",
      derivationInputs: Object.freeze({
        inclinationExactDeg,
        inclinationLowerDeg,
        inclinationUpperDeg,
        polePositionAngleEastOfNorthDeg,
      }),
      derivationFormula: null,
      derivation: "unknown-axis-not-zero-default-y-presentation-only",
    });
  }
  const rangeMidpoint = inclinationExactDeg === null;
  return Object.freeze({
    knownState: "available",
    inclinationDeg,
    polePositionAngleEastOfNorthDeg,
    sourceKey: field.sourceKey,
    sourceVersion: field.sourceVersion,
    sourceMeasurementAdmitted: true,
    measurementAuthorityGranted: false,
    renderApplication: "metadata-only-no-camera-world-convention",
    derivationInputs: Object.freeze({
      inclinationExactDeg,
      inclinationLowerDeg,
      inclinationUpperDeg,
      polePositionAngleEastOfNorthDeg,
    }),
    derivationFormula: rangeMidpoint
      ? "(inclinationLowerDeg + inclinationUpperDeg) / 2; preserve position angle"
      : "preserve exact inclinationDeg and position angle",
    derivation: rangeMidpoint
      ? "primary-literature-range-midpoint-axis-metadata-for-presentation"
      : "primary-literature-exact-axis-metadata-for-presentation",
  });
}

function signatureFrequencyForArchetype(archetype: StellarArchetypeV1): number {
  switch (archetype) {
    case "red-giant-supergiant": return 0.9;
    case "cool-convective": return 0.94;
    case "warm-radiative-convective": return 0.98;
    case "solar-like-convective": return 1;
    case "blue-supergiant-wind": return 1.04;
    case "hot-radiative": return 1.08;
    case "rapid-rotator-gravity-darkened": return 1.1;
  }
}

function resolvePrimaryModelRatio(
  field: StellarProvenanceFieldV1,
): number | null {
  if (!directPrimaryModelField(field)) return null;
  const ratio = numberFromRecord(field.value, "equatorialPolarRatio");
  return ratio !== null && ratio >= 1 && ratio <= 2 ? ratio : null;
}

function resolvePrimaryModelRotationPeriodDays(
  field: StellarProvenanceFieldV1,
): number | null {
  if (!directPrimaryModelField(field) || !isRecord(field.value)) return null;
  const periodDays = field.value.periodDays;
  if (finiteNumber(periodDays) && periodDays > 0) return periodDays;
  const periodHours = field.value.periodHours;
  return finiteNumber(periodHours) && periodHours > 0 ? periodHours / 24 : null;
}

function resolvePrimaryModelGravityDarkening(
  field: StellarProvenanceFieldV1,
): number | null {
  if (!directPrimaryModelField(field)) return null;
  const beta = numberFromRecord(field.value, "gravityDarkeningBeta");
  return beta !== null && beta > 0 && beta <= 0.5 ? beta : null;
}

function resolveArchetype(
  hero: StellarHeroV592,
  provenance: ReturnType<typeof getStellarProvenanceHeroV1>,
): StellarArchetypeV1 {
  const primaryRapidRotator = directPrimaryModelField(provenance.fields.rotation)
    && directPrimaryModelField(provenance.fields.orientation)
    && resolvePrimaryModelGravityDarkening(provenance.fields.rotation) !== null;
  if (hero.equatorialPolarRadiusRatio >= 1.2 || primaryRapidRotator) {
    return "rapid-rotator-gravity-darkened";
  }
  if (hero.shaderProfile === "blue-hot-radiative-wind") return "blue-supergiant-wind";
  if (hero.shaderProfile === "warm-radiative-convective") return "warm-radiative-convective";
  if (hero.shaderProfile === "hot-radiative-photosphere") return "hot-radiative";
  if (hero.radiusSolar >= 50 || hero.temperatureK <= 4_200) return "red-giant-supergiant";
  if (hero.temperatureK < 5_100) return "cool-convective";
  return "solar-like-convective";
}

function resolveSurfaceTopology(archetype: StellarArchetypeV1): StellarSurfaceTopologyV1 {
  switch (archetype) {
    case "hot-radiative": return "radiative-silk";
    case "blue-supergiant-wind": return "radiative-wind-strata";
    case "solar-like-convective": return "solar-cellular";
    case "cool-convective": return "deep-convective-cellular";
    case "red-giant-supergiant": return "supergiant-supercells";
    case "warm-radiative-convective": return "radiative-convective-hybrid";
    case "rapid-rotator-gravity-darkened": return "gravity-darkened-latitudinal";
  }
}

function visualSignature(
  hero: StellarHeroV592,
  provenance: ReturnType<typeof getStellarProvenanceHeroV1>,
  archetype: StellarArchetypeV1,
  deterministicSeed: number,
  gravityDarkening: number,
): StellarVisualSignatureV1 {
  const primaryRatio = resolvePrimaryModelRatio(provenance.fields.radius);
  const primaryPeriod = resolvePrimaryModelRotationPeriodDays(provenance.fields.rotation);
  const axisRatio = primaryRatio ?? hero.equatorialPolarRadiusRatio;
  const rotationPeriodDays = primaryPeriod ?? hero.rotationPeriodDays;
  const rapid = archetype === "rapid-rotator-gravity-darkened";
  const blueWind = archetype === "blue-supergiant-wind";
  const hot = archetype === "hot-radiative";
  const giant = archetype === "red-giant-supergiant";
  const cool = archetype === "cool-convective";
  const warm = archetype === "warm-radiative-convective";
  const orientation = resolveAdmittedOrientation(provenance.fields.orientation);
  const radiativeBandStrength = rapid ? 0.78 : blueWind ? 0.72 : hot ? 0.58 : warm ? 0.32 : 0.08;
  const convectiveCellStrength = giant ? 1 : cool ? 0.88 : warm ? 0.48 : rapid ? 0.2 : blueWind ? 0.12 : hot ? 0.16 : 0.7;
  const windFilamentStrength = blueWind ? 0.94 : rapid ? 0.58 : hot ? 0.48 : giant ? 0.34 : warm ? 0.28 : 0.16;
  return Object.freeze({
    signatureId: `v594:${hero.id}:${archetype}:${Math.round(deterministicSeed * 1e8).toString(16)}`,
    topology: resolveSurfaceTopology(archetype),
    axisRatio: roundSignature(axisRatio),
    axisRatioBasis: primaryRatio === null
      ? "v592-presentation-fallback"
      : "primary-literature-scoped-model",
    rotationPeriodDays: roundSignature(rotationPeriodDays),
    rotationPeriodBasis: primaryPeriod === null
      ? "v592-presentation-fallback"
      : "primary-literature-scoped-model",
    signaturePhaseRad: roundSignature(deterministicSeed * Math.PI * 2),
    signatureFrequency: signatureFrequencyForArchetype(archetype),
    cellAnisotropy: roundSignature(rapid ? 0.74 : blueWind ? 0.34 : giant ? 0.2 : warm ? 0.16 : 0.08),
    radiativeBandStrength,
    convectiveCellStrength,
    windFilamentStrength,
    polarRadiance: roundSignature(rapid ? 0.16 + gravityDarkening * 0.36 : hot || blueWind ? 0.08 : 0.03),
    equatorialShade: roundSignature(rapid ? 0.12 + gravityDarkening * 0.28 : giant ? 0.05 : 0.02),
    orientation,
    presentationOnly: true,
    observationTexture: false,
    measurementAuthorityGranted: false,
    derivation: "archetype-and-source-scoped-presentation-visual-signature",
  });
}

function roundSignature(value: number): number {
  return Math.round(value * 1e8) / 1e8;
}

export function createStellarArchetypeProfileV1(
  hero: StellarHeroV592,
): StellarArchetypeProfileV1 {
  const provenance = getStellarProvenanceHeroV1(hero.id);
  const archetype = resolveArchetype(hero, provenance);
  const phenomenology = createStellarPhenomenologyV1(hero);
  const giant = archetype === "red-giant-supergiant";
  const hot = archetype === "hot-radiative" || archetype === "blue-supergiant-wind";
  const primaryRatio = resolvePrimaryModelRatio(provenance.fields.radius);
  const primaryGravityBeta = resolvePrimaryModelGravityDarkening(provenance.fields.rotation);
  const axisRatio = primaryRatio ?? hero.equatorialPolarRadiusRatio;
  const geometricGravityDarkening = clamp((axisRatio - 1) / 0.4, 0, 1);
  const gravityDarkening = primaryGravityBeta === null
    ? geometricGravityDarkening
    : clamp(geometricGravityDarkening * 0.75 + primaryGravityBeta / 0.25 * 0.25, 0, 1);
  const granulationOctaves = giant ? 3 : hot ? 4 : 5;
  const granulationContrast = clamp(
    giant ? 0.34 : hot ? 0.09 : archetype === "cool-convective" ? 0.28 : 0.18,
    0.04,
    0.42,
  );
  const spotStrength = clamp(
    hot ? 0.08 : giant ? 0.48 : archetype === "cool-convective" ? 0.58 : 0.34,
    0.04,
    0.72,
  );
  const faculaStrength = clamp(hot ? 0.06 : giant ? 0.12 : 0.2, 0.03, 0.28);
  const limbDarkening = clamp(hot ? 0.48 : giant ? 0.38 : 0.56, 0.25, 0.75);
  const coronaFalloff = archetype === "blue-supergiant-wind" ? 2.1 : hot ? 3.45 : giant ? 2.35 : 2.9;
  const windStrength = hero.coronaModel.includes("wind") ? (giant ? 0.42 : 0.68) : 0.24;

  const deterministicSeed = stableSeed(hero.id);

  return Object.freeze({
    version: STELLAR_ARCHETYPE_PROFILE_V1_VERSION,
    heroId: hero.id,
    archetype,
    archetypeTags: Object.freeze([
      archetype,
      ...phenomenology.states,
    ].filter((tag, index, tags) => tags.indexOf(tag) === index)) as readonly StellarArchetypeTagV1[],
    shaderProfile: hero.shaderProfile,
    coronaModel: hero.coronaModel,
    deterministicSeed,
    granulationOctaves,
    granulationContrast,
    spotStrength,
    faculaStrength,
    limbDarkening,
    gravityDarkening,
    coronaFalloff,
    windStrength,
    // Variability is intentionally not inferred from a name or a shader
    // profile.  Keep the channel explicit until a cited source is admitted.
    pulsationAmplitude: 0,
    binaryCompanionCount: phenomenology.binary.companionIds.length,
    visualSignature: visualSignature(
      hero,
      provenance,
      archetype,
      deterministicSeed,
      gravityDarkening,
    ),
    variableStatus: phenomenology.variability.state === "catalog-classified"
      ? "catalog-classified"
      : provenance.fields.variability.authority === "unknown"
        ? "unknown"
        : "not-recorded",
    phenomenology,
    identityStatus: provenance.identityStatus,
    provenanceAdmission: provenance.provenanceAdmission,
    presentationOnly: true,
    scientificPayloadWriteback: false,
    derivation: "parameter-derived-display-not-resolved-surface",
  });
}

export function createStellarArchetypeProfileByIdV1(
  heroId: StellarHeroIdV592,
  heroes: Readonly<Record<StellarHeroIdV592, StellarHeroV592>>,
): StellarArchetypeProfileV1 {
  const hero = heroes[heroId];
  if (!hero) throw new Error(`post-v593-stellar-archetype-hero:${heroId}`);
  return createStellarArchetypeProfileV1(hero);
}
