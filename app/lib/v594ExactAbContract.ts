import type { AtlasV594BuildIdentity } from "./atlasV594BuildIdentity";
import { sha256Utf8HexV566 } from "./sha256BrowserV566";

export const V594_EXACT_AB_QUERY_KEY = "v594ExactAb" as const;
export const V594_EXACT_AB_RUNTIME_VERSION = "v594-stellar-relativity-exact-ab-v1" as const;
export const V594_EXACT_AB_CONSUMER = "webgl-main-scene-v1" as const;
export const V594_EXACT_AB_CONSUMER_RECEIPT_VERSION = "v594-exact-ab-app-consumer-receipt-v1" as const;
export const V594_EXACT_AB_CANVAS_IDENTITY = "atlas-main-r3f-canvas-v1" as const;
export const V594_EXACT_AB_SOAK_OBSERVABILITY_VERSION = "v594-cdp-soak-app-observability-v3" as const;
export const V594_EXACT_AB_RELATIVITY_OBSERVATION_VERSION = "v594-relativity-workbench-observation-marker-v1" as const;
export const V594_EXACT_AB_SETTLE_POLICY = Object.freeze({
  version: "v594-exact-ab-render-settle-policy-v1" as const,
  minimumStableMilliseconds: 1_000,
  minimumStableFrameSamples: 3,
  fingerprint: "canonical-sha256-mounted-renderer-census-v1" as const,
  optionalTexturePendingRequired: 0 as const,
  optionalTextureDisposedAllowed: false as const,
});
export const V594_EXACT_AB_LANES = Object.freeze(["baseline-v593", "candidate-v594"] as const);
export const V594_EXACT_AB_CANVAS_CONTRACT = Object.freeze({
  identity: V594_EXACT_AB_CANVAS_IDENTITY,
  owner: "UniverseCanvas" as const,
  renderer: "react-three-fiber" as const,
  mainCanvas: true as const,
});

export type V594ExactAbLane = (typeof V594_EXACT_AB_LANES)[number];
export type V594ExactAbMode = "cinematic" | "science" | "validation";
export type V594ExactAbCandidate = "v593" | "v594";

export type V594ExactAbQueryResolution = Readonly<{
  status: "inactive" | "active" | "invalid";
  reason: "absent" | "exact-one" | "duplicate" | "unknown-value";
}>;

export type V594ExactAbRequestEligibility = Readonly<{
  eligible: boolean;
  reason:
    | "ready"
    | "inactive"
    | "identity-unbound"
    | "simulation-playing"
    | "simulation-day-not-zero"
    | "assets-not-ready"
    | "target-not-ready"
    | "controls-expanded";
}>;

export function resolveV594ExactAbSearch(search: string): V594ExactAbQueryResolution {
  const values = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
    .getAll(V594_EXACT_AB_QUERY_KEY);
  if (values.length === 0) return Object.freeze({ status: "inactive", reason: "absent" });
  if (values.length !== 1) return Object.freeze({ status: "invalid", reason: "duplicate" });
  if (values[0] !== "1") return Object.freeze({ status: "invalid", reason: "unknown-value" });
  return Object.freeze({ status: "active", reason: "exact-one" });
}

export function resolveV594ExactAbRequestEligibility({
  active,
  identityBound,
  paused,
  simDays,
  assetReady,
  selectedTargetReady,
  controlsCollapsed,
}: Readonly<{
  active: boolean;
  identityBound: boolean;
  paused: boolean;
  simDays: number;
  assetReady: boolean;
  selectedTargetReady: boolean;
  controlsCollapsed: boolean;
}>): V594ExactAbRequestEligibility {
  if (!active) return Object.freeze({ eligible: false, reason: "inactive" });
  if (!identityBound) return Object.freeze({ eligible: false, reason: "identity-unbound" });
  if (!paused) return Object.freeze({ eligible: false, reason: "simulation-playing" });
  if (!Number.isFinite(simDays) || simDays !== 0) {
    return Object.freeze({ eligible: false, reason: "simulation-day-not-zero" });
  }
  if (!assetReady) return Object.freeze({ eligible: false, reason: "assets-not-ready" });
  if (!selectedTargetReady) return Object.freeze({ eligible: false, reason: "target-not-ready" });
  if (!controlsCollapsed) return Object.freeze({ eligible: false, reason: "controls-expanded" });
  return Object.freeze({ eligible: true, reason: "ready" });
}

export function canonicalizeV594Exact(value: unknown): unknown {
  if (value === undefined) throw new Error("v594-exact-canonical-undefined");
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error("v594-exact-canonical-non-finite");
  }
  if (Array.isArray(value)) return value.map(canonicalizeV594Exact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [
    key,
    canonicalizeV594Exact((value as Record<string, unknown>)[key]),
  ]));
}

export function canonicalShaV594Exact(value: unknown): string {
  return sha256Utf8HexV566(JSON.stringify(canonicalizeV594Exact(value)));
}

function domainSha(version: string, value: unknown): string {
  return canonicalShaV594Exact({ version, value });
}

export function exactCandidateForLaneV594(lane: V594ExactAbLane): V594ExactAbCandidate {
  if (lane === "baseline-v593") return "v593";
  if (lane === "candidate-v594") return "v594";
  throw new Error(`v594-exact-lane:${String(lane)}`);
}

export type V594ExactAbFrame = Readonly<{
  frameId: string;
  lane: V594ExactAbLane;
  targetId: string;
  archetype: string;
  mode: V594ExactAbMode;
  simDays: 0;
  paused: true;
  cameraPreset: string;
  assetReady: true;
  selectedTargetReady: true;
  controlsCollapsed: true;
}>;

export type V594ExactAbSimulationState = Readonly<{
  simDays: 0;
  paused: true;
  selectedTargetId: string;
  archetype: string;
  mode: V594ExactAbMode;
  assetReady: true;
  selectedTargetReady: true;
  controlsCollapsed: true;
}>;

export type V594ExactAbRuntimeRequest = Readonly<{
  version: typeof V594_EXACT_AB_RUNTIME_VERSION;
  frame: V594ExactAbFrame;
  captureRequestId: string;
  identity: AtlasV594BuildIdentity;
}>;

export type V594StellarRenderProfile = Readonly<{
  version: "v594-stellar-render-profile-v1";
  lane: V594ExactAbLane;
  candidate: V594ExactAbCandidate;
  targetId: string;
  archetype: string;
  mode: "cinematic" | "science";
  captureRequestId: string;
}>;

export function createV594ExactAbRuntimeRequest({
  lane,
  targetId,
  archetype,
  mode,
  identity,
}: Readonly<{
  lane: V594ExactAbLane;
  targetId: string;
  archetype: string;
  mode: V594ExactAbMode;
  identity: AtlasV594BuildIdentity;
}>): V594ExactAbRuntimeRequest {
  exactCandidateForLaneV594(lane);
  if (!targetId || !archetype) throw new Error("v594-exact-target-archetype");
  if (identity.bindingStatus !== "bound") throw new Error("v594-exact-identity-unbound");
  const frame = Object.freeze({
    frameId: `exact-${archetype}-${lane}`,
    lane,
    targetId,
    archetype,
    mode,
    simDays: 0 as const,
    paused: true as const,
    cameraPreset: `v594-exact-${archetype}-camera-v1`,
    assetReady: true as const,
    selectedTargetReady: true as const,
    controlsCollapsed: true as const,
  });
  return Object.freeze({
    version: V594_EXACT_AB_RUNTIME_VERSION,
    frame,
    captureRequestId: canonicalShaV594Exact({
      version: "v594-exact-capture-request-v1",
      frame,
    }),
    identity,
  });
}

export function createV594StellarRenderProfile(
  request: V594ExactAbRuntimeRequest,
): V594StellarRenderProfile | null {
  if (request.frame.archetype === "relativity-workbench") return null;
  if (request.frame.mode === "validation") throw new Error("v594-stellar-validation-mode");
  return Object.freeze({
    version: "v594-stellar-render-profile-v1",
    lane: request.frame.lane,
    candidate: exactCandidateForLaneV594(request.frame.lane),
    targetId: request.frame.targetId,
    archetype: request.frame.archetype,
    mode: request.frame.mode,
    captureRequestId: request.captureRequestId,
  });
}

export function exactSimulationStateBindingV594(
  frame: V594ExactAbFrame,
): V594ExactAbSimulationState {
  return Object.freeze({
    simDays: frame.simDays,
    paused: frame.paused,
    selectedTargetId: frame.targetId,
    archetype: frame.archetype,
    mode: frame.mode,
    assetReady: frame.assetReady,
    selectedTargetReady: frame.selectedTargetReady,
    controlsCollapsed: frame.controlsCollapsed,
  });
}

export function deriveExactCameraStateShaV594(value: unknown): string {
  return domainSha("v594-exact-camera-state-v1", value);
}

export function deriveExactSimulationStateShaV594(value: unknown): string {
  return domainSha("v594-exact-simulation-state-v1", value);
}

export function deriveExactRenderContractShaV594(value: unknown): string {
  return domainSha("v594-exact-render-contract-v1", value);
}

export function deriveExactRenderStateShaV594(value: unknown): string {
  return domainSha("v594-exact-render-state-v1", value);
}

export type V594ExactAbCameraState = Readonly<{
  preset: string;
  position: readonly [number, number, number];
  target: readonly [number, number, number];
  quaternion: readonly [number, number, number, number];
  projection: Readonly<{ fov: number; near: number; far: number }>;
}>;

export type V594ExactAbFrameClock = Readonly<{
  requestedAtFrameSequence: number;
  consumedAtFrameSequence: number;
  settledAtFrameSequence: number;
  requestedAtMonotonicMs: number;
  consumedAtMonotonicMs: number;
  settledAtMonotonicMs: number;
}>;

export type V594ExactAbSoakProfile = Readonly<{
  key: string;
  targetId: string;
  archetype: string | null;
  kind: "stellar" | "relativity";
  stable: true;
}>;

export type V594ExactAbSoakSnapshot = Readonly<{
  captureKind: "mounted-renderer";
  canvas: Readonly<{
    count: number | null;
    connected: number | null;
  }>;
  renderer: Readonly<{
    active: 0 | 1 | null;
    textures: number | null;
    geometries: number | null;
    programs: number | null;
    resourceCountersSource: "three.webglrenderer.info";
    renderTargets: number | null;
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
    active: 0 | 1 | null;
    objects: number | null;
    candidateNodes: number | null;
    stellarHeroIds: readonly string[];
    stellarArchetypes: readonly string[];
    stellarContractSha256s: readonly string[];
  }>;
  workers: number | null;
}>;

export type V594ExactAbOptionalTextureCacheSnapshot = Readonly<{
  status: "uninitialized" | "active" | "disposed";
  entries: number;
  pending: number;
  referenced: number;
  retainedTextures: number;
  registeredTextures: number;
}>;

export type V594ExactAbSettleProof = Readonly<{
  policy: typeof V594_EXACT_AB_SETTLE_POLICY;
  stableForMilliseconds: number;
  stableFrameSampleCount: number;
  censusFingerprintSha256: string;
  optionalTextureCache: V594ExactAbOptionalTextureCacheSnapshot;
}>;

export type V594ExactAbRelativityObservation = Readonly<{
  version: typeof V594_EXACT_AB_RELATIVITY_OBSERVATION_VERSION;
  active: boolean;
  targetId: string | null;
  workbenchMode: "validation" | "none";
  authority: "shadow-only" | "none";
  defaultKernel: "legacy-eih-1pn";
  scientificPayloadWriteback: false;
}>;

export type V594ExactAbSoakObservability = Readonly<{
  version: typeof V594_EXACT_AB_SOAK_OBSERVABILITY_VERSION;
  profileKey: string;
  profileBindingSha256: string;
  profile: V594ExactAbSoakProfile;
  rendererIdentity: Readonly<{
    canvasIdentity: typeof V594_EXACT_AB_CANVAS_IDENTITY;
    renderer: "WebGLRenderer";
    context: "webgl" | "webgl2" | null;
  }>;
  rendererIdentitySha256: string;
  snapshot: V594ExactAbSoakSnapshot;
  settle: V594ExactAbSettleProof;
  relativityObservation: V594ExactAbRelativityObservation;
  relativityObservationSha256: string;
}>;

function finiteNonnegativeIntegerOrNull(value: number | null): boolean {
  return value === null || (Number.isInteger(value) && value >= 0);
}

export function createV594ExactAbSoakObservability({
  request,
  rendererIdentity,
  snapshot,
  settle,
}: Readonly<{
  request: V594ExactAbRuntimeRequest;
  rendererIdentity: V594ExactAbSoakObservability["rendererIdentity"];
  snapshot: V594ExactAbSoakSnapshot;
  settle: Omit<V594ExactAbSettleProof, "policy">;
}>): V594ExactAbSoakObservability {
  const relativity = request.frame.archetype === "relativity-workbench";
  if (relativity !== (request.frame.mode === "validation")) {
    throw new Error("v594-exact-relativity-observation");
  }
  const profileBinding = Object.freeze({
    version: "v594-exact-ab-soak-profile-key-v1" as const,
    targetId: request.frame.targetId,
    archetype: relativity ? null : request.frame.archetype,
    kind: relativity ? "relativity" as const : "stellar" as const,
  });
  const profileKey = request.frame.archetype;
  const profile = Object.freeze({
    key: profileKey,
    targetId: profileBinding.targetId,
    archetype: profileBinding.archetype,
    kind: profileBinding.kind,
    stable: true as const,
  });
  const censusValues = [
    snapshot.canvas.count,
    snapshot.canvas.connected,
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
    snapshot.scene.objects,
    snapshot.scene.candidateNodes,
    snapshot.workers,
  ];
  const optionalTextureValues = [
    settle.optionalTextureCache.entries,
    settle.optionalTextureCache.pending,
    settle.optionalTextureCache.referenced,
    settle.optionalTextureCache.retainedTextures,
    settle.optionalTextureCache.registeredTextures,
  ];
  const relativityObservation = Object.freeze({
    version: V594_EXACT_AB_RELATIVITY_OBSERVATION_VERSION,
    active: relativity,
    targetId: relativity ? request.frame.targetId : null,
    workbenchMode: relativity ? "validation" as const : "none" as const,
    authority: relativity ? "shadow-only" as const : "none" as const,
    defaultKernel: "legacy-eih-1pn" as const,
    scientificPayloadWriteback: false as const,
  });
  if (
    rendererIdentity.canvasIdentity !== V594_EXACT_AB_CANVAS_IDENTITY
    || rendererIdentity.renderer !== "WebGLRenderer"
    || !["webgl", "webgl2", null].includes(rendererIdentity.context)
    || snapshot.captureKind !== "mounted-renderer"
    || snapshot.renderer.resourceCountersSource !== "three.webglrenderer.info"
    || ![0, 1, null].includes(snapshot.renderer.active)
    || ![0, 1, null].includes(snapshot.scene.active)
    || censusValues.some((value) => !finiteNonnegativeIntegerOrNull(value))
    || snapshot.scene.candidateNodes === null
    || snapshot.scene.candidateNodes < 1
  ) throw new Error("v594-exact-soak-observability");
  if (
    !Number.isFinite(settle.stableForMilliseconds)
    || settle.stableForMilliseconds < V594_EXACT_AB_SETTLE_POLICY.minimumStableMilliseconds
    || !Number.isInteger(settle.stableFrameSampleCount)
    || settle.stableFrameSampleCount < V594_EXACT_AB_SETTLE_POLICY.minimumStableFrameSamples
    || settle.censusFingerprintSha256 !== canonicalShaV594Exact(snapshot)
    || !["uninitialized", "active", "disposed"].includes(settle.optionalTextureCache.status)
    || settle.optionalTextureCache.status === "disposed"
    || optionalTextureValues.some((value) => !Number.isInteger(value) || value < 0)
    || settle.optionalTextureCache.pending !== V594_EXACT_AB_SETTLE_POLICY.optionalTexturePendingRequired
    || settle.optionalTextureCache.retainedTextures > settle.optionalTextureCache.entries
    || settle.optionalTextureCache.registeredTextures > settle.optionalTextureCache.entries
  ) throw new Error("v594-exact-settle-proof");
  const unsigned = {
    version: V594_EXACT_AB_SOAK_OBSERVABILITY_VERSION,
    profileKey,
    profileBindingSha256: canonicalShaV594Exact(profileBinding),
    profile,
    rendererIdentity,
    rendererIdentitySha256: canonicalShaV594Exact(rendererIdentity),
    snapshot,
    settle: Object.freeze({
      ...settle,
      policy: V594_EXACT_AB_SETTLE_POLICY,
    }),
    relativityObservation,
    relativityObservationSha256: canonicalShaV594Exact(relativityObservation),
  };
  return Object.freeze(unsigned);
}

export type V594ExactAbRenderContractState = Readonly<{
  candidate: V594ExactAbCandidate;
  targetId: string;
  archetype: string;
  mode: V594ExactAbMode;
  presentationAuthority: "none";
  relativityAuthority: "shadow-only";
  defaultKernel: "legacy-eih-1pn";
  scientificPayloadWriteback: false;
  sourceBindingSha256: string;
}>;

export type V594ExactAbConsumerReceipt = Readonly<{
  version: typeof V594_EXACT_AB_CONSUMER_RECEIPT_VERSION;
  runtimeVersion: typeof V594_EXACT_AB_RUNTIME_VERSION;
  consumer: typeof V594_EXACT_AB_CONSUMER;
  identity: AtlasV594BuildIdentity;
  frame: V594ExactAbFrame;
  captureRequestId: string;
  cameraState: V594ExactAbCameraState;
  cameraStateSha256: string;
  simulationState: V594ExactAbSimulationState;
  simulationStateSha256: string;
  render: Readonly<{
    candidate: V594ExactAbCandidate;
    candidateNodeIds: readonly string[];
    candidateNodeCount: number;
    contractState: V594ExactAbRenderContractState;
    contractSha256: string;
    revision: 593 | 594;
    state: Readonly<{
      candidate: V594ExactAbCandidate;
      targetId: string;
      archetype: string;
      mode: V594ExactAbMode;
      contractSha256: string;
      revision: 593 | 594;
      candidateNodeIds: readonly string[];
    }>;
    stateSha256: string;
  }>;
  canvas: typeof V594_EXACT_AB_CANVAS_CONTRACT;
  soakObservability: V594ExactAbSoakObservability;
  frameClock: V594ExactAbFrameClock;
  receiptSha256: string;
}>;

export function createV594ExactAbConsumerReceipt({
  request,
  cameraState,
  candidateNodeIds,
  sourceBindingSha256,
  soakObservability,
  frameClock,
}: Readonly<{
  request: V594ExactAbRuntimeRequest;
  cameraState: V594ExactAbCameraState;
  candidateNodeIds: readonly string[];
  sourceBindingSha256: string;
  soakObservability: V594ExactAbSoakObservability;
  frameClock: V594ExactAbFrameClock;
}>): V594ExactAbConsumerReceipt {
  if (request.identity.bindingStatus !== "bound") throw new Error("v594-exact-receipt-identity");
  const sortedNodeIds = Object.freeze([...new Set(candidateNodeIds)].sort());
  if (sortedNodeIds.length === 0 || sortedNodeIds.length !== candidateNodeIds.length) {
    throw new Error("v594-exact-receipt-candidate-nodes");
  }
  if (!/^[0-9a-f]{64}$/.test(sourceBindingSha256)) throw new Error("v594-exact-source-binding");
  if (
    soakObservability.profile.targetId !== request.frame.targetId
    || soakObservability.profileKey !== soakObservability.profile.key
    || soakObservability.snapshot.scene.candidateNodes !== sortedNodeIds.length
  ) throw new Error("v594-exact-soak-binding");
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
    || soakObservability.settle.stableFrameSampleCount
      > frameClock.settledAtFrameSequence - frameClock.consumedAtFrameSequence
    || soakObservability.settle.stableForMilliseconds
      > frameClock.settledAtMonotonicMs - frameClock.consumedAtMonotonicMs
  ) throw new Error("v594-exact-frame-clock");
  const candidate = exactCandidateForLaneV594(request.frame.lane);
  const revision = candidate === "v593" ? 593 as const : 594 as const;
  const simulationState = exactSimulationStateBindingV594(request.frame);
  const contractState = Object.freeze({
    candidate,
    targetId: request.frame.targetId,
    archetype: request.frame.archetype,
    mode: request.frame.mode,
    presentationAuthority: "none" as const,
    relativityAuthority: "shadow-only" as const,
    defaultKernel: "legacy-eih-1pn" as const,
    scientificPayloadWriteback: false as const,
    sourceBindingSha256,
  });
  const contractSha256 = deriveExactRenderContractShaV594(contractState);
  const renderState = Object.freeze({
    candidate,
    targetId: request.frame.targetId,
    archetype: request.frame.archetype,
    mode: request.frame.mode,
    contractSha256,
    revision,
    candidateNodeIds: sortedNodeIds,
  });
  const unsigned = {
    version: V594_EXACT_AB_CONSUMER_RECEIPT_VERSION,
    runtimeVersion: V594_EXACT_AB_RUNTIME_VERSION,
    consumer: V594_EXACT_AB_CONSUMER,
    identity: request.identity,
    frame: request.frame,
    captureRequestId: request.captureRequestId,
    cameraState,
    cameraStateSha256: deriveExactCameraStateShaV594(cameraState),
    simulationState,
    simulationStateSha256: deriveExactSimulationStateShaV594(simulationState),
    render: Object.freeze({
      candidate,
      candidateNodeIds: sortedNodeIds,
      candidateNodeCount: sortedNodeIds.length,
      contractState,
      contractSha256,
      revision,
      state: renderState,
      stateSha256: deriveExactRenderStateShaV594(renderState),
    }),
    canvas: V594_EXACT_AB_CANVAS_CONTRACT,
    soakObservability,
    frameClock,
  };
  return Object.freeze({ ...unsigned, receiptSha256: canonicalShaV594Exact(unsigned) });
}
