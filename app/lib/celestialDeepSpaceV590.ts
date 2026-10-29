import {
  DEEP_SPACE_LAYERS_V590,
  type NebulaIdV590,
} from "./celestialRenderingV590";
import type { CatalogByteRangeV8, CatalogTileIndexEntryV8 } from "./catalogTileV8";

export const CELESTIAL_SPHERE_RADIUS_V590 = 232 as const;
/**
 * Every deep-space layer is expressed in the same camera-centred celestial
 * frame. Render order, rather than a collection of different shell radii,
 * separates the Milky Way, Gaia and constellation presentation layers.
 */
export const MILKY_WAY_SPHERE_RADIUS_V590 = CELESTIAL_SPHERE_RADIUS_V590;
export const CONSTELLATION_SPHERE_RADIUS_V590 = CELESTIAL_SPHERE_RADIUS_V590;
export const MILKY_WAY_ROTATION_V590 = Object.freeze([-0.34, 4.24, -0.86] as const);

export type CelestialStarfieldViewV590 = Readonly<{
  raDeg: number;
  decDeg: number;
  fovDeg: number;
}>;

export const STARFIELD_VIEW_ANGLE_THRESHOLD_DEG_V590 = 7.5 as const;
export const STARFIELD_VIEW_FOV_THRESHOLD_DEG_V590 = 4 as const;
export const STARFIELD_VIEW_SETTLE_MS_V590 = 260 as const;
export const STARFIELD_VIEW_THROTTLE_MS_V590 = 800 as const;
export const GAIA_RANGE_MAX_BYTES_V590 = 1024 * 1024;
export const GAIA_RANGE_MAX_GAP_BYTES_V590 = 64 * 1024;
export const GAIA_RANGE_CONCURRENCY_V590 = 1;
export const GAIA_STRATIFIED_PARENT_COLUMNS_V590 = 24;
export const GAIA_STRATIFIED_PARENT_ROWS_V590 = 14;

function reverseLowBitsV590(value: number, bits: number): number {
  let source = value;
  let result = 0;
  for (let index = 0; index < bits; index += 1) {
    result = (result << 1) | (source & 1);
    source >>= 1;
  }
  return result;
}

export function stratifiedParentLimitV590(recordBudget: number): number {
  if (!Number.isSafeInteger(recordBudget) || recordBudget <= 0) throw new RangeError("v590-gaia-stratified-budget");
  return Math.min(384, Math.max(96, Math.ceil(recordBudget / 156)));
}

/**
 * Samples the full view cone before requesting archive leaves. The legacy
 * nearest-first selector collapsed dense Galactic fields into a visible
 * HEALPix diamond because the row budget was consumed by only a few central
 * parents. This grid is presentation-only, deterministic and view-wide.
 */
export function selectStratifiedCatalogParentsV590(
  entries: readonly CatalogTileIndexEntryV8[],
  view: CelestialStarfieldViewV590,
  maximumParents: number,
): CatalogTileIndexEntryV8[] {
  if (!Number.isSafeInteger(maximumParents) || maximumParents <= 0) throw new RangeError("v590-gaia-stratified-parent-maximum");
  const ra = view.raDeg * Math.PI / 180;
  const dec = view.decDeg * Math.PI / 180;
  const halfAngle = Math.min(Math.PI * 0.49, (view.fovDeg * 0.5 + 6) * Math.PI / 180);
  const forward = [Math.cos(dec) * Math.cos(ra), Math.sin(dec), Math.cos(dec) * Math.sin(ra)] as const;
  const east = [-Math.sin(ra), 0, Math.cos(ra)] as const;
  const north = [-Math.sin(dec) * Math.cos(ra), Math.cos(dec), -Math.sin(dec) * Math.sin(ra)] as const;
  const columns = GAIA_STRATIFIED_PARENT_COLUMNS_V590;
  const rows = GAIA_STRATIFIED_PARENT_ROWS_V590;
  const buckets = new Map<number, Array<{ entry: CatalogTileIndexEntryV8; score: number }>>();
  for (const entry of entries) {
    if (entry.rowCount <= 0) continue;
    const entryRa = entry.centerRaDeg * Math.PI / 180;
    const entryDec = entry.centerDecDeg * Math.PI / 180;
    const direction = [Math.cos(entryDec) * Math.cos(entryRa), Math.sin(entryDec), Math.cos(entryDec) * Math.sin(entryRa)] as const;
    const forwardDot = direction[0] * forward[0] + direction[1] * forward[1] + direction[2] * forward[2];
    if (forwardDot <= 0 || Math.acos(THREE_CLAMP_V590(forwardDot)) > halfAngle) continue;
    const eastDot = direction[0] * east[0] + direction[1] * east[1] + direction[2] * east[2];
    const northDot = direction[0] * north[0] + direction[1] * north[1] + direction[2] * north[2];
    const x = Math.atan2(eastDot, forwardDot) / halfAngle;
    const y = Math.atan2(northDot, forwardDot) / halfAngle;
    if (Math.abs(x) > 1 || Math.abs(y) > 1) continue;
    const column = Math.min(columns - 1, Math.max(0, Math.floor((x * 0.5 + 0.5) * columns)));
    const row = Math.min(rows - 1, Math.max(0, Math.floor((y * 0.5 + 0.5) * rows)));
    const bucket = row * columns + column;
    const centerX = ((column + 0.5) / columns) * 2 - 1;
    const centerY = ((row + 0.5) / rows) * 2 - 1;
    const values = buckets.get(bucket) ?? [];
    values.push({ entry, score: (x - centerX) ** 2 + (y - centerY) ** 2 });
    buckets.set(bucket, values);
  }
  const orderedBuckets = [...buckets.entries()]
    .map(([key, values]) => ({
      key,
      values: values.sort((left, right) => left.score - right.score || left.entry.cell - right.entry.cell),
    }))
    .sort((left, right) => reverseLowBitsV590(left.key, 9) - reverseLowBitsV590(right.key, 9) || left.key - right.key);
  const selected: CatalogTileIndexEntryV8[] = [];
  for (let round = 0; selected.length < maximumParents; round += 1) {
    let added = false;
    for (const bucket of orderedBuckets) {
      const candidate = bucket.values[round];
      if (!candidate) continue;
      selected.push(candidate.entry);
      added = true;
      if (selected.length >= maximumParents) break;
    }
    if (!added) break;
  }
  return selected;
}

const THREE_CLAMP_V590 = (value: number): number => Math.min(1, Math.max(-1, value));

export function selectStratifiedCatalogLeavesV590<T extends Readonly<{ cell: number; rowCount: number }>>(
  leaves: readonly T[],
  parentOrder: readonly number[],
  recordBudget: number,
): T[] {
  if (!Number.isSafeInteger(recordBudget) || recordBudget <= 0) throw new RangeError("v590-gaia-stratified-leaf-budget");
  const byParent = new Map<number, T[]>();
  for (const leaf of leaves) {
    if (leaf.rowCount <= 0) continue;
    const parent = Math.floor(leaf.cell / 16);
    const values = byParent.get(parent) ?? [];
    values.push(leaf);
    byParent.set(parent, values);
  }
  byParent.forEach((values) => values.sort((left, right) => (
    reverseLowBitsV590(left.cell & 15, 4) - reverseLowBitsV590(right.cell & 15, 4)
    || left.cell - right.cell
  )));
  const selected: T[] = [];
  let rows = 0;
  for (let round = 0; rows < recordBudget; round += 1) {
    let added = false;
    for (const parent of parentOrder) {
      const candidate = byParent.get(parent)?.[round];
      if (!candidate) continue;
      selected.push(candidate);
      rows += candidate.rowCount;
      added = true;
      if (rows >= recordBudget) break;
    }
    if (!added) break;
  }
  return selected;
}

export function mergeBoundedCatalogRangesV590(
  entries: readonly CatalogTileIndexEntryV8[],
  maxGapBytes = GAIA_RANGE_MAX_GAP_BYTES_V590,
  maxRangeBytes = GAIA_RANGE_MAX_BYTES_V590,
): CatalogByteRangeV8[] {
  if (!Number.isSafeInteger(maxGapBytes) || maxGapBytes < 0) throw new RangeError("v590-gaia-range-gap");
  if (!Number.isSafeInteger(maxRangeBytes) || maxRangeBytes <= 0) throw new RangeError("v590-gaia-range-maximum");
  const sorted = [...entries]
    .filter((entry) => entry.byteLength > 0)
    .sort((left, right) => left.archiveOffset - right.archiveOffset || left.cell - right.cell);
  const ranges: CatalogByteRangeV8[] = [];
  for (const entry of sorted) {
    const start = entry.archiveOffset;
    const end = start + entry.byteLength - 1;
    if (entry.byteLength > maxRangeBytes) throw new RangeError(`v590-gaia-range-entry:${entry.cell}`);
    const previous = ranges.at(-1);
    const mergedEnd = previous ? Math.max(previous.end, end) : end;
    if (
      previous
      && start <= previous.end + 1 + maxGapBytes
      && mergedEnd - previous.start + 1 <= maxRangeBytes
    ) {
      ranges[ranges.length - 1] = {
        start: previous.start,
        end: mergedEnd,
        cells: [...previous.cells, entry.cell],
      };
    } else {
      ranges.push({ start, end, cells: [entry.cell] });
    }
  }
  return ranges;
}

export const CONSTELLATION_BINDING_URL_V590 =
  "/data/celestial-art-v589/constellation-gaia-bindings-v589.json" as const;
export const CONSTELLATION_BINDING_IDENTITY_SHA256_V590 =
  "5d5faefe782b221729084dc9796969579515151afab8c1ed377f0cbf718937a8" as const;
export const CONSTELLATION_BINDING_FILE_SHA256_V590 =
  "6c5aefed75d78f566fa598a2fe15bad5482af41f7a600d055c1554544012f5f5" as const;
export const GAIA_LITE_URL_V590 = "/data/celestial-art-v589/gaia-lite-46000-v589.bin" as const;
export const GAIA_LITE_SHA256_V590 =
  "a312297456bac7190c7a347d281cea12681ad2bbc6c2458434fb882cf61aa802" as const;

export type DeepSpaceDeviceTierV590 = "desktop" | "mobile";
export type DeepSpaceDeliveryTierV590 = "standalone-full" | "vercel-lite";
export type StarPsfClassV590 = 0 | 1 | 2;

export type FrozenSkyAssetV590 = Readonly<{
  id: "base" | "catalog-stars" | "dust-mask";
  desktopUrl: string;
  desktopBytes: number;
  desktopSha256: string;
  mobileUrl: string;
  mobileBytes: number;
  mobileSha256: string;
  colorSpace: "srgb" | "linear";
  frozenDependency: "V9-readonly" | "v588-readonly";
}>;

export const FROZEN_SKY_ASSETS_V590: readonly FrozenSkyAssetV590[] = Object.freeze([
  {
    id: "base",
    desktopUrl: "/textures/candidate-v588/sky/milky-way-desktop.jpg",
    desktopBytes: 14_122_321,
    desktopSha256: "9d52abb4774cdca473606f514158b72a5af5950fa283e53d703b983a83ff1df2",
    mobileUrl: "/textures/candidate-v588/sky/milky-way-mobile.jpg",
    mobileBytes: 2_594_446,
    mobileSha256: "eea88c57a8fd769c0ca70bcd53006a0314b9e8fab40dba1ad4a8b2317c24a0dc",
    colorSpace: "srgb",
    frozenDependency: "v588-readonly",
  },
  {
    id: "catalog-stars",
    desktopUrl: "/textures/sky/orbit-atlas-v9-stars-4k.jpg",
    desktopBytes: 381_732,
    desktopSha256: "4c22311b7b87d2b003312a548aca2c904bbade5d9edfaf8cca8b085928cd873c",
    mobileUrl: "/textures/sky/orbit-atlas-v9-stars-2k.jpg",
    mobileBytes: 122_612,
    mobileSha256: "613625b6d2b71dd943cf62c90b33a9d12522e38f99df50ebc7e9ec60c5f17d65",
    colorSpace: "srgb",
    frozenDependency: "V9-readonly",
  },
  {
    id: "dust-mask",
    desktopUrl: "/textures/sky/orbit-atlas-v9-dust-2k.jpg",
    desktopBytes: 700_773,
    desktopSha256: "8011f424415f9e8b3841f6a36ce2a63dcdbc5b5161395dc484104e352d9169ce",
    mobileUrl: "/textures/sky/orbit-atlas-v9-dust-2k.jpg",
    mobileBytes: 700_773,
    mobileSha256: "8011f424415f9e8b3841f6a36ce2a63dcdbc5b5161395dc484104e352d9169ce",
    colorSpace: "linear",
    frozenDependency: "V9-readonly",
  },
]);

export type HeroNebulaStateV590 = Readonly<{
  id: NebulaIdV590;
  catalogName: string;
  commonName: string;
  raDeg: number;
  decDeg: number;
  angularSizeDeg: number;
  assetState: "asset-blocked";
  markerState: "verified-coordinate-marker";
  sourceCatalog: string;
  presentationOnly: true;
}>;

/**
 * J2000 coordinate markers. No image or volumetric payload is admitted in v590
 * yet, so every impostor remains explicitly blocked rather than synthesized.
 */
export const HERO_NEBULAE_V590: readonly HeroNebulaStateV590[] = Object.freeze([
  ...DEEP_SPACE_LAYERS_V590
    .filter((layer): layer is typeof layer & { id: NebulaIdV590; kind: "catalog-nebula" } => layer.kind === "catalog-nebula")
    .map((layer) => {
      const names: Record<NebulaIdV590, readonly [string, string]> = {
        "orion-nebula": ["M42 / NGC 1976", "Orion Nebula"],
        "lagoon-nebula": ["M8 / NGC 6523", "Lagoon Nebula"],
        "eagle-nebula": ["M16 / NGC 6611", "Eagle Nebula"],
        "helix-nebula": ["NGC 7293", "Helix Nebula"],
        "veil-nebula": ["NGC 6960 complex", "Veil Nebula"],
        "north-america-nebula": ["NGC 7000", "North America Nebula"],
      };
      return {
        id: layer.id,
        catalogName: names[layer.id][0],
        commonName: names[layer.id][1],
        raDeg: layer.rightAscensionDeg,
        decDeg: layer.declinationDeg,
        angularSizeDeg: layer.angularSizeDeg,
        assetState: "asset-blocked" as const,
        markerState: "verified-coordinate-marker" as const,
        sourceCatalog: "DEEP_SPACE_LAYERS_V590 canonical J2000 contract",
        presentationOnly: true as const,
      };
    }),
]);

export const DEFAULT_CONSTELLATIONS_DESKTOP_V590 = Object.freeze([
  "Ori", "UMa", "Cas", "Cyg", "Lyr", "Aql", "Sco", "Sgr", "Tau", "Gem", "Leo", "And",
] as const);

export const DEFAULT_CONSTELLATIONS_MOBILE_V590 = Object.freeze([
  "Ori", "UMa", "Cas", "Cyg", "Lyr", "Aql", "Sco", "Sgr",
] as const);

export type ConstellationBindingWaypointV590 = Readonly<{
  sourceId: string;
  anchorRaDeg: number;
  anchorDecDeg: number;
  angularDistanceDeg: number;
}>;

export type ConstellationBindingV590 = Readonly<{
  iauCode: string;
  name: string;
  waypoints: readonly ConstellationBindingWaypointV590[];
}>;

export type ConstellationBindingReceiptV590 = Readonly<{
  version: string;
  bindingSha256: string;
  constellationCount: number;
  waypointCount: number;
  maximumAngularDistanceDeg: number;
  thresholdDeg: number;
  bindings: readonly ConstellationBindingV590[];
}>;

export function visualMagnitudeFluxV590(magnitude: number): number {
  return Number.isFinite(magnitude) ? Math.pow(10, -0.4 * magnitude) : 0;
}

/** Stable photometric classes. Source identity never moves a class boundary. */
export function classifyStarPsfV590(magnitude: number): StarPsfClassV590 {
  if (!Number.isFinite(magnitude)) return 0;
  if (magnitude <= 3.5) return 2;
  if (magnitude <= 8.25) return 1;
  return 0;
}

export function deterministicSourceUnitV590(sourceId: string | bigint): number {
  const value = String(sourceId);
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffff_ffff;
}

/** Source identity affects orientation only, never flux, size or class. */
export function starPsfRotationV590(sourceId: string | bigint): number {
  return deterministicSourceUnitV590(sourceId) * Math.PI * 2;
}

export function starPixelSizeV590(magnitude: number, psfClass = classifyStarPsfV590(magnitude)): number {
  const flux = visualMagnitudeFluxV590(magnitude);
  const base = 0.48 + Math.pow(Math.max(0, flux), 0.24) * 3.25;
  const classGain = psfClass === 2 ? 1.36 : psfClass === 1 ? 1.08 : 0.76;
  return Math.min(6.4, Math.max(0.38, base * classGain));
}

function srgbToLinearV590(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/** Deterministic Gaia BP-RP approximation returned as linear RGB. */
export function bpRpToLinearRgbV590(bpRp: number | null): readonly [number, number, number] {
  const color = Number.isFinite(bpRp) ? Math.max(-0.5, Math.min(4, Number(bpRp))) : 0.82;
  const temperature = Math.max(2400, Math.min(12000, 4600 * (
    1 / (0.92 * color + 1.7) + 1 / (0.92 * color + 0.62)
  )));
  const scaled = temperature / 100;
  let red: number;
  let green: number;
  let blue: number;
  if (scaled <= 66) {
    red = 255;
    green = 99.4708025861 * Math.log(scaled) - 161.1195681661;
    blue = scaled <= 19 ? 0 : 138.5177312231 * Math.log(scaled - 10) - 305.0447927307;
  } else {
    red = 329.698727446 * Math.pow(scaled - 60, -0.1332047592);
    green = 288.1221695283 * Math.pow(scaled - 60, -0.0755148492);
    blue = 255;
  }
  const linear = [red, green, blue].map((channel) => (
    srgbToLinearV590(Math.max(0, Math.min(255, channel)) / 255)
  ));
  return linear as [number, number, number];
}

export function raDecToCelestialPositionV590(
  raDeg: number,
  decDeg: number,
  radius: number = CELESTIAL_SPHERE_RADIUS_V590,
): readonly [number, number, number] {
  if (![raDeg, decDeg, radius].every(Number.isFinite) || decDeg < -90 || decDeg > 90 || radius <= 0) {
    throw new Error("v590-celestial-coordinate-invalid");
  }
  const ra = raDeg * Math.PI / 180;
  const dec = decDeg * Math.PI / 180;
  return [
    Math.cos(dec) * Math.cos(ra) * radius,
    Math.sin(dec) * radius,
    Math.cos(dec) * Math.sin(ra) * radius,
  ];
}

export function normalizeCelestialPositionV590(
  value: readonly [number, number, number],
  radius: number = CELESTIAL_SPHERE_RADIUS_V590,
): readonly [number, number, number] {
  const length = Math.hypot(value[0], value[1], value[2]);
  if (!Number.isFinite(length) || length <= 0 || !Number.isFinite(radius) || radius <= 0) {
    throw new Error("v590-celestial-position-invalid");
  }
  const scale = radius / length;
  return [value[0] * scale, value[1] * scale, value[2] * scale];
}

export function starBudgetV590(deliveryTier: DeepSpaceDeliveryTierV590, deviceTier: DeepSpaceDeviceTierV590): number {
  if (deviceTier === "mobile") return deliveryTier === "standalone-full" ? 18_000 : 10_000;
  return deliveryTier === "standalone-full" ? 60_000 : 30_000;
}

export function parseConstellationBindingReceiptV590(value: unknown): ConstellationBindingReceiptV590 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v590-constellation-object");
  const receipt = value as Partial<ConstellationBindingReceiptV590>;
  if (
    receipt.version !== "v589-constellation-gaia-binding-v1"
    || receipt.bindingSha256 !== CONSTELLATION_BINDING_IDENTITY_SHA256_V590
    || receipt.constellationCount !== 88
    || receipt.waypointCount !== 484
    || receipt.thresholdDeg !== 1.5
    || !Number.isFinite(receipt.maximumAngularDistanceDeg)
    || Number(receipt.maximumAngularDistanceDeg) > 1.5
    || !Array.isArray(receipt.bindings)
    || receipt.bindings.length !== 88
  ) throw new Error("v590-constellation-identity");
  let waypointCount = 0;
  const identities = new Set<string>();
  for (const binding of receipt.bindings) {
    if (!binding || typeof binding.iauCode !== "string" || !binding.iauCode || !Array.isArray(binding.waypoints)) {
      throw new Error("v590-constellation-binding");
    }
    if (identities.has(binding.iauCode)) throw new Error("v590-constellation-duplicate");
    identities.add(binding.iauCode);
    for (const waypoint of binding.waypoints) {
      if (
        !/^[0-9]+$/.test(waypoint.sourceId)
        || !Number.isFinite(waypoint.anchorRaDeg)
        || !Number.isFinite(waypoint.anchorDecDeg)
        || !Number.isFinite(waypoint.angularDistanceDeg)
        || waypoint.angularDistanceDeg > 1.5
      ) throw new Error("v590-constellation-waypoint");
      waypointCount += 1;
    }
  }
  if (waypointCount !== 484) throw new Error("v590-constellation-waypoint-count");
  return receipt as ConstellationBindingReceiptV590;
}

export function angularDistanceDegV590(
  leftRaDeg: number,
  leftDecDeg: number,
  rightRaDeg: number,
  rightDecDeg: number,
): number {
  const toRad = Math.PI / 180;
  const leftRa = leftRaDeg * toRad;
  const leftDec = leftDecDeg * toRad;
  const rightRa = rightRaDeg * toRad;
  const rightDec = rightDecDeg * toRad;
  const cosine = Math.sin(leftDec) * Math.sin(rightDec)
    + Math.cos(leftDec) * Math.cos(rightDec) * Math.cos(leftRa - rightRa);
  return Math.acos(Math.max(-1, Math.min(1, cosine))) / toRad;
}

export function starfieldViewDeltaV590(
  left: CelestialStarfieldViewV590,
  right: CelestialStarfieldViewV590,
): Readonly<{ angleDeg: number; fovDeg: number }> {
  return {
    angleDeg: angularDistanceDegV590(left.raDeg, left.decDeg, right.raDeg, right.decDeg),
    fovDeg: Math.abs(left.fovDeg - right.fovDeg),
  };
}

/**
 * A reload requires both a materially different requested cone and an idle,
 * settled camera. Elapsed time alone can never reload a stationary view.
 */
export function shouldRequestStarfieldViewV590(input: Readonly<{
  current: CelestialStarfieldViewV590;
  lastRequested: CelestialStarfieldViewV590 & Readonly<{ sentAtMs: number }>;
  lastAngleChangeAtMs: number;
  nowMs: number;
  requestInFlight: boolean;
}>): boolean {
  if (input.requestInFlight) return false;
  const delta = starfieldViewDeltaV590(input.current, input.lastRequested);
  const materiallyChanged = delta.angleDeg >= STARFIELD_VIEW_ANGLE_THRESHOLD_DEG_V590
    || delta.fovDeg >= STARFIELD_VIEW_FOV_THRESHOLD_DEG_V590;
  return materiallyChanged
    && input.nowMs - input.lastAngleChangeAtMs >= STARFIELD_VIEW_SETTLE_MS_V590
    && input.nowMs - input.lastRequested.sentAtMs >= STARFIELD_VIEW_THROTTLE_MS_V590;
}

/** Translate a celestial direction with the camera without rotating it. */
export function cameraCentredCelestialPositionV590(
  direction: readonly [number, number, number],
  cameraPosition: readonly [number, number, number],
  radius: number = CELESTIAL_SPHERE_RADIUS_V590,
): readonly [number, number, number] {
  const local = normalizeCelestialPositionV590(direction, radius);
  return [
    cameraPosition[0] + local[0],
    cameraPosition[1] + local[1],
    cameraPosition[2] + local[2],
  ];
}

export function celestialDirectionFromCameraV590(
  worldPosition: readonly [number, number, number],
  cameraPosition: readonly [number, number, number],
): readonly [number, number, number] {
  return normalizeCelestialPositionV590([
    worldPosition[0] - cameraPosition[0],
    worldPosition[1] - cameraPosition[1],
    worldPosition[2] - cameraPosition[2],
  ], 1);
}
