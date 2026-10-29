export const ATLAS_V55_ART_ASSET_BASE = "/textures/planets/v55" as const;

export type AtlasV55ArtAssetId =
  | "earth-cloud-alpha"
  | "earth-night-mask"
  | "gas-band-contrast"
  | "saturn-ring-opacity"
  | "sky-noise-matte"
  | "cinematic-color-lut";

export type AtlasV55ArtAssetManifestEntry = {
  id: AtlasV55ArtAssetId;
  path: string;
  role: string;
  runtimePolicy: "historical-build-source-not-shipped";
};

export const ATLAS_V55_ART_ASSET_MANIFEST: readonly AtlasV55ArtAssetManifestEntry[] = [
  {
    id: "earth-cloud-alpha",
    path: `${ATLAS_V55_ART_ASSET_BASE}/earth-cloud-alpha-v55.png`,
    role: "clean local cloud alpha cue for Earth close-up composition",
    runtimePolicy: "historical-build-source-not-shipped",
  },
  {
    id: "earth-night-mask",
    path: `${ATLAS_V55_ART_ASSET_BASE}/earth-night-mask-v55.png`,
    role: "dark-side city-light containment cue for Earth night rendering",
    runtimePolicy: "historical-build-source-not-shipped",
  },
  {
    id: "gas-band-contrast",
    path: `${ATLAS_V55_ART_ASSET_BASE}/gas-band-contrast-v55.png`,
    role: "nonemissive gas-band microcontrast cue for Jupiter/Saturn",
    runtimePolicy: "historical-build-source-not-shipped",
  },
  {
    id: "saturn-ring-opacity",
    path: `${ATLAS_V55_ART_ASSET_BASE}/saturn-ring-opacity-v55.png`,
    role: "Cassini-gap and ring-opacity layer cue for Saturn",
    runtimePolicy: "historical-build-source-not-shipped",
  },
  {
    id: "sky-noise-matte",
    path: `${ATLAS_V55_ART_ASSET_BASE}/sky-noise-matte-v55.png`,
    role: "subject negative-space sky-noise matte for close-up backgrounds",
    runtimePolicy: "historical-build-source-not-shipped",
  },
  {
    id: "cinematic-color-lut",
    path: `${ATLAS_V55_ART_ASSET_BASE}/cinematic-color-lut-v55.png`,
    role: "filmic cool-space/warm-planet color-grade reference strip",
    runtimePolicy: "historical-build-source-not-shipped",
  },
] as const;

export function atlasV55ArtAssetPathFor(id: AtlasV55ArtAssetId): string {
  return ATLAS_V55_ART_ASSET_MANIFEST.find((entry) => entry.id === id)?.path ?? "";
}
