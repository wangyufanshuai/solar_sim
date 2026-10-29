import type { AtlasV596VisualCheckpointIdentity } from "./atlasV596VisualCheckpointIdentity";
import { sha256Utf8HexV566 } from "./sha256BrowserV566";
import type {
  V595ExactAbCameraState,
  V595ExactAbFrameClock,
  V595ExactAbOptionalTextureCacheSnapshot,
  V595ExactAbSoakSnapshot,
} from "./v595ExactAbContract";

export const V596_VISUAL_CHECKPOINT_QUERY_KEY = "v596VisualCheckpoint" as const;
export const V596_VISUAL_CHECKPOINT_RUNTIME_VERSION =
  "v596-stellar-visible-leap-checkpoint-v1" as const;
export const V596_VISUAL_CHECKPOINT_CONSUMER = "webgl-main-scene-v1" as const;
export const V596_VISUAL_CHECKPOINT_CONSUMER_RECEIPT_VERSION =
  "v596-visual-checkpoint-app-consumer-receipt-v1" as const;
export const V596_VISUAL_CHECKPOINT_CANVAS_IDENTITY =
  "atlas-main-r3f-canvas-v1" as const;
export const V596_VISUAL_CHECKPOINT_SETTLE_POLICY = Object.freeze({
  version: "v596-visual-checkpoint-render-settle-policy-v1" as const,
  minimumStableMilliseconds: 1_000,
  minimumStableFrameSamples: 3,
  fingerprint: "canonical-sha256-mounted-renderer-census-v1" as const,
  optionalTexturePendingRequired: 0 as const,
  optionalTextureDisposedAllowed: false as const,
});
export const V596_VISUAL_CHECKPOINT_CANVAS_CONTRACT = Object.freeze({
  identity: V596_VISUAL_CHECKPOINT_CANVAS_IDENTITY,
  owner: "UniverseCanvas" as const,
  renderer: "react-three-fiber" as const,
  mainCanvas: true as const,
  singleCanvasPolicy: "shared-main-canvas" as const,
});

export type V596VisualCheckpointMode = "cinematic" | "science";

export type V596VisualCheckpointQueryResolution = Readonly<{
  status: "inactive" | "active" | "invalid";
  reason: "absent" | "exact-one" | "duplicate" | "unknown-value";
}>;

export type V596VisualCheckpointEligibility = Readonly<{
  eligible: boolean;
  reason:
    | "ready"
    | "inactive"
    | "identity-unbound"
    | "conflicting-capture-query"
    | "simulation-playing"
    | "simulation-day-not-zero"
    | "assets-not-ready"
    | "target-not-ready";
}>;

export function resolveV596VisualCheckpointSearch(
  search: string,
): V596VisualCheckpointQueryResolution {
  const values = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
    .getAll(V596_VISUAL_CHECKPOINT_QUERY_KEY);
  if (values.length === 0) return Object.freeze({ status: "inactive", reason: "absent" });
  if (values.length !== 1) return Object.freeze({ status: "invalid", reason: "duplicate" });
  if (values[0] !== "1") return Object.freeze({ status: "invalid", reason: "unknown-value" });
  return Object.freeze({ status: "active", reason: "exact-one" });
}

export function resolveV596VisualCheckpointEligibility({
  active,
  identityBound,
  conflictFree,
  paused,
  simDays,
  assetReady,
  selectedTargetReady,
}: Readonly<{
  active: boolean;
  identityBound: boolean;
  conflictFree: boolean;
  paused: boolean;
  simDays: number;
  assetReady: boolean;
  selectedTargetReady: boolean;
}>): V596VisualCheckpointEligibility {
  if (!active) return Object.freeze({ eligible: false, reason: "inactive" });
  if (!identityBound) return Object.freeze({ eligible: false, reason: "identity-unbound" });
  if (!conflictFree) {
    return Object.freeze({ eligible: false, reason: "conflicting-capture-query" });
  }
  if (!paused) return Object.freeze({ eligible: false, reason: "simulation-playing" });
  if (!Number.isFinite(simDays) || simDays !== 0) {
    return Object.freeze({ eligible: false, reason: "simulation-day-not-zero" });
  }
  if (!assetReady) return Object.freeze({ eligible: false, reason: "assets-not-ready" });
  if (!selectedTargetReady) {
    return Object.freeze({ eligible: false, reason: "target-not-ready" });
  }
  return Object.freeze({ eligible: true, reason: "ready" });
}

export function canonicalizeV596VisualCheckpoint(value: unknown): unknown {
  if (value === undefined) throw new Error("v596-checkpoint-canonical-undefined");
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error("v596-checkpoint-canonical-non-finite");
  }
  if (Array.isArray(value)) return value.map(canonicalizeV596VisualCheckpoint);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [
    key,
    canonicalizeV596VisualCheckpoint((value as Record<string, unknown>)[key]),
  ]));
}

export function canonicalShaV596VisualCheckpoint(value: unknown): string {
  return sha256Utf8HexV566(JSON.stringify(canonicalizeV596VisualCheckpoint(value)));
}

function domainSha(version: string, value: unknown): string {
  return canonicalShaV596VisualCheckpoint({ version, value });
}

export type V596VisualCheckpointFrame = Readonly<{
  frameId: string;
  candidate: "v596";
  targetId: string;
  archetype: string;
  mode: V596VisualCheckpointMode;
  simDays: 0;
  paused: true;
  cameraPreset: string;
  cameraDistanceSceneUnits: 920;
  cameraFovDegrees: 42;
  cameraNear: 0.01;
  cameraFar: 1_000_000_000;
  assetReady: true;
  selectedTargetReady: true;
}>;

export type V596VisualCheckpointSimulationState = Readonly<{
  simDays: 0;
  paused: true;
  selectedTargetId: string;
  archetype: string;
  mode: V596VisualCheckpointMode;
  assetReady: true;
  selectedTargetReady: true;
}>;

export type V596VisualCheckpointRuntimeRequest = Readonly<{
  version: typeof V596_VISUAL_CHECKPOINT_RUNTIME_VERSION;
  frame: V596VisualCheckpointFrame;
  captureRequestId: string;
  identity: AtlasV596VisualCheckpointIdentity;
}>;

export type V596StellarRenderProfile = Readonly<{
  version: "v596-stellar-render-profile-v1";
  rendererContractVersion: "v596-stellar-portrait-render-contract-v1";
  candidate: "v596";
  targetId: string;
  archetype: string;
  mode: V596VisualCheckpointMode;
  captureRequestId: string;
  checkpointId: string;
  sourceSetSha256: string;
}>;

export function createV596VisualCheckpointRuntimeRequest({
  targetId,
  archetype,
  mode,
  identity,
}: Readonly<{
  targetId: string;
  archetype: string;
  mode: V596VisualCheckpointMode;
  identity: AtlasV596VisualCheckpointIdentity;
}>): V596VisualCheckpointRuntimeRequest {
  if (!targetId || !archetype) throw new Error("v596-checkpoint-target-archetype");
  if (identity.bindingStatus !== "bound") throw new Error("v596-checkpoint-identity-unbound");
  if (identity.formalEvidence !== false
    || identity.promotion !== "none"
    || identity.supplementalOnly !== true
  ) throw new Error("v596-checkpoint-identity-boundary");
  const frame = Object.freeze({
    frameId: `v596-checkpoint-${archetype}-${mode}`,
    candidate: "v596" as const,
    targetId,
    archetype,
    mode,
    simDays: 0 as const,
    paused: true as const,
    cameraPreset: `v596-checkpoint-${archetype}-camera-v1`,
    cameraDistanceSceneUnits: 920 as const,
    cameraFovDegrees: 42 as const,
    cameraNear: 0.01 as const,
    cameraFar: 1_000_000_000 as const,
    assetReady: true as const,
    selectedTargetReady: true as const,
  });
  return Object.freeze({
    version: V596_VISUAL_CHECKPOINT_RUNTIME_VERSION,
    frame,
    captureRequestId: canonicalShaV596VisualCheckpoint({
      version: "v596-visual-checkpoint-capture-request-v1",
      identity,
      frame,
    }),
    identity,
  });
}

export function createV596StellarRenderProfile(
  request: V596VisualCheckpointRuntimeRequest,
): V596StellarRenderProfile {
  return Object.freeze({
    version: "v596-stellar-render-profile-v1" as const,
    rendererContractVersion: "v596-stellar-portrait-render-contract-v1" as const,
    candidate: "v596" as const,
    targetId: request.frame.targetId,
    archetype: request.frame.archetype,
    mode: request.frame.mode,
    captureRequestId: request.captureRequestId,
    checkpointId: request.identity.checkpointId,
    sourceSetSha256: request.identity.sourceSetSha256,
  });
}

export function visualCheckpointSimulationStateBindingV596(
  frame: V596VisualCheckpointFrame,
): V596VisualCheckpointSimulationState {
  return Object.freeze({
    simDays: frame.simDays,
    paused: frame.paused,
    selectedTargetId: frame.targetId,
    archetype: frame.archetype,
    mode: frame.mode,
    assetReady: frame.assetReady,
    selectedTargetReady: frame.selectedTargetReady,
  });
}

export function deriveV596VisualCheckpointCameraStateSha(value: unknown): string {
  return domainSha("v596-visual-checkpoint-camera-state-v1", value);
}

export function deriveV596VisualCheckpointSimulationStateSha(value: unknown): string {
  return domainSha("v596-visual-checkpoint-simulation-state-v1", value);
}

export function deriveV596VisualCheckpointRenderContractSha(value: unknown): string {
  return domainSha("v596-visual-checkpoint-render-contract-v1", value);
}

export function deriveV596VisualCheckpointRenderStateSha(value: unknown): string {
  return domainSha("v596-visual-checkpoint-render-state-v1", value);
}

export type V596VisualCheckpointCameraState = V595ExactAbCameraState;
export type V596VisualCheckpointFrameClock = V595ExactAbFrameClock;
export type V596VisualCheckpointSnapshot = V595ExactAbSoakSnapshot;
export type V596VisualCheckpointOptionalTextureCacheSnapshot =
  V595ExactAbOptionalTextureCacheSnapshot;

export type V596VisualCheckpointSettleProof = Readonly<{
  version: "v596-visual-checkpoint-settle-proof-v1";
  stableForMilliseconds: number;
  stableFrameSampleCount: number;
  censusFingerprintSha256: string;
  snapshotSha256: string;
  optionalTextureCache: V596VisualCheckpointOptionalTextureCacheSnapshot;
}>;

export type V596VisualCheckpointRenderContractState = Readonly<{
  candidate: "v596";
  rendererContractVersion: "v596-stellar-portrait-render-contract-v1";
  targetId: string;
  archetype: string;
  mode: V596VisualCheckpointMode;
  sourceBindingSha256: string;
  morphologySha256: string;
  presentationAuthority: "none";
  relativityAuthority: "shadow-only";
  scientificAuthority: false;
  measuredAuthority: false;
  gpuAuthority: false;
  resolvedSurfaceAuthority: false;
  observationTextureAuthority: false;
  radiativeTransferAuthority: false;
  grmhdAuthority: false;
  formalEvidence: false;
  promotion: "none";
  supplementalOnly: true;
  defaultKernel: "legacy-eih-1pn";
  scientificPayloadWriteback: false;
  formalProductPointer: "v263";
}>;

export type V596VisualCheckpointConsumerReceipt = Readonly<{
  version: typeof V596_VISUAL_CHECKPOINT_CONSUMER_RECEIPT_VERSION;
  runtimeVersion: typeof V596_VISUAL_CHECKPOINT_RUNTIME_VERSION;
  consumer: typeof V596_VISUAL_CHECKPOINT_CONSUMER;
  identity: AtlasV596VisualCheckpointIdentity;
  frame: V596VisualCheckpointFrame;
  captureRequestId: string;
  cameraState: V596VisualCheckpointCameraState;
  cameraStateSha256: string;
  simulationState: V596VisualCheckpointSimulationState;
  simulationStateSha256: string;
  render: Readonly<{
    candidate: "v596";
    candidateNodeIds: readonly string[];
    candidateNodeCount: number;
    contractState: V596VisualCheckpointRenderContractState;
    contractSha256: string;
    state: Readonly<{
      candidate: "v596";
      targetId: string;
      archetype: string;
      mode: V596VisualCheckpointMode;
      contractSha256: string;
      candidateNodeIds: readonly string[];
    }>;
    stateSha256: string;
  }>;
  canvas: typeof V596_VISUAL_CHECKPOINT_CANVAS_CONTRACT;
  snapshot: V596VisualCheckpointSnapshot;
  settle: V596VisualCheckpointSettleProof;
  frameClock: V596VisualCheckpointFrameClock;
  receiptSha256: string;
}>;

export function createV596VisualCheckpointConsumerReceipt({
  request,
  cameraState,
  candidateNodeIds,
  sourceBindingSha256,
  morphologySha256,
  snapshot,
  settle,
  frameClock,
}: Readonly<{
  request: V596VisualCheckpointRuntimeRequest;
  cameraState: V596VisualCheckpointCameraState;
  candidateNodeIds: readonly string[];
  sourceBindingSha256: string;
  morphologySha256: string;
  snapshot: V596VisualCheckpointSnapshot;
  settle: V596VisualCheckpointSettleProof;
  frameClock: V596VisualCheckpointFrameClock;
}>): V596VisualCheckpointConsumerReceipt {
  if (
    request.identity.bindingStatus !== "bound"
    || request.identity.formalEvidence !== false
    || request.identity.promotion !== "none"
    || request.identity.supplementalOnly !== true
    || request.identity.formalProductPointer !== "v263"
  ) throw new Error("v596-checkpoint-receipt-identity");
  const cameraNumbers = [
    ...cameraState.position,
    ...cameraState.target,
    ...cameraState.quaternion,
    cameraState.projection.fov,
    cameraState.projection.near,
    cameraState.projection.far,
  ];
  const cameraDistance = Math.hypot(
    cameraState.position[0] - cameraState.target[0],
    cameraState.position[1] - cameraState.target[1],
    cameraState.position[2] - cameraState.target[2],
  );
  if (
    cameraState.preset !== request.frame.cameraPreset
    || cameraNumbers.some((value) => !Number.isFinite(value))
    || Math.abs(cameraDistance - request.frame.cameraDistanceSceneUnits) > 1e-9
    || cameraState.projection.fov !== request.frame.cameraFovDegrees
    || cameraState.projection.near !== request.frame.cameraNear
    || cameraState.projection.far !== request.frame.cameraFar
  ) throw new Error("v596-checkpoint-camera-binding");
  const sortedNodeIds = Object.freeze([...new Set(candidateNodeIds)].sort());
  if (sortedNodeIds.length === 0 || sortedNodeIds.length !== candidateNodeIds.length) {
    throw new Error("v596-checkpoint-receipt-candidate-nodes");
  }
  if (!/^[0-9a-f]{64}$/.test(sourceBindingSha256)
    || !/^[0-9a-f]{64}$/.test(morphologySha256)
  ) throw new Error("v596-checkpoint-source-binding");
  const snapshotSha256 = canonicalShaV596VisualCheckpoint(snapshot);
  if (
    snapshot.canvas.count !== 1
    || snapshot.canvas.connected !== 1
    || snapshot.scene.candidateNodes !== sortedNodeIds.length
    || snapshot.scene.stellarHeroIds.length !== 1
    || snapshot.scene.stellarHeroIds[0] !== request.frame.targetId
    || snapshot.scene.stellarArchetypes.length !== 1
    || snapshot.scene.stellarArchetypes[0] !== request.frame.archetype
    || snapshot.scene.stellarContractSha256s.length !== 1
    || snapshot.scene.stellarContractSha256s[0] !== sourceBindingSha256
  ) throw new Error("v596-checkpoint-snapshot-binding");
  if (
    settle.version !== "v596-visual-checkpoint-settle-proof-v1"
    || settle.stableForMilliseconds < V596_VISUAL_CHECKPOINT_SETTLE_POLICY.minimumStableMilliseconds
    || settle.stableFrameSampleCount < V596_VISUAL_CHECKPOINT_SETTLE_POLICY.minimumStableFrameSamples
    || settle.censusFingerprintSha256 !== snapshotSha256
    || settle.snapshotSha256 !== snapshotSha256
    || settle.optionalTextureCache.status === "disposed"
    || settle.optionalTextureCache.pending
      !== V596_VISUAL_CHECKPOINT_SETTLE_POLICY.optionalTexturePendingRequired
  ) throw new Error("v596-checkpoint-settle-proof");
  if (
    !Number.isInteger(frameClock.requestedAtFrameSequence)
    || !Number.isInteger(frameClock.consumedAtFrameSequence)
    || !Number.isInteger(frameClock.settledAtFrameSequence)
    || frameClock.requestedAtFrameSequence >= frameClock.consumedAtFrameSequence
    || frameClock.consumedAtFrameSequence > frameClock.settledAtFrameSequence
    || !Number.isFinite(frameClock.requestedAtMonotonicMs)
    || !Number.isFinite(frameClock.consumedAtMonotonicMs)
    || !Number.isFinite(frameClock.settledAtMonotonicMs)
    || frameClock.requestedAtMonotonicMs >= frameClock.consumedAtMonotonicMs
    || frameClock.consumedAtMonotonicMs > frameClock.settledAtMonotonicMs
    || settle.stableFrameSampleCount
      > frameClock.settledAtFrameSequence - frameClock.consumedAtFrameSequence
    || settle.stableForMilliseconds
      > frameClock.settledAtMonotonicMs - frameClock.consumedAtMonotonicMs
  ) throw new Error("v596-checkpoint-frame-clock");
  const simulationState = visualCheckpointSimulationStateBindingV596(request.frame);
  const contractState = Object.freeze({
    candidate: "v596" as const,
    rendererContractVersion: "v596-stellar-portrait-render-contract-v1" as const,
    targetId: request.frame.targetId,
    archetype: request.frame.archetype,
    mode: request.frame.mode,
    sourceBindingSha256,
    morphologySha256,
    presentationAuthority: "none" as const,
    relativityAuthority: "shadow-only" as const,
    scientificAuthority: false as const,
    measuredAuthority: false as const,
    gpuAuthority: false as const,
    resolvedSurfaceAuthority: false as const,
    observationTextureAuthority: false as const,
    radiativeTransferAuthority: false as const,
    grmhdAuthority: false as const,
    formalEvidence: false as const,
    promotion: "none" as const,
    supplementalOnly: true as const,
    defaultKernel: "legacy-eih-1pn" as const,
    scientificPayloadWriteback: false as const,
    formalProductPointer: "v263" as const,
  });
  const contractSha256 = deriveV596VisualCheckpointRenderContractSha(contractState);
  const renderState = Object.freeze({
    candidate: "v596" as const,
    targetId: request.frame.targetId,
    archetype: request.frame.archetype,
    mode: request.frame.mode,
    contractSha256,
    candidateNodeIds: sortedNodeIds,
  });
  const unsigned = {
    version: V596_VISUAL_CHECKPOINT_CONSUMER_RECEIPT_VERSION,
    runtimeVersion: V596_VISUAL_CHECKPOINT_RUNTIME_VERSION,
    consumer: V596_VISUAL_CHECKPOINT_CONSUMER,
    identity: request.identity,
    frame: request.frame,
    captureRequestId: request.captureRequestId,
    cameraState,
    cameraStateSha256: deriveV596VisualCheckpointCameraStateSha(cameraState),
    simulationState,
    simulationStateSha256: deriveV596VisualCheckpointSimulationStateSha(simulationState),
    render: Object.freeze({
      candidate: "v596" as const,
      candidateNodeIds: sortedNodeIds,
      candidateNodeCount: sortedNodeIds.length,
      contractState,
      contractSha256,
      state: renderState,
      stateSha256: deriveV596VisualCheckpointRenderStateSha(renderState),
    }),
    canvas: V596_VISUAL_CHECKPOINT_CANVAS_CONTRACT,
    snapshot,
    settle,
    frameClock,
  };
  return Object.freeze({
    ...unsigned,
    receiptSha256: canonicalShaV596VisualCheckpoint(unsigned),
  });
}
