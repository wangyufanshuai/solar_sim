import { KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312 } from "./kerrAuthorityV312";
import { KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313 } from "./kerrAuthorityV313";
import { KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314, KERR_FULL_SHORT_AUTHORITY_SHA256_V314 } from "./kerrCampaignV314";
import { kerrIscoRadiusV278, liouvilleIntensityInvariantV278, novikovThorneFluxV278, planckRadianceV278 } from "./strongGravityRenderingV278";
import { KERR_CLASSIFICATION_V299, validateKerrScienceTransferPayloadV299, type KerrScienceTransferPayloadV299 } from "./strongGravityRenderingV299";

export const KERR_THIN_DISK_SPECTRAL_VERSION_V319 = "v319-kerr-page-thorne-sparse-spectrum-v1" as const;
export const KERR_THIN_DISK_DEFAULT_SCENARIO_V319 = Object.freeze({
  id: "stellar-mass-thin-disk-reference-v319",
  blackHoleMassSolar: 10,
  eddingtonRatio: 0.1,
  observedFrequencyHz: 1e17,
  colorCorrection: 1,
} as const);

const SPEED_OF_LIGHT_M_S = 299_792_458;
const GRAVITATIONAL_CONSTANT_SI = 6.67430e-11;
const SOLAR_MASS_KG = 1.98847e30;
const STEFAN_BOLTZMANN_SI = 5.670374419e-8;
const PROTON_MASS_KG = 1.67262192369e-27;
const THOMSON_CROSS_SECTION_M2 = 6.6524587321e-29;

export type KerrThinDiskScenarioV319 = Readonly<{
  id: string;
  blackHoleMassSolar: number;
  eddingtonRatio: number;
  observedFrequencyHz: number;
  colorCorrection: 1;
}>;

export type KerrThinDiskSpectralSampleV319 = Readonly<{
  rayIndex: number;
  classification: "capture" | "escape" | "disk-hit";
  applicable: boolean;
  spinA: number;
  emissionRadiusM: number | null;
  kerrSchildEmissionRadiusM: number | null;
  redshiftFactor: number | null;
  emittedFrequencyHz: number | null;
  radiativeEfficiency: number | null;
  accretionRateKgS: number | null;
  localFluxWM2: number | null;
  effectiveTemperatureK: number | null;
  emittedSpectralRadiance: number | null;
  observedSpectralRadiance: number | null;
  observedBolometricIntensity: number | null;
  liouvilleInvariantRelativeResidual: number | null;
  errorBudget: Readonly<{
    diskQuadratureRelative: number | null;
    formulaSpectralRelative: number | null;
    geometryRadiusDifferenceM: number | null;
    geometryRedshiftDifference: number | null;
  }>;
}>;

export type KerrThinDiskSpectralViewV319 = Readonly<{
  version: typeof KERR_THIN_DISK_SPECTRAL_VERSION_V319;
  status: "qualified-sparse-derived-spectrum";
  authority: Readonly<{
    fullShortAuthoritySha256: typeof KERR_FULL_SHORT_AUTHORITY_SHA256_V314;
    geometryEvidenceSha256: typeof KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312;
    polarizationEvidenceSha256: typeof KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313;
    rayPlanSha256: typeof KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314;
    denseAggregateSha256: null;
  }>;
  scenario: KerrThinDiskScenarioV319;
  counts: Readonly<{ sampleCount: 16; applicableDiskRayCount: 4; unavailableRayCount: 12 }>;
  maxima: Readonly<{
    liouvilleInvariantRelativeResidual: number;
    diskQuadratureRelative: number;
    formulaSpectralRelative: number;
  }>;
  samples: readonly KerrThinDiskSpectralSampleV319[];
  units: Readonly<{
    radius: "GM/c^2";
    frequency: "Hz";
    flux: "W m^-2";
    temperature: "K";
    spectralRadiance: "W m^-2 sr^-1 Hz^-1";
    bolometricIntensity: "W m^-2 sr^-1";
  }>;
  assumptions: readonly [
    "test-particle-kerr",
    "page-thorne-zero-torque-at-isco",
    "geometrically-thin-optically-thick-local-blackbody",
    "isotropic-lambert-emission",
    "no-returning-radiation",
    "no-limb-darkening",
    "no-color-correction",
    "no-grmhd-or-plasma-transfer",
  ];
  uncertaintyCombination: "componentwise-no-rss-no-scalar-total";
  displayBoundary: "science-linear-physical-values-cinematic-must-not-mutate";
  boundary: "four-authority-disk-rays-derived-spectrum-not-dense-image";
}>;

function validateScenario(scenario: KerrThinDiskScenarioV319): void {
  if (!scenario.id || scenario.id.length > 96
    || !Number.isFinite(scenario.blackHoleMassSolar) || scenario.blackHoleMassSolar < 3 || scenario.blackHoleMassSolar > 1e11
    || !Number.isFinite(scenario.eddingtonRatio) || scenario.eddingtonRatio <= 0 || scenario.eddingtonRatio > 1
    || !Number.isFinite(scenario.observedFrequencyHz) || scenario.observedFrequencyHz < 1e9 || scenario.observedFrequencyHz > 1e22
    || scenario.colorCorrection !== 1) throw new Error("v319-scenario-boundary");
}

function iscoSpecificEnergy(spinA: number): number {
  const radiusM = kerrIscoRadiusV278(spinA);
  const sqrtR = Math.sqrt(radiusM);
  const denominator = radiusM ** 0.75 * Math.sqrt(Math.max(1e-18, radiusM ** 1.5 - 3 * sqrtR + 2 * spinA));
  const energy = (radiusM ** 1.5 - 2 * sqrtR + spinA) / denominator;
  if (!Number.isFinite(energy) || energy <= 0 || energy >= 1) throw new Error("v319-isco-efficiency");
  return energy;
}

export function resolveKerrThinDiskPhysicalScaleV319(spinA: number, scenario: KerrThinDiskScenarioV319): Readonly<{
  blackHoleMassKg: number;
  gravitationalRadiusM: number;
  radiativeEfficiency: number;
  eddingtonLuminosityW: number;
  accretionRateKgS: number;
}> {
  validateScenario(scenario);
  if (!Number.isFinite(spinA) || Math.abs(spinA) > 0.998) throw new Error("v319-spin-boundary");
  const blackHoleMassKg = scenario.blackHoleMassSolar * SOLAR_MASS_KG;
  const radiativeEfficiency = 1 - iscoSpecificEnergy(spinA);
  const eddingtonLuminosityW = 4 * Math.PI * GRAVITATIONAL_CONSTANT_SI * blackHoleMassKg * PROTON_MASS_KG
    * SPEED_OF_LIGHT_M_S / THOMSON_CROSS_SECTION_M2;
  const accretionRateKgS = scenario.eddingtonRatio * eddingtonLuminosityW
    / (radiativeEfficiency * SPEED_OF_LIGHT_M_S ** 2);
  return Object.freeze({
    blackHoleMassKg,
    gravitationalRadiusM: GRAVITATIONAL_CONSTANT_SI * blackHoleMassKg / SPEED_OF_LIGHT_M_S ** 2,
    radiativeEfficiency,
    eddingtonLuminosityW,
    accretionRateKgS,
  });
}

function localFluxSi(spinA: number, radiusM: number, accretionRateKgS: number, blackHoleMassKg: number, integrationSteps: number): number {
  const dimensionlessFlux = novikovThorneFluxV278({ spinA, radiusM, accretionRate: 1, integrationSteps });
  const physicalScale = accretionRateKgS * SPEED_OF_LIGHT_M_S ** 6
    / (GRAVITATIONAL_CONSTANT_SI ** 2 * blackHoleMassKg ** 2);
  const flux = dimensionlessFlux * physicalScale;
  if (!Number.isFinite(flux) || flux < 0) throw new Error("v319-local-flux-non-finite");
  return flux;
}

function spectralSample(spinA: number, radiusM: number, redshiftFactor: number, scenario: KerrThinDiskScenarioV319, integrationSteps: number) {
  const scale = resolveKerrThinDiskPhysicalScaleV319(spinA, scenario);
  const localFluxWM2 = localFluxSi(spinA, radiusM, scale.accretionRateKgS, scale.blackHoleMassKg, integrationSteps);
  const effectiveTemperatureK = Math.max(1, (localFluxWM2 / STEFAN_BOLTZMANN_SI) ** 0.25 / scenario.colorCorrection);
  const emittedFrequencyHz = scenario.observedFrequencyHz / redshiftFactor;
  const emittedSpectralRadiance = planckRadianceV278(effectiveTemperatureK, emittedFrequencyHz) / scenario.colorCorrection ** 4;
  const observedSpectralRadiance = emittedSpectralRadiance * redshiftFactor ** 3;
  const observedBolometricIntensity = localFluxWM2 / Math.PI * redshiftFactor ** 4;
  const emittedInvariant = liouvilleIntensityInvariantV278(emittedSpectralRadiance, emittedFrequencyHz);
  const observedInvariant = liouvilleIntensityInvariantV278(observedSpectralRadiance, scenario.observedFrequencyHz);
  const liouvilleInvariantRelativeResidual = Math.abs(observedInvariant - emittedInvariant) / Math.max(1e-300, Math.abs(emittedInvariant));
  if (![effectiveTemperatureK, emittedFrequencyHz, emittedSpectralRadiance, observedSpectralRadiance, observedBolometricIntensity, liouvilleInvariantRelativeResidual].every(Number.isFinite)
    || emittedFrequencyHz <= 0 || emittedSpectralRadiance < 0 || observedSpectralRadiance < 0 || observedBolometricIntensity < 0) {
    throw new Error("v319-spectral-sample-non-finite");
  }
  return Object.freeze({ ...scale, localFluxWM2, effectiveTemperatureK, emittedFrequencyHz, emittedSpectralRadiance, observedSpectralRadiance, observedBolometricIntensity, liouvilleInvariantRelativeResidual });
}

function relativeDifference(first: number, second: number): number {
  return Math.abs(first - second) / Math.max(1e-300, Math.abs(first), Math.abs(second));
}

export function createKerrThinDiskSpectralViewV319(
  payload: KerrScienceTransferPayloadV299,
  scenario: KerrThinDiskScenarioV319 = KERR_THIN_DISK_DEFAULT_SCENARIO_V319,
): KerrThinDiskSpectralViewV319 {
  validateScenario(scenario);
  const validation = validateKerrScienceTransferPayloadV299(payload);
  if (!validation.passed) throw new Error(`v319-payload-invalid:${validation.failures.join(",")}`);
  if (payload.authorityKind !== "v312-v313-short-gate-sparse"
    || payload.geometryEvidenceSha256 !== KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312
    || payload.polarizationEvidenceSha256 !== KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313
    || payload.rayPlanSha256 !== KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314
    || payload.denseCampaignComplete || payload.denseAggregateSha256 !== null || payload.sampleCount !== 16) {
    throw new Error("v319-current-sparse-authority-boundary");
  }
  let applicableDiskRayCount = 0;
  let maxLiouville = 0;
  let maxQuadrature = 0;
  let maxFormulaSpectral = 0;
  const samples = Array.from({ length: payload.sampleCount }, (_, rayIndex): KerrThinDiskSpectralSampleV319 => {
    const code = payload.classification[rayIndex];
    const classification = code === KERR_CLASSIFICATION_V299.capture ? "capture"
      : code === KERR_CLASSIFICATION_V299.escape ? "escape" : "disk-hit";
    if (classification !== "disk-hit") {
      return Object.freeze({
        rayIndex, classification, applicable: false, spinA: payload.spinA[rayIndex], emissionRadiusM: null,
        kerrSchildEmissionRadiusM: null, redshiftFactor: null, emittedFrequencyHz: null, radiativeEfficiency: null,
        accretionRateKgS: null, localFluxWM2: null, effectiveTemperatureK: null, emittedSpectralRadiance: null,
        observedSpectralRadiance: null, observedBolometricIntensity: null, liouvilleInvariantRelativeResidual: null,
        errorBudget: Object.freeze({ diskQuadratureRelative: null, formulaSpectralRelative: null, geometryRadiusDifferenceM: null, geometryRedshiftDifference: null }),
      });
    }
    applicableDiskRayCount += 1;
    const carter = spectralSample(payload.spinA[rayIndex], payload.emissionRadiusM[rayIndex], payload.redshiftFactor[rayIndex], scenario, 256);
    const coarse = spectralSample(payload.spinA[rayIndex], payload.emissionRadiusM[rayIndex], payload.redshiftFactor[rayIndex], scenario, 128);
    const kerrSchild = spectralSample(payload.spinA[rayIndex], payload.kerrSchildEmissionRadiusM[rayIndex], payload.kerrSchildRedshiftFactor[rayIndex], scenario, 256);
    const diskQuadratureRelative = relativeDifference(carter.observedSpectralRadiance, coarse.observedSpectralRadiance);
    const formulaSpectralRelative = relativeDifference(carter.observedSpectralRadiance, kerrSchild.observedSpectralRadiance);
    maxLiouville = Math.max(maxLiouville, carter.liouvilleInvariantRelativeResidual);
    maxQuadrature = Math.max(maxQuadrature, diskQuadratureRelative);
    maxFormulaSpectral = Math.max(maxFormulaSpectral, formulaSpectralRelative);
    return Object.freeze({
      rayIndex, classification, applicable: true, spinA: payload.spinA[rayIndex], emissionRadiusM: payload.emissionRadiusM[rayIndex],
      kerrSchildEmissionRadiusM: payload.kerrSchildEmissionRadiusM[rayIndex], redshiftFactor: payload.redshiftFactor[rayIndex],
      emittedFrequencyHz: carter.emittedFrequencyHz, radiativeEfficiency: carter.radiativeEfficiency,
      accretionRateKgS: carter.accretionRateKgS, localFluxWM2: carter.localFluxWM2,
      effectiveTemperatureK: carter.effectiveTemperatureK, emittedSpectralRadiance: carter.emittedSpectralRadiance,
      observedSpectralRadiance: carter.observedSpectralRadiance, observedBolometricIntensity: carter.observedBolometricIntensity,
      liouvilleInvariantRelativeResidual: carter.liouvilleInvariantRelativeResidual,
      errorBudget: Object.freeze({
        diskQuadratureRelative,
        formulaSpectralRelative,
        geometryRadiusDifferenceM: payload.geometryDiskRadiusDifferenceM[rayIndex],
        geometryRedshiftDifference: payload.geometryRedshiftDifference[rayIndex],
      }),
    });
  });
  if (applicableDiskRayCount !== 4 || maxLiouville >= 1e-12 || maxQuadrature >= 5e-4 || maxFormulaSpectral >= 0.02) {
    throw new Error(`v319-spectral-qualification:${applicableDiskRayCount}:${maxLiouville}:${maxQuadrature}:${maxFormulaSpectral}`);
  }
  return Object.freeze({
    version: KERR_THIN_DISK_SPECTRAL_VERSION_V319,
    status: "qualified-sparse-derived-spectrum",
    authority: Object.freeze({
      fullShortAuthoritySha256: KERR_FULL_SHORT_AUTHORITY_SHA256_V314,
      geometryEvidenceSha256: KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312,
      polarizationEvidenceSha256: KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313,
      rayPlanSha256: KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314,
      denseAggregateSha256: null,
    }),
    scenario: Object.freeze({ ...scenario }),
    counts: Object.freeze({ sampleCount: 16, applicableDiskRayCount: 4, unavailableRayCount: 12 }),
    maxima: Object.freeze({ liouvilleInvariantRelativeResidual: maxLiouville, diskQuadratureRelative: maxQuadrature, formulaSpectralRelative: maxFormulaSpectral }),
    samples: Object.freeze(samples),
    units: Object.freeze({ radius: "GM/c^2", frequency: "Hz", flux: "W m^-2", temperature: "K", spectralRadiance: "W m^-2 sr^-1 Hz^-1", bolometricIntensity: "W m^-2 sr^-1" }),
    assumptions: Object.freeze([
      "test-particle-kerr", "page-thorne-zero-torque-at-isco", "geometrically-thin-optically-thick-local-blackbody",
      "isotropic-lambert-emission", "no-returning-radiation", "no-limb-darkening", "no-color-correction", "no-grmhd-or-plasma-transfer",
    ] as const),
    uncertaintyCombination: "componentwise-no-rss-no-scalar-total",
    displayBoundary: "science-linear-physical-values-cinematic-must-not-mutate",
    boundary: "four-authority-disk-rays-derived-spectrum-not-dense-image",
  });
}

export function parseKerrThinDiskSpectralViewV319(value: unknown): KerrThinDiskSpectralViewV319 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrThinDiskSpectralViewV319>
    : null;
  if (!source || source.version !== KERR_THIN_DISK_SPECTRAL_VERSION_V319
    || source.status !== "qualified-sparse-derived-spectrum"
    || source.authority?.fullShortAuthoritySha256 !== KERR_FULL_SHORT_AUTHORITY_SHA256_V314
    || source.authority.geometryEvidenceSha256 !== KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312
    || source.authority.polarizationEvidenceSha256 !== KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313
    || source.authority.rayPlanSha256 !== KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314
    || source.authority.denseAggregateSha256 !== null
    || source.counts?.sampleCount !== 16 || source.counts.applicableDiskRayCount !== 4 || source.counts.unavailableRayCount !== 12
    || source.uncertaintyCombination !== "componentwise-no-rss-no-scalar-total"
    || source.displayBoundary !== "science-linear-physical-values-cinematic-must-not-mutate"
    || source.boundary !== "four-authority-disk-rays-derived-spectrum-not-dense-image") {
    throw new Error("v319-view-identity");
  }
  validateScenario(source.scenario as KerrThinDiskScenarioV319);
  if (!Array.isArray(source.samples) || source.samples.length !== 16) throw new Error("v319-view-sample-count");
  let applicableCount = 0;
  source.samples.forEach((sample, index) => {
    if (sample.rayIndex !== index || !["capture", "escape", "disk-hit"].includes(sample.classification)
      || !Number.isFinite(sample.spinA) || Math.abs(sample.spinA) > 0.998) throw new Error("v319-view-sample-identity");
    if (sample.applicable) {
      applicableCount += 1;
      if (sample.classification !== "disk-hit"
        || ![sample.emissionRadiusM, sample.kerrSchildEmissionRadiusM, sample.redshiftFactor, sample.emittedFrequencyHz,
          sample.radiativeEfficiency, sample.accretionRateKgS, sample.localFluxWM2, sample.effectiveTemperatureK,
          sample.emittedSpectralRadiance, sample.observedSpectralRadiance, sample.observedBolometricIntensity,
          sample.liouvilleInvariantRelativeResidual, sample.errorBudget.diskQuadratureRelative,
          sample.errorBudget.formulaSpectralRelative, sample.errorBudget.geometryRadiusDifferenceM,
          sample.errorBudget.geometryRedshiftDifference].every((entry) => typeof entry === "number" && Number.isFinite(entry))) {
        throw new Error("v319-view-disk-observable");
      }
    } else if (sample.classification === "disk-hit"
      || sample.emissionRadiusM !== null || sample.redshiftFactor !== null || sample.observedSpectralRadiance !== null
      || sample.errorBudget.diskQuadratureRelative !== null || sample.errorBudget.formulaSpectralRelative !== null) {
      throw new Error("v319-view-unavailable-observable");
    }
  });
  if (applicableCount !== 4
    || typeof source.maxima?.liouvilleInvariantRelativeResidual !== "number" || source.maxima.liouvilleInvariantRelativeResidual >= 1e-12
    || typeof source.maxima.diskQuadratureRelative !== "number" || source.maxima.diskQuadratureRelative >= 5e-4
    || typeof source.maxima.formulaSpectralRelative !== "number" || source.maxima.formulaSpectralRelative >= 0.02
    || source.units?.spectralRadiance !== "W m^-2 sr^-1 Hz^-1"
    || !Array.isArray(source.assumptions) || source.assumptions.length !== 8
    || !source.assumptions.includes("no-grmhd-or-plasma-transfer")) throw new Error("v319-view-conservation");
  return value as KerrThinDiskSpectralViewV319;
}
