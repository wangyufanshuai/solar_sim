export type ResourceRenderTier = "core" | "deferred" | "highQuality";

export type DeepSkyResourcePackItem = {
  id: string;
  name: string;
  file: string;
  publicUrl?: string;
  previewUrl: string;
  qualityUrl: string;
  nasaId?: string | null;
  sourceUrl: string | null;
  credit: string;
  sourceCredit?: string;
  packVersion?: "pack-v2" | "pack-v3";
  renderProfile?: "deep-universe-v4-observational";
  bytes: {
    preview: number;
    quality: number;
  };
  dimensions?: {
    preview?: [number, number];
    quality?: [number, number];
  };
  checksum: {
    preview: string;
    quality: string;
  };
  galactic: {
    lonDeg: number;
    latDeg: number;
  };
  visual: {
    size: number;
    rotation: number;
    opacity: number;
    dustPreserve?: number;
    saturation?: number;
    shellOpacity?: number;
  };
  renderTier: ResourceRenderTier;
  renderMode: "anchored sky-sphere decal";
};

export type SpacecraftResourcePackItem = {
  id: string;
  title: string;
  localPath: string;
  originUrl: string;
  sourcePage: string;
  credit: string;
  bytes: number;
  checksum: string;
  modelScale: number;
  previewTier: "core" | "gallery";
  missionYear: number | null;
  category: "space-station" | "crewed" | "telescope" | "outer-planet" | "mars" | "lunar" | "earth-orbit" | "comet" | "probe";
  scaleLabel: string;
  description: string;
  sourceCreditShort: string;
};

export type ResourcePackManifest = {
  generatedAt: string;
  source: string;
  license: string;
  performancePolicy: string;
  deepSky?: DeepSkyResourcePackItem[];
  spacecraft?: SpacecraftResourcePackItem[];
};
