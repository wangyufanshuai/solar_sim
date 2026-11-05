import {
  NEBULA_EXTENDED_VISUAL_ASSETS_V592,
  NEBULA_EXTENDED_VISUAL_MANIFEST_SHA256_V592,
} from "../data/nebulaExtendedVisualAssetsV592.generated";
import {
  NEBULA_CLOSURE_VISUAL_ASSETS_V592,
  NEBULA_CLOSURE_VISUAL_MANIFEST_SHA256_V592,
} from "../data/nebulaClosureVisualAssetsV592.generated";
import { sha256Utf8HexV566 } from "./sha256BrowserV566";
import type { CelestialDeliveryTierV590, CelestialDeviceTierV590 } from "./celestialRenderingV590";

export {
  NEBULA_CLOSURE_VISUAL_MANIFEST_SHA256_V592,
  NEBULA_EXTENDED_VISUAL_MANIFEST_SHA256_V592,
};

export const NEBULA_EXTENDED_VISUAL_IDS_V592 = Object.freeze([
  "jellyfish-nebula",
  "cocoon-nebula",
  "rho-ophiuchi-cloud",
  "cepheus-c-nebula",
  "dragon-lair-nebula",
] as const);

export const NEBULA_CLOSURE_VISUAL_IDS_V592 = Object.freeze([
  "monkey-head-nebula",
  "w40-nebula",
  "sh2-235-nebula",
  "flaming-star-nebula",
  "spider-nebula",
  "tarantula-nebula",
  "tadpole-nebula",
] as const);

export const NEBULA_OVERLAY_VISUAL_IDS_V592 = Object.freeze([
  ...NEBULA_EXTENDED_VISUAL_IDS_V592,
  ...NEBULA_CLOSURE_VISUAL_IDS_V592,
] as const);

export type NebulaExtendedVisualIdV592 = typeof NEBULA_EXTENDED_VISUAL_IDS_V592[number];
export type NebulaClosureVisualIdV592 = typeof NEBULA_CLOSURE_VISUAL_IDS_V592[number];
export type NebulaOverlayVisualIdV592 = typeof NEBULA_OVERLAY_VISUAL_IDS_V592[number];

export type NebulaOverlayVisualFileV592 = Readonly<{
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

export type NebulaOverlayVisualSliceV592 = Readonly<{
  depthIndex: number;
  ktx2?: NebulaOverlayVisualFileV592;
  fallback?: NebulaOverlayVisualFileV592;
  desktopFallback?: NebulaOverlayVisualFileV592;
  mobileFallback?: NebulaOverlayVisualFileV592;
}>;

export type NebulaOverlayVisualAssetV592 = Readonly<{
  target: NebulaOverlayVisualIdV592;
  nasaId: string;
  catalogName: string;
  coordinates: Readonly<{
    coordinateFrame: string;
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
  tiers: Readonly<{
    desktop: Readonly<{ width: number; height: number; aspect: number; depthSliceCount: 4; slices: readonly NebulaOverlayVisualSliceV592[] }>;
    mobile: Readonly<{ width: number; height: number; aspect: number; depthSliceCount: 2; slices: readonly NebulaOverlayVisualSliceV592[] }>;
    lite: Readonly<{ width: number; height: number; aspect: number; depthSliceCount: 1; slices: readonly NebulaOverlayVisualSliceV592[] }>;
  }>;
  presentationOnly: true;
  scientificAuthority: false;
  scientificPayloadWriteback: false;
}>;

export type NebulaOverlayVisualSliceSelectionV592 = Readonly<{
  depthIndex: number;
  primary: NebulaOverlayVisualFileV592 | null;
  fallback: NebulaOverlayVisualFileV592;
}>;

type OverlayNamespaceV592 = "extended" | "closure";
type OverlayManifestV592 = Readonly<{
  version: string;
  status: string;
  policy: Readonly<{
    sourceCount: number;
    runtimeAssetAdmittedCount: number;
    proceduralFallbackAllowed: false;
    scienceImagePayloadAllowed: false;
    presentationOnly: true;
    fixedJ2000Direction: true;
    noInpainting: true;
    noSyntheticCoverageFill: true;
    mobileSharesDesktopCore: true;
  }>;
  admission: Readonly<{
    metadataCandidateCount: number;
    runtimeAssetAdmittedCount: number;
    visualSignoffGranted: false;
    admittedTargets: readonly NebulaOverlayVisualIdV592[];
    blockedTargets: readonly string[];
  }>;
  assets: readonly NebulaOverlayVisualAssetV592[];
  manifestSha256: string;
}>;

const EXTENDED_SET_V592 = new Set<string>(NEBULA_EXTENDED_VISUAL_IDS_V592);
const OVERLAY_SET_V592 = new Set<string>(NEBULA_OVERLAY_VISUAL_IDS_V592);
const SHA256_PATTERN_V592 = /^[a-f0-9]{64}$/;

export const NEBULA_OVERLAY_VISUAL_ASSETS_V592 = Object.freeze([
  ...NEBULA_EXTENDED_VISUAL_ASSETS_V592,
  ...NEBULA_CLOSURE_VISUAL_ASSETS_V592,
] as unknown as readonly NebulaOverlayVisualAssetV592[]);

export const NEBULA_OVERLAY_VISUAL_CATALOG_V592 = Object.freeze(
  NEBULA_OVERLAY_VISUAL_ASSETS_V592.map((asset) => Object.freeze({
    id: asset.target,
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

function canonicalizeV592(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeV592);
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, canonicalizeV592(record[key])]));
}

function namespaceForV592(assetId: NebulaOverlayVisualIdV592): OverlayNamespaceV592 {
  return EXTENDED_SET_V592.has(assetId) ? "extended" : "closure";
}

function idsForNamespaceV592(namespace: OverlayNamespaceV592): readonly NebulaOverlayVisualIdV592[] {
  return namespace === "extended" ? NEBULA_EXTENDED_VISUAL_IDS_V592 : NEBULA_CLOSURE_VISUAL_IDS_V592;
}

function manifestUrlForNamespaceV592(namespace: OverlayNamespaceV592): string {
  return `/data/living-universe-v592/nebula-${namespace}-visual-assets.json`;
}

function manifestShaForNamespaceV592(namespace: OverlayNamespaceV592): string {
  return namespace === "extended"
    ? NEBULA_EXTENDED_VISUAL_MANIFEST_SHA256_V592
    : NEBULA_CLOSURE_VISUAL_MANIFEST_SHA256_V592;
}

function validateFileV592(file: unknown, namespace: OverlayNamespaceV592, target: string, depthIndex: number): asserts file is NebulaOverlayVisualFileV592 {
  if (!file || typeof file !== "object" || Array.isArray(file)) throw new Error(`v592-nebula-overlay-file:${target}:${depthIndex}`);
  const candidate = file as Record<string, unknown>;
  if (
    typeof candidate.url !== "string"
    || !candidate.url.startsWith(`/textures/candidate-v592/nebulae-${namespace}-v592/`)
    || candidate.url.includes("\\")
    || candidate.url.split("/").includes("..")
    || !Number.isInteger(candidate.bytes) || Number(candidate.bytes) <= 0
    || !Number.isInteger(candidate.width) || Number(candidate.width) <= 0
    || !Number.isInteger(candidate.height) || Number(candidate.height) <= 0
    || !SHA256_PATTERN_V592.test(String(candidate.sha256))
    || (candidate.format !== "ktx2" && candidate.format !== "webp")
    || candidate.colorSpace !== "srgb"
    || candidate.depthIndex !== depthIndex
  ) throw new Error(`v592-nebula-overlay-file:${target}:${depthIndex}`);
}

export function parseNebulaOverlayVisualManifestV592(value: unknown, namespace: OverlayNamespaceV592): OverlayManifestV592 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v592-nebula-overlay-manifest:${namespace}`);
  const root = value as Record<string, unknown>;
  const unsigned = { ...root };
  delete unsigned.manifestSha256;
  const expectedIds = idsForNamespaceV592(namespace);
  const policy = root.policy as Record<string, unknown> | undefined;
  const admission = root.admission as Record<string, unknown> | undefined;
  if (
    root.version !== `v592-nebula-${namespace}-visual-assets-v2`
    || root.status !== "additive-presentation-assets-admitted-signoff-pending"
    || root.manifestSha256 !== manifestShaForNamespaceV592(namespace)
    || root.manifestSha256 !== sha256Utf8HexV566(JSON.stringify(canonicalizeV592(unsigned)))
    || policy?.sourceCount !== expectedIds.length
    || policy.runtimeAssetAdmittedCount !== expectedIds.length
    || policy.proceduralFallbackAllowed !== false
    || policy.scienceImagePayloadAllowed !== false
    || policy.presentationOnly !== true
    || policy.fixedJ2000Direction !== true
    || policy.noInpainting !== true
    || policy.noSyntheticCoverageFill !== true
    || policy.mobileSharesDesktopCore !== true
    || admission?.metadataCandidateCount !== expectedIds.length
    || admission.runtimeAssetAdmittedCount !== expectedIds.length
    || admission.visualSignoffGranted !== false
    || !Array.isArray(admission.admittedTargets)
    || admission.admittedTargets.join(",") !== expectedIds.join(",")
    || !Array.isArray(root.assets)
    || root.assets.length !== expectedIds.length
  ) throw new Error(`v592-nebula-overlay-manifest-identity:${namespace}`);
  const observed = new Set<string>();
  for (const rawAsset of root.assets) {
    if (!rawAsset || typeof rawAsset !== "object" || Array.isArray(rawAsset)) throw new Error(`v592-nebula-overlay-asset:${namespace}`);
    const asset = rawAsset as Record<string, unknown>;
    const target = String(asset.target);
    const coordinates = asset.coordinates as Record<string, unknown> | undefined;
    const encoding = asset.observationEncoding as Record<string, unknown> | undefined;
    const tiers = asset.tiers as Record<string, unknown> | undefined;
    if (
      !expectedIds.includes(target as NebulaOverlayVisualIdV592)
      || observed.has(target)
      || asset.presentationOnly !== true
      || asset.scientificAuthority !== false
      || asset.scientificPayloadWriteback !== false
      || !coordinates
      || typeof coordinates.coordinateFrame !== "string" || !coordinates.coordinateFrame.includes("J2000")
      || typeof coordinates.raDeg !== "number" || coordinates.raDeg < 0 || coordinates.raDeg >= 360
      || typeof coordinates.decDeg !== "number" || coordinates.decDeg < -90 || coordinates.decDeg > 90
      || typeof coordinates.angularSizeDeg !== "number" || coordinates.angularSizeDeg <= 0
      || encoding?.nakedEyeRepresentationClaimed !== false
      || !tiers
    ) throw new Error(`v592-nebula-overlay-asset:${target}`);
    for (const [tierName, count] of [["desktop", 4], ["mobile", 2], ["lite", 1]] as const) {
      const tier = tiers[tierName] as Record<string, unknown> | undefined;
      if (!tier || tier.depthSliceCount !== count || !Array.isArray(tier.slices) || tier.slices.length !== count) throw new Error(`v592-nebula-overlay-tier:${target}:${tierName}`);
      tier.slices.forEach((slice, depthIndex) => {
        if (!slice || typeof slice !== "object" || Array.isArray(slice)) throw new Error(`v592-nebula-overlay-slice:${target}:${depthIndex}`);
        const record = slice as Record<string, unknown>;
        if (record.depthIndex !== depthIndex) throw new Error(`v592-nebula-overlay-slice-index:${target}:${depthIndex}`);
        if (tierName === "lite") {
          validateFileV592(record.desktopFallback, namespace, target, depthIndex);
          validateFileV592(record.mobileFallback, namespace, target, depthIndex);
        } else {
          validateFileV592(record.ktx2, namespace, target, depthIndex);
          validateFileV592(record.fallback, namespace, target, depthIndex);
        }
      });
    }
    observed.add(target);
  }
  if (expectedIds.some((id) => !observed.has(id))) throw new Error(`v592-nebula-overlay-cardinality:${namespace}`);
  return root as unknown as OverlayManifestV592;
}

const manifestPromisesV592: Partial<Record<OverlayNamespaceV592, Promise<OverlayManifestV592>>> = {};

async function fetchManifestV592(namespace: OverlayNamespaceV592, signal?: AbortSignal): Promise<OverlayManifestV592> {
  const sha = manifestShaForNamespaceV592(namespace);
  const response = await fetch(`${manifestUrlForNamespaceV592(namespace)}?sha256=${sha}`, { cache: "force-cache", signal });
  if (!response.ok) throw new Error(`v592-nebula-overlay-manifest-fetch:${namespace}:${response.status}`);
  return parseNebulaOverlayVisualManifestV592(await response.json(), namespace);
}

export function loadNebulaOverlayVisualManifestV592(assetId: NebulaOverlayVisualIdV592, signal?: AbortSignal): Promise<OverlayManifestV592> {
  const namespace = namespaceForV592(assetId);
  if (signal) return fetchManifestV592(namespace, signal);
  manifestPromisesV592[namespace] ??= fetchManifestV592(namespace).catch((error) => {
    delete manifestPromisesV592[namespace];
    throw error;
  });
  return manifestPromisesV592[namespace]!;
}

export function isNebulaOverlayVisualIdV592(value: string): value is NebulaOverlayVisualIdV592 {
  return OVERLAY_SET_V592.has(value);
}

export function nebulaOverlayManifestShaForIdV592(assetId: NebulaOverlayVisualIdV592): string {
  return manifestShaForNamespaceV592(namespaceForV592(assetId));
}

export function selectNebulaOverlayVisualSlicesV592(
  asset: NebulaOverlayVisualAssetV592,
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
): readonly NebulaOverlayVisualSliceSelectionV592[] {
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
