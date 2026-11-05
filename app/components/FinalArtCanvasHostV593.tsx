"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { memo, useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import {
  getAtlasResourceSnapshot,
  type AtlasRuntimeResourceSnapshot,
} from "../lib/atlasResourceLifecycle";
import type { CelestialDeviceTierV590, CelestialModeV590 } from "../lib/celestialRenderingV590";

export type FinalArtLifecycleCapturePhaseV593 = "baseline" | "mounted" | "detached-stable";

export type FinalArtLifecycleSnapshotV593 = Readonly<{
  capturedAt: string;
  renderer: Readonly<{
    textures: number | null;
    geometries: number | null;
    programs: number | null;
    renderTargets: number | null;
    renderTargetsSource: "atlas-resource-registry.gpuRenderTargets" | "unavailable";
  }>;
  registry: Readonly<{
    total: number | null;
    workers: number | null;
    renderTargets: number | null;
    textures: number | null;
    subscriptions: number | null;
    typedArrays: number | null;
    estimatedBytes: number | null;
  }>;
  scene: Readonly<{
    objects: number;
    candidateNodes: number;
  }>;
}>;

export type FinalArtLifecycleExitObservationV593 = Readonly<{
  renderListsDisposed?: true;
  contextLost?: true;
  canvasDetached?: true;
  routeAfter?: string;
}>;

type LifecycleAuditControllerV593 = Readonly<{
  requestSnapshot: (phase: FinalArtLifecycleCapturePhaseV593 | null) => void;
  updateCallbacks: (
    onSnapshot: ((phase: FinalArtLifecycleCapturePhaseV593, snapshot: FinalArtLifecycleSnapshotV593) => void) | undefined,
    onExitObservation: ((observation: FinalArtLifecycleExitObservationV593) => void) | undefined,
  ) => void;
  observeHostUnmount: () => void;
}>;

const SNAPSHOT_INTERVAL_MILLISECONDS_V593 = 100;
const SNAPSHOT_STABLE_MILLISECONDS_V593 = 750;

function finiteMeasurementV593(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function captureLifecycleSnapshotV593(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
): FinalArtLifecycleSnapshotV593 {
  let registry: AtlasRuntimeResourceSnapshot | null = null;
  try {
    registry = getAtlasResourceSnapshot();
  } catch {
    registry = null;
  }
  let objects = 0;
  let candidateNodes = 0;
  scene.traverse((node) => {
    objects += 1;
    if (node.userData.atlasCandidate === "v593") candidateNodes += 1;
  });
  const renderTargets = finiteMeasurementV593(registry?.gpuRenderTargets);
  return Object.freeze({
    capturedAt: new Date().toISOString(),
    renderer: Object.freeze({
      textures: finiteMeasurementV593(gl.info.memory?.textures),
      geometries: finiteMeasurementV593(gl.info.memory?.geometries),
      programs: Array.isArray(gl.info.programs) ? gl.info.programs.length : null,
      renderTargets,
      renderTargetsSource: renderTargets === null
        ? "unavailable"
        : "atlas-resource-registry.gpuRenderTargets",
    }),
    registry: Object.freeze({
      total: finiteMeasurementV593(registry?.total),
      workers: finiteMeasurementV593(registry?.workers),
      renderTargets,
      textures: finiteMeasurementV593(registry?.textures),
      subscriptions: finiteMeasurementV593(registry?.subscriptions),
      typedArrays: finiteMeasurementV593(registry?.typedArrayCaches),
      estimatedBytes: finiteMeasurementV593(registry?.estimatedBytes),
    }),
    scene: Object.freeze({ objects, candidateNodes }),
  });
}

function snapshotMeasurementsV593(snapshot: FinalArtLifecycleSnapshotV593): readonly (number | null)[] {
  return Object.freeze([
    snapshot.renderer.textures,
    snapshot.renderer.geometries,
    snapshot.renderer.programs,
    snapshot.renderer.renderTargets,
    snapshot.registry.total,
    snapshot.registry.workers,
    snapshot.registry.renderTargets,
    snapshot.registry.textures,
    snapshot.registry.subscriptions,
    snapshot.registry.typedArrays,
    snapshot.registry.estimatedBytes,
  ]);
}

function snapshotIsMeasuredZeroV593(snapshot: FinalArtLifecycleSnapshotV593): boolean {
  return snapshotMeasurementsV593(snapshot).every((value) => value !== null && value === 0);
}

function snapshotQualifiesV593(
  phase: FinalArtLifecycleCapturePhaseV593,
  snapshot: FinalArtLifecycleSnapshotV593,
): boolean {
  if (phase === "baseline" || phase === "detached-stable") {
    return snapshotIsMeasuredZeroV593(snapshot);
  }
  const rendererHasSceneResources = [
    snapshot.renderer.textures,
    snapshot.renderer.geometries,
    snapshot.renderer.programs,
  ].some((value) => value !== null && value > 0);
  return snapshot.scene.objects > 1
    && rendererHasSceneResources
    && snapshot.registry.total !== null
    && snapshot.registry.total > 0;
}

function snapshotStabilityKeyV593(snapshot: FinalArtLifecycleSnapshotV593): string {
  return JSON.stringify({
    renderer: snapshot.renderer,
    registry: snapshot.registry,
    scene: snapshot.scene,
  });
}

function createLifecycleAuditControllerV593(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  onSnapshot: ((phase: FinalArtLifecycleCapturePhaseV593, snapshot: FinalArtLifecycleSnapshotV593) => void) | undefined,
  onExitObservation: ((observation: FinalArtLifecycleExitObservationV593) => void) | undefined,
): LifecycleAuditControllerV593 {
  const canvas = gl.domElement;
  const context = gl.getContext();
  const renderLists = gl.renderLists;
  const originalRenderListsDispose = renderLists.dispose;
  let snapshotCallback = onSnapshot;
  let exitCallback = onExitObservation;
  let requestedPhase: FinalArtLifecycleCapturePhaseV593 | null = null;
  let stableKey: string | null = null;
  let stableSince = 0;
  let hostUnmounted = false;
  let observationReleased = false;
  const exitObservation: {
    renderListsDisposed: true | null;
    contextLost: true | null;
    canvasDetached: true | null;
    routeAfter: string | null;
  } = {
    renderListsDisposed: null,
    contextLost: null,
    canvasDetached: null,
    routeAfter: null,
  };

  const publishExitObservation = (patch: FinalArtLifecycleExitObservationV593) => {
    let changed = false;
    for (const [key, value] of Object.entries(patch)) {
      const observationKey = key as keyof typeof exitObservation;
      if (exitObservation[observationKey] === value) continue;
      Object.assign(exitObservation, { [observationKey]: value });
      changed = true;
    }
    if (changed) exitCallback?.(Object.freeze({ ...patch }));
  };

  const wrappedRenderListsDispose = function renderListsDisposeAuditV593() {
    if (hostUnmounted) publishExitObservation({ renderListsDisposed: true });
    return originalRenderListsDispose.call(renderLists);
  };
  renderLists.dispose = wrappedRenderListsDispose;

  const onContextLost = () => {
    if (hostUnmounted) publishExitObservation({ contextLost: true });
  };
  canvas.addEventListener("webglcontextlost", onContextLost, { capture: true });

  const observeCanvasConnection = () => {
    if (hostUnmounted && !canvas.isConnected) publishExitObservation({ canvasDetached: true });
  };
  const canvasObserver = new MutationObserver(observeCanvasConnection);
  canvasObserver.observe(document.documentElement, { childList: true, subtree: true });

  const releaseObservation = () => {
    if (observationReleased) return;
    observationReleased = true;
    window.clearInterval(sampleTimer);
    canvasObserver.disconnect();
    canvas.removeEventListener("webglcontextlost", onContextLost, { capture: true });
    if (renderLists.dispose === wrappedRenderListsDispose) {
      renderLists.dispose = originalRenderListsDispose;
    }
  };

  const sample = () => {
    if (hostUnmounted) {
      const routeAfter = window.location.pathname;
      if (routeAfter !== exitObservation.routeAfter) publishExitObservation({ routeAfter });
      if (context.isContextLost()) publishExitObservation({ contextLost: true });
      observeCanvasConnection();
      if (
        exitObservation.renderListsDisposed === true
        && exitObservation.contextLost === true
        && exitObservation.canvasDetached === true
      ) releaseObservation();
      return;
    }
    if (requestedPhase === null) return;
    const snapshot = captureLifecycleSnapshotV593(gl, scene);
    if (!snapshotQualifiesV593(requestedPhase, snapshot)) {
      stableKey = null;
      stableSince = 0;
      return;
    }
    const nextStableKey = snapshotStabilityKeyV593(snapshot);
    const now = performance.now();
    if (stableKey !== nextStableKey) {
      stableKey = nextStableKey;
      stableSince = now;
      return;
    }
    if (now - stableSince < SNAPSHOT_STABLE_MILLISECONDS_V593) return;
    const completedPhase = requestedPhase;
    requestedPhase = null;
    stableKey = null;
    stableSince = 0;
    snapshotCallback?.(completedPhase, snapshot);
  };
  const sampleTimer = window.setInterval(sample, SNAPSHOT_INTERVAL_MILLISECONDS_V593);
  sample();

  return Object.freeze({
    requestSnapshot(phase) {
      if (hostUnmounted || phase === requestedPhase) return;
      requestedPhase = phase;
      stableKey = null;
      stableSince = 0;
      sample();
    },
    updateCallbacks(nextSnapshotCallback, nextExitCallback) {
      snapshotCallback = nextSnapshotCallback;
      exitCallback = nextExitCallback;
    },
    observeHostUnmount() {
      if (hostUnmounted) return;
      hostUnmounted = true;
      requestedPhase = null;
      stableKey = null;
      stableSince = 0;
      sample();
    },
  });
}

function FinalArtExposureDirectorV593({ mode }: Readonly<{ mode: CelestialModeV590 }>) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    gl.toneMapping = mode === "science" ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = mode === "science" ? 1 : 1.08;
  }, [gl, mode]);
  return null;
}

function FinalArtRendererProbeV593() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const lastUpdate = useRef(-1);
  const frameRates = useRef<number[]>([]);

  useFrame(({ clock }, delta) => {
    if (delta > 0 && delta < 0.25) {
      frameRates.current.push(Math.min(240, 1 / delta));
      if (frameRates.current.length > 120) frameRates.current.splice(0, frameRates.current.length - 120);
    }
    if (clock.elapsedTime - lastUpdate.current < 0.25) return;
    lastUpdate.current = clock.elapsedTime;
    const root = document.querySelector<HTMLElement>("section[data-atlas-v593-shell]");
    if (!root) return;
    let candidateNodes = 0;
    let v593Materials = 0;
    scene.traverse((node) => {
      if (node.userData.atlasCandidate === "v593") candidateNodes += 1;
      if (!(node instanceof THREE.Mesh) && !(node instanceof THREE.Points)) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const material of materials) {
        if (material.userData.atlasV593SignatureMaterial === true) v593Materials += 1;
      }
    });
    root.dataset.atlasV593DrawCalls = String(gl.info.render.calls);
    root.dataset.atlasV593Triangles = String(gl.info.render.triangles);
    root.dataset.atlasV593Programs = String(gl.info.programs?.length ?? 0);
    root.dataset.atlasV593Textures = String(gl.info.memory.textures);
    root.dataset.atlasV593Geometries = String(gl.info.memory.geometries);
    root.dataset.atlasV593CandidateNodes = String(candidateNodes);
    root.dataset.atlasV593SignatureMaterialCount = String(v593Materials);
    root.dataset.atlasV593WebglOutputChanged = v593Materials > 0 ? "true" : "false";
    if (frameRates.current.length >= 30) {
      const sorted = [...frameRates.current].sort((left, right) => left - right);
      root.dataset.atlasV593FpsMedian = (sorted[Math.floor(sorted.length / 2)] ?? 0).toFixed(3);
      root.dataset.atlasV593FpsMinimum = (sorted[0] ?? 0).toFixed(3);
      root.dataset.atlasV593FpsP10 = (sorted[Math.floor(sorted.length * 0.1)] ?? 0).toFixed(3);
      root.dataset.atlasV593FpsSampleCount = String(sorted.length);
    }
  });
  return null;
}

function FinalArtCanvasHostV593({
  children,
  mode,
  deviceTier,
  onCanvasReady,
  lifecycleAudit,
  lifecycleAuditPhase,
  onLifecycleSnapshot,
  onLifecycleExitObservation,
}: Readonly<{
  children: ReactNode;
  mode: CelestialModeV590;
  deviceTier: CelestialDeviceTierV590;
  onCanvasReady?: () => void;
  lifecycleAudit?: "same-realm-v1";
  lifecycleAuditPhase?: FinalArtLifecycleCapturePhaseV593 | null;
  onLifecycleSnapshot?: (phase: FinalArtLifecycleCapturePhaseV593, snapshot: FinalArtLifecycleSnapshotV593) => void;
  onLifecycleExitObservation?: (observation: FinalArtLifecycleExitObservationV593) => void;
}>) {
  const auditController = useRef<LifecycleAuditControllerV593 | null>(null);

  useEffect(() => {
    auditController.current?.updateCallbacks(onLifecycleSnapshot, onLifecycleExitObservation);
    auditController.current?.requestSnapshot(lifecycleAuditPhase ?? null);
  }, [lifecycleAuditPhase, onLifecycleExitObservation, onLifecycleSnapshot]);

  useEffect(() => () => {
    auditController.current?.observeHostUnmount();
    auditController.current = null;
  }, []);

  return (
    <Canvas
      className="h-full w-full"
      style={{ display: "block" }}
      dpr={deviceTier === "desktop" ? [1, 1.5] : 1}
      camera={{
        fov: 42,
        near: 0.01,
        far: 1e9,
        position: [0, 0, 12],
      }}
      gl={{
        antialias: false,
        alpha: false,
        stencil: false,
        depth: true,
        logarithmicDepthBuffer: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl, camera, scene }) => {
        gl.setClearColor(new THREE.Color(0x000000), 1);
        gl.toneMapping = mode === "science" ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = mode === "science" ? 1 : 1.08;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.shadowMap.enabled = false;
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.near = 0.01;
          camera.far = 1e9;
          camera.updateProjectionMatrix();
        }
        if (lifecycleAudit === "same-realm-v1") {
          auditController.current = createLifecycleAuditControllerV593(
            gl,
            scene,
            onLifecycleSnapshot,
            onLifecycleExitObservation,
          );
          auditController.current.requestSnapshot(lifecycleAuditPhase ?? null);
        }
        onCanvasReady?.();
      }}
    >
      <FinalArtExposureDirectorV593 mode={mode} />
      <FinalArtRendererProbeV593 />
      {children}
    </Canvas>
  );
}

export default memo(FinalArtCanvasHostV593);
