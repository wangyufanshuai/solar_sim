import type { MutableRefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { LaunchConfig } from "../lib/launchTelemetryTypes";
import type { LocalTelemetry } from "../lib/localLaunchPhysics";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import type { AtlasRuntimeQualityTier } from "../lib/simulationDiagnosticsTypes";

export type LaunchSceneViewProps = {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  onHandoff: (heliocentric: {
    posM: [number, number, number];
    velMs: [number, number, number];
    massKg: number;
  }) => void;
  onAbort: () => void;
  telemetryRef?: MutableRefObject<LocalTelemetry | null>;
  active: boolean;
  launchConfigRef?: MutableRefObject<LaunchConfig | null>;
  controlsRef?: MutableRefObject<OrbitControlsImpl | null>;
  runtimeQualityTier?: AtlasRuntimeQualityTier;
};
