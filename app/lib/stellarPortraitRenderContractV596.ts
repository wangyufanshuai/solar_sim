import type { StellarMaterialProfile } from "./stellarMaterialProfile";
import type { StellarArchetypeV1, StellarSurfaceTopologyV1 } from "./stellarArchetypeProfileV1";
import type { StellarHeroV592 } from "./stellarHeroesV592";
import { sha256Utf8HexV566 } from "./sha256BrowserV566";
import {
  STELLAR_PORTRAIT_RENDER_CONTRACT_V594_VERSION,
  canonicalSerializeStellarPortraitRenderContractV594,
  createStellarPortraitProfileFromRenderContractV594,
  createStellarPortraitRenderContractV594,
  resolveStellarPortraitEvolutionPhaseV594,
  resolveStellarPortraitRotationPhaseV594,
  type StellarPortraitProfileV594,
  type StellarPortraitRenderContractV594,
  type StellarPortraitRenderModeV594,
} from "./stellarPortraitRenderContractV594";

export const STELLAR_PORTRAIT_RENDER_CONTRACT_V596_VERSION =
  "v596-stellar-portrait-render-contract-v1" as const;
export const STELLAR_PORTRAIT_PROFILE_V596_VERSION =
  "v596-stellar-portrait-profile-v1" as const;
export const STELLAR_MORPHOLOGY_V596_VERSION =
  "v596-visible-stellar-morphology-v1" as const;

export type StellarMorphologySurfaceParametersV596 = Readonly<{
  macroScale: number;
  mesoScale: number;
  microScale: number;
  macroStrength: number;
  mesoStrength: number;
  microStrength: number;
  boundaryStrength: number;
  boundarySharpness: number;
  radiativeLayerStrength: number;
  radiativeFiberScale: number;
  latitudeOrganization: number;
  latitudeFrequency: number;
  activityRegionStrength: number;
  activityRegionScale: number;
  activityLatitude: number;
  activityLatitudeWidth: number;
  plumeStrength: number;
  irregularity: number;
  polarBrightening: number;
  equatorialDarkening: number;
  gravityTransition: number;
  limbCrispness: number;
}>;

export type StellarMorphologyCoronaParametersV596 = Readonly<{
  layerSeparation: number;
  filamentScale: number;
  filamentBreakup: number;
  radialSpokeStrength: number;
}>;

export type StellarMorphologyHaloParametersV596 = Readonly<{
  coreTightness: number;
  outerFalloff: number;
}>;

export type StellarMorphologyProfileV596 = Readonly<{
  version: typeof STELLAR_MORPHOLOGY_V596_VERSION;
  heroId: StellarPortraitRenderContractV594["heroId"];
  family: StellarArchetypeV1;
  topology: StellarSurfaceTopologyV1;
  deterministicSeed: number;
  surface: StellarMorphologySurfaceParametersV596;
  corona: StellarMorphologyCoronaParametersV596;
  halo: StellarMorphologyHaloParametersV596;
  presentationOnly: true;
  resolvedSurface: false;
  observationTexture: false;
  radiativeTransferAuthority: false;
  grmhdAuthority: false;
  measurementAuthorityGranted: false;
  scientificPayloadWriteback: false;
  shaderBranch: "v596-observable-morphology-surface-corona-halo";
  derivation: "archetype-scoped-deterministic-presentation-morphology";
  profileSha256: string;
}>;

type V596Surface = StellarPortraitRenderContractV594["surface"] & Readonly<{
  morphology: StellarMorphologySurfaceParametersV596;
}>;

type V596Corona = StellarPortraitRenderContractV594["corona"] & Readonly<{
  morphology: StellarMorphologyCoronaParametersV596;
}>;

type V596Halo = StellarPortraitRenderContractV594["halo"] & Readonly<{
  morphology: StellarMorphologyHaloParametersV596;
}>;

export type StellarPortraitRenderContractV596 = Omit<
  StellarPortraitRenderContractV594,
  "version" | "surface" | "corona" | "halo" | "companions" | "contractSha256"
> & Readonly<{
  version: typeof STELLAR_PORTRAIT_RENDER_CONTRACT_V596_VERSION;
  formalProductPointer: "v263";
  baselineV594Contract: StellarPortraitRenderContractV594;
  baselineV594ContractSha256: string;
  morphology: StellarMorphologyProfileV596;
  surface: V596Surface;
  corona: V596Corona;
  halo: V596Halo;
  companions: Readonly<{
    enabled: false;
    presentationOnly: true;
    entries: readonly (Omit<
      StellarPortraitRenderContractV594["companions"]["entries"][number],
      "enabled"
    > & Readonly<{ enabled: false }>)[];
    reason: "disabled-v596-primary-morphology-no-orbit-or-occultation-claim";
  }>;
  extendedAuthority: Readonly<{
    scientific: false;
    measured: false;
    gpu: false;
    resolvedSurface: false;
    observationTexture: false;
    radiativeTransfer: false;
    grmhd: false;
    scientificPayloadWriteback: false;
  }>;
  contractSha256: string;
}>;

export type StellarPortraitProfileV596 = Omit<
  StellarPortraitProfileV594,
  "version" | "parameterSource" | "renderContractSha256" | "derivation"
> & Readonly<{
  version: typeof STELLAR_PORTRAIT_PROFILE_V596_VERSION;
  parameterSource: "v596-additive-morphology-over-sealed-v594-contract";
  baselineV594ContractSha256: string;
  morphology: StellarMorphologyProfileV596;
  renderContractSha256: string;
  derivation: "v596-visible-morphology-display-not-resolved-surface";
}>;

type MorphologyPresetV596 = Readonly<{
  surface: StellarMorphologySurfaceParametersV596;
  corona: StellarMorphologyCoronaParametersV596;
  halo: StellarMorphologyHaloParametersV596;
}>;

const MORPHOLOGY_PRESETS_V596: Readonly<Record<StellarArchetypeV1, MorphologyPresetV596>> =
  Object.freeze({
    "hot-radiative": {
      surface: {
        macroScale: 2.4, mesoScale: 9.2, microScale: 41,
        macroStrength: 0.07, mesoStrength: 0.18, microStrength: 0.48,
        boundaryStrength: 0.1, boundarySharpness: 0.62,
        radiativeLayerStrength: 0.96, radiativeFiberScale: 17,
        latitudeOrganization: 0.14, latitudeFrequency: 4.6,
        activityRegionStrength: 0.06, activityRegionScale: 3.4,
        activityLatitude: 0.36, activityLatitudeWidth: 0.34,
        plumeStrength: 0.06, irregularity: 0.12,
        polarBrightening: 0.08, equatorialDarkening: 0.02,
        gravityTransition: 0.58, limbCrispness: 0.84,
      },
      corona: {
        layerSeparation: 0.2, filamentScale: 8, filamentBreakup: 0.42,
        radialSpokeStrength: 0.18,
      },
      halo: { coreTightness: 4.8, outerFalloff: 3.4 },
    },
    "blue-supergiant-wind": {
      surface: {
        macroScale: 2.4, mesoScale: 6.2, microScale: 26,
        macroStrength: 0.14, mesoStrength: 0.28, microStrength: 0.34,
        boundaryStrength: 0.18, boundarySharpness: 0.58,
        radiativeLayerStrength: 0.7, radiativeFiberScale: 11,
        latitudeOrganization: 0.38, latitudeFrequency: 4.2,
        activityRegionStrength: 0.1, activityRegionScale: 2.8,
        activityLatitude: 0.32, activityLatitudeWidth: 0.4,
        plumeStrength: 0.3, irregularity: 0.58,
        polarBrightening: 0.1, equatorialDarkening: 0.03,
        gravityTransition: 0.55, limbCrispness: 0.76,
      },
      corona: {
        layerSeparation: 0.98, filamentScale: 10.8, filamentBreakup: 0.98,
        radialSpokeStrength: 0.48,
      },
      halo: { coreTightness: 3.5, outerFalloff: 1.95 },
    },
    "solar-like-convective": {
      surface: {
        macroScale: 4.6, mesoScale: 15, microScale: 42,
        macroStrength: 0.22, mesoStrength: 0.62, microStrength: 0.38,
        boundaryStrength: 0.72, boundarySharpness: 0.78,
        radiativeLayerStrength: 0.08, radiativeFiberScale: 8,
        latitudeOrganization: 0.34, latitudeFrequency: 3.4,
        activityRegionStrength: 0.42, activityRegionScale: 4.6,
        activityLatitude: 0.34, activityLatitudeWidth: 0.22,
        plumeStrength: 0.2, irregularity: 0.34,
        polarBrightening: 0.04, equatorialDarkening: 0.02,
        gravityTransition: 0.52, limbCrispness: 0.72,
      },
      corona: {
        layerSeparation: 0.45, filamentScale: 9.5, filamentBreakup: 0.66,
        radialSpokeStrength: 0.42,
      },
      halo: { coreTightness: 4.1, outerFalloff: 2.8 },
    },
    "cool-convective": {
      surface: {
        macroScale: 2.7, mesoScale: 7.4, microScale: 19,
        macroStrength: 0.58, mesoStrength: 0.48, microStrength: 0.18,
        boundaryStrength: 0.66, boundarySharpness: 0.62,
        radiativeLayerStrength: 0.04, radiativeFiberScale: 6,
        latitudeOrganization: 0.18, latitudeFrequency: 2.8,
        activityRegionStrength: 0.34, activityRegionScale: 3.2,
        activityLatitude: 0.3, activityLatitudeWidth: 0.3,
        plumeStrength: 0.38, irregularity: 0.54,
        polarBrightening: 0.03, equatorialDarkening: 0.04,
        gravityTransition: 0.5, limbCrispness: 0.62,
      },
      corona: {
        layerSeparation: 0.5, filamentScale: 7.2, filamentBreakup: 0.74,
        radialSpokeStrength: 0.38,
      },
      halo: { coreTightness: 3.7, outerFalloff: 2.6 },
    },
    "red-giant-supergiant": {
      surface: {
        macroScale: 1.18, mesoScale: 3.2, microScale: 9,
        macroStrength: 1.08, mesoStrength: 0.52, microStrength: 0.06,
        boundaryStrength: 0.58, boundarySharpness: 0.48,
        radiativeLayerStrength: 0.02, radiativeFiberScale: 4,
        latitudeOrganization: 0.06, latitudeFrequency: 1.8,
        activityRegionStrength: 0.26, activityRegionScale: 1.9,
        activityLatitude: 0.26, activityLatitudeWidth: 0.5,
        plumeStrength: 0.9, irregularity: 0.98,
        polarBrightening: 0.02, equatorialDarkening: 0.06,
        gravityTransition: 0.44, limbCrispness: 0.5,
      },
      corona: {
        layerSeparation: 0.62, filamentScale: 5.4, filamentBreakup: 0.9,
        radialSpokeStrength: 0.52,
      },
      halo: { coreTightness: 3.2, outerFalloff: 2.2 },
    },
    "warm-radiative-convective": {
      surface: {
        macroScale: 3.6, mesoScale: 12.5, microScale: 34,
        macroStrength: 0.24, mesoStrength: 0.56, microStrength: 0.2,
        boundaryStrength: 0.54, boundarySharpness: 0.72,
        radiativeLayerStrength: 0.52, radiativeFiberScale: 11.5,
        latitudeOrganization: 0.18, latitudeFrequency: 3.5,
        activityRegionStrength: 0.22, activityRegionScale: 3.8,
        activityLatitude: 0.34, activityLatitudeWidth: 0.28,
        plumeStrength: 0.2, irregularity: 0.38,
        polarBrightening: 0.06, equatorialDarkening: 0.02,
        gravityTransition: 0.55, limbCrispness: 0.76,
      },
      corona: {
        layerSeparation: 0.34, filamentScale: 8.8, filamentBreakup: 0.58,
        radialSpokeStrength: 0.3,
      },
      halo: { coreTightness: 4.35, outerFalloff: 3 },
    },
    "rapid-rotator-gravity-darkened": {
      surface: {
        macroScale: 2.8, mesoScale: 8, microScale: 28,
        macroStrength: 0.12, mesoStrength: 0.2, microStrength: 0.22,
        boundaryStrength: 0.18, boundarySharpness: 0.62,
        radiativeLayerStrength: 0.48, radiativeFiberScale: 12,
        latitudeOrganization: 0.82, latitudeFrequency: 2.2,
        activityRegionStrength: 0.08, activityRegionScale: 3,
        activityLatitude: 0.42, activityLatitudeWidth: 0.38,
        plumeStrength: 0.08, irregularity: 0.16,
        polarBrightening: 0.94, equatorialDarkening: 0.8,
        gravityTransition: 0.84, limbCrispness: 0.84,
      },
      corona: {
        layerSeparation: 0.3, filamentScale: 10, filamentBreakup: 0.5,
        radialSpokeStrength: 0.24,
      },
      halo: { coreTightness: 4.6, outerFalloff: 3.15 },
    },
  });

function round(value: number, digits = 8): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function deepFreeze<Value>(value: Value): Value {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const entry of Object.values(value as Record<string, unknown>)) deepFreeze(entry);
  return Object.freeze(value);
}

function morphologyForContractV596(
  baseline: StellarPortraitRenderContractV594,
): StellarMorphologyProfileV596 {
  const preset = MORPHOLOGY_PRESETS_V596[baseline.archetype];
  const identityOffset = baseline.deterministicSeed - 0.5;
  const surface = deepFreeze({
    ...preset.surface,
    macroScale: round(preset.surface.macroScale * (1 + identityOffset * 0.08)),
    mesoScale: round(preset.surface.mesoScale * (1 - identityOffset * 0.06)),
    microScale: round(preset.surface.microScale * (1 + identityOffset * 0.05)),
    activityLatitude: round(clamp(
      preset.surface.activityLatitude + identityOffset * 0.06,
      0.08,
      0.72,
    )),
    irregularity: round(clamp(
      preset.surface.irregularity + Math.abs(identityOffset) * 0.08,
      0,
      1,
    )),
  });
  const unsigned: Omit<StellarMorphologyProfileV596, "profileSha256"> = {
    version: STELLAR_MORPHOLOGY_V596_VERSION,
    heroId: baseline.heroId,
    family: baseline.archetype,
    topology: baseline.visualSignature.topology,
    deterministicSeed: baseline.deterministicSeed,
    surface,
    corona: preset.corona,
    halo: preset.halo,
    presentationOnly: true,
    resolvedSurface: false,
    observationTexture: false,
    radiativeTransferAuthority: false,
    grmhdAuthority: false,
    measurementAuthorityGranted: false,
    scientificPayloadWriteback: false,
    shaderBranch: "v596-observable-morphology-surface-corona-halo",
    derivation: "archetype-scoped-deterministic-presentation-morphology",
  };
  const profileSha256 = sha256Utf8HexV566(
    canonicalSerializeStellarPortraitRenderContractV594(unsigned),
  );
  return deepFreeze({ ...unsigned, profileSha256 });
}

export function computeStellarPortraitRenderContractSha256V596(
  value: Omit<StellarPortraitRenderContractV596, "contractSha256">
    | StellarPortraitRenderContractV596,
): string {
  const unsigned = { ...value } as Record<string, unknown>;
  delete unsigned.contractSha256;
  return sha256Utf8HexV566(
    canonicalSerializeStellarPortraitRenderContractV594(unsigned),
  );
}

export function createStellarPortraitRenderContractV596(
  hero: StellarHeroV592,
  mode: StellarPortraitRenderModeV594,
): StellarPortraitRenderContractV596 {
  const baseline = createStellarPortraitRenderContractV594(hero, mode);
  const { contractSha256: _baselineSeal, ...baselineUnsigned } = baseline;
  const morphology = morphologyForContractV596(baseline);
  const unsigned: Omit<StellarPortraitRenderContractV596, "contractSha256"> = {
    ...baselineUnsigned,
    version: STELLAR_PORTRAIT_RENDER_CONTRACT_V596_VERSION,
    formalProductPointer: "v263",
    baselineV594Contract: baseline,
    baselineV594ContractSha256: baseline.contractSha256,
    morphology,
    surface: deepFreeze({ ...baseline.surface, morphology: morphology.surface }),
    corona: deepFreeze({ ...baseline.corona, morphology: morphology.corona }),
    halo: deepFreeze({ ...baseline.halo, morphology: morphology.halo }),
    companions: deepFreeze({
      enabled: false as const,
      presentationOnly: true as const,
      entries: baseline.companions.entries.map((entry) => deepFreeze({
        ...entry,
        enabled: false as const,
      })),
      reason: "disabled-v596-primary-morphology-no-orbit-or-occultation-claim" as const,
    }),
    extendedAuthority: deepFreeze({
      scientific: false,
      measured: false,
      gpu: false,
      resolvedSurface: false,
      observationTexture: false,
      radiativeTransfer: false,
      grmhd: false,
      scientificPayloadWriteback: false,
    }),
  };
  const contractSha256 = computeStellarPortraitRenderContractSha256V596(unsigned);
  return deepFreeze({ ...unsigned, contractSha256 });
}

export function createStellarPortraitProfileFromRenderContractV596(
  contract: StellarPortraitRenderContractV596,
  material: StellarMaterialProfile,
): StellarPortraitProfileV596 {
  const base = createStellarPortraitProfileFromRenderContractV594(
    contract.baselineV594Contract,
    material,
  );
  return deepFreeze({
    ...base,
    version: STELLAR_PORTRAIT_PROFILE_V596_VERSION,
    parameterSource: "v596-additive-morphology-over-sealed-v594-contract",
    baselineV594ContractSha256: contract.baselineV594ContractSha256,
    morphology: contract.morphology,
    drawCallBudget: 1
      + (contract.corona.enabled ? 1 : 0)
      + (contract.halo.enabled ? 1 : 0),
    renderContractSha256: contract.contractSha256,
    derivation: "v596-visible-morphology-display-not-resolved-surface",
  });
}

export function resolveStellarPortraitRotationPhaseV596(
  contract: StellarPortraitRenderContractV596,
  julianDate: number,
): number {
  return resolveStellarPortraitRotationPhaseV594(contract.baselineV594Contract, julianDate);
}

export function resolveStellarPortraitEvolutionPhaseV596(
  contract: StellarPortraitRenderContractV596,
  julianDate: number,
): number {
  return resolveStellarPortraitEvolutionPhaseV594(contract.baselineV594Contract, julianDate);
}

export function assertStellarPortraitRenderContractInheritanceV596(
  contract: StellarPortraitRenderContractV596,
): void {
  if (contract.baselineV594Contract.version !== STELLAR_PORTRAIT_RENDER_CONTRACT_V594_VERSION) {
    throw new Error(`v596-stellar-baseline-version:${contract.heroId}`);
  }
  if (contract.baselineV594Contract.contractSha256 !== contract.baselineV594ContractSha256) {
    throw new Error(`v596-stellar-baseline-seal:${contract.heroId}`);
  }
  if (contract.surface.pulsation.enabled || contract.surface.pulsation.amplitude !== null) {
    throw new Error(`v596-stellar-pulsation-gate:${contract.heroId}`);
  }
  if (Object.values(contract.extendedAuthority).some(Boolean)) {
    throw new Error(`v596-stellar-authority:${contract.heroId}`);
  }
}
