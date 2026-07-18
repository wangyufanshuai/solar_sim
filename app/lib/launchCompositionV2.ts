import type {
  AtlasLaunchSequenceDirectorPhase,
  AtlasRuntimeQualityTier,
} from "./simulationDiagnosticsTypes";

export const LAUNCH_COMPOSITION_V2_VERSION =
  "v158-launch-composition-reconstruction-v2" as const;

export type LaunchFrameRequestV2 = {
  phase: AtlasLaunchSequenceDirectorPhase;
  qualityTier: AtlasRuntimeQualityTier;
  vehicleHeightScene: number;
};

export type LaunchFrameSolutionV2 = {
  version: typeof LAUNCH_COMPOSITION_V2_VERSION;
  phase: AtlasLaunchSequenceDirectorPhase;
  sideDistance: number;
  elevationDistance: number;
  trailingDistance: number;
  lookAheadDistance: number;
  desiredSubjectCoverage: number;
  transitionMs: number;
};

const PHASE_FRAME: Record<AtlasLaunchSequenceDirectorPhase, Omit<LaunchFrameSolutionV2, "version" | "phase">> = {
  prelaunch: {
    sideDistance: 0.48,
    elevationDistance: 0.24,
    trailingDistance: 0.18,
    lookAheadDistance: 0.025,
    desiredSubjectCoverage: 0.5,
    transitionMs: 760,
  },
  liftoff: {
    sideDistance: 0.64,
    elevationDistance: 0.34,
    trailingDistance: 0.1,
    lookAheadDistance: 0.04,
    desiredSubjectCoverage: 0.46,
    transitionMs: 820,
  },
  "max-q": {
    sideDistance: 1.08,
    elevationDistance: 0.42,
    trailingDistance: 0.32,
    lookAheadDistance: 0.02,
    desiredSubjectCoverage: 0.38,
    transitionMs: 900,
  },
  "stage-separation": {
    sideDistance: 1.26,
    elevationDistance: 0.46,
    trailingDistance: 0.36,
    lookAheadDistance: 0.02,
    desiredSubjectCoverage: 0.34,
    transitionMs: 880,
  },
  "coast-insertion": {
    sideDistance: 1.7,
    elevationDistance: 0.58,
    trailingDistance: 0.52,
    lookAheadDistance: 0,
    desiredSubjectCoverage: 0.28,
    transitionMs: 960,
  },
  "payload-deploy": {
    sideDistance: 0.74,
    elevationDistance: 0.3,
    trailingDistance: 0.18,
    lookAheadDistance: 0.01,
    desiredSubjectCoverage: 0.42,
    transitionMs: 820,
  },
};

export function solveLaunchFrameV2(request: LaunchFrameRequestV2): LaunchFrameSolutionV2 {
  const base = PHASE_FRAME[request.phase];
  const mobileScale = request.qualityTier === "mobile-safe" ? 1.16 : 1;
  const vehicleScale = Math.max(0.82, Math.min(1.32, request.vehicleHeightScene / 0.18));
  return {
    version: LAUNCH_COMPOSITION_V2_VERSION,
    phase: request.phase,
    sideDistance: base.sideDistance * mobileScale * vehicleScale,
    elevationDistance: base.elevationDistance * mobileScale,
    trailingDistance: base.trailingDistance * mobileScale,
    lookAheadDistance: base.lookAheadDistance * vehicleScale,
    desiredSubjectCoverage: request.qualityTier === "mobile-safe"
      ? Math.max(0.28, base.desiredSubjectCoverage - 0.05)
      : base.desiredSubjectCoverage,
    transitionMs: base.transitionMs,
  };
}

export type LaunchAssetTransformV2 = {
  path: string;
  scale: number;
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  bounds: { heightScene: number; radiusScene: number };
};

export const LAUNCH_ASSET_TRANSFORMS_V2 = {
  "sls-block-1": {
    path: "/models/spacecraft/sls-block-1.glb",
    scale: 0.00043,
    position: [0, 0, 0],
    rotation: [-Math.PI / 2, 0, 0],
    bounds: { heightScene: 0.18, radiusScene: 0.024 },
  },
  "orion-capsule": {
    path: "/models/spacecraft/orion-capsule.glb",
    scale: 0.004,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    bounds: { heightScene: 0.035, radiusScene: 0.018 },
  },
  "cubesat-1ru": {
    path: "/models/spacecraft/cubesat-1ru.glb",
    scale: 0.004,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    bounds: { heightScene: 0.024, radiusScene: 0.012 },
  },
  "gateway-core": {
    path: "/models/spacecraft/gateway-core.glb",
    scale: 0.004,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    bounds: { heightScene: 0.12, radiusScene: 0.08 },
  },
} as const satisfies Record<string, LaunchAssetTransformV2>;
