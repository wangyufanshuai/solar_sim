import { NEBULA_VISUAL_ASSETS_V592, NEBULA_VISUAL_MANIFEST_SHA256_V592 } from "../data/nebulaVisualAssetsV592.generated";
import {
  NEBULA_OVERLAY_VISUAL_CATALOG_V592,
  NEBULA_OVERLAY_VISUAL_IDS_V592,
  isNebulaOverlayVisualIdV592,
  nebulaOverlayManifestShaForIdV592,
  type NebulaOverlayVisualIdV592,
} from "./nebulaOverlayVisualAssetsV592";
import { sha256Utf8HexV566 } from "./sha256BrowserV566";
import type {
  CelestialDeliveryTierV590,
  CelestialDeviceTierV590,
  CelestialFocusTargetV590,
} from "./celestialRenderingV590";
import type { DeepSpaceReferenceIdV592 } from "./deepSpaceReferenceV592";

export { NEBULA_VISUAL_MANIFEST_SHA256_V592 };

export const NEBULA_VISUAL_MANIFEST_URL_V592 = "/data/living-universe-v592/nebula-visual-assets.json" as const;
export const NEBULA_VISUAL_IDS_V592 = Object.freeze([
  "heart-nebula",
  "soul-nebula",
  "witch-head-nebula",
  "flame-nebula",
  "pacman-nebula",
  "running-chicken-nebula",
] as const);

export type NebulaBaseVisualIdV592 = typeof NEBULA_VISUAL_IDS_V592[number];
export type NebulaVisualIdV592 = NebulaBaseVisualIdV592 | NebulaOverlayVisualIdV592;
export type LivingUniverseFocusTargetV592 = CelestialFocusTargetV590 | NebulaVisualIdV592 | DeepSpaceReferenceIdV592;

export type NebulaVisualFileV592 = Readonly<{
  url: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
  format: "ktx2" | "webp";
  colorSpace: "srgb";
  compression: string;
  role: string;
  depthIndex: number;
}>;

export type NebulaVisualSliceV592 = Readonly<{
  depthIndex: number;
  ktx2?: NebulaVisualFileV592;
  fallback?: NebulaVisualFileV592;
  desktopFallback?: NebulaVisualFileV592;
  mobileFallback?: NebulaVisualFileV592;
}>;

export type NebulaVisualAssetV592 = Readonly<{
  target: NebulaBaseVisualIdV592;
  nasaId: string;
  catalogName: string;
  source: Readonly<{
    url: string;
    path: string;
    bytes: number;
    sha256: string;
    width: number;
    height: number;
    colorSpace: "srgb";
    license: string;
    licenseUrl: string;
    credit: string;
    acquisitionReceiptSha256: string;
    licenseReviewReceiptSha256: string;
    visualAnalysisReceiptSha256: string;
  }>;
  coordinates: Readonly<{
    coordinateFrame: string;
    derivation: string;
    raDeg: number;
    decDeg: number;
    angularSizeDeg: number;
    galacticCatalogReference: Readonly<{ lDeg: number; bDeg: number; distancePc: number }>;
  }>;
  observationEncoding: Readonly<{
    bands: readonly string[];
    colorPolicy: string;
    nakedEyeRepresentationClaimed: false;
    scienceModePolicy: string;
    cinematicModePolicy: string;
  }>;
  derivation: Readonly<{
    tool: string;
    parameters: Readonly<{
      alphaPolicy: string;
      depthSlicePolicy: string;
      alphaProfiles: Readonly<Record<"desktop4" | "mobile2" | "lite1", Readonly<{
        low: readonly number[];
        high: readonly number[];
        opacity: readonly number[];
      }>>>;
      ktx2BlockAlignment: "4x4-all-full-tiers";
      inpainting: false;
      syntheticCoverageFill: false;
      scientificDataClaim: false;
    }>;
  }>;
  tiers: Readonly<{
    desktop: Readonly<{ width: number; height: number; aspect: number; depthSliceCount: 4; slices: readonly NebulaVisualSliceV592[] }>;
    mobile: Readonly<{ width: number; height: number; aspect: number; depthSliceCount: 2; slices: readonly NebulaVisualSliceV592[] }>;
    lite: Readonly<{ width: number; height: number; aspect: number; depthSliceCount: 1; slices: readonly NebulaVisualSliceV592[] }>;
  }>;
  presentationOnly: true;
  scientificAuthority: false;
  scientificPayloadWriteback: false;
}>;

export type NebulaVisualManifestV592 = Readonly<{
  version: "v592-nebula-visual-assets-v1";
  generatedAt: string;
  status: "six-of-seven-source-reviewed-nebula-runtime-assets-admitted";
  policy: Readonly<{
    requiredNewSourceCount: 7;
    runtimeAssetAdmittedCount: 6;
    proceduralFallbackAllowed: false;
    coloredPlaceholderAllowed: false;
    scienceImagePayloadAllowed: false;
    cinematicPresentationOnly: true;
    fixedJ2000Direction: true;
    noInpainting: true;
    noSyntheticCoverageFill: true;
    maxConcurrentHighOrderDepthSlices: 3;
  }>;
  sourceReceipts: Readonly<{
    acquisitionReceiptSha256: string;
    licenseReviewReceiptSha256: string;
    visualAnalysisReceiptSha256: string;
  }>;
  admission: Readonly<{
    sourceReviewedCount: 7;
    sourceCoverageBlockedCount: 1;
    runtimeAssetAdmittedCount: 6;
    heroAdmissionCount: 0;
    admittedTargets: readonly NebulaVisualIdV592[];
    blockedTargets: readonly string[];
  }>;
  assets: readonly NebulaVisualAssetV592[];
  manifestSha256: string;
}>;

export type NebulaVisualSliceSelectionV592 = Readonly<{
  depthIndex: number;
  primary: NebulaVisualFileV592 | null;
  fallback: NebulaVisualFileV592;
}>;

export const NEBULA_VISUAL_CATALOG_V592 = Object.freeze(
  NEBULA_VISUAL_ASSETS_V592.map((asset) => Object.freeze({
    id: asset.target as NebulaBaseVisualIdV592,
    nasaId: asset.nasaId,
    catalogName: asset.catalogName,
    raDeg: asset.coordinates.raDeg,
    decDeg: asset.coordinates.decDeg,
    angularSizeDeg: asset.coordinates.angularSizeDeg,
    bands: Object.freeze([...asset.observationEncoding.bands]),
    desktopAspect: asset.tiers.desktop.aspect,
    mobileAspect: asset.tiers.mobile.aspect,
    liteAspect: asset.tiers.lite.aspect,
  })),
);

export const NEBULA_ALL_VISUAL_IDS_V592 = Object.freeze([
  ...NEBULA_VISUAL_IDS_V592,
  ...NEBULA_OVERLAY_VISUAL_IDS_V592,
] as const);

export const NEBULA_ALL_VISUAL_CATALOG_V592 = Object.freeze([
  ...NEBULA_VISUAL_CATALOG_V592,
  ...NEBULA_OVERLAY_VISUAL_CATALOG_V592,
]);

const SHA256_PATTERN_V592 = /^[a-f0-9]{64}$/;
const BASE_ID_SET_V592 = new Set<string>(NEBULA_VISUAL_IDS_V592);
const ID_SET_V592 = new Set<string>(NEBULA_ALL_VISUAL_IDS_V592);

function canonicalizeV592(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeV592);
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(source).sort().map((key) => [key, canonicalizeV592(source[key])]));
}

function validateLocalFileV592(file: unknown, target: string, depthIndex: number): asserts file is NebulaVisualFileV592 {
  if (!file || typeof file !== "object" || Array.isArray(file)) throw new Error(`v592-nebula-file:${target}:${depthIndex}`);
  const candidate = file as Record<string, unknown>;
  if (
    typeof candidate.url !== "string"
    || !candidate.url.startsWith("/textures/candidate-v592/nebulae-v592/")
    || candidate.url.includes("\\")
    || candidate.url.split("/").includes("..")
    || typeof candidate.bytes !== "number" || !Number.isInteger(candidate.bytes) || candidate.bytes <= 0
    || typeof candidate.width !== "number" || !Number.isInteger(candidate.width) || candidate.width <= 0
    || typeof candidate.height !== "number" || !Number.isInteger(candidate.height) || candidate.height <= 0
    || !SHA256_PATTERN_V592.test(String(candidate.sha256))
    || (candidate.format !== "ktx2" && candidate.format !== "webp")
    || candidate.colorSpace !== "srgb"
    || candidate.depthIndex !== depthIndex
  ) throw new Error(`v592-nebula-file:${target}:${depthIndex}`);
}

function validateTierV592(
  tier: unknown,
  target: string,
  expectedDepthCount: 1 | 2 | 4,
  delivery: "full" | "lite",
): void {
  if (!tier || typeof tier !== "object" || Array.isArray(tier)) throw new Error(`v592-nebula-tier:${target}`);
  const candidate = tier as Record<string, unknown>;
  if (
    candidate.depthSliceCount !== expectedDepthCount
    || !Array.isArray(candidate.slices)
    || candidate.slices.length !== expectedDepthCount
    || typeof candidate.width !== "number" || candidate.width <= 0
    || typeof candidate.height !== "number" || candidate.height <= 0
    || typeof candidate.aspect !== "number" || candidate.aspect <= 0
  ) throw new Error(`v592-nebula-tier:${target}`);
  candidate.slices.forEach((slice, depthIndex) => {
    if (!slice || typeof slice !== "object" || Array.isArray(slice)) throw new Error(`v592-nebula-slice:${target}:${depthIndex}`);
    const entry = slice as Record<string, unknown>;
    if (entry.depthIndex !== depthIndex) throw new Error(`v592-nebula-slice-index:${target}:${depthIndex}`);
    if (delivery === "full") {
      validateLocalFileV592(entry.ktx2, target, depthIndex);
      validateLocalFileV592(entry.fallback, target, depthIndex);
      if ((entry.ktx2 as NebulaVisualFileV592).format !== "ktx2" || (entry.fallback as NebulaVisualFileV592).format !== "webp") {
        throw new Error(`v592-nebula-slice-format:${target}:${depthIndex}`);
      }
    } else {
      validateLocalFileV592(entry.desktopFallback, target, depthIndex);
      validateLocalFileV592(entry.mobileFallback, target, depthIndex);
      if ((entry.desktopFallback as NebulaVisualFileV592).format !== "webp" || (entry.mobileFallback as NebulaVisualFileV592).format !== "webp") {
        throw new Error(`v592-nebula-slice-format:${target}:${depthIndex}`);
      }
    }
  });
}

export function parseNebulaVisualManifestV592(value: unknown): NebulaVisualManifestV592 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v592-nebula-manifest-object");
  const root = value as Record<string, unknown>;
  const unsigned = { ...root };
  delete unsigned.manifestSha256;
  if (
    root.version !== "v592-nebula-visual-assets-v1"
    || root.status !== "six-of-seven-source-reviewed-nebula-runtime-assets-admitted"
    || root.manifestSha256 !== NEBULA_VISUAL_MANIFEST_SHA256_V592
    || sha256Utf8HexV566(JSON.stringify(canonicalizeV592(unsigned))) !== root.manifestSha256
  ) throw new Error("v592-nebula-manifest-identity");
  const policy = root.policy as Record<string, unknown> | undefined;
  const admission = root.admission as Record<string, unknown> | undefined;
  if (
    policy?.runtimeAssetAdmittedCount !== 6
    || policy.proceduralFallbackAllowed !== false
    || policy.coloredPlaceholderAllowed !== false
    || policy.scienceImagePayloadAllowed !== false
    || policy.cinematicPresentationOnly !== true
    || policy.fixedJ2000Direction !== true
    || policy.noInpainting !== true
    || policy.noSyntheticCoverageFill !== true
    || policy.maxConcurrentHighOrderDepthSlices !== 3
    || admission?.sourceReviewedCount !== 7
    || admission.sourceCoverageBlockedCount !== 1
    || admission.runtimeAssetAdmittedCount !== 6
    || admission.heroAdmissionCount !== 0
    || !Array.isArray(admission.admittedTargets)
    || admission.admittedTargets.join(",") !== NEBULA_VISUAL_IDS_V592.join(",")
    || !Array.isArray(root.assets)
    || root.assets.length !== 6
  ) throw new Error("v592-nebula-manifest-policy");
  const observed = new Set<string>();
  for (const valueAsset of root.assets) {
    if (!valueAsset || typeof valueAsset !== "object" || Array.isArray(valueAsset)) throw new Error("v592-nebula-asset-object");
    const asset = valueAsset as Record<string, unknown>;
    const target = String(asset.target);
    const source = asset.source as Record<string, unknown> | undefined;
    const coordinates = asset.coordinates as Record<string, unknown> | undefined;
    const encoding = asset.observationEncoding as Record<string, unknown> | undefined;
    const derivation = asset.derivation as Record<string, unknown> | undefined;
    const parameters = derivation?.parameters as Record<string, unknown> | undefined;
    const tiers = asset.tiers as Record<string, unknown> | undefined;
    if (
      !BASE_ID_SET_V592.has(target) || observed.has(target)
      || asset.presentationOnly !== true
      || asset.scientificAuthority !== false
      || asset.scientificPayloadWriteback !== false
      || !source || typeof source.url !== "string" || !source.url.startsWith("https://images-assets.nasa.gov/")
      || typeof source.path !== "string" || !source.path.startsWith("source-cache/v592/nebulae/visual/") || source.path.includes("\\") || source.path.split("/").includes("..")
      || typeof source.bytes !== "number" || source.bytes <= 0
      || !SHA256_PATTERN_V592.test(String(source.sha256))
      || source.colorSpace !== "srgb"
      || typeof source.licenseUrl !== "string" || !source.licenseUrl.startsWith("https://www.nasa.gov/")
      || !SHA256_PATTERN_V592.test(String(source.acquisitionReceiptSha256))
      || !SHA256_PATTERN_V592.test(String(source.licenseReviewReceiptSha256))
      || !SHA256_PATTERN_V592.test(String(source.visualAnalysisReceiptSha256))
      || !coordinates || typeof coordinates.coordinateFrame !== "string" || !coordinates.coordinateFrame.includes("J2000")
      || typeof coordinates.raDeg !== "number" || coordinates.raDeg < 0 || coordinates.raDeg >= 360
      || typeof coordinates.decDeg !== "number" || coordinates.decDeg < -90 || coordinates.decDeg > 90
      || typeof coordinates.angularSizeDeg !== "number" || coordinates.angularSizeDeg <= 0
      || !encoding || encoding.nakedEyeRepresentationClaimed !== false
      || parameters?.inpainting !== false || parameters.syntheticCoverageFill !== false || parameters.scientificDataClaim !== false
      || !tiers
    ) throw new Error(`v592-nebula-asset:${target}`);
    validateTierV592(tiers.desktop, target, 4, "full");
    validateTierV592(tiers.mobile, target, 2, "full");
    validateTierV592(tiers.lite, target, 1, "lite");
    observed.add(target);
  }
  if (NEBULA_VISUAL_IDS_V592.some((id) => !observed.has(id))) throw new Error("v592-nebula-asset-cardinality");
  return root as unknown as NebulaVisualManifestV592;
}

let manifestPromiseV592: Promise<NebulaVisualManifestV592> | null = null;
export function loadNebulaVisualManifestV592(signal?: AbortSignal): Promise<NebulaVisualManifestV592> {
  const load = async () => {
    const response = await fetch(`${NEBULA_VISUAL_MANIFEST_URL_V592}?sha256=${NEBULA_VISUAL_MANIFEST_SHA256_V592}`, {
      cache: "force-cache",
      signal,
    });
    if (!response.ok) throw new Error(`v592-nebula-manifest-fetch:${response.status}`);
    return parseNebulaVisualManifestV592(await response.json());
  };
  if (signal) return load();
  manifestPromiseV592 ??= load().catch((error) => {
    manifestPromiseV592 = null;
    throw error;
  });
  return manifestPromiseV592;
}

export function isNebulaVisualFocusTargetV592(value: string): value is NebulaVisualIdV592 {
  return ID_SET_V592.has(value);
}

export function nebulaVisualManifestShaForIdV592(assetId: NebulaVisualIdV592): string {
  return isNebulaOverlayVisualIdV592(assetId)
    ? nebulaOverlayManifestShaForIdV592(assetId)
    : NEBULA_VISUAL_MANIFEST_SHA256_V592;
}

export function selectNebulaVisualSlicesV592(
  asset: NebulaVisualAssetV592,
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
): readonly NebulaVisualSliceSelectionV592[] {
  if (deliveryTier === "vercel-lite") {
    return asset.tiers.lite.slices.map((slice) => ({
      depthIndex: slice.depthIndex,
      primary: null,
      fallback: deviceTier === "mobile" ? slice.mobileFallback! : slice.desktopFallback!,
    }));
  }
  const tier = deviceTier === "mobile" ? asset.tiers.mobile : asset.tiers.desktop;
  return tier.slices.map((slice) => ({ depthIndex: slice.depthIndex, primary: slice.ktx2!, fallback: slice.fallback! }));
}

export function selectNebulaVisualImpostorsV592(
  mode: "science" | "cinematic",
  focusTarget: LivingUniverseFocusTargetV592,
): readonly NebulaVisualIdV592[] {
  if (mode !== "cinematic" || !isNebulaVisualFocusTargetV592(focusTarget)) return Object.freeze([]);
  return Object.freeze([focusTarget]);
}
