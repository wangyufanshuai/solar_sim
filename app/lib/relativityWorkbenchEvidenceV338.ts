import {
  createRelativityWorkbenchEvidenceModelV330,
  type AtlasRelativityEvidenceSnapshotV330,
  type RelativityWorkbenchEvidenceModelV330,
} from "./relativityWorkbenchEvidenceV330";
import type { RelativityEvidenceLoadStatusV285 } from "./relativityWorkbenchEvidenceV285";
export type { RelativityEvidenceLoadStatusV285 } from "./relativityWorkbenchEvidenceV285";

export type RelativityWorkbenchEvidenceV338 = Readonly<{
  v336: Readonly<{
    status: "runtime-profile-state-replay-qualified-browser-pending" | "unavailable";
    sequence: readonly string[];
    transitionCount: number;
    sceneRevisionDelta: number;
    stateInvariantsStable: boolean;
    cameraLeaseBaseline: boolean;
    singleCanvasStable: boolean;
    resolverReferencesStable: boolean;
    artifactSha256: string | null;
  }>;
  v337: Readonly<{
    status: "science-cinematic-buffer-replay-qualified-browser-pending" | "unavailable";
    sampleCount: number;
    classificationCounts: Readonly<{ capture: number; escape: number; diskHit: number }>;
    scientificBufferFieldCount: number;
    scientificBufferByteLength: number;
    allScientificBuffersByteIdentical: boolean;
    scienceOutputProfileInvariant: boolean;
    scienceOutputDeterministic: boolean;
    cinematicOutputDeterministic: boolean;
    cinematicProfileOutputsDistinct: boolean;
    scienceAndCinematicBuffersDisjoint: boolean;
    scienceOutputDigest: string | null;
    v5CinematicOutputDigest: string | null;
    v6CinematicOutputDigest: string | null;
    artifactSha256: string | null;
  }>;
}>;

export type AtlasRelativityEvidenceSnapshotV338 = Omit<AtlasRelativityEvidenceSnapshotV330, "version" | "current"> & Readonly<{
  version: "v338-relativity-evidence-snapshot";
  current: AtlasRelativityEvidenceSnapshotV330["current"] & RelativityWorkbenchEvidenceV338;
}>;

type RelativityWorkbenchCurrentRowV338 = RelativityWorkbenchEvidenceModelV330["currentRows"][number] | Readonly<{
  id: keyof RelativityWorkbenchEvidenceV338;
  status: string;
  label: string;
  metric: string;
  artifactSha256: string | null;
}>;

export type RelativityWorkbenchEvidenceModelV338 = Omit<RelativityWorkbenchEvidenceModelV330, "version" | "currentRows"> & Readonly<{
  version: "v338-relativity-workbench-evidence-model";
  currentRows: readonly RelativityWorkbenchCurrentRowV338[];
}>;

function digest(value: string | null): string {
  return value == null ? "unavailable" : `${value.slice(0, 10)}…${value.slice(-8)}`;
}

export function createRelativityWorkbenchEvidenceModelV338(
  snapshot: AtlasRelativityEvidenceSnapshotV338,
  loadStatus: RelativityEvidenceLoadStatusV285 = "ready",
): RelativityWorkbenchEvidenceModelV338 {
  const { v336, v337, ...v330Current } = snapshot.current;
  const v330Snapshot: AtlasRelativityEvidenceSnapshotV330 = {
    ...snapshot,
    version: "v330-relativity-evidence-snapshot",
    current: v330Current,
  };
  const previous = createRelativityWorkbenchEvidenceModelV330(v330Snapshot, loadStatus);
  return {
    ...previous,
    version: "v338-relativity-workbench-evidence-model",
    currentRows: [
      ...previous.currentRows,
      {
        id: "v336",
        status: v336.status,
        label: "Profile/state replay",
        metric: `${v336.sequence.join(" → ")} / ${v336.transitionCount} transitions / sceneRevision Δ${v336.sceneRevisionDelta} / state ${v336.stateInvariantsStable ? "stable" : "drift"} / camera ${v336.cameraLeaseBaseline ? "baseline" : "drift"} / Canvas ${v336.singleCanvasStable ? "1" : "pending"} / resolver ${v336.resolverReferencesStable ? "stable" : "pending"}`,
        artifactSha256: v336.artifactSha256,
      },
      {
        id: "v337",
        status: v337.status,
        label: "Science/Cinematic buffer integrity",
        metric: `${v337.sampleCount} sparse rays / ${v337.scientificBufferFieldCount} fields / ${v337.scientificBufferByteLength} bytes / Science ${v337.scienceOutputProfileInvariant && v337.scienceOutputDeterministic ? "invariant" : "pending"} / Cinematic ${v337.cinematicOutputDeterministic && v337.cinematicProfileOutputsDistinct ? "seeded-distinct" : "pending"} / buffers ${v337.allScientificBuffersByteIdentical && v337.scienceAndCinematicBuffersDisjoint ? "disjoint" : "drift"} / digests ${digest(v337.v5CinematicOutputDigest)} · ${digest(v337.v6CinematicOutputDigest)}`,
        artifactSha256: v337.artifactSha256,
      },
    ],
  };
}

export type RelativityEvidenceResponseV338 = Readonly<{
  version: "v338-relativity-evidence-response";
  available: boolean;
  reason: "ready" | "lite-boundary" | "evidence-unavailable" | "evidence-corrupt";
  snapshot: AtlasRelativityEvidenceSnapshotV338 | null;
}>;

export function parseRelativityEvidenceResponseV338(value: unknown): RelativityEvidenceResponseV338 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v338 evidence response is invalid");
  const response = value as Partial<RelativityEvidenceResponseV338>;
  if (response.version !== "v338-relativity-evidence-response" || typeof response.available !== "boolean") throw new Error("v338 evidence response version is invalid");
  if (!["ready", "lite-boundary", "evidence-unavailable", "evidence-corrupt"].includes(String(response.reason))) throw new Error("v338 evidence response reason is invalid");
  if (!response.available) return { version: response.version, available: false, reason: response.reason!, snapshot: null };
  if (!response.snapshot || response.snapshot.version !== "v338-relativity-evidence-snapshot") throw new Error("v338 evidence snapshot is invalid");
  return response as RelativityEvidenceResponseV338;
}
