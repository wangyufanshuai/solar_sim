"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { getAtlasResourceSnapshot } from "../lib/atlasResourceLifecycle";
import { getOptionalTextureRendererCacheSnapshotV594 } from "../lib/useOptionalTexture";
import {
  V594_EXACT_AB_CANVAS_IDENTITY,
  V594_EXACT_AB_SETTLE_POLICY,
  canonicalShaV594Exact,
  createV594ExactAbConsumerReceipt,
  createV594ExactAbSoakObservability,
  exactCandidateForLaneV594,
  type V594ExactAbCameraState,
  type V594ExactAbConsumerReceipt,
  type V594ExactAbRuntimeRequest,
  type V594ExactAbSoakSnapshot,
} from "../lib/v594ExactAbContract";

type ExactCandidateObservation = Readonly<{
  nodeIds: readonly string[];
  sourceBindingSha256: string;
  anchor: THREE.Vector3;
}>;

type ExactConsumptionState = Readonly<{
  captureRequestId: string;
  phase: "requested" | "consumed" | "published";
  requestedAtFrameSequence: number;
  requestedAtMonotonicMs: number;
  consumedAtFrameSequence: number | null;
  consumedAtMonotonicMs: number | null;
  observation: ExactCandidateObservation | null;
  cameraState: V594ExactAbCameraState | null;
  settleFingerprintSha256: string | null;
  settleStartedAtFrameSequence: number | null;
  settleStartedAtMonotonicMs: number | null;
  settleFrameSampleCount: number;
}>;

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function observeExactCandidate(
  scene: THREE.Scene,
  request: V594ExactAbRuntimeRequest,
): ExactCandidateObservation | null {
  const candidate = exactCandidateForLaneV594(request.frame.lane);
  const nodes: THREE.Object3D[] = [];
  const nodeIds = new Set<string>();
  const sourceBindings = new Set<string>();
  scene.traverse((node) => {
    const data = node.userData;
    if (
      data.atlasExactAbRuntime !== true
      || data.atlasExactAbCaptureRequestId !== request.captureRequestId
      || data.atlasExactAbCandidate !== candidate
      || data.atlasExactAbTargetId !== request.frame.targetId
      || data.atlasExactAbArchetype !== request.frame.archetype
      || data.atlasExactAbMode !== request.frame.mode
      || typeof data.atlasExactAbNodeId !== "string"
      || !data.atlasExactAbNodeId
      || typeof data.atlasExactAbSourceBindingSha256 !== "string"
      || !/^[0-9a-f]{64}$/.test(data.atlasExactAbSourceBindingSha256)
      || data.atlasExactAbPresentationAuthority !== "none"
      || data.atlasExactAbRelativityAuthority !== "shadow-only"
      || data.atlasExactAbDefaultKernel !== "legacy-eih-1pn"
      || data.atlasExactAbScientificPayloadWriteback !== false
    ) return;
    if (nodeIds.has(data.atlasExactAbNodeId)) return;
    nodes.push(node);
    nodeIds.add(data.atlasExactAbNodeId);
    sourceBindings.add(data.atlasExactAbSourceBindingSha256);
  });
  if (nodes.length === 0 || sourceBindings.size !== 1) return null;
  const root = nodes.find((node) => String(node.userData.atlasExactAbNodeId).endsWith(":root"));
  if (!root) return null;
  return Object.freeze({
    nodeIds: Object.freeze([...nodeIds].sort()),
    sourceBindingSha256: [...sourceBindings][0]!,
    anchor: root.getWorldPosition(new THREE.Vector3()),
  });
}

function exactCameraPosition(
  request: V594ExactAbRuntimeRequest,
  anchor: THREE.Vector3,
): THREE.Vector3 {
  if (request.frame.archetype === "relativity-workbench") return new THREE.Vector3(0, 0, 28);
  const radial = anchor.clone();
  if (radial.lengthSq() < 1e-12) radial.set(0, 0, 1);
  return anchor.clone().add(radial.normalize().multiplyScalar(-920));
}

function applyExactCamera(
  camera: THREE.Camera,
  controls: OrbitControlsImpl,
  request: V594ExactAbRuntimeRequest,
  anchor: THREE.Vector3,
): V594ExactAbCameraState | null {
  if (!(camera instanceof THREE.PerspectiveCamera)) return null;
  controls.enabled = false;
  controls.enableDamping = false;
  controls.target.copy(anchor);
  camera.position.copy(exactCameraPosition(request, anchor));
  camera.fov = 42;
  camera.near = 0.01;
  camera.far = 1e9;
  camera.lookAt(anchor);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  controls.update();
  return Object.freeze({
    preset: request.frame.cameraPreset,
    position: Object.freeze([camera.position.x, camera.position.y, camera.position.z] as const),
    target: Object.freeze([controls.target.x, controls.target.y, controls.target.z] as const),
    quaternion: Object.freeze([
      camera.quaternion.x,
      camera.quaternion.y,
      camera.quaternion.z,
      camera.quaternion.w,
    ] as const),
    projection: Object.freeze({ fov: camera.fov, near: camera.near, far: camera.far }),
  });
}

function sameCameraState(
  camera: THREE.Camera,
  controls: OrbitControlsImpl,
  expected: V594ExactAbCameraState,
): boolean {
  if (!(camera instanceof THREE.PerspectiveCamera)) return false;
  const actual = [
    ...camera.position.toArray(),
    ...controls.target.toArray(),
    ...camera.quaternion.toArray(),
    camera.fov,
    camera.near,
    camera.far,
  ];
  const wanted = [
    ...expected.position,
    ...expected.target,
    ...expected.quaternion,
    expected.projection.fov,
    expected.projection.near,
    expected.projection.far,
  ];
  return actual.length === wanted.length
    && actual.every((value, index) => finiteNumber(value) && Math.abs(value - wanted[index]!) <= 1e-9);
}

function captureMountedSoakSnapshot(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  observation: ExactCandidateObservation,
  request: V594ExactAbRuntimeRequest,
): V594ExactAbSoakSnapshot {
  const canvasSelector = `canvas[data-atlas-v594-exact-ab-canvas-identity="${V594_EXACT_AB_CANVAS_IDENTITY}"]`;
  const canvases = Array.from(document.querySelectorAll<HTMLCanvasElement>(canvasSelector));
  const registry = getAtlasResourceSnapshot();
  let objects = 0;
  const stellarHeroIds = new Set<string>();
  const stellarArchetypes = new Set<string>();
  const stellarContractSha256s = new Set<string>();
  scene.traverse((node) => {
    if (node !== scene) objects += 1;
    if (node.userData.atlasExactAbCaptureRequestId !== request.captureRequestId) return;
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
  let active: 0 | 1 | null = null;
  try {
    active = gl.getContext().isContextLost() ? 0 : 1;
  } catch {
    // An unavailable WebGL state remains unknown.
  }
  return Object.freeze({
    captureKind: "mounted-renderer" as const,
    canvas: Object.freeze({
      count: canvases.length,
      connected: canvases.filter((canvas) => canvas.isConnected).length,
    }),
    renderer: Object.freeze({
      active,
      textures: Number.isInteger(gl.info.memory?.textures) ? gl.info.memory.textures : null,
      geometries: Number.isInteger(gl.info.memory?.geometries) ? gl.info.memory.geometries : null,
      programs: Array.isArray(gl.info.programs) ? gl.info.programs.length : null,
      resourceCountersSource: "three.webglrenderer.info" as const,
      renderTargets: registry.gpuRenderTargets,
    }),
    registry: Object.freeze({
      total: registry.total,
      workers: registry.workers,
      renderTargets: registry.gpuRenderTargets,
      textures: registry.textures,
      subscriptions: registry.subscriptions,
      typedArrays: registry.typedArrayCaches,
      estimatedBytes: registry.estimatedBytes,
    }),
    scene: Object.freeze({
      active: objects > 0 ? 1 as const : 0 as const,
      objects,
      candidateNodes: observation.nodeIds.length,
      stellarHeroIds: Object.freeze([...stellarHeroIds].sort()),
      stellarArchetypes: Object.freeze([...stellarArchetypes].sort()),
      stellarContractSha256s: Object.freeze([...stellarContractSha256s].sort()),
    }),
    workers: registry.workers,
  });
}

export default function V594ExactAbR3fConsumer({
  request,
  controlsRef,
  onReceipt,
}: Readonly<{
  request: V594ExactAbRuntimeRequest;
  controlsRef: MutableRefObject<OrbitControlsImpl | null>;
  onReceipt: (receipt: V594ExactAbConsumerReceipt) => void;
}>) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const frameSequenceRef = useRef(0);
  const stateRef = useRef<ExactConsumptionState | null>(null);

  useEffect(() => {
    const controls = controlsRef.current;
    gl.domElement.dataset.atlasV594ExactAbCanvasIdentity = V594_EXACT_AB_CANVAS_IDENTITY;
    return () => {
      delete gl.domElement.dataset.atlasV594ExactAbCanvasIdentity;
      if (controls) {
        controls.enabled = true;
        controls.enableDamping = true;
      }
    };
  }, [controlsRef, gl]);

  useFrame(() => {
    const sequence = ++frameSequenceRef.current;
    const now = performance.now();
    let consumption = stateRef.current;
    if (!consumption || consumption.captureRequestId !== request.captureRequestId) {
      stateRef.current = Object.freeze({
        captureRequestId: request.captureRequestId,
        phase: "requested",
        requestedAtFrameSequence: sequence,
        requestedAtMonotonicMs: now,
        consumedAtFrameSequence: null,
        consumedAtMonotonicMs: null,
        observation: null,
        cameraState: null,
        settleFingerprintSha256: null,
        settleStartedAtFrameSequence: null,
        settleStartedAtMonotonicMs: null,
        settleFrameSampleCount: 0,
      });
      return;
    }
    if (consumption.phase === "published") return;
    const controls = controlsRef.current;
    if (!controls) return;
    const observation = observeExactCandidate(scene, request);
    if (!observation) return;
    if (consumption.phase === "requested") {
      const cameraState = applyExactCamera(camera, controls, request, observation.anchor);
      if (!cameraState || sequence <= consumption.requestedAtFrameSequence || now <= consumption.requestedAtMonotonicMs) return;
      stateRef.current = Object.freeze({
        ...consumption,
        phase: "consumed",
        consumedAtFrameSequence: sequence,
        consumedAtMonotonicMs: now,
        observation,
        cameraState,
        settleFingerprintSha256: null,
        settleStartedAtFrameSequence: null,
        settleStartedAtMonotonicMs: null,
        settleFrameSampleCount: 0,
      });
      return;
    }
    consumption = stateRef.current;
    if (
      !consumption
      || consumption.phase !== "consumed"
      || consumption.consumedAtFrameSequence === null
      || consumption.consumedAtMonotonicMs === null
      || !consumption.observation
      || !consumption.cameraState
      || sequence <= consumption.consumedAtFrameSequence
      || now <= consumption.consumedAtMonotonicMs
      || JSON.stringify(observation.nodeIds) !== JSON.stringify(consumption.observation.nodeIds)
      || observation.sourceBindingSha256 !== consumption.observation.sourceBindingSha256
      || !sameCameraState(camera, controls, consumption.cameraState)
    ) return;
    const snapshot = captureMountedSoakSnapshot(gl, scene, observation, request);
    const optionalTextureCache = getOptionalTextureRendererCacheSnapshotV594(gl);
    if (
      optionalTextureCache.status === "disposed"
      || optionalTextureCache.pending !== V594_EXACT_AB_SETTLE_POLICY.optionalTexturePendingRequired
    ) {
      if (consumption.settleFingerprintSha256 !== null) {
        stateRef.current = Object.freeze({
          ...consumption,
          settleFingerprintSha256: null,
          settleStartedAtFrameSequence: null,
          settleStartedAtMonotonicMs: null,
          settleFrameSampleCount: 0,
        });
      }
      return;
    }
    const censusFingerprintSha256 = canonicalShaV594Exact(snapshot);
    if (
      consumption.settleFingerprintSha256 !== censusFingerprintSha256
      || consumption.settleStartedAtFrameSequence === null
      || consumption.settleStartedAtMonotonicMs === null
    ) {
      stateRef.current = Object.freeze({
        ...consumption,
        settleFingerprintSha256: censusFingerprintSha256,
        settleStartedAtFrameSequence: sequence,
        settleStartedAtMonotonicMs: now,
        settleFrameSampleCount: 1,
      });
      return;
    }
    const stableFrameSampleCount = consumption.settleFrameSampleCount + 1;
    const stableForMilliseconds = now - consumption.settleStartedAtMonotonicMs;
    if (
      stableForMilliseconds < V594_EXACT_AB_SETTLE_POLICY.minimumStableMilliseconds
      || stableFrameSampleCount < V594_EXACT_AB_SETTLE_POLICY.minimumStableFrameSamples
    ) {
      stateRef.current = Object.freeze({
        ...consumption,
        settleFrameSampleCount: stableFrameSampleCount,
      });
      return;
    }
    const rendererIdentity = Object.freeze({
      canvasIdentity: V594_EXACT_AB_CANVAS_IDENTITY,
      renderer: "WebGLRenderer" as const,
      context: gl.capabilities.isWebGL2 ? "webgl2" as const : "webgl" as const,
    });
    const soakObservability = createV594ExactAbSoakObservability({
      request,
      rendererIdentity,
      snapshot,
      settle: Object.freeze({
        stableForMilliseconds,
        stableFrameSampleCount,
        censusFingerprintSha256,
        optionalTextureCache,
      }),
    });
    const receipt = createV594ExactAbConsumerReceipt({
      request,
      cameraState: consumption.cameraState,
      candidateNodeIds: observation.nodeIds,
      sourceBindingSha256: observation.sourceBindingSha256,
      soakObservability,
      frameClock: Object.freeze({
        requestedAtFrameSequence: consumption.requestedAtFrameSequence,
        consumedAtFrameSequence: consumption.consumedAtFrameSequence,
        settledAtFrameSequence: sequence,
        requestedAtMonotonicMs: consumption.requestedAtMonotonicMs,
        consumedAtMonotonicMs: consumption.consumedAtMonotonicMs,
        settledAtMonotonicMs: now,
      }),
    });
    stateRef.current = Object.freeze({ ...consumption, phase: "published" });
    queueMicrotask(() => onReceipt(receipt));
  }, 3);

  return null;
}
