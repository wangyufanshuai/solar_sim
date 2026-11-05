export const ATLAS_VISUAL_ASSET_MANIFEST_VERSION_V274 = "science-cinematic-v3-v274-assets-v1" as const;

export type AtlasVisualAssetLicenseV274 = {
  id: "NASA-public-domain" | "CC-BY-SA-4.0" | "CC-BY-4.0";
  status: "approved-runtime";
  termsUrl: string;
  attributionRequired: boolean;
};

export type AtlasVisualAssetManifestEntryV274 = {
  id: string;
  group: "sky/backdrop" | "solar/planet/rings" | "catalog/cosmic";
  sourceUrl: string;
  downloadedAt: string;
  originalPath: string;
  originalBytes: number;
  originalSha256: string;
  outputPath: string;
  outputBytes: number;
  outputSha256: string;
  tier: "desktop-8k" | "desktop-4k" | "mobile-2k" | "catalog";
  format: "jpg" | "ktx2" | "json.gz";
  derivedParameters: Readonly<Record<string, string | number | boolean>>;
  license: AtlasVisualAssetLicenseV274;
};

export type AtlasVisualAssetManifestV274 = {
  version: typeof ATLAS_VISUAL_ASSET_MANIFEST_VERSION_V274;
  id: "science-cinematic-v3-v274-assets";
  generatedAt: string;
  canonicalSha256: string;
  installedBytes: number;
  installedLimitBytes: number;
  temporaryWorkingSetLimitBytes: number;
  minimumFreeDiskBytes: number;
  runtimePolicy: "local-shadow-intent-only-no-formal-or-lite-default";
  entries: readonly AtlasVisualAssetManifestEntryV274[];
  stagedExcluded: readonly { id: string; reason: string }[];
};

const SHA256 = /^[a-f0-9]{64}$/;

export function parseAtlasVisualAssetManifestV274(value: unknown): AtlasVisualAssetManifestV274 {
  if (!value || typeof value !== "object") throw new Error("v274 visual asset manifest is invalid");
  const manifest = value as Partial<AtlasVisualAssetManifestV274>;
  if (manifest.version !== ATLAS_VISUAL_ASSET_MANIFEST_VERSION_V274 || manifest.id !== "science-cinematic-v3-v274-assets") {
    throw new Error("v274 visual asset manifest identity changed");
  }
  if (!SHA256.test(manifest.canonicalSha256 ?? "") || !Array.isArray(manifest.entries) || !Array.isArray(manifest.stagedExcluded)) {
    throw new Error("v274 visual asset manifest integrity fields are invalid");
  }
  if (!Number.isSafeInteger(manifest.installedBytes) || !Number.isSafeInteger(manifest.installedLimitBytes)
    || (manifest.installedBytes ?? 0) > (manifest.installedLimitBytes ?? 0)
    || manifest.runtimePolicy !== "local-shadow-intent-only-no-formal-or-lite-default") {
    throw new Error("v274 visual asset manifest budget/default boundary changed");
  }
  const ids = new Set<string>();
  for (const entry of manifest.entries) {
    if (!entry.id || ids.has(entry.id) || !SHA256.test(entry.originalSha256) || !SHA256.test(entry.outputSha256)) {
      throw new Error("v274 visual asset entry identity/SHA is invalid");
    }
    if (entry.license.status !== "approved-runtime" || !entry.license.termsUrl.startsWith("https://")) {
      throw new Error(`v274 visual asset ${entry.id} has no approved license`);
    }
    if (!entry.sourceUrl.startsWith("https://") || !Number.isSafeInteger(entry.outputBytes) || entry.outputBytes < 1) {
      throw new Error(`v274 visual asset ${entry.id} provenance is incomplete`);
    }
    ids.add(entry.id);
  }
  return value as AtlasVisualAssetManifestV274;
}
