import type { ResourceRenderTier } from "./resourcePackTypes";

export type DeepUniverseRenderTier = ResourceRenderTier;

export type DeepUniverseResourceManifest = {
  generatedAt: string;
  packVersion: "pack-v3";
  source: string;
  license: string;
  performancePolicy: string;
  totalBytes: number;
  maxCommittedBytes: number;
  deepSky: DeepSkyResourceV3[];
};

export type DeepSkyResourceV3 = {
  id: string;
  name: string;
  file: string;
  previewUrl: string;
  qualityUrl: string;
  nasaId?: string | null;
  sourceUrl: string | null;
  credit: string;
  sourceCredit: string;
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
    dustPreserve: number;
    saturation: number;
    shellOpacity: number;
  };
  renderTier: DeepUniverseRenderTier;
  renderMode: "anchored sky-sphere decal";
  renderProfile: "deep-universe-v4-observational";
  packVersion: "pack-v3";
};

export type DeepUniverseRenderProfile = {
  id: "deep-universe-v4-observational";
  label: string;
  galaxyExposure: number;
  galaxyContrast: number;
  dustLaneContrast: number;
  coreCompression: number;
  decalShellOpacity: number;
  previewFirst: boolean;
  qualityLazy: boolean;
};

export type StarfieldRenderProfile = {
  id: "solar-local" | "milky-way" | "atlas-deep-universe";
  maxStars: number;
  opacityByLod: {
    solar: number;
    mid: number;
    far: number;
  };
  haloScale: number;
  colorIndexStrength: number;
};

export type DeepUniverseCoverMetadata = {
  selectedTargetId: string | null;
  title: string;
  scaleLabel: string;
  sourceCredit: string;
  renderProfile: "deep-universe-v4-observational";
  resourcePack: "pack-v3";
  qualityState: "preview" | "quality-lazy" | "quality-ready";
  timestamp: string;
};
