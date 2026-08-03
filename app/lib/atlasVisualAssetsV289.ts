import { getAtlasDeliveryProfile, type AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V285 } from "./atlasVisualProfileV274";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300, ATLAS_VISUAL_PROFILE_CANDIDATE_V340, ATLAS_VISUAL_PROFILE_CANDIDATE_V349, ATLAS_VISUAL_PROFILE_CANDIDATE_V362, type AtlasVisualProfileV299 } from "./atlasVisualProfileV299";

export const ATLAS_VISUAL_ASSET_MANIFEST_CANONICAL_SHA256_V289 = "424b7ce2e50f83e5667ac09e12a1eac8ef7f9de1f7c4d42aba7eabe634309df5" as const;
export const ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V289 = "local-shadow-v4-v5-v6-deep-space-v289" as const;
export const ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V340 = "local-shadow-v7-deep-space-v340" as const;
export const ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V349 = "local-shadow-v8-spectral-observatory-v349" as const;
export const ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V362 = "local-shadow-v9-instrument-lab-v362" as const;
export const ATLAS_VISUAL_ASSET_LICENSE_V289 = "NASA-public-domain-approved-runtime" as const;

const BASE_ASSET_V289 = Object.freeze({
  id: "nasa-svs-milky-way-mobile-2k",
  sourceUrl: "https://svs.gsfc.nasa.gov/4851/",
  outputPath: "textures/sky/orbit-atlas-v68-reference-backdrop-base-2k.jpg",
  originalSha256: "9d60e58075bcbce9cd03f8115e5635533a0a910007348a485755630a3927b97a",
  outputSha256: "53ff92ed692d56058854e5216e9204f3f6437c8a9b7de6aeae40758db326fff5",
});
const STARS_ASSET_V289 = Object.freeze({
  id: "nasa-svs-bright-stars-mobile-2k",
  sourceUrl: "https://svs.gsfc.nasa.gov/4851/",
  outputPath: "textures/sky/orbit-atlas-v68-reference-primary-stars-2k.jpg",
  originalSha256: "bd12d36e3e32ba75e61bd501aca25675f70250dce50fcfb880f22b9b6229725c",
  outputSha256: "62ccea2d5b83ab96e362c42a847b42530a9f13e806ae0c4b700928d6053a112d",
});

export type AtlasVisualAssetManifestV289 = {
  version: "science-cinematic-v4-v289-assets-v1";
  id: "science-cinematic-v4-v289-assets";
  runtimePolicy: "local-shadow-v4-intent-only";
  sourcePolicy: "existing-cache-only-no-new-visual-network-download";
  installedBytes: number;
  installedLimitBytes: 67_108_864;
  minimumFreeDiskBytes: 32_212_254_720;
  entries: readonly {
    id: "nasa-svs-milky-way-mobile-2k" | "nasa-svs-bright-stars-mobile-2k";
    sourceUrl: "https://svs.gsfc.nasa.gov/4851/";
    outputPath: string;
    originalPath: string;
    originalBytes: number;
    outputBytes: number;
    originalSha256: string;
    outputSha256: string;
    processing: { projection: "equirectangular"; width: 2048; height: 1024; recipe: string };
    license: { id: "NASA-public-domain"; status: "approved-runtime"; termsUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/"; attributionRequired: false };
    networkDownloadApplied: false;
  }[];
  canonicalSha256: typeof ATLAS_VISUAL_ASSET_MANIFEST_CANONICAL_SHA256_V289;
  contentRoot?: typeof ATLAS_VISUAL_ASSET_MANIFEST_CANONICAL_SHA256_V289;
};

export type AtlasVisualAssetTextureProvenanceV289 = Readonly<{
  atlasVisualAssetManifestSha256: typeof ATLAS_VISUAL_ASSET_MANIFEST_CANONICAL_SHA256_V289;
  atlasVisualAssetId: string;
  atlasVisualAssetSha256: string;
  atlasVisualAssetSourceUrl: "https://svs.gsfc.nasa.gov/4851/";
  atlasVisualAssetLicense: typeof ATLAS_VISUAL_ASSET_LICENSE_V289;
  atlasVisualAssetRuntimeSelector: typeof ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V289 | typeof ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V340 | typeof ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V349 | typeof ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V362;
}>;

export type AtlasVisualAssetSelectionV289 = {
  available: boolean;
  reason: "ready" | "legacy-profile" | "lite-boundary" | "no-deep-space-intent" | "ordinary-standalone-boundary";
  baseUrl: string | null;
  starsUrl: string | null;
  tier: "2k" | null;
  provenance: Readonly<{ base: AtlasVisualAssetTextureProvenanceV289; stars: AtlasVisualAssetTextureProvenanceV289 }> | null;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function sha(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function validateAtlasVisualAssetManifestV289(document: unknown): { passed: boolean; failures: string[] } {
  const failures: string[] = [];
  const manifest = record(document);
  if (manifest.version !== "science-cinematic-v4-v289-assets-v1"
    || manifest.id !== "science-cinematic-v4-v289-assets"
    || manifest.runtimePolicy !== "local-shadow-v4-intent-only"
    || manifest.sourcePolicy !== "existing-cache-only-no-new-visual-network-download"
    || manifest.canonicalSha256 !== ATLAS_VISUAL_ASSET_MANIFEST_CANONICAL_SHA256_V289
    || (manifest.contentRoot !== undefined && manifest.contentRoot !== ATLAS_VISUAL_ASSET_MANIFEST_CANONICAL_SHA256_V289)) failures.push("manifest-identity");
  if (manifest.installedLimitBytes !== 67_108_864
    || manifest.minimumFreeDiskBytes !== 32_212_254_720
    || !Number.isSafeInteger(manifest.installedBytes)
    || Number(manifest.installedBytes) < 1
    || Number(manifest.installedBytes) > 67_108_864) failures.push("manifest-budget");
  const entries = Array.isArray(manifest.entries) ? manifest.entries.map(record) : [];
  if (entries.length !== 2) failures.push("entry-count");
  const expectedById = new Map([
    [BASE_ASSET_V289.id, { ...BASE_ASSET_V289, originalPath: ".cache/sky-sources/milkyway_2020_16k.exr", recipe: "v68-reference-backdrop-existing-derived" }],
    [STARS_ASSET_V289.id, { ...STARS_ASSET_V289, originalPath: ".cache/sky-sources/hiptyc_2020_16k.exr", recipe: "v68-primary-stars-existing-derived" }],
  ] as const);
  let outputBytes = 0;
  const observedIds = new Set<string>();
  for (const entry of entries) {
    const id = typeof entry.id === "string" ? entry.id : "";
    const expected = expectedById.get(id as typeof BASE_ASSET_V289.id | typeof STARS_ASSET_V289.id);
    if (!expected || observedIds.has(id)) {
      failures.push("entry-identity");
      continue;
    }
    observedIds.add(id);
    if (entry.sourceUrl !== expected.sourceUrl
      || entry.outputPath !== expected.outputPath
      || entry.originalPath !== expected.originalPath
      || entry.originalSha256 !== expected.originalSha256
      || entry.outputSha256 !== expected.outputSha256
      || !sha(entry.originalSha256)
      || !sha(entry.outputSha256)) failures.push("entry-sha-identity");
    if (String(entry.outputPath).includes("..")
      || String(entry.outputPath).startsWith("/")
      || !String(entry.outputPath).startsWith("textures/sky/")
      || String(entry.originalPath).includes("..")
      || !String(entry.originalPath).startsWith(".cache/sky-sources/")) failures.push("entry-path-boundary");
    const processing = record(entry.processing);
    if (processing.projection !== "equirectangular"
      || processing.width !== 2048
      || processing.height !== 1024
      || processing.recipe !== expected.recipe) failures.push("entry-processing");
    const license = record(entry.license);
    if (license.id !== "NASA-public-domain"
      || license.status !== "approved-runtime"
      || license.termsUrl !== "https://www.nasa.gov/nasa-brand-center/images-and-media/"
      || license.attributionRequired !== false
      || entry.networkDownloadApplied !== false) failures.push("entry-license");
    if (!Number.isSafeInteger(entry.originalBytes) || Number(entry.originalBytes) < 1
      || !Number.isSafeInteger(entry.outputBytes) || Number(entry.outputBytes) < 1) failures.push("entry-size");
    else outputBytes += Number(entry.outputBytes);
  }
  if (outputBytes !== Number(manifest.installedBytes)) failures.push("installed-byte-conservation");
  return { passed: failures.length === 0, failures: [...new Set(failures)] };
}

function unavailableSelection(reason: Exclude<AtlasVisualAssetSelectionV289["reason"], "ready">): AtlasVisualAssetSelectionV289 {
  return { available: false, reason, baseUrl: null, starsUrl: null, tier: null, provenance: null };
}

function textureProvenance(entry: typeof BASE_ASSET_V289 | typeof STARS_ASSET_V289, selector: AtlasVisualAssetTextureProvenanceV289["atlasVisualAssetRuntimeSelector"]): AtlasVisualAssetTextureProvenanceV289 {
  return Object.freeze({
    atlasVisualAssetManifestSha256: ATLAS_VISUAL_ASSET_MANIFEST_CANONICAL_SHA256_V289,
    atlasVisualAssetId: entry.id,
    atlasVisualAssetSha256: entry.outputSha256,
    atlasVisualAssetSourceUrl: entry.sourceUrl,
    atlasVisualAssetLicense: ATLAS_VISUAL_ASSET_LICENSE_V289,
    atlasVisualAssetRuntimeSelector: selector,
  });
}

const RUNTIME_PROVENANCE_V289 = Object.freeze({
  base: textureProvenance(BASE_ASSET_V289, ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V289),
  stars: textureProvenance(STARS_ASSET_V289, ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V289),
});
const RUNTIME_PROVENANCE_V340 = Object.freeze({
  base: textureProvenance(BASE_ASSET_V289, ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V340),
  stars: textureProvenance(STARS_ASSET_V289, ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V340),
});
const RUNTIME_PROVENANCE_V349 = Object.freeze({
  base: textureProvenance(BASE_ASSET_V289, ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V349),
  stars: textureProvenance(STARS_ASSET_V289, ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V349),
});
const RUNTIME_PROVENANCE_V362 = Object.freeze({
  base: textureProvenance(BASE_ASSET_V289, ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V362),
  stars: textureProvenance(STARS_ASSET_V289, ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V362),
});

export function resolveAtlasVisualAssetSelectionV289(args: {
  deliveryProfile: AtlasDeliveryProfile;
  visualProfile: AtlasVisualProfileV299;
  deepSpaceIntent: boolean;
}): AtlasVisualAssetSelectionV289 {
  if (args.visualProfile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V285
    && args.visualProfile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V299
    && args.visualProfile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V300
    && args.visualProfile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V340
    && args.visualProfile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V349
    && args.visualProfile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V362) return unavailableSelection("legacy-profile");
  if (args.deliveryProfile === "vercel-lite") return unavailableSelection("lite-boundary");
  if (args.deliveryProfile !== "local-shadow") return unavailableSelection("ordinary-standalone-boundary");
  if (!args.deepSpaceIntent) return unavailableSelection("no-deep-space-intent");
  return {
    available: true,
    reason: "ready",
    baseUrl: "/textures/sky/orbit-atlas-v68-reference-backdrop-base-2k.jpg",
    starsUrl: "/textures/sky/orbit-atlas-v68-reference-primary-stars-2k.jpg",
    tier: "2k",
    provenance: args.visualProfile === ATLAS_VISUAL_PROFILE_CANDIDATE_V362 ? RUNTIME_PROVENANCE_V362 : args.visualProfile === ATLAS_VISUAL_PROFILE_CANDIDATE_V349 ? RUNTIME_PROVENANCE_V349 : args.visualProfile === ATLAS_VISUAL_PROFILE_CANDIDATE_V340 ? RUNTIME_PROVENANCE_V340 : RUNTIME_PROVENANCE_V289,
  };
}

export function resolveAtlasRuntimeVisualAssetSelectionV289(
  visualProfile: AtlasVisualProfileV299,
  deepSpaceIntent: boolean,
): AtlasVisualAssetSelectionV289 {
  return resolveAtlasVisualAssetSelectionV289({ deliveryProfile: getAtlasDeliveryProfile(), visualProfile, deepSpaceIntent });
}
