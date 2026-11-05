export const ATLAS_SCALE_RESOURCE_SNAPSHOT_VERSION_V273 = "v273-scale-resource-snapshot-v1" as const;

export type AtlasScaleResourceBandV273 = "local-group" | "near-universe";

export type AtlasScaleResourceSnapshotV273 = {
  version: typeof ATLAS_SCALE_RESOURCE_SNAPSHOT_VERSION_V273;
  band?: AtlasScaleResourceBandV273;
  status: "loading" | "ready" | "unavailable";
  count?: number;
  cacheHit?: boolean;
  decodedBytes?: number;
  provenance?: string;
  publicDeploymentBlocked?: boolean;
  error?: string;
  automaticRetryApplied: false;
};

export function createAtlasScaleResourceSnapshotV273(
  value: Omit<AtlasScaleResourceSnapshotV273, "version" | "automaticRetryApplied">,
): AtlasScaleResourceSnapshotV273 {
  return {
    version: ATLAS_SCALE_RESOURCE_SNAPSHOT_VERSION_V273,
    automaticRetryApplied: false,
    ...value,
  };
}
