import {
  CELESTIAL_ROTATION_MODELS_V592,
  CELESTIAL_ROTATION_PACKET_SHA256_V592,
  CELESTIAL_ROTATION_SOURCE_PATH_V592,
  CELESTIAL_ROTATION_SOURCE_SHA256_V592,
} from "../data/celestialRotationV592.generated";
import { JULIAN_DATE_J2000_V592 } from "./celestialClockV592";
import type { HeroBodyIdV590 } from "./celestialRenderingV590";

export {
  CELESTIAL_ROTATION_PACKET_SHA256_V592,
  CELESTIAL_ROTATION_SOURCE_PATH_V592,
  CELESTIAL_ROTATION_SOURCE_SHA256_V592,
};

export const CELESTIAL_ROTATION_REFERENCE_URL_V592 = "/data/living-universe-v592/rotation-reference.json" as const;
export const J2000_MEAN_OBLIQUITY_DEG_V592 = 23.439291111 as const;

export type RotationAuthorityV592 =
  | "rotation-admitted-iau-linear-reference"
  | "rotation-authority-incomplete";

export type CelestialRotationModelV592 = Readonly<{
  bodyId: HeroBodyIdV590;
  naifId: number;
  status: RotationAuthorityV592;
  kinematicStatus:
    | "rotation-kinematics-admitted-iau-linear-reference"
    | "rotation-kinematics-admitted-catalog-pole-native-model-meridian"
    | "rotation-kinematics-incomplete";
  absolutePrimeMeridian: boolean;
  poleRaDeg: readonly [number, number, number] | null;
  poleDecDeg: readonly [number, number, number] | null;
  primeMeridianDeg: readonly [number, number, number] | null;
  coefficientPolicy: string;
  referenceFrame: "J2000";
  textureLongitudeCalibration: string;
  scientificPayloadWriteback: false;
}>;

export type CelestialOrientationV592 = Readonly<{
  bodyId: HeroBodyIdV590;
  naifId: number;
  authority: RotationAuthorityV592;
  kinematicAuthority: CelestialRotationModelV592["kinematicStatus"];
  absolutePrimeMeridian: boolean;
  julianDate: number;
  daysSinceJ2000: number;
  julianCenturiesSinceJ2000: number;
  poleRaDeg: number | null;
  poleDecDeg: number | null;
  primeMeridianDeg: number | null;
  signedRotationDegPerDay: number | null;
  quaternionScene: readonly [number, number, number, number] | null;
  periodicTermsApplied: false;
  scientificPayloadWriteback: false;
}>;

const MODEL_BY_BODY_V592 = Object.freeze(Object.fromEntries(
  CELESTIAL_ROTATION_MODELS_V592.map((model) => [model.bodyId, model]),
)) as unknown as Readonly<Record<HeroBodyIdV590, CelestialRotationModelV592>>;

export const CELESTIAL_ROTATION_ADMITTED_BODIES_V592 = Object.freeze(
  CELESTIAL_ROTATION_MODELS_V592
    .filter((model) => model.status === "rotation-admitted-iau-linear-reference")
    .map((model) => model.bodyId),
) as readonly HeroBodyIdV590[];

export const CELESTIAL_ROTATION_INCOMPLETE_BODIES_V592 = Object.freeze(
  CELESTIAL_ROTATION_MODELS_V592
    .filter((model) => model.status === "rotation-authority-incomplete")
    .map((model) => model.bodyId),
) as readonly HeroBodyIdV590[];

export const CELESTIAL_ROTATION_KINEMATIC_BODIES_V592 = Object.freeze(
  CELESTIAL_ROTATION_MODELS_V592
    .filter((model) => model.kinematicStatus.startsWith("rotation-kinematics-admitted"))
    .map((model) => model.bodyId),
) as readonly HeroBodyIdV590[];

const radians = (degrees: number) => degrees * Math.PI / 180;

export function normalizeDegreesV592(degrees: number): number {
  if (!Number.isFinite(degrees)) throw new Error("v592-rotation-degrees");
  const normalized = degrees % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function evaluatePolynomialV592(coefficients: readonly [number, number, number], independent: number): number {
  return coefficients[0] + coefficients[1] * independent + coefficients[2] * independent * independent;
}

type Vector3TupleV592 = readonly [number, number, number];

function normalizeVectorV592(vector: Vector3TupleV592): Vector3TupleV592 {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  if (!Number.isFinite(length) || length < 1e-15) throw new Error("v592-rotation-vector");
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function crossVectorV592(left: Vector3TupleV592, right: Vector3TupleV592): Vector3TupleV592 {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ];
}

function dotVectorV592(left: Vector3TupleV592, right: Vector3TupleV592): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function equatorialVectorToSceneV592(vector: Vector3TupleV592): Vector3TupleV592 {
  const obliquity = radians(J2000_MEAN_OBLIQUITY_DEG_V592);
  const [xEquatorial, yEquatorial, zEquatorial] = vector;
  const xEcliptic = xEquatorial;
  const yEcliptic = Math.cos(obliquity) * yEquatorial + Math.sin(obliquity) * zEquatorial;
  const zEcliptic = -Math.sin(obliquity) * yEquatorial + Math.cos(obliquity) * zEquatorial;
  // Orbit Atlas uses X/Z for the ecliptic plane and +Y for ecliptic north.
  return normalizeVectorV592([xEcliptic, zEcliptic, yEcliptic]);
}

function rotateAroundAxisV592(vector: Vector3TupleV592, axis: Vector3TupleV592, angleRad: number): Vector3TupleV592 {
  const unitAxis = normalizeVectorV592(axis);
  const cosine = Math.cos(angleRad);
  const sine = Math.sin(angleRad);
  const cross = crossVectorV592(unitAxis, vector);
  const dot = dotVectorV592(unitAxis, vector);
  return normalizeVectorV592([
    vector[0] * cosine + cross[0] * sine + unitAxis[0] * dot * (1 - cosine),
    vector[1] * cosine + cross[1] * sine + unitAxis[1] * dot * (1 - cosine),
    vector[2] * cosine + cross[2] * sine + unitAxis[2] * dot * (1 - cosine),
  ]);
}

function quaternionFromBasisV592(
  xAxis: Vector3TupleV592,
  yAxis: Vector3TupleV592,
  zAxis: Vector3TupleV592,
): readonly [number, number, number, number] {
  const m00 = xAxis[0]; const m01 = yAxis[0]; const m02 = zAxis[0];
  const m10 = xAxis[1]; const m11 = yAxis[1]; const m12 = zAxis[1];
  const m20 = xAxis[2]; const m21 = yAxis[2]; const m22 = zAxis[2];
  const trace = m00 + m11 + m22;
  let x: number; let y: number; let z: number; let w: number;
  if (trace > 0) {
    const scale = Math.sqrt(trace + 1) * 2;
    w = 0.25 * scale;
    x = (m21 - m12) / scale;
    y = (m02 - m20) / scale;
    z = (m10 - m01) / scale;
  } else if (m00 > m11 && m00 > m22) {
    const scale = Math.sqrt(1 + m00 - m11 - m22) * 2;
    w = (m21 - m12) / scale;
    x = 0.25 * scale;
    y = (m01 + m10) / scale;
    z = (m02 + m20) / scale;
  } else if (m11 > m22) {
    const scale = Math.sqrt(1 + m11 - m00 - m22) * 2;
    w = (m02 - m20) / scale;
    x = (m01 + m10) / scale;
    y = 0.25 * scale;
    z = (m12 + m21) / scale;
  } else {
    const scale = Math.sqrt(1 + m22 - m00 - m11) * 2;
    w = (m10 - m01) / scale;
    x = (m02 + m20) / scale;
    y = (m12 + m21) / scale;
    z = 0.25 * scale;
  }
  const length = Math.hypot(x, y, z, w);
  const sign = w < 0 ? -1 : 1;
  return [sign * x / length, sign * y / length, sign * z / length, sign * w / length];
}

export function orientationQuaternionFromPoleV592(
  poleRaDeg: number,
  poleDecDeg: number,
  primeMeridianDeg: number,
): readonly [number, number, number, number] {
  if (![poleRaDeg, poleDecDeg, primeMeridianDeg].every(Number.isFinite)) throw new Error("v592-rotation-orientation-input");
  const ra = radians(poleRaDeg);
  const dec = radians(poleDecDeg);
  const poleEquatorial = normalizeVectorV592([
    Math.cos(dec) * Math.cos(ra),
    Math.cos(dec) * Math.sin(ra),
    Math.sin(dec),
  ]);
  const nodeEquatorial = normalizeVectorV592([-Math.sin(ra), Math.cos(ra), 0]);
  const poleScene = equatorialVectorToSceneV592(poleEquatorial);
  const nodeScene = equatorialVectorToSceneV592(nodeEquatorial);
  const primeAxis = rotateAroundAxisV592(nodeScene, poleScene, radians(primeMeridianDeg));
  const thirdAxis = normalizeVectorV592(crossVectorV592(primeAxis, poleScene));
  return quaternionFromBasisV592(primeAxis, poleScene, thirdAxis);
}

export function resolveBodyOrientationV592(
  bodyId: HeroBodyIdV590,
  julianDate: number,
): CelestialOrientationV592 {
  if (!Number.isFinite(julianDate)) throw new Error("v592-rotation-julian-date");
  const model = MODEL_BY_BODY_V592[bodyId];
  const daysSinceJ2000 = julianDate - JULIAN_DATE_J2000_V592;
  const julianCenturiesSinceJ2000 = daysSinceJ2000 / 36_525;
  if (!model.poleRaDeg || !model.poleDecDeg || !model.primeMeridianDeg) {
    return Object.freeze({
      bodyId,
      naifId: model.naifId,
      authority: "rotation-authority-incomplete",
      kinematicAuthority: "rotation-kinematics-incomplete",
      absolutePrimeMeridian: false,
      julianDate,
      daysSinceJ2000,
      julianCenturiesSinceJ2000,
      poleRaDeg: null,
      poleDecDeg: null,
      primeMeridianDeg: null,
      signedRotationDegPerDay: null,
      quaternionScene: null,
      periodicTermsApplied: false,
      scientificPayloadWriteback: false,
    });
  }
  const poleRaDeg = evaluatePolynomialV592(model.poleRaDeg, julianCenturiesSinceJ2000);
  const poleDecDeg = evaluatePolynomialV592(model.poleDecDeg, julianCenturiesSinceJ2000);
  const primeMeridianDeg = normalizeDegreesV592(evaluatePolynomialV592(model.primeMeridianDeg, daysSinceJ2000));
  return Object.freeze({
    bodyId,
    naifId: model.naifId,
    authority: model.status,
    kinematicAuthority: model.kinematicStatus,
    absolutePrimeMeridian: model.absolutePrimeMeridian,
    julianDate,
    daysSinceJ2000,
    julianCenturiesSinceJ2000,
    poleRaDeg,
    poleDecDeg,
    primeMeridianDeg,
    signedRotationDegPerDay: model.primeMeridianDeg[1] + 2 * model.primeMeridianDeg[2] * daysSinceJ2000,
    quaternionScene: orientationQuaternionFromPoleV592(poleRaDeg, poleDecDeg, primeMeridianDeg),
    periodicTermsApplied: false,
    scientificPayloadWriteback: false,
  });
}

/**
 * A bounded photospheric differential-rotation presentation model. It affects
 * no catalog coordinate or scientific payload and is never described as an
 * observed surface map.
 */
export function solarDifferentialRotationDegPerDayV592(latitudeRad: number): number {
  if (!Number.isFinite(latitudeRad)) throw new Error("v592-solar-latitude");
  const sin2 = Math.sin(latitudeRad) ** 2;
  return 14.713 - 2.396 * sin2 - 1.787 * sin2 * sin2;
}

export function serializeOrientationReplayV592(
  bodyIds: readonly HeroBodyIdV590[],
  julianDate: number,
): string {
  return JSON.stringify(bodyIds.map((bodyId) => resolveBodyOrientationV592(bodyId, julianDate)));
}
