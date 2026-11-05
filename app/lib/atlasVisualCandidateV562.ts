import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import rawAssetCatalog from "../data/atlasVisualCandidateAssetsV562.json";

export const ATLAS_VISUAL_CANDIDATE_VERSION_V562 = "v562-visual-candidate-ktx2-first" as const;
export const ATLAS_VISUAL_CANDIDATE_ROOT_V562 = "dist/science/atlas-visual-candidate-v562/manifest.json" as const;
export const ATLAS_VISUAL_CANDIDATE_PACK_V562 = "visual-candidate-v562" as const;

export type AtlasVisualCandidateVariantV562 = "desktop" | "mobile" | "shared";
export type AtlasVisualCandidateRoleV562 = "sky-background" | "sky-stars" | "sky-mask" | "planet-albedo" | "planet-mask" | "planet-ring";
export type AtlasVisualCandidateColorSpaceV562 = "srgb-assumed-untagged" | "linear-grayscale-untagged" | "srgb" | "linear";

export type AtlasVisualCandidateAssetSpecV562 = Readonly<{
  id: string;
  url: string;
  sourcePath: string;
  originalSourcePath: string;
  role: AtlasVisualCandidateRoleV562;
  variant: AtlasVisualCandidateVariantV562;
  format: "jpg-preview" | "ktx2";
  expectedDimensions: Readonly<{ width: number; height: number }>;
  colorSpace: AtlasVisualCandidateColorSpaceV562;
  compression: "jpeg-existing-byte-copy" | "ktx2-existing-byte-copy";
  license: Readonly<{ id: string; url: string }>;
  provenance: Readonly<{
    sourceUrl: string;
    relationship: "byte-copy-from-frozen-source" | "byte-copy-from-admitted-v49-conversion";
    authorityIdentity: "candidate-v562-no-legacy-authority" | "candidate-v562-no-v49-jpeg-authority";
  }>;
}>;

export type AtlasVisualCandidateAssetV562 = AtlasVisualCandidateAssetSpecV562 & Readonly<{
  path: string;
  packId: typeof ATLAS_VISUAL_CANDIDATE_PACK_V562;
  bytes: number;
  sha256: string;
  sourceSha256: string;
  originalSourceSha256: string;
  dimensions: Readonly<{ width: number; height: number }>;
}>;

export type AtlasVisualCandidateManifestV562 = Readonly<{
  version: typeof ATLAS_VISUAL_CANDIDATE_VERSION_V562;
  status: "candidate-qualified-history-immutable";
  visualAuthority: "candidate-only-not-v263-not-legacy-v9";
  authorityNamespace: "candidate-v562";
  assets: readonly AtlasVisualCandidateAssetV562[];
  sourceManifest: readonly Readonly<{ path: string; bytes: number; sha256: string }>[];
  sourceSha256: string;
  manifestSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const catalog = rawAssetCatalog as AtlasVisualCandidateAssetSpecV562[];

export const ATLAS_VISUAL_CANDIDATE_ASSETS_V562: readonly AtlasVisualCandidateAssetSpecV562[] = Object.freeze(
  catalog.map((asset) => Object.freeze({
    ...asset,
    expectedDimensions: Object.freeze({ ...asset.expectedDimensions }),
    license: Object.freeze({ ...asset.license }),
    provenance: Object.freeze({ ...asset.provenance }),
  })),
);

export function loadAtlasVisualCandidateManifestV562(root = process.cwd()): AtlasVisualCandidateManifestV562 {
  const manifestPath = resolve(root, ATLAS_VISUAL_CANDIDATE_ROOT_V562);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as AtlasVisualCandidateManifestV562;
  if (
    manifest.version !== ATLAS_VISUAL_CANDIDATE_VERSION_V562
    || manifest.status !== "candidate-qualified-history-immutable"
    || manifest.visualAuthority !== "candidate-only-not-v263-not-legacy-v9"
    || manifest.authorityNamespace !== "candidate-v562"
    || !SHA256.test(manifest.manifestSha256)
    || !SHA256.test(manifest.sourceSha256)
    || !Array.isArray(manifest.assets)
    || manifest.assets.length !== ATLAS_VISUAL_CANDIDATE_ASSETS_V562.length
  ) throw new Error("v562-visual-candidate-identity");

  const specs = new Map(ATLAS_VISUAL_CANDIDATE_ASSETS_V562.map((asset) => [asset.id, asset]));
  for (const asset of manifest.assets) {
    const spec = specs.get(asset.id);
    if (
      !spec
      || asset.path !== spec.url
      || asset.url !== spec.url
      || asset.sourcePath !== spec.sourcePath
      || asset.originalSourcePath !== spec.originalSourcePath
      || asset.packId !== ATLAS_VISUAL_CANDIDATE_PACK_V562
      || !asset.url.startsWith("/textures/candidate-v562/")
      || !asset.sourcePath.startsWith("public/textures/candidate-v562/")
      || !Number.isSafeInteger(asset.bytes)
      || asset.bytes <= 0
      || !SHA256.test(asset.sha256)
      || !SHA256.test(asset.sourceSha256)
      || !SHA256.test(asset.originalSourceSha256)
      || asset.sha256 !== asset.sourceSha256
      || asset.sha256 !== asset.originalSourceSha256
      || asset.dimensions.width !== spec.expectedDimensions.width
      || asset.dimensions.height !== spec.expectedDimensions.height
      || asset.colorSpace !== spec.colorSpace
      || !asset.license.id
      || !asset.license.url.startsWith("https://")
      || !asset.provenance.authorityIdentity.startsWith("candidate-v562-")
    ) throw new Error(`v562-visual-candidate-asset:${asset.id}`);
  }
  return manifest;
}

export function visualCandidateAssetPathV562(id: string): string {
  const asset = ATLAS_VISUAL_CANDIDATE_ASSETS_V562.find((entry) => entry.id === id);
  if (!asset) throw new Error(`v562-visual-candidate-asset-id:${id}`);
  return asset.url;
}
