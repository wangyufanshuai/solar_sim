import type { AtlasLaunchSequenceDirectorPhaseV118 } from "./simulationDiagnosticsTypes";

export const LAUNCH_CINEMATIC_V3_VERSION =
  "v164-launch-cinematic-reconstruction-v3" as const;

export const LAUNCH_CINEMATIC_PHASES_V3 = [
  "prelaunch",
  "ignition",
  "tower-clear",
  "max-q",
  "meco-separation",
  "coast",
  "insertion",
  "payload-deploy",
] as const satisfies readonly AtlasLaunchSequenceDirectorPhaseV118[];

export type LaunchSceneAssetManifestV3 = {
  version: typeof LAUNCH_CINEMATIC_V3_VERSION;
  initialAssetLimitBytes: 26_214_400;
  contentPack: "spacecraft";
  required: readonly ["sls-block-1"];
  deferred: readonly ["orion-capsule", "cubesat-1ru", "gateway-core"];
  sourcePolicy: "nasa-official-and-permissive-assets-with-checksum";
  fallbackPolicy: "explicit-programmatic-fallback-never-claims-hd";
};

export const LAUNCH_SCENE_ASSET_MANIFEST_V3: LaunchSceneAssetManifestV3 = {
  version: LAUNCH_CINEMATIC_V3_VERSION,
  initialAssetLimitBytes: 26_214_400,
  contentPack: "spacecraft",
  required: ["sls-block-1"],
  deferred: ["orion-capsule", "cubesat-1ru", "gateway-core"],
  sourcePolicy: "nasa-official-and-permissive-assets-with-checksum",
  fallbackPolicy: "explicit-programmatic-fallback-never-claims-hd",
};

export function launchPhaseProgressV3(phase: AtlasLaunchSequenceDirectorPhaseV118): number {
  return Math.max(0, LAUNCH_CINEMATIC_PHASES_V3.indexOf(phase));
}
