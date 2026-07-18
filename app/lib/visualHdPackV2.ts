export const VISUAL_HD_PACK_V2_VERSION = "v143-visual-hd-v2" as const;
export const VISUAL_HD_PACK_V2_MAX_BYTES = 1.5 * 1024 * 1024 * 1024;

export type LaunchAssetManifest = {
  version: typeof VISUAL_HD_PACK_V2_VERSION;
  installedBytes: number;
  gpuResidencyLimitBytes: number;
  inspectTextureResidencyLimitBytes: number;
  files: readonly {
    path: string;
    bytes: number;
    sha256: string;
    role: "planet-ktx2" | "planet-hd-fallback" | "spacecraft-glb" | "launch-environment";
    source: string;
    license: string;
  }[];
  runtimePolicy: "scene-lru-on-demand-release-on-exit";
};

export function validateVisualHdPackV2(manifest: LaunchAssetManifest): readonly string[] {
  const errors: string[] = [];
  if (manifest.installedBytes > VISUAL_HD_PACK_V2_MAX_BYTES) errors.push("visual-hd-over-1.5-gib");
  if (manifest.gpuResidencyLimitBytes > 2.5 * 1024 * 1024 * 1024) errors.push("gpu-residency-over-2.5-gib");
  if (manifest.inspectTextureResidencyLimitBytes > 1.25 * 1024 * 1024 * 1024) errors.push("inspect-texture-residency-over-1.25-gib");
  if (manifest.files.some((file) => !/^[a-f0-9]{64}$/.test(file.sha256))) errors.push("invalid-asset-checksum");
  return errors;
}
