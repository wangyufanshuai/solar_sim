import type { AtlasV595BuildIdentity } from "./atlasV595BuildIdentity";
import { sha256Utf8HexV566 } from "./sha256BrowserV566";
import type {
  V594ExactAbCameraState,
  V594ExactAbFrameClock,
  V594ExactAbOptionalTextureCacheSnapshot,
  V594ExactAbSoakSnapshot,
} from "./v594ExactAbContract";

export const V595_EXACT_AB_QUERY_KEY = "v595ExactAb" as const;
export const V595_EXACT_AB_RUNTIME_VERSION = "v595-stellar-relativity-exact-ab-v1" as const;
export const V595_EXACT_AB_CONSUMER = "webgl-main-scene-v1" as const;
export const V595_EXACT_AB_CONSUMER_RECEIPT_VERSION =
  "v595-exact-ab-app-consumer-receipt-v1" as const;
export const V595_EXACT_AB_CANVAS_IDENTITY = "atlas-main-r3f-canvas-v1" as const;
export const V595_EXACT_AB_SOAK_OBSERVABILITY_VERSION =
  "v595-cdp-soak-app-observability-v1" as const;
export const V595_EXACT_AB_RELATIVITY_OBSERVATION_VERSION =
  "v595-relativity-workbench-observation-marker-v1" as const;
export const V595_EXACT_AB_SETTLE_POLICY = Object.freeze({
  version: "v595-exact-ab-render-settle-policy-v1" as const,
  minimumStableMilliseconds: 1_000,
  minimumStableFrameSamples: 3,
  fingerprint: "canonical-sha256-mounted-renderer-census-v1" as const,
  optionalTexturePendingRequired: 0 as const,
  optionalTextureDisposedAllowed: false as const,
});
export const V595_EXACT_AB_LANES = Object.freeze([
  "baseline-v594",
  "candidate-v595",
] as const);
export const V595_EXACT_AB_CANVAS_CONTRACT = Object.freeze({
  identity: V595_EXACT_AB_CANVAS_IDENTITY,
  owner: "UniverseCanvas" as const,
  renderer: "react-three-fiber" as const,
  mainCanvas: true as const,
  singleCanvasPolicy: "shared-main-canvas" as const,
});

export type V595ExactAbLane = (typeof V595_EXACT_AB_LANES)[number];
export type V595ExactAbMode = "cinematic" | "science" | "validation";
export type V595ExactAbCandidate = "v594" | "v595";

export type V595ExactAbQueryResolution = Readonly<{
  status: "inactive" | "active" | "invalid";
  reason: "absent" | "exact-one" | "duplicate" | "unknown-value";
}>;

export type V595ExactAbRequestEligibility = Readonly<{
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

export function resolveV595ExactAbSearch(search: string): V595ExactAbQueryResolution {
  const values = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
    .getAll(V595_EXACT_AB_QUERY_KEY);
  if (values.length === 0) return Object.freeze({ status: "inactive", reason: "absent" });
  if (values.length !== 1) return Object.freeze({ status: "invalid", reason: "duplicate" });
  if (values[0] !== "1") return Object.freeze({ status: "invalid", reason: "unknown-value" });
  return Object.freeze({ status: "active", reason: "exact-one" });
}

export function resolveV595ExactAbRequestEligibility({
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
}>): V595ExactAbRequestEligibility {
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

export function canonicalizeV595Exact(value: unknown): unknown {
  if (value === undefined) throw new Error("v595-exact-canonical-undefined");
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error("v595-exact-canonical-non-finite");
  }
  if (Array.isArray(value)) return value.map(canonicalizeV595Exact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [
    key,
    canonicalizeV595Exact((value as Record<string, unknown>)[key]),
  ]));
}

export function canonicalShaV595Exact(value: unknown): string {
  return sha256Utf8HexV566(JSON.stringify(canonicalizeV595Exact(value)));
}

function domainSha(version: string, value: unknown): string {
  return canonicalShaV595Exact({ version, value });
}

export function exactCandidateForLaneV595(lane: V595ExactAbLane): V595ExactAbCandidate {
  if (lane === "baseline-v594") return "v594";
  if (lane === "candidate-v595") return "v595";
  throw new Error(`v595-exact-lane:${String(lane)}`);
}

export type V595ExactAbFrame = Readonly<{
  frameId: string;
  lane: V595ExactAbLane;
  targetId: string;
  archetype: string;
  mode: V595ExactAbMode;
  simDays: 0;
  paused: true;
  cameraPreset: string;
  assetReady: true;
  selectedTargetReady: true;
  controlsCollapsed: true;
}>;

export type V595ExactAbSimulationState = Readonly<{
  simDays: 0;
  paused: true;
  selectedTargetId: string;
  archetype: string;
  mode: V595ExactAbMode;
  assetReady: true;
  selectedTargetReady: true;
  controlsCollapsed: true;
}>;

export type V595ExactAbRuntimeRequest = Readonly<{
  version: typeof V595_EXACT_AB_RUNTIME_VERSION;
  frame: V595ExactAbFrame;
  captureRequestId: string;
  identity: AtlasV595BuildIdentity;
}>;

export type V595StellarRenderProfile = Readonly<{
  version: "v595-stellar-render-profile-v1";
  rendererContractVersion: "v594-stellar-portrait-render-contract-v1";
  lane: V595ExactAbLane;
  candidate: V595ExactAbCandidate;
  targetId: string;
  archetype: string;
  mode: "cinematic" | "science";
  captureRequestId: string;
}>;

export function createV595ExactAbRuntimeRequest({
  lane,
  targetId,
  archetype,
  mode,
  identity,
}: Readonly<{
  lane: V595ExactAbLane;
  targetId: string;
  archetype: string;
  mode: V595ExactAbMode;
  identity: AtlasV595BuildIdentity;
}>): V595ExactAbRuntimeRequest {
  exactCandidateForLaneV595(lane);
  if (!targetId || !archetype) throw new Error("v595-exact-target-archetype");
  if (identity.bindingStatus !== "bound") throw new Error("v595-exact-identity-unbound");
  const frame = Object.freeze({
    frameId: `exact-${archetype}-${lane}`,
    lane,
    targetId,
    archetype,
    mode,
    simDays: 0 as const,
    paused: true as const,
    cameraPreset: `v595-exact-${archetype}-camera-v1`,
    assetReady: true as const,
    selectedTargetReady: true as const,
    controlsCollapsed: true as const,
  });
  return Object.freeze({
    version: V595_EXACT_AB_RUNTIME_VERSION,
    frame,
    captureRequestId: canonicalShaV595Exact({
      version: "v595-exact-capture-request-v1",
      identity: {
        sourceManifestSha256: identity.sourceManifestSha256,
        candidateManifestSha256: identity.candidateManifestSha256,
        buildFingerprint: identity.buildFingerprint,
      },
      frame,
    }),
    identity,
  });
}

export function createV595StellarRenderProfile(
  request: V595ExactAbRuntimeRequest,
): V595StellarRenderProfile | null {
  if (request.frame.archetype === "relativity-workbench") return null;
  if (request.frame.mode === "validation") throw new Error("v595-stellar-validation-mode");
  return Object.freeze({
    version: "v595-stellar-render-profile-v1" as const,
    rendererContractVersion: "v594-stellar-portrait-render-contract-v1" as const,
    lane: request.frame.lane,
    candidate: exactCandidateForLaneV595(request.frame.lane),
    targetId: request.frame.targetId,
    archetype: request.frame.archetype,
    mode: request.frame.mode,
    captureRequestId: request.captureRequestId,
  });
}

export function exactSimulationStateBindingV595(
  frame: V595ExactAbFrame,
): V595ExactAbSimulationState {
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

export function deriveExactCameraStateShaV595(value: unknown): string {
  return domainSha("v595-exact-camera-state-v1", value);
}

export function deriveExactSimulationStateShaV595(value: unknown): string {
  return domainSha("v595-exact-simulation-state-v1", value);
}

export function deriveExactRenderContractShaV595(value: unknown): string {
  return domainSha("v595-exact-render-contract-v1", value);
}

export function deriveExactRenderStateShaV595(value: unknown): string {
  return domainSha("v595-exact-render-state-v1", value);
}

// The camera, clock and renderer census shapes are stable renderer machinery.
// They are type-only aliases; all v595 versions, domains, identities and seals
// below are independently defined and cannot emit a v594 receipt.
export type V595ExactAbCameraState = V594ExactAbCameraState;
export type V595ExactAbFrameClock = V594ExactAbFrameClock;
export type V595ExactAbSoakSnapshot = V594ExactAbSoakSnapshot;
export type V595ExactAbOptionalTextureCacheSnapshot =
  V594ExactAbOptionalTextureCacheSnapshot;

export type V595ExactAbSoakProfile = Readonly<{
  key: string;
  targetId: string;
  archetype: string | null;
  kind: "stellar" | "relativity";
  stable: true;
}>;

export type V595ExactAbSettleProof = Readonly<{
  policy: typeof V595_EXACT_AB_SETTLE_POLICY;
  stableForMilliseconds: number;
  stableFrameSampleCount: number;
  censusFingerprintSha256: string;
  optionalTextureCache: V595ExactAbOptionalTextureCacheSnapshot;
}>;

export type V595ExactAbRelativityObservation = Readonly<{
  version: typeof V595_EXACT_AB_RELATIVITY_OBSERVATION_VERSION;
  active: boolean;
  targetId: string | null;
  workbenchMode: "validation" | "none";
  authority: "shadow-only" | "none";
  referenceCandidate: "timelike-kerr-v595" | "none";
  formalEvidence: false;
  promotion: "none";
  defaultKernel: "legacy-eih-1pn";
  scientificPayloadWriteback: false;
}>;

export type V595ExactAbSoakObservability = Readonly<{
  version: typeof V595_EXACT_AB_SOAK_OBSERVABILITY_VERSION;
  profileKey: string;
  profileBindingSha256: string;
  profile: V595ExactAbSoakProfile;
  rendererIdentity: Readonly<{
    canvasIdentity: typeof V595_EXACT_AB_CANVAS_IDENTITY;
    renderer: "WebGLRenderer";
    context: "webgl" | "webgl2" | null;
  }>;
  rendererIdentitySha256: string;
  snapshot: V595ExactAbSoakSnapshot;
  settle: V595ExactAbSettleProof;
  relativityObservation: V595ExactAbRelativityObservation;
  relativityObservationSha256: string;
}>;

function finiteNonnegativeIntegerOrNull(value: number | null): boolean {
  return value === null || (Number.isInteger(value) && value >= 0);
}

export function createV595ExactAbSoakObservability({
  request,
  rendererIdentity,
  snapshot,
  settle,
}: Readonly<{
  request: V595ExactAbRuntimeRequest;
  rendererIdentity: V595ExactAbSoakObservability["rendererIdentity"];
  snapshot: V595ExactAbSoakSnapshot;
  settle: Omit<V595ExactAbSettleProof, "policy">;
}>): V595ExactAbSoakObservability {
  const relativity = request.frame.archetype === "relativity-workbench";
  if (relativity !== (request.frame.mode === "validation")) {
    throw new Error("v595-exact-relativity-observation");
  }
  const profileBinding = Object.freeze({
    version: "v595-exact-ab-soak-profile-key-v1" as const,
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
    version: V595_EXACT_AB_RELATIVITY_OBSERVATION_VERSION,
    active: relativity,
    targetId: relativity ? request.frame.targetId : null,
    workbenchMode: relativity ? "validation" as const : "none" as const,
    authority: relativity ? "shadow-only" as const : "none" as const,
    referenceCandidate: relativity ? "timelike-kerr-v595" as const : "none" as const,
    formalEvidence: false as const,
    promotion: "none" as const,
    defaultKernel: "legacy-eih-1pn" as const,
    scientificPayloadWriteback: false as const,
  });
  if (
    rendererIdentity.canvasIdentity !== V595_EXACT_AB_CANVAS_IDENTITY
    || rendererIdentity.renderer !== "WebGLRenderer"
    || !["webgl", "webgl2", null].includes(rendererIdentity.context)
    || snapshot.captureKind !== "mounted-renderer"
    || snapshot.renderer.resourceCountersSource !== "three.webglrenderer.info"
    || ![0, 1, null].includes(snapshot.renderer.active)
    || ![0, 1, null].includes(snapshot.scene.active)
    || snapshot.canvas.count !== 1
    || snapshot.canvas.connected !== 1
    || censusValues.some((value) => !finiteNonnegativeIntegerOrNull(value))
    || snapshot.scene.candidateNodes === null
    || snapshot.scene.candidateNodes < 1
  ) throw new Error("v595-exact-soak-observability");
  if (
    !Number.isFinite(settle.stableForMilliseconds)
    || settle.stableForMilliseconds < V595_EXACT_AB_SETTLE_POLICY.minimumStableMilliseconds
    || !Number.isInteger(settle.stableFrameSampleCount)
    || settle.stableFrameSampleCount < V595_EXACT_AB_SETTLE_POLICY.minimumStableFrameSamples
    || settle.censusFingerprintSha256 !== canonicalShaV595Exact(snapshot)
    || !["uninitialized", "active", "disposed"].includes(settle.optionalTextureCache.status)
    || settle.optionalTextureCache.status === "disposed"
    || optionalTextureValues.some((value) => !Number.isInteger(value) || value < 0)
    || settle.optionalTextureCache.pending !== V595_EXACT_AB_SETTLE_POLICY.optionalTexturePendingRequired
    || settle.optionalTextureCache.retainedTextures > settle.optionalTextureCache.entries
    || settle.optionalTextureCache.registeredTextures > settle.optionalTextureCache.entries
  ) throw new Error("v595-exact-settle-proof");
  return Object.freeze({
    version: V595_EXACT_AB_SOAK_OBSERVABILITY_VERSION,
    profileKey,
    profileBindingSha256: canonicalShaV595Exact(profileBinding),
    profile,
    rendererIdentity,
    rendererIdentitySha256: canonicalShaV595Exact(rendererIdentity),
    snapshot,
    settle: Object.freeze({ ...settle, policy: V595_EXACT_AB_SETTLE_POLICY }),
    relativityObservation,
    relativityObservationSha256: canonicalShaV595Exact(relativityObservation),
  });
}

export type V595ExactAbRenderContractState = Readonly<{
  candidate: V595ExactAbCandidate;
  targetId: string;
  archetype: string;
  mode: V595ExactAbMode;
  presentationAuthority: "none";
  relativityAuthority: "shadow-only";
  scientificAuthority: false;
  measuredAuthority: false;
  gpuAuthority: false;
  radiativeTransferAuthority: false;
  grmhdAuthority: false;
  promotion: "none";
  defaultKernel: "legacy-eih-1pn";
  scientificPayloadWriteback: false;
  sourceBindingSha256: string;
}>;

export type V595ExactAbConsumerReceipt = Readonly<{
  version: typeof V595_EXACT_AB_CONSUMER_RECEIPT_VERSION;
  runtimeVersion: typeof V595_EXACT_AB_RUNTIME_VERSION;
  consumer: typeof V595_EXACT_AB_CONSUMER;
  identity: AtlasV595BuildIdentity;
  frame: V595ExactAbFrame;
  captureRequestId: string;
  cameraState: V595ExactAbCameraState;
  cameraStateSha256: string;
  simulationState: V595ExactAbSimulationState;
  simulationStateSha256: string;
  render: Readonly<{
    candidate: V595ExactAbCandidate;
    candidateNodeIds: readonly string[];
    candidateNodeCount: number;
    contractState: V595ExactAbRenderContractState;
    contractSha256: string;
    revision: 594 | 595;
    state: Readonly<{
      candidate: V595ExactAbCandidate;
      targetId: string;
      archetype: string;
      mode: V595ExactAbMode;
      contractSha256: string;
      revision: 594 | 595;
      candidateNodeIds: readonly string[];
    }>;
    stateSha256: string;
  }>;
  canvas: typeof V595_EXACT_AB_CANVAS_CONTRACT;
  soakObservability: V595ExactAbSoakObservability;
  frameClock: V595ExactAbFrameClock;
  receiptSha256: string;
}>;

export function createV595ExactAbConsumerReceipt({
  request,
  cameraState,
  candidateNodeIds,
  sourceBindingSha256,
  soakObservability,
  frameClock,
}: Readonly<{
  request: V595ExactAbRuntimeRequest;
  cameraState: V595ExactAbCameraState;
  candidateNodeIds: readonly string[];
  sourceBindingSha256: string;
  soakObservability: V595ExactAbSoakObservability;
  frameClock: V595ExactAbFrameClock;
}>): V595ExactAbConsumerReceipt {
  if (request.identity.bindingStatus !== "bound") throw new Error("v595-exact-receipt-identity");
  const sortedNodeIds = Object.freeze([...new Set(candidateNodeIds)].sort());
  if (sortedNodeIds.length === 0 || sortedNodeIds.length !== candidateNodeIds.length) {
    throw new Error("v595-exact-receipt-candidate-nodes");
  }
  if (!/^[0-9a-f]{64}$/.test(sourceBindingSha256)) throw new Error("v595-exact-source-binding");
  if (
    soakObservability.profile.targetId !== request.frame.targetId
    || soakObservability.profileKey !== soakObservability.profile.key
    || soakObservability.snapshot.scene.candidateNodes !== sortedNodeIds.length
  ) throw new Error("v595-exact-soak-binding");
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
  ) throw new Error("v595-exact-frame-clock");
  const candidate = exactCandidateForLaneV595(request.frame.lane);
  const revision = candidate === "v594" ? 594 as const : 595 as const;
  const simulationState = exactSimulationStateBindingV595(request.frame);
  const contractState = Object.freeze({
    candidate,
    targetId: request.frame.targetId,
    archetype: request.frame.archetype,
    mode: request.frame.mode,
    presentationAuthority: "none" as const,
    relativityAuthority: "shadow-only" as const,
    scientificAuthority: false as const,
    measuredAuthority: false as const,
    gpuAuthority: false as const,
    radiativeTransferAuthority: false as const,
    grmhdAuthority: false as const,
    promotion: "none" as const,
    defaultKernel: "legacy-eih-1pn" as const,
    scientificPayloadWriteback: false as const,
    sourceBindingSha256,
  });
  const contractSha256 = deriveExactRenderContractShaV595(contractState);
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
    version: V595_EXACT_AB_CONSUMER_RECEIPT_VERSION,
    runtimeVersion: V595_EXACT_AB_RUNTIME_VERSION,
    consumer: V595_EXACT_AB_CONSUMER,
    identity: request.identity,
    frame: request.frame,
    captureRequestId: request.captureRequestId,
    cameraState,
    cameraStateSha256: deriveExactCameraStateShaV595(cameraState),
    simulationState,
    simulationStateSha256: deriveExactSimulationStateShaV595(simulationState),
    render: Object.freeze({
      candidate,
      candidateNodeIds: sortedNodeIds,
      candidateNodeCount: sortedNodeIds.length,
      contractState,
      contractSha256,
      revision,
      state: renderState,
      stateSha256: deriveExactRenderStateShaV595(renderState),
    }),
    canvas: V595_EXACT_AB_CANVAS_CONTRACT,
    soakObservability,
    frameClock,
  };
  return Object.freeze({ ...unsigned, receiptSha256: canonicalShaV595Exact(unsigned) });
}
