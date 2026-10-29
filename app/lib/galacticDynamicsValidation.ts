import {
  DEFAULT_GALACTIC_POTENTIAL,
  KPC_METERS,
  galacticCircularVelocityKmS,
  galacticEscapeSpeedKmS,
  galacticPotentialJPerKg,
  type GalacticPotentialParams,
} from "./galacticPotential";
import { atlasPublicAssetUrl } from "./atlasDeliveryProfile";
import type {
  GaiaDr3KinematicsRow,
  GalacticDynamicsValidationSummary,
  GalacticRotationCurvePoint,
  GalacticVelocitySample,
} from "./simulationDiagnosticsTypes";

const KM_S_PER_AU_YR_AT_ONE_PC = 4.74047;
const C_MS = 299_792_458;
const DAY_SECONDS = 86_400;

export const GAIA_DR3_KINEMATICS_URL = atlasPublicAssetUrl("data/gaia-dr3-kinematics-2000.json");
export const GALACTIC_R0_KPC = 8.178;
export const GALACTIC_ROTATION_CURVE_RADII_KPC = [4, 6, GALACTIC_R0_KPC, 10, 12, 16] as const;
export const PENDING_GALACTIC_VALIDATION: GalacticDynamicsValidationSummary = {
  status: "pending",
  source: "unavailable",
  sampleCount: 0,
  r0Kpc: GALACTIC_R0_KPC,
  localCircularVelocityTargetKmS: [220, 240],
  localEscapeVelocityTargetKmS: [520, 580],
  rotationCurve: [],
  circularVelocityAtR0KmS: null,
  escapeSpeedAtR0KmS: null,
  medianTangentialVelocityKmS: null,
  medianSpeedKmS: null,
  medianAbsUkmS: null,
  medianAbsVkmS: null,
  medianAbsWkmS: null,
  verticalOscillationScale: "order-of-magnitude teaching diagnostic",
  weakFieldPhiOverC2: null,
  weakFieldClockOffsetUsPerDay: null,
  weakFieldDiagnostic: "teaching",
  semantics: {
    solarDynamics: "live-nbody-eih-1pn",
    galacticDynamics: "analytic-potential-validation",
    orbitAtlas: "presentation-layer",
    cosmology: "not-full-gr-or-cosmological-expansion",
  },
};

export function loadGaiaKinematicsCatalogFromJson(json: string): GaiaDr3KinematicsRow[] {
  const raw = JSON.parse(json) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error("Gaia kinematics catalog JSON must be an array");
  }
  const rows = raw.map((row, index) => {
    if (!isGaiaDr3KinematicsRow(row)) {
      throw new Error(`Invalid Gaia kinematics row at index ${index}`);
    }
    return {
      ...row,
      source_id: String(row.source_id),
    };
  });
  if (rows.length === 0) {
    throw new Error("Gaia kinematics catalog must not be empty");
  }
  return rows;
}

export function isGaiaDr3KinematicsRow(row: unknown): row is GaiaDr3KinematicsRow {
  if (!row || typeof row !== "object") return false;
  const r = row as Record<string, unknown>;
  return (
    (typeof r.source_id === "string" || typeof r.source_id === "number") &&
    finiteNumber(r.ra) &&
    finiteNumber(r.dec) &&
    finiteNumber(r.parallax) &&
    finiteNumber(r.pmra) &&
    finiteNumber(r.pmdec) &&
    finiteNumber(r.radial_velocity) &&
    finiteNumber(r.phot_g_mean_mag) &&
    finiteNumber(r.bp_rp) &&
    finiteNumber(r.parallax_over_error) &&
    finiteNumber(r.ruwe) &&
    finiteNumber(r.radial_velocity_error) &&
    r.parallax > 5 &&
    r.parallax_over_error >= 10 &&
    r.ruwe < 1.4 &&
    r.radial_velocity_error <= 5
  );
}

export function gaiaKinematicsToLocalVelocity(row: GaiaDr3KinematicsRow): GalacticVelocitySample {
  const ra = degToRad(row.ra);
  const dec = degToRad(row.dec);
  const distancePc = 1000 / row.parallax;
  const cosDec = Math.cos(dec);
  const sinDec = Math.sin(dec);
  const cosRa = Math.cos(ra);
  const sinRa = Math.sin(ra);

  const rHat = [cosDec * cosRa, cosDec * sinRa, sinDec] as const;
  const alphaHat = [-sinRa, cosRa, 0] as const;
  const deltaHat = [-cosRa * sinDec, -sinRa * sinDec, cosDec] as const;

  const vAlphaKmS = KM_S_PER_AU_YR_AT_ONE_PC * distancePc * (row.pmra / 1000);
  const vDeltaKmS = KM_S_PER_AU_YR_AT_ONE_PC * distancePc * (row.pmdec / 1000);
  const icrsVelocity = [
    row.radial_velocity * rHat[0] + vAlphaKmS * alphaHat[0] + vDeltaKmS * deltaHat[0],
    row.radial_velocity * rHat[1] + vAlphaKmS * alphaHat[1] + vDeltaKmS * deltaHat[1],
    row.radial_velocity * rHat[2] + vAlphaKmS * alphaHat[2] + vDeltaKmS * deltaHat[2],
  ] as const;
  const [uKmS, vKmS, wKmS] = icrsToGalacticVelocity(icrsVelocity);
  const tangentialKmS = Math.hypot(vAlphaKmS, vDeltaKmS);

  return {
    sourceId: String(row.source_id),
    distancePc,
    uKmS,
    vKmS,
    wKmS,
    tangentialKmS,
    speedKmS: Math.hypot(uKmS, vKmS, wKmS),
  };
}

export function computeGalacticRotationCurve(
  params: GalacticPotentialParams = DEFAULT_GALACTIC_POTENTIAL,
): GalacticRotationCurvePoint[] {
  return GALACTIC_ROTATION_CURVE_RADII_KPC.map((radiusKpc) => ({
    radiusKpc,
    circularVelocityKmS: galacticCircularVelocityKmS(radiusKpc * 1000, params),
  }));
}

export function computeGalacticEscapeSpeedKmS(
  radiusKpc = GALACTIC_R0_KPC,
  params: GalacticPotentialParams = DEFAULT_GALACTIC_POTENTIAL,
): number {
  return galacticEscapeSpeedKmS(radiusKpc, params);
}

export function computeGalacticWeakFieldClockOffset(
  radiusKpc = GALACTIC_R0_KPC,
  params: GalacticPotentialParams = DEFAULT_GALACTIC_POTENTIAL,
): { phiOverC2: number; clockOffsetUsPerDay: number; diagnostic: "teaching" } {
  const phi = galacticPotentialJPerKg(radiusKpc * KPC_METERS, 0, 0, params);
  const phiOverC2 = Math.abs(phi) / (C_MS * C_MS);
  return {
    phiOverC2,
    clockOffsetUsPerDay: phiOverC2 * DAY_SECONDS * 1e6,
    diagnostic: "teaching",
  };
}

export function createGalacticDynamicsValidationSummary(
  rows: readonly GaiaDr3KinematicsRow[],
  params: GalacticPotentialParams = DEFAULT_GALACTIC_POTENTIAL,
): GalacticDynamicsValidationSummary {
  const samples = rows.map(gaiaKinematicsToLocalVelocity).filter(isFiniteVelocitySample);
  const rotationCurve = computeGalacticRotationCurve(params);
  const circularVelocityAtR0KmS =
    rotationCurve.find((point) => point.radiusKpc === GALACTIC_R0_KPC)?.circularVelocityKmS ?? null;
  const escapeSpeedAtR0KmS = computeGalacticEscapeSpeedKmS(GALACTIC_R0_KPC, params);
  const weakField = computeGalacticWeakFieldClockOffset(GALACTIC_R0_KPC, params);

  return {
    ...PENDING_GALACTIC_VALIDATION,
    status: "ready",
    source: "gaia-dr3-kinematics",
    sampleCount: samples.length,
    rotationCurve,
    circularVelocityAtR0KmS,
    escapeSpeedAtR0KmS,
    medianTangentialVelocityKmS: median(samples.map((sample) => sample.tangentialKmS)),
    medianSpeedKmS: median(samples.map((sample) => sample.speedKmS)),
    medianAbsUkmS: median(samples.map((sample) => Math.abs(sample.uKmS))),
    medianAbsVkmS: median(samples.map((sample) => Math.abs(sample.vKmS))),
    medianAbsWkmS: median(samples.map((sample) => Math.abs(sample.wKmS))),
    weakFieldPhiOverC2: weakField.phiOverC2,
    weakFieldClockOffsetUsPerDay: weakField.clockOffsetUsPerDay,
  };
}

export function failedGalacticDynamicsValidationSummary(error: unknown): GalacticDynamicsValidationSummary {
  return {
    ...PENDING_GALACTIC_VALIDATION,
    status: "failed",
    error: error instanceof Error ? error.message : String(error),
  };
}

function icrsToGalacticVelocity(v: readonly [number, number, number]): [number, number, number] {
  const m = [
    [-0.0548755604, -0.8734370902, -0.4838350155],
    [0.4941094279, -0.44482963, 0.7469822445],
    [-0.867666149, -0.1980763734, 0.4559837762],
  ] as const;
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

function isFiniteVelocitySample(sample: GalacticVelocitySample): boolean {
  return (
    Number.isFinite(sample.distancePc) &&
    Number.isFinite(sample.uKmS) &&
    Number.isFinite(sample.vKmS) &&
    Number.isFinite(sample.wKmS) &&
    Number.isFinite(sample.tangentialKmS) &&
    Number.isFinite(sample.speedKmS)
  );
}

function median(values: readonly number[]): number | null {
  const sorted = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
