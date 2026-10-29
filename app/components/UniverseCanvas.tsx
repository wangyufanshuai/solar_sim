"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { TRUE_VOID_TONE_MAPPING_EXPOSURE } from "../lib/trueVoid";
import { resolveAtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import UniverseScene, {
  normalizeAtlasCanvasSimulationProps,
  stabilizeAtlasCanvasSimulationGroups,
  type AtlasCanvasSimulationGroups,
  type UniverseCanvasSimulationProps,
} from "./UniverseScene";
import {
  ORBIT_ATLAS_CAMERA_FOV,
  ORBIT_ATLAS_CAMERA_POSITION,
} from "../lib/orbitAtlasPresentation";
import { createAtlasVisualDirectorV4 } from "../lib/atlasVisualDirectorV4";
import { setAtlasRenderExposureV274 } from "../lib/atlasRenderExposureV274";
import {
  installOptionalTextureRendererTeardownV594,
  registerRendererSharedGeometryBindingV594,
} from "../lib/useOptionalTexture";
import {
  POST_V594_LIFECYCLE_SAMPLE_INTERVAL_MILLISECONDS,
  POST_V594_LIFECYCLE_STABLE_MILLISECONDS,
  POST_V594_SAME_REALM_LIFECYCLE_QUERY,
  assignPostV594LifecycleObserver,
  createPostV594RendererSnapshot,
  getPostV594SameRealmLifecycleLedger,
  isPostV594SameRealmLifecycleAuditSearch,
  postV594LifecycleSnapshotStabilityKey,
  postV594MountedSnapshotIsActive,
  postV594SnapshotSatisfiesReleaseContract,
  readPostV594ResourceSnapshot,
  type PostV594LifecycleExitObservation,
  type PostV594LifecycleSnapshot,
} from "../lib/postV594SameRealmLifecycle";
import {
  PostV594CdpSoakHtmlSuppressionProvider,
  resolvePostV594CdpSoakAudit,
} from "../lib/v594CdpSoakSurface";
import { registerV594ReleasedHeapSemanticPrototypes } from "../lib/v594ReleasedHeapSemanticProbe";

export type { AtlasCanvasSimulationGroups, UniverseCanvasSimulationProps };

export type UniverseCanvasObservationProfileV587 = Readonly<{
  sceneMode: "kerr";
  mode: "science" | "cinematic";
  visualEnhance: boolean;
  qualityTier: "mobile-safe" | "balanced";
  onCanvasReady?: () => void;
}>;

export type UniverseCanvasLifecycleAuditPropsV594 = Readonly<{
  lifecycleAudit?: typeof POST_V594_SAME_REALM_LIFECYCLE_QUERY;
  onLifecycleSnapshot?: (
    phase: "mounted" | "detached-stable" | "exited",
    snapshot: PostV594LifecycleSnapshot,
  ) => void;
  onLifecycleExitObservation?: (observation: PostV594LifecycleExitObservation) => void;
}>;

type UniverseCanvasProps = (
  | { simulation: UniverseCanvasSimulationProps; sceneOverride?: never; observationProfile?: never }
  | { simulation?: never; sceneOverride: ReactNode; observationProfile: UniverseCanvasObservationProfileV587 }
) & UniverseCanvasLifecycleAuditPropsV594;

type UniverseCanvasLifecycleAuditControllerV594 = Readonly<{
  updateCallbacks: (
    onSnapshot: UniverseCanvasLifecycleAuditPropsV594["onLifecycleSnapshot"],
    onExitObservation: UniverseCanvasLifecycleAuditPropsV594["onLifecycleExitObservation"],
  ) => void;
  scheduleHostUnmountObservation: () => void;
}>;

const POST_V594_CANVAS_IDENTITY = "atlas-main-single-canvas-v594" as const;
const POST_V595_LIFECYCLE_CANDIDATE = "v595" as const;

function isCurrentV595LifecycleStellarCandidate(node: THREE.Object3D): boolean {
  // `atlasStellarRendererV594` names the inherited renderer contract; the
  // candidate marker itself is owned by the current v595 identity.
  return node.userData.atlasCandidate === POST_V595_LIFECYCLE_CANDIDATE
    && node.userData.atlasStellarRendererV594 === true;
}

function captureUniverseCanvasLifecycleSnapshotV594(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  hostUnmounted: boolean,
  teardownObservation: Readonly<{
    forceContextLossCalled: true | null;
    contextLost: true | null;
  }>,
): PostV594LifecycleSnapshot {
  const selector = `canvas[data-atlas-v594-canvas-identity="${POST_V594_CANVAS_IDENTITY}"]`;
  const canvases = Array.from(document.querySelectorAll<HTMLCanvasElement>(selector));
  const canvasCount = canvases.length;
  const connectedCanvasCount = canvases.filter((candidate) => candidate.isConnected).length;
  let objects = 0;
  let candidateNodes = 0;
  const stellarHeroIds = new Set<string>();
  const stellarArchetypes = new Set<string>();
  const stellarContractSha256s = new Set<string>();
  scene.traverse((node) => {
    if (node !== scene) objects += 1;
    if (!isCurrentV595LifecycleStellarCandidate(node)) return;
    candidateNodes += 1;
    if (typeof node.userData.atlasStellarHeroId === "string") {
      stellarHeroIds.add(node.userData.atlasStellarHeroId);
    }
    if (typeof node.userData.atlasStellarArchetype === "string") {
      stellarArchetypes.add(node.userData.atlasStellarArchetype);
    }
    if (typeof node.userData.atlasStellarRenderContractSha256 === "string") {
      stellarContractSha256s.add(node.userData.atlasStellarRenderContractSha256);
    }
  });
  let contextLost: boolean | null = null;
  try {
    contextLost = gl.getContext().isContextLost();
  } catch {
    // An unavailable context state is unknown and cannot become a zero claim.
  }
  const rendererActive = hostUnmounted
    ? teardownObservation.forceContextLossCalled === true && contextLost === true
      ? 0
      : null
    : contextLost === false
      ? 1
      : null;
  const rendererCountersObserved = !hostUnmounted && contextLost === false;
  const rendererResourceCountsSource = rendererCountersObserved
    ? "three.webglrenderer.info" as const
    : hostUnmounted
      && teardownObservation.forceContextLossCalled === true
      && contextLost === true
      ? "unavailable-context-lost-stale-info" as const
      : null;
  return createPostV594RendererSnapshot({
    captureKind: hostUnmounted ? "unmounted-renderer" : "mounted-renderer",
    canvasCount,
    connectedCanvasCount,
    rendererActive,
    rendererTextures: rendererCountersObserved ? gl.info.memory?.textures : null,
    rendererGeometries: rendererCountersObserved ? gl.info.memory?.geometries : null,
    rendererPrograms: rendererCountersObserved && Array.isArray(gl.info.programs)
      ? gl.info.programs.length
      : null,
    rendererResourceCountsSource,
    registry: readPostV594ResourceSnapshot(),
    sceneActive: objects > 0 ? 1 : 0,
    sceneObjects: objects,
    candidateNodes,
    stellarHeroIds: [...stellarHeroIds],
    stellarArchetypes: [...stellarArchetypes],
    stellarContractSha256s: [...stellarContractSha256s],
  });
}

type UniverseCanvasRendererBoundObserverV594 = Readonly<{
  scheduleHostUnmountObservation: () => void;
}>;

function createUniverseCanvasRendererBoundObserverV594({
  gl,
  scene,
  observerAssignment,
  onMountedSnapshot,
  onExitObservation,
  onRendererReferencesReleased,
}: Readonly<{
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  observerAssignment: number;
  onMountedSnapshot: (snapshot: PostV594LifecycleSnapshot) => void;
  onExitObservation: (
    observation: PostV594LifecycleExitObservation,
  ) => void;
  onRendererReferencesReleased: (snapshot: PostV594LifecycleSnapshot) => void;
}>): UniverseCanvasRendererBoundObserverV594 {
  const canvas = gl.domElement;
  const context = gl.getContext();
  const renderLists = gl.renderLists;
  const originalRenderListsDispose = renderLists.dispose;
  const originalForceContextLoss = gl.forceContextLoss;
  let hostUnmounted = false;
  let rendererReferencesReleased = false;
  let mountedPublished = false;
  let stableKind: "mounted" | "detached-stable" | null = null;
  let stableKey: string | null = null;
  let stableSince = 0;
  const exitObservation: {
    renderListsDisposed: true | null;
    forceContextLossCalled: true | null;
    contextLost: true | null;
    contextLossSource: "webglcontextlost-event" | "isContextLost" | null;
    canvasDetached: true | null;
    routeAfter: string | null;
  } = {
    renderListsDisposed: null,
    forceContextLossCalled: null,
    contextLost: null,
    contextLossSource: null,
    canvasDetached: null,
    routeAfter: null,
  };

  const publishExitObservation = (
    patch: Omit<
      PostV594LifecycleExitObservation,
      "observerAssignment" | "resourceReferencesReleased" | "observerReleased"
    >,
  ) => {
    let changed = false;
    for (const [key, value] of Object.entries(patch)) {
      const observationKey = key as keyof typeof exitObservation;
      if (exitObservation[observationKey] === value) continue;
      Object.assign(exitObservation, { [observationKey]: value });
      changed = true;
    }
    if (changed) {
      onExitObservation(Object.freeze({ observerAssignment, ...patch }));
    }
  };

  const teardownRequested = () => {
    const phase = getPostV594SameRealmLifecycleLedger()?.phase;
    return hostUnmounted
      || phase === "detaching"
      || phase === "resetting"
      || phase === "exiting";
  };

  const wrappedRenderListsDispose = function renderListsDisposeAuditV594() {
    const result = originalRenderListsDispose.call(renderLists);
    if (teardownRequested()) publishExitObservation({ renderListsDisposed: true });
    return result;
  };
  renderLists.dispose = wrappedRenderListsDispose;

  const wrappedForceContextLoss = function forceContextLossAuditV594() {
    const result = originalForceContextLoss.call(gl);
    if (teardownRequested()) publishExitObservation({ forceContextLossCalled: true });
    return result;
  };
  gl.forceContextLoss = wrappedForceContextLoss;

  const onContextLost = () => {
    if (teardownRequested()) {
      publishExitObservation({
        contextLost: true,
        contextLossSource: "webglcontextlost-event",
      });
    }
  };
  canvas.addEventListener("webglcontextlost", onContextLost, { capture: true });

  const observeCanvasConnection = () => {
    if (teardownRequested() && !canvas.isConnected) {
      publishExitObservation({ canvasDetached: true });
    }
  };
  const canvasObserver = new MutationObserver(observeCanvasConnection);
  canvasObserver.observe(document.documentElement, { childList: true, subtree: true });

  const releaseRendererReferences = (snapshot: PostV594LifecycleSnapshot) => {
    if (rendererReferencesReleased) return;
    rendererReferencesReleased = true;
    window.clearInterval(sampleTimer);
    canvasObserver.disconnect();
    canvas.removeEventListener("webglcontextlost", onContextLost, { capture: true });
    if (renderLists.dispose === wrappedRenderListsDispose) {
      renderLists.dispose = originalRenderListsDispose;
    }
    if (gl.forceContextLoss === wrappedForceContextLoss) {
      gl.forceContextLoss = originalForceContextLoss;
    }
    onRendererReferencesReleased(snapshot);
  };

  const resetStability = (kind: "mounted" | "detached-stable") => {
    stableKind = kind;
    stableKey = null;
    stableSince = 0;
  };

  const publishWhenStable = (
    kind: "mounted" | "detached-stable",
    snapshot: PostV594LifecycleSnapshot,
    qualifies: boolean,
  ) => {
    if (!qualifies) {
      resetStability(kind);
      return;
    }
    const nextKey = postV594LifecycleSnapshotStabilityKey(snapshot);
    const now = performance.now();
    if (stableKind !== kind || stableKey !== nextKey) {
      stableKind = kind;
      stableKey = nextKey;
      stableSince = now;
      return;
    }
    if (now - stableSince < POST_V594_LIFECYCLE_STABLE_MILLISECONDS) return;
    stableKind = null;
    stableKey = null;
    stableSince = 0;
    if (kind === "mounted") {
      mountedPublished = true;
      onMountedSnapshot(snapshot);
      return;
    }
    releaseRendererReferences(snapshot);
  };

  const sample = () => {
    if (rendererReferencesReleased) return;
    if (!hostUnmounted) {
      if (!mountedPublished) {
        const snapshot = captureUniverseCanvasLifecycleSnapshotV594(
          gl,
          scene,
          false,
          exitObservation,
        );
        publishWhenStable("mounted", snapshot, postV594MountedSnapshotIsActive(snapshot));
      }
      return;
    }

    const routeAfter = window.location.pathname;
    if (routeAfter !== exitObservation.routeAfter) publishExitObservation({ routeAfter });
    try {
      if (context.isContextLost()) {
        publishExitObservation({ contextLost: true, contextLossSource: "isContextLost" });
      }
    } catch {
      // Unknown remains null and therefore cannot satisfy the cleanup contract.
    }
    observeCanvasConnection();

    const cleanupObserved = exitObservation.renderListsDisposed === true
      && exitObservation.forceContextLossCalled === true
      && exitObservation.contextLost === true
      && exitObservation.canvasDetached === true;
    if (cleanupObserved) {
      const snapshot = captureUniverseCanvasLifecycleSnapshotV594(
        gl,
        scene,
        true,
        exitObservation,
      );
      publishWhenStable(
        "detached-stable",
        snapshot,
        postV594SnapshotSatisfiesReleaseContract(snapshot),
      );
    }
  };
  const sampleTimer = window.setInterval(
    sample,
    POST_V594_LIFECYCLE_SAMPLE_INTERVAL_MILLISECONDS,
  );
  sample();

  return Object.freeze({
    scheduleHostUnmountObservation() {
      if (hostUnmounted || rendererReferencesReleased) return;
      window.setTimeout(() => {
        if (canvas.isConnected || hostUnmounted || rendererReferencesReleased) return;
        hostUnmounted = true;
        resetStability("detached-stable");
        sample();
      }, 0);
    },
  });
}

function createUniverseCanvasLifecycleAuditControllerV594(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  onSnapshot: UniverseCanvasLifecycleAuditPropsV594["onLifecycleSnapshot"],
  onExitObservation: UniverseCanvasLifecycleAuditPropsV594["onLifecycleExitObservation"],
): UniverseCanvasLifecycleAuditControllerV594 {
  const observerAssignment = assignPostV594LifecycleObserver();
  const initialPathname = window.location.pathname;
  let snapshotCallback = onSnapshot;
  let exitCallback = onExitObservation;
  let detachedSnapshot: PostV594LifecycleSnapshot | null = null;
  let terminalTimer: number | null = null;
  let terminalReleased = false;
  let rendererObserver: UniverseCanvasRendererBoundObserverV594 | null = null;

  const publishExitObservation = (
    patch: Omit<PostV594LifecycleExitObservation, "observerAssignment">,
  ) => {
    exitCallback?.(Object.freeze({ observerAssignment, ...patch }));
  };

  const releaseTerminalObserver = () => {
    if (terminalReleased) return;
    terminalReleased = true;
    if (terminalTimer !== null) {
      window.clearInterval(terminalTimer);
      terminalTimer = null;
    }
    publishExitObservation({ observerReleased: true });
    detachedSnapshot = null;
    snapshotCallback = undefined;
    exitCallback = undefined;
  };

  const sampleTerminalState = () => {
    if (terminalReleased || detachedSnapshot === null) return;
    const lifecyclePhase = getPostV594SameRealmLifecycleLedger()?.phase;
    if (lifecyclePhase === "resetting") {
      releaseTerminalObserver();
      return;
    }
    const routeAfter = window.location.pathname;
    if (routeAfter !== "/downloads" || routeAfter === initialPathname) return;
    publishExitObservation({ routeAfter });
    snapshotCallback?.("exited", detachedSnapshot);
    releaseTerminalObserver();
  };

  const handleRendererReferencesReleased = (
    snapshot: PostV594LifecycleSnapshot,
  ) => {
    if (rendererObserver === null || detachedSnapshot !== null) return;
    detachedSnapshot = snapshot;
    // This is the ownership cut: no timer, listener, wrapper, returned method,
    // or coordinator reference may retain the renderer-bound closure beyond it.
    rendererObserver = null;
    publishExitObservation({ resourceReferencesReleased: true });
    queueMicrotask(() => {
      if (terminalReleased || detachedSnapshot !== snapshot) return;
      snapshotCallback?.("detached-stable", snapshot);
      terminalTimer = window.setInterval(
        sampleTerminalState,
        POST_V594_LIFECYCLE_SAMPLE_INTERVAL_MILLISECONDS,
      );
      sampleTerminalState();
    });
  };

  rendererObserver = createUniverseCanvasRendererBoundObserverV594({
    gl,
    scene,
    observerAssignment,
    onMountedSnapshot(snapshot) {
      snapshotCallback?.("mounted", snapshot);
    },
    onExitObservation(observation) {
      exitCallback?.(observation);
    },
    onRendererReferencesReleased: handleRendererReferencesReleased,
  });

  return Object.freeze({
    updateCallbacks(nextSnapshotCallback, nextExitCallback) {
      if (terminalReleased) return;
      snapshotCallback = nextSnapshotCallback;
      exitCallback = nextExitCallback;
    },
    scheduleHostUnmountObservation() {
      rendererObserver?.scheduleHostUnmountObservation();
    },
  });
}

function UniverseCanvas({
  simulation,
  sceneOverride,
  observationProfile,
  lifecycleAudit,
  onLifecycleSnapshot,
  onLifecycleExitObservation,
}: UniverseCanvasProps) {
  const pointerDownRef = useRef<{ x: number; y: number; t: number } | null>(
    null
  );
  const draggedRef = useRef(false);
  const wheelUntilRef = useRef(0);
  const simulationGroupsRef = useRef<AtlasCanvasSimulationGroups | null>(null);
  const lifecycleAuditControllerRef = useRef<UniverseCanvasLifecycleAuditControllerV594 | null>(null);
  const simulationGroups = useMemo(
    () => {
      if (!simulation) return null;
      const next = stabilizeAtlasCanvasSimulationGroups(
        simulationGroupsRef.current,
        normalizeAtlasCanvasSimulationProps(simulation),
      );
      simulationGroupsRef.current = next;
      return next;
    },
    [simulation],
  );
  const visualEnhance = simulation?.visualEnhance ?? observationProfile?.visualEnhance ?? false;
  const presentationMode = simulation?.presentationMode ?? "orbit-atlas";
  const sceneMode = simulation?.sceneMode ?? observationProfile?.sceneMode ?? "kerr";
  // The observation scene owns its own renderer profile. Keep the legacy
  // simulation quality type separate so the discriminated union never lets a
  // v587-only value leak into the frozen Atlas scene director.
  const qualityTier = simulation?.runtimeQualityTier ?? "balanced";

  useEffect(() => {
    lifecycleAuditControllerRef.current?.updateCallbacks(
      onLifecycleSnapshot,
      onLifecycleExitObservation,
    );
  }, [onLifecycleExitObservation, onLifecycleSnapshot]);

  useEffect(() => () => {
    // Cut the React-fiber -> lifecycle-controller -> renderer closure edge at
    // the component boundary. The controller keeps the same-realm observer
    // alive only long enough to observe the browser-owned detach contract;
    // retaining it in the ref after unmount would also retain gl.domElement
    // through the controller's lexical environment.
    const controller = lifecycleAuditControllerRef.current;
    lifecycleAuditControllerRef.current = null;
    controller?.scheduleHostUnmountObservation();
  }, []);

  return (
    <Canvas
      className="h-full w-full"
      style={{ display: "block" }}
      dpr={visualEnhance ? [1, 1.5] : 1}
      onPointerDown={(e) => {
        pointerDownRef.current = {
          x: e.nativeEvent.clientX,
          y: e.nativeEvent.clientY,
          t: performance.now(),
        };
        draggedRef.current = false;
      }}
      onPointerMove={(e) => {
        const down = pointerDownRef.current;
        if (!down) return;
        const dx = e.nativeEvent.clientX - down.x;
        const dy = e.nativeEvent.clientY - down.y;
        if (dx * dx + dy * dy > 36) draggedRef.current = true;
      }}
      onWheel={() => {
        wheelUntilRef.current = performance.now() + 180;
      }}
      onPointerMissed={() => {
        const now = performance.now();
        const down = pointerDownRef.current;
        if (now < wheelUntilRef.current || draggedRef.current) return;
        if (down && now - down.t > 700) return;
        simulation?.onCanvasPointerMissed?.();
      }}
      camera={{
        fov: observationProfile ? 42 : presentationMode === "orbit-atlas" ? ORBIT_ATLAS_CAMERA_FOV : 60,
        near: 0.01,
        far: 1e9,
        position:
          observationProfile
            ? [0, 0, 12]
            : presentationMode === "orbit-atlas"
            ? ORBIT_ATLAS_CAMERA_POSITION.toArray()
            : [0, 460, 300],
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
        installOptionalTextureRendererTeardownV594(gl);
        const black = new THREE.Color(0x000000);
        gl.setClearColor(black, 1);
        gl.toneMapping = observationProfile?.mode === "science"
          ? THREE.NoToneMapping
          : THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = observationProfile?.mode === "science"
          ? 1
          : TRUE_VOID_TONE_MAPPING_EXPOSURE;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.shadowMap.enabled = false;
        if (camera && "isPerspectiveCamera" in camera && camera.isPerspectiveCamera) {
          camera.near = 0.01;
          camera.far = 1e9;
          camera.updateProjectionMatrix();
        }
        gl.domElement.dataset.atlasCanvasIdentity = "atlas-main-single-canvas-v161";
        if (
          lifecycleAudit === POST_V594_SAME_REALM_LIFECYCLE_QUERY
          && isPostV594SameRealmLifecycleAuditSearch(window.location.search)
        ) {
          gl.domElement.dataset.atlasV594CanvasIdentity = POST_V594_CANVAS_IDENTITY;
          lifecycleAuditControllerRef.current = createUniverseCanvasLifecycleAuditControllerV594(
            gl,
            scene,
            onLifecycleSnapshot,
            onLifecycleExitObservation,
          );
        }
        simulation?.onCanvasReady?.();
        observationProfile?.onCanvasReady?.();
      }}
    >
      <PostV594CdpSoakHtmlSuppressionProvider
        enabled={lifecycleAudit === POST_V594_SAME_REALM_LIFECYCLE_QUERY
          && resolvePostV594CdpSoakAudit()}
      >
        {observationProfile ? (
          <ObservationExposureDirectorV587 mode={observationProfile.mode} />
        ) : (
          <RenderExposureDirector sceneMode={sceneMode} qualityTier={qualityTier} />
        )}
        <RendererSharedGeometryBindingV594 />
        {sceneOverride ?? (simulationGroups ? <UniverseScene simulationGroups={simulationGroups} /> : null)}
        {lifecycleAudit ? <V594ReleasedHeapSemanticPrototypeProbe /> : null}
      </PostV594CdpSoakHtmlSuppressionProvider>
    </Canvas>
  );
}

function V594ReleasedHeapSemanticPrototypeProbe() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const registeredRef = useRef(false);
  useFrame(() => {
    if (registeredRef.current) return;
    registerV594ReleasedHeapSemanticPrototypes(gl, scene);
    registeredRef.current = true;
  });
  return null;
}

function RendererSharedGeometryBindingV594() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const registeredRef = useRef(false);
  useFrame(() => {
    if (registeredRef.current) return;
    let registered = false;
    scene.traverse((object) => {
      if (!(object instanceof THREE.Sprite)) return;
      registerRendererSharedGeometryBindingV594(gl, object.geometry);
      registered = true;
    });
    registeredRef.current = registered;
  });
  return null;
}

function ObservationExposureDirectorV587({ mode }: { mode: "science" | "cinematic" }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    gl.toneMapping = mode === "science" ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = mode === "science" ? 1 : 1.12;
  }, [gl, mode]);
  return null;
}

function RenderExposureDirector({ sceneMode, qualityTier }: { sceneMode: UniverseCanvasSimulationProps["sceneMode"]; qualityTier: NonNullable<UniverseCanvasSimulationProps["runtimeQualityTier"]> }) {
  const gl = useThree((state) => state.gl);
  const visualProfile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  useEffect(() => {
    const profile = createAtlasVisualDirectorV4(sceneMode, qualityTier);
    const visual = resolveAtlasVisualProfileV299(visualProfile);
    const exposure = TRUE_VOID_TONE_MAPPING_EXPOSURE * profile.exposure * visual.exposureMultiplier[sceneMode] * visual.groups.sky.backgroundExposure;
    setAtlasRenderExposureV274(exposure);
    gl.toneMappingExposure = exposure;
  }, [gl, qualityTier, sceneMode, visualProfile]);
  return null;
}

export function shallowEqualSimulationProps(
  previous: UniverseCanvasSimulationProps,
  next: UniverseCanvasSimulationProps,
): boolean {
  if (previous === next) return true;
  const keys = Object.keys(previous) as (keyof UniverseCanvasSimulationProps)[];
  if (keys.length !== Object.keys(next).length) return false;
  return keys.every((key) => Object.is(previous[key], next[key]));
}

export default memo(
  UniverseCanvas,
  (previous, next) => {
    if (previous.simulation && next.simulation) {
      return shallowEqualSimulationProps(previous.simulation, next.simulation)
        && previous.lifecycleAudit === next.lifecycleAudit
        && previous.onLifecycleSnapshot === next.onLifecycleSnapshot
        && previous.onLifecycleExitObservation === next.onLifecycleExitObservation;
    }
    return previous.sceneOverride === next.sceneOverride
      && previous.observationProfile?.mode === next.observationProfile?.mode
      && previous.observationProfile?.qualityTier === next.observationProfile?.qualityTier
      && previous.observationProfile?.visualEnhance === next.observationProfile?.visualEnhance
      && previous.lifecycleAudit === next.lifecycleAudit
      && previous.onLifecycleSnapshot === next.onLifecycleSnapshot
      && previous.onLifecycleExitObservation === next.onLifecycleExitObservation;
  },
);
