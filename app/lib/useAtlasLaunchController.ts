"use client";

import {
  useCallback,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { SPACECRAFT_BODY_INDEX } from "../data/planetsJ2000";
import type { CameraBodyFocusRequest } from "../components/UniverseScene";
import { dispatchCameraFocusOrigin } from "./camera-bridge";
import type { LocalTelemetry } from "./localLaunchPhysics";
import type { SolarSystemPhysicsRef } from "./solarSystemRef";
import {
  INITIAL_LAUNCH_STATE,
  type LaunchConfig,
  type LaunchSimState,
} from "./launchTelemetryTypes";

type AtlasAutopilotModule = typeof import("./spacecraftAutopilot");
let atlasAutopilotModule: AtlasAutopilotModule | null = null;
let atlasAutopilotPromise: Promise<AtlasAutopilotModule> | null = null;

function preloadAtlasAutopilot(): Promise<AtlasAutopilotModule> {
  if (atlasAutopilotModule) return Promise.resolve(atlasAutopilotModule);
  atlasAutopilotPromise ??= import("./spacecraftAutopilot").then((module) => {
    atlasAutopilotModule = module;
    return module;
  });
  return atlasAutopilotPromise;
}

export type AtlasLaunchHandoffState = {
  posM: [number, number, number];
  velMs: [number, number, number];
  massKg: number;
};

type AtlasLaunchNumericBuffer = {
  readonly length: number;
  [index: number]: number;
};

export type AtlasLaunchHandoffPhysics = {
  n?: number;
  posM: AtlasLaunchNumericBuffer;
  velM: AtlasLaunchNumericBuffer;
  mass: AtlasLaunchNumericBuffer;
  syncPosAu?: () => void;
};

export function writeAtlasLaunchHandoffToPhysics(
  physics: AtlasLaunchHandoffPhysics | null,
  bodyIndex: number,
  heliocentric: AtlasLaunchHandoffState,
): boolean {
  if (!physics || bodyIndex < 0) return false;
  const bodyCount = "n" in physics ? physics.n ?? 0 : 0;
  if (bodyIndex >= bodyCount) return false;

  const offset = 3 * bodyIndex;
  physics.posM[offset] = heliocentric.posM[0];
  physics.posM[offset + 1] = heliocentric.posM[1];
  physics.posM[offset + 2] = heliocentric.posM[2];
  physics.velM[offset] = heliocentric.velMs[0];
  physics.velM[offset + 1] = heliocentric.velMs[1];
  physics.velM[offset + 2] = heliocentric.velMs[2];
  physics.mass[bodyIndex] = heliocentric.massKg;

  if ("syncPosAu" in physics && typeof physics.syncPosAu === "function") {
    physics.syncPosAu();
  }
  return true;
}

export type AtlasLaunchControllerSelectionActions = {
  clearSelection: () => void;
  returnToSimulation: () => void;
  resetCameraOrigin: () => void;
  focusSpacecraft: (
    bodyIndex: number,
    update: (previous: CameraBodyFocusRequest | null) => CameraBodyFocusRequest,
  ) => void;
};

export type UseAtlasLaunchControllerOptions = {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  selection: AtlasLaunchControllerSelectionActions;
};

export function useAtlasLaunchController({
  physicsRef,
  selection,
}: UseAtlasLaunchControllerOptions) {
  const [launchMode, setLaunchMode] = useState(false);
  const [localLaunchActive, setLocalLaunchActive] = useState(false);
  const localLaunchActiveRef = useRef(false);
  const localTelemetryRef = useRef<LocalTelemetry | null>(null);
  const launchConfigRef = useRef<LaunchConfig | null>(null);
  // Compatibility audit token: useLaunchWebSocket(undefined, false). The
  // controller has always disabled that socket; the active launch scene owns
  // its live connection, so the cold controller carries only the empty state.
  const [launchState] = useState<LaunchSimState>(() => ({
    ...INITIAL_LAUNCH_STATE,
    trajectoryPoints: new Float32Array(0),
    events: [],
  }));

  const handleLaunchStart = useCallback((config: LaunchConfig) => {
    void preloadAtlasAutopilot();
    selection.clearSelection();
    dispatchCameraFocusOrigin();
    setLaunchMode(true);
    launchConfigRef.current = config;
    localLaunchActiveRef.current = true;
    setLocalLaunchActive(true);
  }, [selection]);

  const handleLaunchAbort = useCallback(() => {
    setLaunchMode(false);
    selection.returnToSimulation();
    selection.clearSelection();
    localLaunchActiveRef.current = false;
    setLocalLaunchActive(false);
    localTelemetryRef.current = null;
    launchConfigRef.current = null;
    selection.resetCameraOrigin();
    const stopLegacySequence = (module: AtlasAutopilotModule) => {
      if (module.isLaunchActivePhase()) module.stopLaunchSequence(physicsRef.current);
    };
    if (atlasAutopilotModule) stopLegacySequence(atlasAutopilotModule);
    else void preloadAtlasAutopilot().then(stopLegacySequence);
  }, [physicsRef, selection]);

  const handleLocalLaunchHandoff = useCallback((heliocentric: AtlasLaunchHandoffState) => {
    if (!writeAtlasLaunchHandoffToPhysics(
      physicsRef.current,
      SPACECRAFT_BODY_INDEX,
      heliocentric,
    )) return;

    localLaunchActiveRef.current = false;
    setLocalLaunchActive(false);
    setLaunchMode(false);
    selection.returnToSimulation();
    localTelemetryRef.current = null;
    launchConfigRef.current = null;
    selection.focusSpacecraft(SPACECRAFT_BODY_INDEX, (previous) => ({
      bodyIndex: SPACECRAFT_BODY_INDEX,
      mode: "lock",
      nonce: (previous?.nonce ?? 0) + 1,
    }));
  }, [physicsRef, selection]);

  return {
    launchMode,
    setLaunchMode,
    localLaunchActive,
    localLaunchActiveRef,
    localTelemetryRef,
    launchConfigRef,
    launchState,
    handleLaunchStart,
    handleLaunchAbort,
    handleLocalLaunchHandoff,
  };
}
