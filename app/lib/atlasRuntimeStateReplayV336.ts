import {
  acquireAtlasResource,
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
  type AtlasResourceBaselineDiffV300,
} from "./atlasResourceLifecycle";
import { atlasRuntimeStore, type AtlasRuntimeStoreState } from "./atlasRuntimeStore";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V299,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V300,
  resolveAtlasVisualProfileV299,
  type AtlasVisualProfileV299,
} from "./atlasVisualProfileV299";
import { createAtlasVisualRuntimeMatrixV334 } from "./atlasVisualRuntimeMatrixV334";

export const ATLAS_RUNTIME_STATE_REPLAY_VERSION_V336 = "v336-atlas-profile-state-replay-v1" as const;

export type AtlasRuntimeStateReplayCanvasAuditV336 = Readonly<{
  canvasCountBefore: 1;
  canvasCountAfter: 1;
  universeCanvasComponentCount: 1;
  sceneHostMountCount: 1;
  sceneHostLimitDeclared: true;
}>;

export type AtlasRuntimeProfileTransitionV336 = Readonly<{
  from: AtlasVisualProfileV299;
  to: AtlasVisualProfileV299;
  changedKeys: readonly ["visualProfile"];
  sceneRevisionBefore: number;
  sceneRevisionAfter: number;
  sceneRevisionDelta: 0;
  nonProfileStateDigest: string;
  resolverReferenceStable: true;
  resourceTotal: number;
  cameraLeaseCount: number;
}>;

export type AtlasRuntimeStateReplayV336 = Readonly<{
  version: typeof ATLAS_RUNTIME_STATE_REPLAY_VERSION_V336;
  status: "qualified-profile-state-camera-canvas-baseline-return";
  sequence: readonly ["legacy-v9", typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V299, typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V300, "legacy-v9"];
  transitions: readonly AtlasRuntimeProfileTransitionV336[];
  originalProfile: AtlasVisualProfileV299;
  originalProfileRestored: true;
  modifiedGlobalStoreFields: readonly ["visualProfile"];
  allModifiedGlobalStoreFieldsRestored: true;
  sceneRevisionDelta: 0;
  selectionStable: true;
  sceneModeStable: true;
  scaleBandStable: true;
  scaleJourneyStable: true;
  researchStateStable: true;
  focusStateStable: true;
  panelStateStable: true;
  qualityTierStable: true;
  safeViewportStable: true;
  resolverReferencesStable: true;
  scienceFieldsEquivalent: true;
  cinematicFieldsDistinct: true;
  profileResourceDriftAbsent: true;
  cameraLeaseDuring: AtlasResourceBaselineDiffV300;
  afterCameraRelease: AtlasResourceBaselineDiffV300;
  cameraLeaseIdentityReturnedToBaseline: true;
  canvas: AtlasRuntimeStateReplayCanvasAuditV336;
  singleCanvasStable: true;
  runtimePhysicsContextStable: true;
  scienceCinematicPresentationDidNotMutateSelectionOrPhysics: true;
  originalStateDigest: string;
  restoredStateDigest: string;
  baselineResourceIdentityDigest: string;
  restoredResourceIdentityDigest: string;
  boundary: "bounded-in-process-store-and-registry-replay-no-renderer-worker-gpu-network-or-physics-created";
}>;

const PROFILE_SEQUENCE = [
  "legacy-v9",
  ATLAS_VISUAL_PROFILE_CANDIDATE_V299,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V300,
  "legacy-v9",
] as const;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}

function digest(value: unknown): string {
  const text = JSON.stringify(canonicalize(value));
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function withoutVisualProfile(snapshot: AtlasRuntimeStoreState): Omit<AtlasRuntimeStoreState, "visualProfile"> {
  const rest = { ...snapshot } as Partial<AtlasRuntimeStoreState>;
  delete rest.visualProfile;
  return rest as Omit<AtlasRuntimeStoreState, "visualProfile">;
}

function changedTopLevelKeys(
  before: AtlasRuntimeStoreState,
  after: AtlasRuntimeStoreState,
): readonly (keyof AtlasRuntimeStoreState)[] {
  return (Object.keys(before) as readonly (keyof AtlasRuntimeStoreState)[])
    .filter((key) => before[key] !== after[key]);
}

export function runAtlasRuntimeStateReplayV336(
  canvas: AtlasRuntimeStateReplayCanvasAuditV336,
): AtlasRuntimeStateReplayV336 {
  const originalState = atlasRuntimeStore.getSnapshot();
  const originalStateDigest = digest(originalState);
  const originalProfile = originalState.visualProfile;
  const baselineResources = getAtlasResourceSnapshot();
  let releaseCameraLease: (() => void) | null = null;
  let result: AtlasRuntimeStateReplayV336 | null = null;

  try {
    atlasRuntimeStore.setVisualProfile("legacy-v9");
    const replayBaseline = atlasRuntimeStore.getSnapshot();
    const invariantDigest = digest(withoutVisualProfile(replayBaseline));
    releaseCameraLease = acquireAtlasResource("camera-lock", replayBaseline.sceneMode, "v336:visual-profile-replay-camera-lease", {
      owner: "v336-runtime-state-replay",
      estimatedBytes: 0,
    });
    const cameraLeaseSnapshot = getAtlasResourceSnapshot();
    const cameraLeaseDuring = diffAtlasResourceSnapshotsV300(baselineResources, cameraLeaseSnapshot);
    const transitions: AtlasRuntimeProfileTransitionV336[] = [];

    for (const target of PROFILE_SEQUENCE.slice(1)) {
      const before = atlasRuntimeStore.getSnapshot();
      atlasRuntimeStore.setVisualProfile(target);
      const after = atlasRuntimeStore.getSnapshot();
      const firstResolution = resolveAtlasVisualProfileV299(target);
      const secondResolution = resolveAtlasVisualProfileV299(target);
      const changedKeys = changedTopLevelKeys(before, after);
      const currentResources = getAtlasResourceSnapshot();
      if (changedKeys.length !== 1 || changedKeys[0] !== "visualProfile"
        || after.sceneRevision !== before.sceneRevision
        || digest(withoutVisualProfile(after)) !== invariantDigest
        || firstResolution !== secondResolution
        || currentResources.identityDigest !== cameraLeaseSnapshot.identityDigest) {
        throw new Error(`v336-profile-transition-drift:${before.visualProfile}:${target}`);
      }
      transitions.push(Object.freeze({
        from: before.visualProfile,
        to: target,
        changedKeys: ["visualProfile"] as const,
        sceneRevisionBefore: before.sceneRevision,
        sceneRevisionAfter: after.sceneRevision,
        sceneRevisionDelta: 0,
        nonProfileStateDigest: invariantDigest,
        resolverReferenceStable: true,
        resourceTotal: currentResources.total,
        cameraLeaseCount: currentResources.cameraLocks,
      }));
    }

    const replayEnd = atlasRuntimeStore.getSnapshot();
    const visualMatrix = createAtlasVisualRuntimeMatrixV334();
    releaseCameraLease();
    releaseCameraLease = null;
    const restoredResources = getAtlasResourceSnapshot();
    const afterCameraRelease = diffAtlasResourceSnapshotsV300(baselineResources, restoredResources);
    atlasRuntimeStore.setVisualProfile(originalProfile);
    const restoredState = atlasRuntimeStore.getSnapshot();
    const restoredStateDigest = digest(restoredState);
    const canvasQualified = canvas.canvasCountBefore === 1 && canvas.canvasCountAfter === 1
      && canvas.universeCanvasComponentCount === 1 && canvas.sceneHostMountCount === 1
      && canvas.sceneHostLimitDeclared === true;
    const qualified = transitions.length === 3
      && replayEnd.sceneRevision === replayBaseline.sceneRevision
      && afterCameraRelease.status === "baseline"
      && restoredResources.identityDigest === baselineResources.identityDigest
      && restoredStateDigest === originalStateDigest
      && visualMatrix.resolverReferenceStable && visualMatrix.scienceFieldsEquivalent
      && visualMatrix.cinematicFieldsDistinct && canvasQualified;
    if (!qualified) throw new Error("v336-runtime-state-replay-failed");

    result = Object.freeze({
      version: ATLAS_RUNTIME_STATE_REPLAY_VERSION_V336,
      status: "qualified-profile-state-camera-canvas-baseline-return",
      sequence: PROFILE_SEQUENCE,
      transitions: Object.freeze(transitions),
      originalProfile,
      originalProfileRestored: true,
      modifiedGlobalStoreFields: ["visualProfile"] as const,
      allModifiedGlobalStoreFieldsRestored: true,
      sceneRevisionDelta: 0,
      selectionStable: true,
      sceneModeStable: true,
      scaleBandStable: true,
      scaleJourneyStable: true,
      researchStateStable: true,
      focusStateStable: true,
      panelStateStable: true,
      qualityTierStable: true,
      safeViewportStable: true,
      resolverReferencesStable: true,
      scienceFieldsEquivalent: true,
      cinematicFieldsDistinct: true,
      profileResourceDriftAbsent: true,
      cameraLeaseDuring,
      afterCameraRelease,
      cameraLeaseIdentityReturnedToBaseline: true,
      canvas,
      singleCanvasStable: true,
      runtimePhysicsContextStable: true,
      scienceCinematicPresentationDidNotMutateSelectionOrPhysics: true,
      originalStateDigest,
      restoredStateDigest,
      baselineResourceIdentityDigest: baselineResources.identityDigest,
      restoredResourceIdentityDigest: restoredResources.identityDigest,
      boundary: "bounded-in-process-store-and-registry-replay-no-renderer-worker-gpu-network-or-physics-created",
    });
  } finally {
    releaseCameraLease?.();
    atlasRuntimeStore.setVisualProfile(originalProfile);
  }

  if (!result) throw new Error("v336-runtime-state-replay-no-result");
  return result;
}
