import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import {
  CONSTELLATION_DEFAULT_DESKTOP_V591,
  CONSTELLATION_DEFAULT_MOBILE_V591,
} from "./celestialConstellationsV591";
import { CONSTELLATION_SPHERE_RADIUS_V590 } from "./celestialDeepSpaceV590";
import type {
  CelestialDeviceTierV590,
  CelestialFocusTargetV590,
} from "./celestialRenderingV590";

export const CONSTELLATION_RENDER_RADIUS_V592 = CONSTELLATION_SPHERE_RADIUS_V590 - 0.12;
export const CONSTELLATION_FOCUS_CODE_BY_TARGET_V592 = Object.freeze({
  orion: "Ori",
  "ursa-major": "UMa",
  cassiopeia: "Cas",
} as const);
export const CONSTELLATION_MOBILE_FOV_DEG_BY_CODE_V592 = Object.freeze({
  Ori: 56,
  UMa: 72,
  Cas: 58,
} as const);

export type ConstellationFocusTargetV592 = keyof typeof CONSTELLATION_FOCUS_CODE_BY_TARGET_V592;
export type ConstellationFocusCodeV592 = typeof CONSTELLATION_FOCUS_CODE_BY_TARGET_V592[ConstellationFocusTargetV592];

export type LivingConstellationLabelV592 = Readonly<{
  code: string;
  latin: string;
  chinese: string;
}>;

const DEFAULT_DESKTOP_CODES_V592 = Object.freeze([
  ...CONSTELLATION_DEFAULT_DESKTOP_V591.slice(0, 11),
  "Cru",
] as const);

const LABEL_BY_CODE_V592 = new Map<string, LivingConstellationLabelV592>(
  CONSTELLATION_LINES.map((entry) => [entry.iauCode, Object.freeze({
    code: entry.iauCode,
    latin: entry.name,
    chinese: entry.nameCn,
  })]),
);

export function constellationFocusCodeV592(
  focusTarget: CelestialFocusTargetV590,
): ConstellationFocusCodeV592 | null {
  return focusTarget in CONSTELLATION_FOCUS_CODE_BY_TARGET_V592
    ? CONSTELLATION_FOCUS_CODE_BY_TARGET_V592[focusTarget as ConstellationFocusTargetV592]
    : null;
}

export function defaultConstellationCodesV592(
  deviceTier: CelestialDeviceTierV590,
): readonly string[] {
  return deviceTier === "mobile"
    ? CONSTELLATION_DEFAULT_MOBILE_V591
    : DEFAULT_DESKTOP_CODES_V592;
}

export function visibleConstellationCodesV592(
  deviceTier: CelestialDeviceTierV590,
  focusTarget: CelestialFocusTargetV590,
): readonly string[] {
  const defaults = defaultConstellationCodesV592(deviceTier);
  const focusedCode = constellationFocusCodeV592(focusTarget);
  if (!focusedCode || defaults.includes(focusedCode as never)) return defaults;
  return Object.freeze([...defaults.slice(0, Math.max(0, defaults.length - 1)), focusedCode]);
}

export function constellationLabelV592(
  code: string,
  fallbackLatin: string,
): LivingConstellationLabelV592 {
  return LABEL_BY_CODE_V592.get(code) ?? Object.freeze({
    code,
    latin: fallbackLatin,
    chinese: "",
  });
}

export function constellationLabelCountV592(values: Readonly<{
  visibleCodeCount: number;
  focusedCode: string | null;
  closeup: boolean;
  cleanView: boolean;
}>): number {
  if (values.cleanView) return 0;
  if (values.focusedCode) return 1;
  return values.closeup ? 0 : values.visibleCodeCount;
}

export function constellationMobileFovDegV592(code: ConstellationFocusCodeV592): number {
  return CONSTELLATION_MOBILE_FOV_DEG_BY_CODE_V592[code];
}

export function constellationHorizontalViewOffsetPxV592(ndcX: number, viewportWidth: number): number {
  if (!Number.isFinite(ndcX) || !Number.isFinite(viewportWidth) || viewportWidth <= 0) {
    throw new Error("v592-constellation-view-offset-input");
  }
  const limit = viewportWidth * 0.78;
  return Math.max(-limit, Math.min(limit, ndcX * viewportWidth * 0.5));
}

export const CONSTELLATION_NAME_COVERAGE_V592 = Object.freeze({
  iauCount: CONSTELLATION_LINES.length,
  latinCount: CONSTELLATION_LINES.filter((entry) => entry.name.trim().length > 0).length,
  chineseCount: CONSTELLATION_LINES.filter((entry) => entry.nameCn.trim().length > 0).length,
  source: "readonly-app-data-constellation-catalog",
  presentationOnly: true,
  iauBoundaryAdmission: "blocked-source-not-admitted",
} as const);
