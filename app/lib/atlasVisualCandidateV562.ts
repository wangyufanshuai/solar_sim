import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const ATLAS_VISUAL_CANDIDATE_VERSION_V562 = "v562-visual-candidate-ktx2-first" as const;
export const ATLAS_VISUAL_CANDIDATE_ROOT_V562 = "dist/science/atlas-visual-candidate-v562/manifest.json" as const;

export type AtlasVisualCandidateVariantV562 = "desktop" | "mobile" | "shared";
export type AtlasVisualCandidateAssetV562 = Readonly<{
  id: string;
  path: string;
  sourcePath: string;
  role: "sky-background" | "planet-albedo" | "planet-mask" | "planet-ring";
  variant: AtlasVisualCandidateVariantV562;
  format: "jpg-preview" | "ktx2";
  packId: "core" | "planet-hd";
  bytes: number;
  sha256: string;
  sourceSha256: string;
  license: string;
}>;

export type AtlasVisualCandidateManifestV562 = Readonly<{
  version: typeof ATLAS_VISUAL_CANDIDATE_VERSION_V562;
  status: "candidate-qualified-history-immutable";
  visualAuthority: "candidate-only-not-v263-not-legacy-v9";
  assets: readonly AtlasVisualCandidateAssetV562[];
  sourceManifest: readonly Readonly<{ path: string; bytes: number; sha256: string }>[];
  sourceSha256: string;
  manifestSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;

export const ATLAS_VISUAL_CANDIDATE_ASSETS_V562 = Object.freeze([
  { id: "sky-stars-desktop", path: "/textures/sky/orbit-atlas-v9-stars-4k.jpg", sourcePath: "public/textures/sky/orbit-atlas-v9-stars-4k.jpg", role: "sky-background", variant: "desktop", format: "jpg-preview", packId: "core", license: "NASA-ESA-source-manifests" },
  { id: "sky-stars-mobile", path: "/textures/sky/orbit-atlas-v9-stars-2k.jpg", sourcePath: "public/textures/sky/orbit-atlas-v9-stars-2k.jpg", role: "sky-background", variant: "mobile", format: "jpg-preview", packId: "core", license: "NASA-ESA-source-manifests" },
  { id: "sky-dust-shared", path: "/textures/sky/orbit-atlas-v9-dust-2k.jpg", sourcePath: "public/textures/sky/orbit-atlas-v9-dust-2k.jpg", role: "sky-background", variant: "shared", format: "jpg-preview", packId: "core", license: "NASA-ESA-source-manifests" },
  { id: "earth-albedo", path: "/textures/ktx2/planets_v49_earth-albedo.ktx2", sourcePath: "public/textures/ktx2/planets_v49_earth-albedo.ktx2", role: "planet-albedo", variant: "shared", format: "ktx2", packId: "planet-hd", license: "NASA-public-domain-and-source-manifests" },
  { id: "earth-cloud-alpha", path: "/textures/ktx2/planets_v49_earth-cloud-alpha.ktx2", sourcePath: "public/textures/ktx2/planets_v49_earth-cloud-alpha.ktx2", role: "planet-mask", variant: "shared", format: "ktx2", packId: "planet-hd", license: "NASA-public-domain-and-source-manifests" },
  { id: "jupiter-albedo", path: "/textures/ktx2/planets_v49_jupiter-albedo.ktx2", sourcePath: "public/textures/ktx2/planets_v49_jupiter-albedo.ktx2", role: "planet-albedo", variant: "shared", format: "ktx2", packId: "planet-hd", license: "NASA-public-domain-and-source-manifests" },
  { id: "jupiter-band-mask", path: "/textures/ktx2/planets_v49_jupiter-band-mask.ktx2", sourcePath: "public/textures/ktx2/planets_v49_jupiter-band-mask.ktx2", role: "planet-mask", variant: "shared", format: "ktx2", packId: "planet-hd", license: "NASA-public-domain-and-source-manifests" },
  { id: "saturn-albedo", path: "/textures/ktx2/planets_v49_saturn-albedo.ktx2", sourcePath: "public/textures/ktx2/planets_v49_saturn-albedo.ktx2", role: "planet-albedo", variant: "shared", format: "ktx2", packId: "planet-hd", license: "NASA-public-domain-and-source-manifests" },
  { id: "saturn-ring-alpha", path: "/textures/ktx2/planets_v49_saturn-ring-alpha.ktx2", sourcePath: "public/textures/ktx2/planets_v49_saturn-ring-alpha.ktx2", role: "planet-ring", variant: "shared", format: "ktx2", packId: "planet-hd", license: "NASA-public-domain-and-source-manifests" },
] as const);

export function loadAtlasVisualCandidateManifestV562(root = process.cwd()): AtlasVisualCandidateManifestV562 {
  const path = resolve(root, ATLAS_VISUAL_CANDIDATE_ROOT_V562);
  const manifest = JSON.parse(readFileSync(path, "utf8")) as AtlasVisualCandidateManifestV562;
  if (manifest.version !== ATLAS_VISUAL_CANDIDATE_VERSION_V562 || manifest.status !== "candidate-qualified-history-immutable" || manifest.visualAuthority !== "candidate-only-not-v263-not-legacy-v9" || !SHA256.test(manifest.manifestSha256) || !SHA256.test(manifest.sourceSha256) || !Array.isArray(manifest.assets) || manifest.assets.length !== ATLAS_VISUAL_CANDIDATE_ASSETS_V562.length) throw new Error("v562-visual-candidate-identity");
  for (const asset of manifest.assets) {
    if (!asset.id || !asset.path.startsWith("/textures/") || !asset.sourcePath.startsWith("public/textures/") || !["jpg-preview", "ktx2"].includes(asset.format) || !Number.isSafeInteger(asset.bytes) || asset.bytes <= 0 || !SHA256.test(asset.sha256) || !SHA256.test(asset.sourceSha256) || !asset.license) throw new Error(`v562-visual-candidate-asset:${asset.id}`);
  }
  return manifest;
}

export function visualCandidateAssetPathV562(id: string): string {
  const asset = ATLAS_VISUAL_CANDIDATE_ASSETS_V562.find((entry) => entry.id === id);
  if (!asset) throw new Error(`v562-visual-candidate-asset-id:${id}`);
  return asset.path;
}
