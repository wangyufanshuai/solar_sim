import {
  MAJOR_MOON_VISUAL_ASSET_COUNT_V592,
  MAJOR_MOON_VISUAL_ASSETS_V592,
  MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592,
} from "../data/majorMoonVisualAssetsV592.generated";
import type { CelestialDeliveryTierV590, CelestialDeviceTierV590 } from "./celestialRenderingV590";
import { MAJOR_MOON_IDS_V592, type MajorMoonIdV592 } from "./majorMoonsV592";
import { sha256Utf8HexV566 } from "./sha256BrowserV566";

export {
  MAJOR_MOON_VISUAL_ASSET_COUNT_V592,
  MAJOR_MOON_VISUAL_ASSETS_V592,
  MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592,
};

export const MAJOR_MOON_VISUAL_MANIFEST_URL_V592 = "/data/living-universe-v592/major-moon-visual-assets.json" as const;
export const MAJOR_MOON_RUNTIME_HERO_IDS_V592 = Object.freeze(
  MAJOR_MOON_VISUAL_ASSETS_V592.map((asset) => asset.target),
);
export type MajorMoonRuntimeHeroIdV592 = (typeof MAJOR_MOON_VISUAL_ASSETS_V592)[number]["target"];

export type MajorMoonVisualFileV592 = Readonly<{
  url: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
  format: "ktx2" | "webp";
  colorSpace: "srgb";
  compression: string;
  role: string;
}>;

export type MajorMoonVisualAssetV592 = Readonly<{
  target: MajorMoonRuntimeHeroIdV592;
  nasaId: string;
  status: string;
  heroAdmission: false;
  source: Readonly<{
    url: string;
    bytes: number;
    sha256: string;
    width: number;
    height: number;
    license: string;
    licenseUrl: string;
    credit: string;
  }>;
  variants: Readonly<{
    desktopKtx2: MajorMoonVisualFileV592;
    desktopFallback: MajorMoonVisualFileV592;
    mobileKtx2: MajorMoonVisualFileV592;
    mobileFallback: MajorMoonVisualFileV592;
    liteDesktop: MajorMoonVisualFileV592;
    liteMobile: MajorMoonVisualFileV592;
  }>;
  observationColorPolicy: string;
  scientificAuthority: false;
  presentationOnly: true;
  scientificPayloadWriteback: false;
}>;

export type MajorMoonVisualManifestV592 = Readonly<{
  version: "v592-major-moon-visual-assets-v1";
  status: string;
  policy: Readonly<{
    requiredCount: 12;
    ktx2First: true;
    fallbackShaVerified: true;
    missingAssetBehavior: "asset-blocked";
    proceduralFallbackAllowed: false;
    coloredPlaceholderAllowed: false;
    albedoAdmissionDoesNotGrantHeroAdmission: true;
    presentationOnly: true;
    scientificPayloadWriteback: false;
  }>;
  admission: Readonly<{
    albedoAssetAdmittedCount: number;
    heroAdmittedCount: 0;
    blockedCount: number;
    admittedBodies: readonly MajorMoonRuntimeHeroIdV592[];
    blockedBodies: readonly MajorMoonIdV592[];
  }>;
  assets: readonly MajorMoonVisualAssetV592[];
  manifestSha256: string;
}>;

export type MajorMoonVisualFileSelectionV592 = Readonly<{
  primary: MajorMoonVisualFileV592 | null;
  fallback: MajorMoonVisualFileV592;
}>;

const SHA256_PATTERN_V592 = /^[a-f0-9]{64}$/;
const RUNTIME_ID_SET_V592 = new Set<string>(MAJOR_MOON_RUNTIME_HERO_IDS_V592);
const MAJOR_MOON_ID_SET_V592 = new Set<string>(MAJOR_MOON_IDS_V592);
const OFFICIAL_SOURCE_HOSTS_V592 = new Set([
  "images-assets.nasa.gov",
  "asc-pds-services.s3.us-west-2.amazonaws.com",
  "astrogeology.usgs.gov",
]);
const OFFICIAL_LICENSE_HOSTS_V592 = new Set([
  "www.nasa.gov",
  "www.usgs.gov",
  "astrogeology.usgs.gov",
  "planetarymaps.usgs.gov",
  "pds.nasa.gov",
]);

function hasOfficialHttpsHostV592(value: unknown, hosts: ReadonlySet<string>): boolean {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && hosts.has(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function canonicalizeV592(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeV592);
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(source).sort().map((key) => [key, canonicalizeV592(source[key])]));
}

function validateFileV592(value: unknown, target: string, role: string): asserts value is MajorMoonVisualFileV592 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v592-major-moon-file:${target}:${role}`);
  const file = value as Record<string, unknown>;
  if (
    typeof file.url !== "string"
    || !file.url.startsWith("/textures/candidate-v592/major-moons/")
    || file.url.includes("\\")
    || file.url.split("/").includes("..")
    || typeof file.bytes !== "number" || file.bytes <= 0
    || !SHA256_PATTERN_V592.test(String(file.sha256))
    || typeof file.width !== "number" || file.width <= 0
    || typeof file.height !== "number" || file.height <= 0
    || (file.format !== "ktx2" && file.format !== "webp")
    || file.colorSpace !== "srgb"
    || typeof file.compression !== "string" || file.compression.length === 0
    || file.role !== role
  ) throw new Error(`v592-major-moon-file-contract:${target}:${role}`);
}

export function parseMajorMoonVisualManifestV592(value: unknown): MajorMoonVisualManifestV592 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v592-major-moon-manifest-object");
  const root = value as Record<string, unknown>;
  const unsigned = { ...root };
  delete unsigned.manifestSha256;
  const policy = root.policy as Record<string, unknown> | undefined;
  const admission = root.admission as Record<string, unknown> | undefined;
  const expectedAdmittedCount = MAJOR_MOON_VISUAL_ASSET_COUNT_V592;
  const expectedBlockedCount = MAJOR_MOON_IDS_V592.length - expectedAdmittedCount;
  const expectedStatus = `${expectedAdmittedCount}-of-12-albedo-assets-admitted-0-of-12-heroes-admitted`;
  if (
    root.version !== "v592-major-moon-visual-assets-v1"
    || root.status !== expectedStatus
    || root.manifestSha256 !== MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592
    || sha256Utf8HexV566(JSON.stringify(canonicalizeV592(unsigned))) !== root.manifestSha256
    || policy?.requiredCount !== 12
    || policy.ktx2First !== true
    || policy.fallbackShaVerified !== true
    || policy.missingAssetBehavior !== "asset-blocked"
    || policy.proceduralFallbackAllowed !== false
    || policy.coloredPlaceholderAllowed !== false
    || policy.albedoAdmissionDoesNotGrantHeroAdmission !== true
    || policy.presentationOnly !== true
    || policy.scientificPayloadWriteback !== false
    || admission?.albedoAssetAdmittedCount !== expectedAdmittedCount
    || admission.heroAdmittedCount !== 0
    || admission.blockedCount !== expectedBlockedCount
    || !Array.isArray(admission.admittedBodies)
    || admission.admittedBodies.join(",") !== MAJOR_MOON_RUNTIME_HERO_IDS_V592.join(",")
    || !Array.isArray(admission.blockedBodies)
    || admission.blockedBodies.length !== expectedBlockedCount
    || new Set(admission.blockedBodies).size !== expectedBlockedCount
    || admission.blockedBodies.some((body) => typeof body !== "string" || !MAJOR_MOON_ID_SET_V592.has(body) || RUNTIME_ID_SET_V592.has(body))
    || !Array.isArray(root.assets)
    || root.assets.length !== MAJOR_MOON_RUNTIME_HERO_IDS_V592.length
  ) throw new Error("v592-major-moon-manifest-identity");

  const observed = new Set<string>();
  for (const valueAsset of root.assets) {
    if (!valueAsset || typeof valueAsset !== "object" || Array.isArray(valueAsset)) throw new Error("v592-major-moon-asset-object");
    const asset = valueAsset as Record<string, unknown>;
    const target = String(asset.target);
    const source = asset.source as Record<string, unknown> | undefined;
    const variants = asset.variants as Record<string, unknown> | undefined;
    if (
      !RUNTIME_ID_SET_V592.has(target) || observed.has(target)
      || asset.heroAdmission !== false
      || asset.scientificAuthority !== false
      || asset.presentationOnly !== true
      || asset.scientificPayloadWriteback !== false
      || typeof asset.nasaId !== "string" || asset.nasaId.length === 0
      || !source
      || !hasOfficialHttpsHostV592(source.url, OFFICIAL_SOURCE_HOSTS_V592)
      || typeof source.bytes !== "number" || source.bytes <= 0
      || !SHA256_PATTERN_V592.test(String(source.sha256))
      || typeof source.width !== "number" || source.width <= 0
      || typeof source.height !== "number" || source.height <= 0
      || !hasOfficialHttpsHostV592(source.licenseUrl, OFFICIAL_LICENSE_HOSTS_V592)
      || !variants
    ) throw new Error(`v592-major-moon-asset:${target}`);
    validateFileV592(variants.desktopKtx2, target, "full-desktop");
    validateFileV592(variants.desktopFallback, target, "full-desktop-fallback");
    validateFileV592(variants.mobileKtx2, target, "full-mobile");
    validateFileV592(variants.mobileFallback, target, "full-mobile-fallback");
    validateFileV592(variants.liteDesktop, target, "lite-desktop");
    validateFileV592(variants.liteMobile, target, "lite-mobile");
    observed.add(target);
  }
  if (MAJOR_MOON_RUNTIME_HERO_IDS_V592.some((id) => !observed.has(id))) throw new Error("v592-major-moon-asset-cardinality");
  return root as unknown as MajorMoonVisualManifestV592;
}

let manifestPromiseV592: Promise<MajorMoonVisualManifestV592> | null = null;
export function loadMajorMoonVisualManifestV592(signal?: AbortSignal): Promise<MajorMoonVisualManifestV592> {
  const load = async () => {
    const response = await fetch(`${MAJOR_MOON_VISUAL_MANIFEST_URL_V592}?sha256=${MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592}`, {
      cache: "force-cache",
      signal,
    });
    if (!response.ok) throw new Error(`v592-major-moon-manifest-fetch:${response.status}`);
    return parseMajorMoonVisualManifestV592(await response.json());
  };
  if (signal) return load();
  manifestPromiseV592 ??= load().catch((error) => {
    manifestPromiseV592 = null;
    throw error;
  });
  return manifestPromiseV592;
}

export function isMajorMoonRuntimeHeroIdV592(value: string | null): value is MajorMoonRuntimeHeroIdV592 {
  return value !== null && RUNTIME_ID_SET_V592.has(value);
}

export function selectMajorMoonVisualFilesV592(
  asset: MajorMoonVisualAssetV592,
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
): MajorMoonVisualFileSelectionV592 {
  if (deliveryTier === "vercel-lite") {
    return Object.freeze({
      primary: null,
      fallback: deviceTier === "mobile" ? asset.variants.liteMobile : asset.variants.liteDesktop,
    });
  }
  return deviceTier === "mobile"
    ? Object.freeze({ primary: asset.variants.mobileKtx2, fallback: asset.variants.mobileFallback })
    : Object.freeze({ primary: asset.variants.desktopKtx2, fallback: asset.variants.desktopFallback });
}
