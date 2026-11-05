import {
  acquireAtlasResource,
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
  listAtlasRuntimeResources,
  type AtlasResourceBaselineDiffV300,
  type AtlasRuntimeResourceKind,
} from "./atlasResourceLifecycle";
import type { AtlasSceneModeV2 } from "./atlasRuntimeStore";

export const ATLAS_RESOURCE_LIFECYCLE_REPLAY_VERSION_V335 = "v335-atlas-all-kind-lifecycle-replay-v1" as const;

export type AtlasResourceLifecycleReplayCaseV335 = Readonly<{
  kind: AtlasRuntimeResourceKind;
  sceneMode: AtlasSceneModeV2;
  owner: string;
  label: string;
  estimatedBytes: number;
}>;

export const ATLAS_RESOURCE_LIFECYCLE_REPLAY_CASES_V335: readonly AtlasResourceLifecycleReplayCaseV335[] = Object.freeze([
  { kind: "worker", sceneMode: "relativity-lab", owner: "v335-authority", label: "authority-worker", estimatedBytes: 1_024 },
  { kind: "gpu-render-target", sceneMode: "kerr", owner: "v335-kerr", label: "science-target", estimatedBytes: 4_096 },
  { kind: "gpu-buffer", sceneMode: "kerr", owner: "v335-kerr", label: "ray-buffer", estimatedBytes: 8_192 },
  { kind: "gpu-compute-pipeline", sceneMode: "kerr", owner: "v335-kerr", label: "shadow-pipeline", estimatedBytes: 2_048 },
  { kind: "gpu-query", sceneMode: "kerr", owner: "v335-kerr", label: "timestamp-query", estimatedBytes: 512 },
  { kind: "texture", sceneMode: "kerr", owner: "v335-kerr", label: "transfer-texture", estimatedBytes: 16_384 },
  { kind: "model", sceneMode: "launch", owner: "v335-launch", label: "spacecraft-model", estimatedBytes: 2_048 },
  { kind: "subscription", sceneMode: "atlas", owner: "v335-runtime", label: "telemetry-subscription", estimatedBytes: 256 },
  { kind: "object-url", sceneMode: "relativity-lab", owner: "v335-export", label: "provenance-object-url", estimatedBytes: 128 },
  { kind: "typed-array-cache", sceneMode: "kerr", owner: "v335-kerr", label: "science-payload-cache", estimatedBytes: 4_096 },
  { kind: "camera-lock", sceneMode: "inspect", owner: "v335-camera", label: "observer-camera-lease", estimatedBytes: 0 },
]);

export type AtlasResourceLifecycleReplayV335 = Readonly<{
  version: typeof ATLAS_RESOURCE_LIFECYCLE_REPLAY_VERSION_V335;
  status: "qualified-all-kinds-idempotent-baseline-return";
  resourceKindCount: 11;
  acquiredCount: 11;
  uniqueIdentityCount: 11;
  during: AtlasResourceBaselineDiffV300;
  afterFirstRelease: AtlasResourceBaselineDiffV300;
  afterDuplicateRelease: AtlasResourceBaselineDiffV300;
  releaseOrder: readonly AtlasRuntimeResourceKind[];
  baselineIdentityDigest: string;
  returnIdentityDigest: string;
  allKindsCovered: true;
  reverseRelease: true;
  idempotentRelease: true;
  identityReturnedToBaseline: true;
  ownerReturnedToBaseline: true;
  boundary: "bounded-in-process-fixture-no-worker-gpu-or-network-created";
}>;

export function runAtlasResourceLifecycleReplayV335(): AtlasResourceLifecycleReplayV335 {
  const baseline = getAtlasResourceSnapshot();
  const releases = ATLAS_RESOURCE_LIFECYCLE_REPLAY_CASES_V335.map((entry) => ({
    kind: entry.kind,
    release: acquireAtlasResource(entry.kind, entry.sceneMode, `v335:${entry.label}`, { owner: entry.owner, estimatedBytes: entry.estimatedBytes }),
  }));
  const duringSnapshot = getAtlasResourceSnapshot();
  const during = diffAtlasResourceSnapshotsV300(baseline, duringSnapshot);
  const fixtureResources = listAtlasRuntimeResources().filter((entry) => entry.label.startsWith("v335:"));
  const expectedKinds = new Set<AtlasRuntimeResourceKind>(ATLAS_RESOURCE_LIFECYCLE_REPLAY_CASES_V335.map((entry) => entry.kind));
  const releaseOrder: AtlasRuntimeResourceKind[] = [];
  for (let index = releases.length - 1; index >= 0; index -= 1) {
    releaseOrder.push(releases[index].kind);
    releases[index].release();
  }
  const afterFirstRelease = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  for (const entry of releases) entry.release();
  const returned = getAtlasResourceSnapshot();
  const afterDuplicateRelease = diffAtlasResourceSnapshotsV300(baseline, returned);
  const allKindsCovered = expectedKinds.size === 11 && ATLAS_RESOURCE_LIFECYCLE_REPLAY_CASES_V335.length === 11;
  const reverseRelease = releaseOrder.every((kind, index) => kind === ATLAS_RESOURCE_LIFECYCLE_REPLAY_CASES_V335.at(-(index + 1))?.kind);
  const qualified = during.total === 11 && during.status === "drift" && fixtureResources.length === 11
    && new Set(fixtureResources.map((entry) => JSON.stringify([entry.kind, entry.owner, entry.label]))).size === 11
    && afterFirstRelease.status === "baseline" && afterDuplicateRelease.status === "baseline"
    && returned.identityDigest === baseline.identityDigest && allKindsCovered && reverseRelease;
  if (!qualified) throw new Error("v335-lifecycle-replay-failed");
  return Object.freeze({
    version: ATLAS_RESOURCE_LIFECYCLE_REPLAY_VERSION_V335,
    status: "qualified-all-kinds-idempotent-baseline-return",
    resourceKindCount: 11,
    acquiredCount: 11,
    uniqueIdentityCount: 11,
    during,
    afterFirstRelease,
    afterDuplicateRelease,
    releaseOrder: Object.freeze(releaseOrder),
    baselineIdentityDigest: baseline.identityDigest,
    returnIdentityDigest: returned.identityDigest,
    allKindsCovered: true,
    reverseRelease: true,
    idempotentRelease: true,
    identityReturnedToBaseline: true,
    ownerReturnedToBaseline: true,
    boundary: "bounded-in-process-fixture-no-worker-gpu-or-network-created",
  });
}
