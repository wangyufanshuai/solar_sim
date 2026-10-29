import { AU_METERS, DAY_SECONDS } from "./physicalConstants";
import type { HorizonsOrbitalResidual } from "./simulationDiagnosticsTypes";

export type HorizonsResidualVector3 = readonly [number, number, number];

export type HorizonsOrbitalResidualInput = {
  measuredPositionAu: HorizonsResidualVector3;
  measuredVelocityAuD: HorizonsResidualVector3;
  referencePositionAu: HorizonsResidualVector3;
  referenceVelocityAuD: HorizonsResidualVector3;
};

const BASIS_EPSILON = 1e-15;

export function createHorizonsOrbitalResidual(
  input: HorizonsOrbitalResidualInput,
): HorizonsOrbitalResidual {
  const positionDeltaAu = subtract(
    input.measuredPositionAu,
    input.referencePositionAu,
  );
  const velocityDeltaAuD = subtract(
    input.measuredVelocityAuD,
    input.referenceVelocityAuD,
  );
  const positionDeltaKm = scale(positionDeltaAu, AU_METERS / 1000);
  const velocityDeltaMs = scale(velocityDeltaAuD, AU_METERS / DAY_SECONDS);
  const positionNormKm = magnitude(positionDeltaKm);
  const velocityNormMs = magnitude(velocityDeltaMs);
  const basis = createReferenceRtnBasis(
    input.referencePositionAu,
    input.referenceVelocityAuD,
  );

  if (!basis) {
    return {
      frame: "sun-centered-reference-rtn",
      basisStatus: "degenerate",
      radialPositionKm: null,
      transversePositionKm: null,
      normalPositionKm: null,
      radialVelocityMs: null,
      transverseVelocityMs: null,
      normalVelocityMs: null,
      positionNormKm,
      velocityNormMs,
    };
  }

  return {
    frame: "sun-centered-reference-rtn",
    basisStatus: "ready",
    radialPositionKm: dot(positionDeltaKm, basis.radial),
    transversePositionKm: dot(positionDeltaKm, basis.transverse),
    normalPositionKm: dot(positionDeltaKm, basis.normal),
    radialVelocityMs: dot(velocityDeltaMs, basis.radial),
    transverseVelocityMs: dot(velocityDeltaMs, basis.transverse),
    normalVelocityMs: dot(velocityDeltaMs, basis.normal),
    positionNormKm,
    velocityNormMs,
  };
}

export function createReferenceRtnBasis(
  referencePosition: HorizonsResidualVector3,
  referenceVelocity: HorizonsResidualVector3,
): {
  radial: HorizonsResidualVector3;
  transverse: HorizonsResidualVector3;
  normal: HorizonsResidualVector3;
} | null {
  if (!isFiniteVector(referencePosition) || !isFiniteVector(referenceVelocity)) {
    return null;
  }
  const radial = normalize(referencePosition);
  if (!radial) return null;
  const normal = normalize(cross(referencePosition, referenceVelocity));
  if (!normal) return null;
  const transverse = normalize(cross(normal, radial));
  if (!transverse) return null;
  return { radial, transverse, normal };
}

function isFiniteVector(value: HorizonsResidualVector3): boolean {
  return value.every(Number.isFinite);
}

function subtract(
  left: HorizonsResidualVector3,
  right: HorizonsResidualVector3,
): HorizonsResidualVector3 {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
}

function scale(
  value: HorizonsResidualVector3,
  factor: number,
): HorizonsResidualVector3 {
  return [value[0] * factor, value[1] * factor, value[2] * factor];
}

function dot(
  left: HorizonsResidualVector3,
  right: HorizonsResidualVector3,
): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function cross(
  left: HorizonsResidualVector3,
  right: HorizonsResidualVector3,
): HorizonsResidualVector3 {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ];
}

function magnitude(value: HorizonsResidualVector3): number {
  return Math.hypot(value[0], value[1], value[2]);
}

function normalize(
  value: HorizonsResidualVector3,
): HorizonsResidualVector3 | null {
  const norm = magnitude(value);
  if (!Number.isFinite(norm) || norm <= BASIS_EPSILON) return null;
  return [value[0] / norm, value[1] / norm, value[2] / norm];
}
