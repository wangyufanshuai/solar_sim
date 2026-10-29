"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { getAtlasResourceSnapshot } from "../lib/atlasResourceLifecycle";
import { getOptionalTextureRendererCacheSnapshotV594 } from "../lib/useOptionalTexture";
import {
  V596_VISUAL_CHECKPOINT_CANVAS_IDENTITY,
  V596_VISUAL_CHECKPOINT_SETTLE_POLICY,
  canonicalShaV596VisualCheckpoint,
  createV596VisualCheckpointConsumerReceipt,
  type V596VisualCheckpointCameraState,
  type V596VisualCheckpointConsumerReceipt,
  type V596VisualCheckpointRuntimeRequest,
  type V596VisualCheckpointSnapshot,
} from "../lib/v596VisualCheckpointContract";

type CheckpointCandidateObservation = Readonly<{
  nodeIds: readonly string[];
  sourceBindingSha256: string;
  morphologySha256: string;
  anchor: THREE.Vector3;
}>;

type CheckpointConsumptionState = Readonly<{
  captureRequestId: string;
  phase: "requested" | "consumed" | "published";
  requestedAtFrameSequence: number;
  requestedAtMonotonicMs: number;
  consumedAtFrameSequence: number | null;
  consumedAtMonotonicMs: number | null;
  observation: CheckpointCandidateObservation | null;
  cameraState: V596VisualCheckpointCameraState | null;
  settleFingerprintSha256: string | null;
  settleStartedAtFrameSequence: number | null;
  settleStartedAtMonotonicMs: number | null;
  settleFrameSampleCount: number;
}>;

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function observeCheckpointCandidate(
  scene: THREE.Scene,
  request: V596VisualCheckpointRuntimeRequest,
): CheckpointCandidateObservation | null {
  const nodes: THREE.Object3D[] = [];
  const nodeIds = new Set<string>();
  const sourceBindings = new Set<string>();
  const morphologyBindings = new Set<string>();
  scene.traverse((node) => {
    const data = node.userData;
    if (
      data.atlasV596VisualCheckpointRuntime !== true
      || data.atlasV596VisualCheckpointCaptureRequestId !== request.captureRequestId
      || data.atlasV596VisualCheckpointCandidate !== "v596"
      || data.atlasV596VisualCheckpointTargetId !== request.frame.targetId
      || data.atlasV596VisualCheckpointArchetype !== request.frame.archetype
      || data.atlasV596VisualCheckpointMode !== request.frame.mode
      || data.atlasV596VisualCheckpointCheckpointId !== request.identity.checkpointId
      || typeof data.atlasV596VisualCheckpointNodeId !== "string"
      || !data.atlasV596VisualCheckpointNodeId
      || typeof data.atlasV596VisualCheckpointSourceBindingSha256 !== "string"
      || !/^[0-9a-f]{64}$/.test(data.atlasV596VisualCheckpointSourceBindingSha256)
      || typeof data.atlasV596VisualCheckpointMorphologySha256 !== "string"
      || !/^[0-9a-f]{64}$/.test(data.atlasV596VisualCheckpointMorphologySha256)
      || data.atlasV596VisualCheckpointPresentationAuthority !== "none"
      || data.atlasV596VisualCheckpointRelativityAuthority !== "shadow-only"
      || data.atlasV596VisualCheckpointDefaultKernel !== "legacy-eih-1pn"
      || data.atlasV596VisualCheckpointScientificAuthority !== false
      || data.atlasV596VisualCheckpointMeasuredAuthority !== false
      || data.atlasV596VisualCheckpointGpuAuthority !== false
      || data.atlasV596VisualCheckpointResolvedSurfaceAuthority !== false
      || data.atlasV596VisualCheckpointObservationTextureAuthority !== false
      || data.atlasV596VisualCheckpointRadiativeTransferAuthority !== false
      || data.atlasV596VisualCheckpointGrmhdAuthority !== false
      || data.atlasV596VisualCheckpointFormalEvidence !== false
      || data.atlasV596VisualCheckpointPromotion !== "none"
      || data.atlasV596VisualCheckpointSupplementalOnly !== true
      || data.atlasV596VisualCheckpointScientificPayloadWriteback !== false
      || data.atlasV596VisualCheckpointFormalProductPointer !== "v263"
    ) return;
    if (nodeIds.has(data.atlasV596VisualCheckpointNodeId)) return;
    nodes.push(node);
    nodeIds.add(data.atlasV596VisualCheckpointNodeId);
    sourceBindings.add(data.atlasV596VisualCheckpointSourceBindingSha256);
    morphologyBindings.add(data.atlasV596VisualCheckpointMorphologySha256);
  });
  if (nodes.length === 0 || sourceBindings.size !== 1 || morphologyBindings.size !== 1) {
    return null;
  }
  const root = nodes.find((node) => String(
    node.userData.atlasV596VisualCheckpointNodeId,
  ).endsWith(":root"));
  if (!root) return null;
  return Object.freeze({
    nodeIds: Object.freeze([...nodeIds].sort()),
    sourceBindingSha256: [...sourceBindings][0]!,
    morphologySha256: [...morphologyBindings][0]!,
    anchor: root.getWorldPosition(new THREE.Vector3()),
  });
}

function checkpointCameraPosition(
  request: V596VisualCheckpointRuntimeRequest,
  anchor: THREE.Vector3,
): THREE.Vector3 {
  const radial = anchor.clone();
  if (radial.lengthSq() < 1e-12) radial.set(0, 0, 1);
  return anchor.clone().add(
    radial.normalize().multiplyScalar(-request.frame.cameraDistanceSceneUnits),
  );
}

function applyCheckpointCamera(
  camera: THREE.Camera,
  controls: OrbitControlsImpl,
  request: V596VisualCheckpointRuntimeRequest,
  anchor: THREE.Vector3,
): V596VisualCheckpointCameraState | null {
  if (!(camera instanceof THREE.PerspectiveCamera)) return null;
  controls.enabled = false;
  controls.enableDamping = false;
  controls.target.copy(anchor);
  camera.position.copy(checkpointCameraPosition(request, anchor));
  camera.fov = request.frame.cameraFovDegrees;
  camera.near = request.frame.cameraNear;
  camera.far = request.frame.cameraFar;
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
  expected: V596VisualCheckpointCameraState,
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
    && actual.every((value, index) => finiteNumber(value)
      && Math.abs(value - wanted[index]!) <= 1e-9);
}

function captureCheckpointSnapshot(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  observation: CheckpointCandidateObservation,
  request: V596VisualCheckpointRuntimeRequest,
): V596VisualCheckpointSnapshot {
  const selector =
    `canvas[data-atlas-v596-visual-checkpoint-canvas-identity="${V596_VISUAL_CHECKPOINT_CANVAS_IDENTITY}"]`;
  const canvases = Array.from(document.querySelectorAll<HTMLCanvasElement>(selector));
  const registry = getAtlasResourceSnapshot();
  let objects = 0;
  const stellarHeroIds = new Set<string>();
  const stellarArchetypes = new Set<string>();
  const stellarContractSha256s = new Set<string>();
  scene.traverse((node) => {
    if (node !== scene) objects += 1;
    if (node.userData.atlasV596VisualCheckpointCaptureRequestId
      !== request.captureRequestId
    ) return;
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
    // Unavailable WebGL state remains unknown rather than synthetic success.
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

export default function V596VisualCheckpointR3fConsumer({
  request,
  controlsRef,
  onReceipt,
}: Readonly<{
  request: V596VisualCheckpointRuntimeRequest;
  controlsRef: MutableRefObject<OrbitControlsImpl | null>;
  onReceipt: (receipt: V596VisualCheckpointConsumerReceipt) => void;
}>) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const frameSequenceRef = useRef(0);
  const stateRef = useRef<CheckpointConsumptionState | null>(null);

  useEffect(() => {
    const controls = controlsRef.current;
    gl.domElement.dataset.atlasV596VisualCheckpointCanvasIdentity =
      V596_VISUAL_CHECKPOINT_CANVAS_IDENTITY;
    return () => {
      delete gl.domElement.dataset.atlasV596VisualCheckpointCanvasIdentity;
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
        phase: "requested" as const,
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
    const observation = observeCheckpointCandidate(scene, request);
    if (!observation) return;
    if (consumption.phase === "requested") {
      const cameraState = applyCheckpointCamera(camera, controls, request, observation.anchor);
      if (!cameraState
        || sequence <= consumption.requestedAtFrameSequence
        || now <= consumption.requestedAtMonotonicMs
      ) return;
      stateRef.current = Object.freeze({
        ...consumption,
        phase: "consumed" as const,
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
      || observation.morphologySha256 !== consumption.observation.morphologySha256
      || !sameCameraState(camera, controls, consumption.cameraState)
    ) return;
    const snapshot = captureCheckpointSnapshot(gl, scene, observation, request);
    const optionalTextureCache = getOptionalTextureRendererCacheSnapshotV594(gl);
    if (
      optionalTextureCache.status === "disposed"
      || optionalTextureCache.pending
        !== V596_VISUAL_CHECKPOINT_SETTLE_POLICY.optionalTexturePendingRequired
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
    const censusFingerprintSha256 = canonicalShaV596VisualCheckpoint(snapshot);
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
      stableForMilliseconds < V596_VISUAL_CHECKPOINT_SETTLE_POLICY.minimumStableMilliseconds
      || stableFrameSampleCount
        < V596_VISUAL_CHECKPOINT_SETTLE_POLICY.minimumStableFrameSamples
    ) {
      stateRef.current = Object.freeze({ ...consumption, settleFrameSampleCount: stableFrameSampleCount });
      return;
    }
    const receipt = createV596VisualCheckpointConsumerReceipt({
      request,
      cameraState: consumption.cameraState,
      candidateNodeIds: observation.nodeIds,
      sourceBindingSha256: observation.sourceBindingSha256,
      morphologySha256: observation.morphologySha256,
      snapshot,
      settle: Object.freeze({
        version: "v596-visual-checkpoint-settle-proof-v1" as const,
        stableForMilliseconds,
        stableFrameSampleCount,
        censusFingerprintSha256,
        snapshotSha256: censusFingerprintSha256,
        optionalTextureCache,
      }),
      frameClock: Object.freeze({
        requestedAtFrameSequence: consumption.requestedAtFrameSequence,
        consumedAtFrameSequence: consumption.consumedAtFrameSequence,
        settledAtFrameSequence: sequence,
        requestedAtMonotonicMs: consumption.requestedAtMonotonicMs,
        consumedAtMonotonicMs: consumption.consumedAtMonotonicMs,
        settledAtMonotonicMs: now,
      }),
    });
    stateRef.current = Object.freeze({ ...consumption, phase: "published" as const });
    queueMicrotask(() => onReceipt(receipt));
  }, 3);

  return null;
}
