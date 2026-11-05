import {
  MAJOR_MOON_MODELS_V592,
  MAJOR_MOON_MOTION_REFERENCE_COUNT_V592,
  MAJOR_MOON_PACKET_SHA256_V592,
  MAJOR_MOON_VISUAL_ASSET_ADMISSION_COUNT_V592,
} from "../data/majorMoonsV592.generated";
import { JULIAN_DATE_J2000_V592 } from "./celestialClockV592";
import { orientationQuaternionFromPoleV592 } from "./celestialRotationV592";

export {
  MAJOR_MOON_MODELS_V592,
  MAJOR_MOON_MOTION_REFERENCE_COUNT_V592,
  MAJOR_MOON_PACKET_SHA256_V592,
  MAJOR_MOON_VISUAL_ASSET_ADMISSION_COUNT_V592,
};

export const MAJOR_MOON_REFERENCE_URL_V592 = "/data/living-universe-v592/major-moons-reference.json" as const;
export type MajorMoonIdV592 = (typeof MAJOR_MOON_MODELS_V592)[number]["bodyId"];

export const MAJOR_MOON_BY_ID_V592 = Object.freeze(Object.fromEntries(
  MAJOR_MOON_MODELS_V592.map((moon) => [moon.bodyId, moon]),
)) as unknown as Readonly<Record<MajorMoonIdV592, (typeof MAJOR_MOON_MODELS_V592)[number]>>;

export const MAJOR_MOON_IDS_V592 = Object.freeze(
  MAJOR_MOON_MODELS_V592.map((moon) => moon.bodyId),
) as readonly MajorMoonIdV592[];

export const MAJOR_MOON_ASSET_BLOCKED_IDS_V592 = Object.freeze(
  MAJOR_MOON_MODELS_V592
    .filter((moon) => moon.visualAsset.status === "asset-blocked")
    .map((moon) => moon.bodyId),
) as readonly MajorMoonIdV592[];

function normalizeDegreesV592(value: number): number {
  const result = value % 360;
  return result < 0 ? result + 360 : result;
}

function evaluatePolynomialV592(coefficients: readonly number[], independent: number): number {
  return coefficients[0] + coefficients[1] * independent + coefficients[2] * independent * independent;
}

export function resolveMajorMoonRotationV592(bodyId: MajorMoonIdV592, julianDate: number) {
  if (!Number.isFinite(julianDate)) throw new Error("v592-major-moon-julian-date");
  const moon = MAJOR_MOON_BY_ID_V592[bodyId];
  if (!moon) throw new Error(`v592-major-moon-id:${bodyId}`);
  const daysSinceJ2000 = julianDate - JULIAN_DATE_J2000_V592;
  const centuriesSinceJ2000 = daysSinceJ2000 / 36_525;
  const poleRaDeg = evaluatePolynomialV592(moon.rotation.poleRaDeg, centuriesSinceJ2000);
  const poleDecDeg = evaluatePolynomialV592(moon.rotation.poleDecDeg, centuriesSinceJ2000);
  const primeMeridianDeg = normalizeDegreesV592(evaluatePolynomialV592(moon.rotation.primeMeridianDeg, daysSinceJ2000));
  return Object.freeze({
    bodyId,
    julianDate,
    daysSinceJ2000,
    poleRaDeg,
    poleDecDeg,
    primeMeridianDeg,
    signedRotationDegPerDay: moon.rotation.signedRotationDegPerDay,
    direction: moon.rotation.direction,
    absolutePrimeMeridian: true as const,
    quaternionScene: orientationQuaternionFromPoleV592(poleRaDeg, poleDecDeg, primeMeridianDeg),
    periodicTermsApplied: false as const,
    scientificPayloadWriteback: false as const,
  });
}

export function serializeMajorMoonReplayV592(julianDate: number): string {
  return JSON.stringify(MAJOR_MOON_IDS_V592.map((bodyId) => resolveMajorMoonRotationV592(bodyId, julianDate)));
}
