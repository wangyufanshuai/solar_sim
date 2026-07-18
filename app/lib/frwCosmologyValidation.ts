import type {
  FrwCosmologyParams,
  FrwCosmologyValidationSummary,
  FrwDistanceAnchor,
} from "./simulationDiagnosticsTypes";

const C_KM_S = 299_792.458;
const MPC_KM = 3.0856775814913673e19;
const JULIAN_YEAR_SECONDS = 31_557_600;
const GYR_SECONDS = JULIAN_YEAR_SECONDS * 1e9;
const DEFAULT_INTEGRATION_STEPS = 4096;
const AGE_A_MIN = 1e-6;

export const PLANCK_2018_FLAT_LCDM_PARAMS: FrwCosmologyParams = {
  presetId: "planck2018-flat-lcdm",
  source: "planck-2018",
  h0KmSmpc: 67.4,
  omegaMatter: 0.315,
  omegaLambda: 0.685,
  omegaCurvature: 0,
  reference: "Planck 2018 TT,TE,EE+lowE+lensing base-LambdaCDM",
};

export const FRW_REDSHIFT_ANCHORS = [0.5, 1, 2, 10] as const;

export function validateFrwCosmologyParams(params: FrwCosmologyParams): {
  valid: boolean;
  error?: string;
} {
  if (!Number.isFinite(params.h0KmSmpc) || params.h0KmSmpc <= 0) {
    return { valid: false, error: "H0 must be finite and positive" };
  }
  if (!Number.isFinite(params.omegaMatter) || params.omegaMatter < 0) {
    return { valid: false, error: "Omega_m must be finite and non-negative" };
  }
  if (!Number.isFinite(params.omegaLambda) || params.omegaLambda < 0) {
    return { valid: false, error: "Omega_Lambda must be finite and non-negative" };
  }
  if (!Number.isFinite(params.omegaCurvature)) {
    return { valid: false, error: "Omega_k must be finite" };
  }
  const sum = params.omegaMatter + params.omegaLambda + params.omegaCurvature;
  if (Math.abs(sum - 1) > 1e-6) {
    return { valid: false, error: "Flat LCDM preset must satisfy Omega_m + Omega_Lambda + Omega_k = 1" };
  }
  return { valid: true };
}

export function scaleFactorForRedshift(redshift: number): number {
  assertValidRedshift(redshift);
  return 1 / (1 + redshift);
}

export function hubbleParameterKmSmpc(
  redshift: number,
  params: FrwCosmologyParams = PLANCK_2018_FLAT_LCDM_PARAMS,
): number {
  assertValidRedshift(redshift);
  assertValidParams(params);
  return params.h0KmSmpc * eOfZ(redshift, params);
}

export function hubbleTimeGyr(params: FrwCosmologyParams = PLANCK_2018_FLAT_LCDM_PARAMS): number {
  assertValidParams(params);
  return MPC_KM / params.h0KmSmpc / GYR_SECONDS;
}

export function lookbackTimeGyr(
  redshift: number,
  params: FrwCosmologyParams = PLANCK_2018_FLAT_LCDM_PARAMS,
): number {
  assertValidRedshift(redshift);
  assertValidParams(params);
  if (redshift === 0) return 0;
  const integral = simpsonIntegrate(
    (z) => 1 / ((1 + z) * eOfZ(z, params)),
    0,
    redshift,
    DEFAULT_INTEGRATION_STEPS,
  );
  return hubbleTimeGyr(params) * integral;
}

export function ageAtRedshiftGyr(
  redshift: number,
  params: FrwCosmologyParams = PLANCK_2018_FLAT_LCDM_PARAMS,
): number {
  assertValidRedshift(redshift);
  assertValidParams(params);
  const a = scaleFactorForRedshift(redshift);
  const earlyApprox = (2 / 3) * Math.pow(AGE_A_MIN, 1.5) / Math.sqrt(params.omegaMatter);
  const integral = simpsonIntegrate(
    (scaleFactor) => 1 / (scaleFactor * eOfA(scaleFactor, params)),
    AGE_A_MIN,
    a,
    DEFAULT_INTEGRATION_STEPS,
  );
  return hubbleTimeGyr(params) * (earlyApprox + integral);
}

export function comovingDistanceMpc(
  redshift: number,
  params: FrwCosmologyParams = PLANCK_2018_FLAT_LCDM_PARAMS,
): number {
  assertValidRedshift(redshift);
  assertValidParams(params);
  if (redshift === 0) return 0;
  const integral = simpsonIntegrate(
    (z) => 1 / eOfZ(z, params),
    0,
    redshift,
    DEFAULT_INTEGRATION_STEPS,
  );
  return (C_KM_S / params.h0KmSmpc) * integral;
}

export function luminosityDistanceMpc(
  redshift: number,
  params: FrwCosmologyParams = PLANCK_2018_FLAT_LCDM_PARAMS,
): number {
  assertValidRedshift(redshift);
  return (1 + redshift) * comovingDistanceMpc(redshift, params);
}

export function angularDiameterDistanceMpc(
  redshift: number,
  params: FrwCosmologyParams = PLANCK_2018_FLAT_LCDM_PARAMS,
): number {
  assertValidRedshift(redshift);
  return comovingDistanceMpc(redshift, params) / (1 + redshift);
}

export function distanceModulusMag(
  redshift: number,
  params: FrwCosmologyParams = PLANCK_2018_FLAT_LCDM_PARAMS,
): number {
  const dlMpc = luminosityDistanceMpc(redshift, params);
  if (dlMpc <= 0) return Number.NEGATIVE_INFINITY;
  return 5 * Math.log10(dlMpc) + 25;
}

export function createFrwDistanceAnchor(
  redshift: number,
  params: FrwCosmologyParams = PLANCK_2018_FLAT_LCDM_PARAMS,
): FrwDistanceAnchor {
  return {
    redshift,
    scaleFactor: scaleFactorForRedshift(redshift),
    hubbleKmSmpc: hubbleParameterKmSmpc(redshift, params),
    lookbackTimeGyr: lookbackTimeGyr(redshift, params),
    ageAtRedshiftGyr: ageAtRedshiftGyr(redshift, params),
    comovingDistanceMpc: comovingDistanceMpc(redshift, params),
    luminosityDistanceMpc: luminosityDistanceMpc(redshift, params),
    angularDiameterDistanceMpc: angularDiameterDistanceMpc(redshift, params),
    distanceModulusMag: distanceModulusMag(redshift, params),
  };
}

export function createFrwCosmologyValidationSummary(
  params: FrwCosmologyParams = PLANCK_2018_FLAT_LCDM_PARAMS,
): FrwCosmologyValidationSummary {
  try {
    assertValidParams(params);
    return {
      status: "ready",
      modelId: params.presetId,
      source: params.source,
      confidence: "formula-checked",
      params,
      hubbleTimeGyr: hubbleTimeGyr(params),
      ageNowGyr: ageAtRedshiftGyr(0, params),
      anchors: FRW_REDSHIFT_ANCHORS.map((redshift) => createFrwDistanceAnchor(redshift, params)),
      semantics: {
        cosmology: "analytic-frw-validation-layer",
        structureFormation: "not-nbody-cosmological-structure-formation",
        cmb: "not-boltzmann-solver",
        orbitAtlas: "presentation-layer",
      },
    };
  } catch (error) {
    return {
      status: "failed",
      modelId: params.presetId,
      source: params.source,
      confidence: "formula-checked",
      params,
      hubbleTimeGyr: null,
      ageNowGyr: null,
      anchors: [],
      semantics: {
        cosmology: "analytic-frw-validation-layer",
        structureFormation: "not-nbody-cosmological-structure-formation",
        cmb: "not-boltzmann-solver",
        orbitAtlas: "presentation-layer",
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function eOfZ(redshift: number, params: FrwCosmologyParams): number {
  const zp1 = 1 + redshift;
  return Math.sqrt(
    params.omegaMatter * zp1 * zp1 * zp1 +
    params.omegaCurvature * zp1 * zp1 +
    params.omegaLambda,
  );
}

function eOfA(scaleFactor: number, params: FrwCosmologyParams): number {
  return Math.sqrt(
    params.omegaMatter / Math.pow(scaleFactor, 3) +
    params.omegaCurvature / Math.pow(scaleFactor, 2) +
    params.omegaLambda,
  );
}

function simpsonIntegrate(
  fn: (x: number) => number,
  min: number,
  max: number,
  steps: number,
): number {
  if (max === min) return 0;
  const n = steps % 2 === 0 ? steps : steps + 1;
  const h = (max - min) / n;
  let sum = fn(min) + fn(max);
  for (let i = 1; i < n; i += 1) {
    sum += fn(min + i * h) * (i % 2 === 0 ? 2 : 4);
  }
  return (sum * h) / 3;
}

function assertValidParams(params: FrwCosmologyParams): void {
  const result = validateFrwCosmologyParams(params);
  if (!result.valid) {
    throw new RangeError(result.error ?? "Invalid FRW cosmology params");
  }
}

function assertValidRedshift(redshift: number): void {
  if (!Number.isFinite(redshift) || redshift < 0) {
    throw new RangeError("Redshift must be finite and non-negative");
  }
}
