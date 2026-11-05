import {
  STELLAR_HEROES_V592,
  STELLAR_HERO_PACKET_SHA256_V592,
} from "../data/stellarHeroesV592.generated";
import { JULIAN_DATE_J2000_V592 } from "./celestialClockV592";

export { STELLAR_HEROES_V592, STELLAR_HERO_PACKET_SHA256_V592 };

export const STELLAR_HERO_PACKET_URL_V592 = "/data/living-universe-v592/stellar-heroes.json" as const;
export const STELLAR_HERO_IDS_V592 = Object.freeze(STELLAR_HEROES_V592.map((hero) => hero.id));
export type StellarHeroIdV592 = (typeof STELLAR_HERO_IDS_V592)[number];
export type StellarHeroV592 = (typeof STELLAR_HEROES_V592)[number];

export const STELLAR_HERO_BY_ID_V592 = Object.freeze(Object.fromEntries(
  STELLAR_HEROES_V592.map((hero) => [hero.id, hero]),
)) as Readonly<Record<StellarHeroIdV592, StellarHeroV592>>;

export function resolveStellarRotationPhaseV592(
  starId: StellarHeroIdV592,
  julianDate: number,
): number {
  if (!Number.isFinite(julianDate)) throw new Error("v592-stellar-julian-date");
  const periodDays = STELLAR_HERO_BY_ID_V592[starId].rotationPeriodDays;
  if (!Number.isFinite(periodDays) || periodDays <= 0) throw new Error(`v592-stellar-rotation-period:${starId}`);
  const turns = (julianDate - JULIAN_DATE_J2000_V592) / periodDays;
  const phase = turns % 1;
  return (phase < 0 ? phase + 1 : phase) * Math.PI * 2;
}

/** Approximate black-body sRGB for presentation; temperature remains catalog metadata. */
export function stellarTemperatureSrgbV592(temperatureK: number): readonly [number, number, number] {
  if (!Number.isFinite(temperatureK) || temperatureK < 1_000 || temperatureK > 60_000) {
    throw new Error("v592-stellar-temperature");
  }
  const temperature = temperatureK / 100;
  const red = temperature <= 66 ? 255 : 329.698727446 * (temperature - 60) ** -0.1332047592;
  const green = temperature <= 66
    ? 99.4708025861 * Math.log(temperature) - 161.1195681661
    : 288.1221695283 * (temperature - 60) ** -0.0755148492;
  const blue = temperature >= 66
    ? 255
    : temperature <= 19
      ? 0
      : 138.5177312231 * Math.log(temperature - 10) - 305.044792731;
  const clamp = (value: number) => Math.min(1, Math.max(0, value / 255));
  return [clamp(red), clamp(green), clamp(blue)];
}

export function stellarInspectionScaleV592(starId: StellarHeroIdV592): readonly [number, number, number] {
  const ratio = STELLAR_HERO_BY_ID_V592[starId].equatorialPolarRadiusRatio;
  const normalization = ratio ** (-2 / 3);
  return [ratio * normalization, normalization, ratio * normalization];
}

export function validateStellarHeroesV592(): void {
  if (STELLAR_HEROES_V592.length !== 24 || new Set(STELLAR_HERO_IDS_V592).size !== 24) {
    throw new Error("v592-stellar-hero-count");
  }
  const sourceIds = new Set<string>();
  for (const hero of STELLAR_HEROES_V592) {
    if (!/^\d+$/.test(hero.gaiaSourceId) || sourceIds.has(hero.gaiaSourceId)) throw new Error(`v592-stellar-gaia-id:${hero.id}`);
    sourceIds.add(hero.gaiaSourceId);
    if (
      hero.gaiaAnchorAngularDistanceDeg > 1.5
      || hero.distancePc <= 0
      || hero.parallaxMas <= 0
      || hero.temperatureK < 1_000
      || hero.luminositySolar <= 0
      || hero.radiusSolar <= 0
      || hero.rotationPeriodDays <= 0
      || hero.equatorialPolarRadiusRatio < 1
      || hero.presentationOnly !== true
      || hero.scientificPayloadWriteback !== false
      || hero.authority.photosphere !== "physics-generated-presentation-model-not-observation-texture"
    ) throw new Error(`v592-stellar-hero:${hero.id}`);
  }
}

validateStellarHeroesV592();
