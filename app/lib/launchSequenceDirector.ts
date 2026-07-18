import type { LocalTelemetry } from "./localLaunchPhysics";
import type {
  AtlasLaunchSequenceDirectorPhase,
  AtlasLaunchSequenceDirectorPhaseV118,
  AtlasRuntimeQualityTier,
} from "./simulationDiagnosticsTypes";

export const LAUNCH_SEQUENCE_DIRECTOR_VERSION =
  "v114-launch-sequence-director" as const;

export type LaunchRuntimeQualityProfile = {
  tier: AtlasRuntimeQualityTier;
  particleBudget: number;
  particleUpdateStride: number;
  plumeBudget: "full-plume" | "reduced-plume";
  trajectorySampleSeconds: number;
  hudUpdateMs: number;
  earthSegments: number;
  starOpacity: number;
};

export type SelectAtlasRuntimeQualityTierArgs = {
  mobile: boolean;
  launchActive: boolean;
  closeupActive: boolean;
};

export function selectAtlasRuntimeQualityTier({
  mobile,
  launchActive,
  closeupActive,
}: SelectAtlasRuntimeQualityTierArgs): AtlasRuntimeQualityTier {
  if (mobile) return "mobile-safe";
  if (launchActive) return "launch-cinematic";
  if (closeupActive) return "closeup-inspect";
  return "balanced";
}

export function getAtlasRuntimeQualityProfile(
  tier: AtlasRuntimeQualityTier,
): LaunchRuntimeQualityProfile {
  switch (tier) {
    case "mobile-safe":
      return {
        tier,
        particleBudget: 28,
        particleUpdateStride: 2,
        plumeBudget: "reduced-plume",
        trajectorySampleSeconds: 5,
        hudUpdateMs: 250,
        earthSegments: 64,
        starOpacity: 0.045,
      };
    case "launch-cinematic":
      return {
        tier,
        particleBudget: 72,
        particleUpdateStride: 1,
        plumeBudget: "full-plume",
        trajectorySampleSeconds: 2,
        hudUpdateMs: 100,
        earthSegments: 96,
        starOpacity: 0.075,
      };
    case "closeup-inspect":
      return {
        tier,
        particleBudget: 36,
        particleUpdateStride: 2,
        plumeBudget: "reduced-plume",
        trajectorySampleSeconds: 4,
        hudUpdateMs: 180,
        earthSegments: 64,
        starOpacity: 0.035,
      };
    case "balanced":
    default:
      return {
        tier: "balanced",
        particleBudget: 48,
        particleUpdateStride: 1,
        plumeBudget: "full-plume",
        trajectorySampleSeconds: 3,
        hudUpdateMs: 160,
        earthSegments: 80,
        starOpacity: 0.06,
      };
  }
}

export function getLaunchSequenceDirectorPhase(
  telemetry: Pick<
    LocalTelemetry,
    | "phase"
    | "missionTimeS"
    | "altitudeKm"
    | "dynamicPressurePa"
    | "destination"
    | "fuelPercent"
  > | null,
): AtlasLaunchSequenceDirectorPhase {
  if (!telemetry || telemetry.phase === "prelaunch" || telemetry.missionTimeS <= 0) {
    return "prelaunch";
  }

  if (
    telemetry.dynamicPressurePa >= 18_000 &&
    telemetry.altitudeKm < 55 &&
    (telemetry.phase === "srbBurn" || telemetry.phase === "coreBurn")
  ) {
    return "max-q";
  }

  if (telemetry.phase === "staging") return "stage-separation";

  if (
    telemetry.destination === "LEO" &&
    telemetry.altitudeKm >= 120 &&
    telemetry.fuelPercent <= 18
  ) {
    return "payload-deploy";
  }

  if (
    telemetry.phase === "orbitCoast" ||
    telemetry.phase === "icpsFirst" ||
    telemetry.phase === "tliBurn" ||
    telemetry.phase === "transLunarCoast" ||
    telemetry.phase === "marsInjection" ||
    telemetry.phase === "interplanetaryCoast"
  ) {
    return "coast-insertion";
  }

  return "liftoff";
}

export function launchDirectorPhaseLabel(
  phase: AtlasLaunchSequenceDirectorPhase,
): string {
  switch (phase) {
    case "prelaunch":
      return "Prelaunch";
    case "liftoff":
      return "Liftoff";
    case "max-q":
      return "Max-Q";
    case "stage-separation":
      return "Stage separation";
    case "coast-insertion":
      return "Coast / insertion";
    case "payload-deploy":
      return "Payload deploy";
    default:
      return "Launch";
  }
}

export function getLaunchSequenceDirectorPhaseV118(
  telemetry: Pick<LocalTelemetry, "phase" | "missionTimeS" | "altitudeKm" | "dynamicPressurePa" | "destination" | "fuelPercent"> | null,
): AtlasLaunchSequenceDirectorPhaseV118 {
  if (!telemetry || telemetry.phase === "prelaunch" || telemetry.missionTimeS <= 0) return "prelaunch";
  if (telemetry.missionTimeS < 1.5) return "ignition";
  if (telemetry.missionTimeS < 8 || telemetry.altitudeKm < 1.5) return "tower-clear";
  if (telemetry.dynamicPressurePa >= 18_000 && telemetry.altitudeKm < 55) return "max-q";
  if (telemetry.phase === "staging") return "meco-separation";
  if (telemetry.destination === "LEO" && telemetry.altitudeKm >= 120 && telemetry.fuelPercent <= 18) return "payload-deploy";
  if (telemetry.phase === "orbitCoast" || telemetry.phase === "transLunarCoast" || telemetry.phase === "interplanetaryCoast") return "coast";
  if (telemetry.phase === "icpsFirst" || telemetry.phase === "tliBurn" || telemetry.phase === "marsInjection") return "insertion";
  return "tower-clear";
}

export function launchDirectorPhaseLabelV118(phase: AtlasLaunchSequenceDirectorPhaseV118): string {
  switch (phase) {
    case "prelaunch": return "发射准备";
    case "ignition": return "点火";
    case "tower-clear": return "越塔上升";
    case "max-q": return "Max-Q 最大动压";
    case "meco-separation": return "主机关机 / 分级";
    case "coast": return "滑行段";
    case "insertion": return "轨道注入";
    case "payload-deploy": return "载荷部署";
  }
}
