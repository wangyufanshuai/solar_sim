import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { loadAtlasRelativityEvidenceSnapshotV330 } from "./relativityEvidenceServerV330";
import type { AtlasRelativityEvidenceSnapshotV330 } from "./relativityWorkbenchEvidenceV330";
import type { AtlasRelativityEvidenceSnapshotV338, RelativityWorkbenchEvidenceV338 } from "./relativityWorkbenchEvidenceV338";

const INPUT_MAX_BYTES = 128 * 1024;
const FILES = ["dist/science/orbit-atlas-shadow-v336-evidence.json", "dist/science/orbit-atlas-shadow-v337-evidence.json"] as const;
type Document = Record<string, unknown>;
type Loaded = Readonly<{ document: Document; evidenceSha256: string }>;
type CacheEntry = { fingerprint: string; promise: Promise<readonly Loaded[]> };
const cache = new Map<string, CacheEntry>();

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Document)
    .filter(([key]) => !["generatedAt", "artifactSha256", "pointerSha256", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}
function canonicalSha(value: unknown): string { return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex"); }
function record(value: unknown): Document { return value && typeof value === "object" && !Array.isArray(value) ? value as Document : {}; }
function sha(value: unknown): value is string { return typeof value === "string" && /^[a-f0-9]{64}$/.test(value); }
function integer(value: unknown, minimum: number, maximum: number): number { return Number.isSafeInteger(value) ? Math.min(maximum, Math.max(minimum, Number(value))) : 0; }
function bool(value: unknown): boolean { return value === true; }
const SENSITIVE_KEYS = new Set(["generatedAt", "absolutePath", "host", "pid", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"]);
function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Document).filter(([key]) => !SENSITIVE_KEYS.has(key)).map(([key, entry]) => [key, sanitize(entry)]));
}

async function loadDocuments(root: string): Promise<readonly Loaded[]> {
  const absolutePaths = FILES.map((relative) => resolve(root, relative));
  const metadata = await Promise.all(absolutePaths.map((path) => stat(path)));
  if (metadata.some((entry) => !entry.isFile() || entry.size <= 0 || entry.size > INPUT_MAX_BYTES)) throw new Error("v338-evidence-input-boundary");
  const fingerprint = metadata.map((entry) => `${entry.size}:${entry.mtimeMs}`).join("|");
  const cacheKey = resolve(root);
  const cached = cache.get(cacheKey);
  if (cached?.fingerprint === fingerprint) return cached.promise;
  const promise = Promise.all(absolutePaths.map(async (path, index) => {
    const bytes = await readFile(path);
    if (bytes.byteLength !== metadata[index].size) throw new Error("v338-evidence-changed-during-read");
    const document = JSON.parse(bytes.toString("utf8")) as Document;
    const expected = document.evidenceSha256;
    if (!sha(expected)) throw new Error("v338-evidence-sha-missing");
    const unsigned = { ...document };
    delete unsigned.evidenceSha256;
    if (canonicalSha(unsigned) !== expected) throw new Error("v338-evidence-sha-mismatch");
    return { document, evidenceSha256: expected };
  }));
  cache.set(cacheKey, { fingerprint, promise });
  try { return await promise; } catch (error) { if (cache.get(cacheKey)?.promise === promise) cache.delete(cacheKey); throw error; }
}

function unavailable(): RelativityWorkbenchEvidenceV338 {
  return {
    v336: { status: "unavailable", sequence: [], transitionCount: 0, sceneRevisionDelta: 0, stateInvariantsStable: false, cameraLeaseBaseline: false, singleCanvasStable: false, resolverReferencesStable: false, artifactSha256: null },
    v337: { status: "unavailable", sampleCount: 0, classificationCounts: { capture: 0, escape: 0, diskHit: 0 }, scientificBufferFieldCount: 0, scientificBufferByteLength: 0, allScientificBuffersByteIdentical: false, scienceOutputProfileInvariant: false, scienceOutputDeterministic: false, cinematicOutputDeterministic: false, cinematicProfileOutputsDistinct: false, scienceAndCinematicBuffersDisjoint: false, scienceOutputDigest: null, v5CinematicOutputDigest: null, v6CinematicOutputDigest: null, artifactSha256: null },
  };
}

function validate(documents: readonly Loaded[]): void {
  const [v336, v337] = documents.map((entry) => entry.document);
  if (v336.version !== "orbit-atlas-shadow-v336-evidence-v1" || v336.status !== "runtime-profile-state-replay-v336-qualified-browser-pending-dense-incomplete-0-of-49"
    || v337.version !== "orbit-atlas-shadow-v337-evidence-v1" || v337.status !== "science-cinematic-buffer-replay-v337-qualified-browser-pending-dense-incomplete-0-of-49") throw new Error("v338-evidence-version-mismatch");
  for (const document of [v336, v337]) {
    const campaign = record(document.correctedCampaign);
    if (campaign.namespace !== "v314" || campaign.status !== "incomplete-0-of-49" || campaign.completedShardCount !== 0 || campaign.plannedShardCount !== 49 || campaign.attemptConsumed !== false || campaign.aggregateAvailable !== false) throw new Error("v338-dense-boundary-mismatch");
  }
}

export async function loadAtlasRelativityEvidenceSnapshotV338(root = process.cwd()): Promise<AtlasRelativityEvidenceSnapshotV338> {
  try {
    const [base, documents] = await Promise.all([loadAtlasRelativityEvidenceSnapshotV330(root), loadDocuments(root)]);
    if (base.status !== "ready") throw new Error("v338-base-evidence-unavailable");
    validate(documents);
    const sanitizedBase = sanitize(base) as AtlasRelativityEvidenceSnapshotV330;
    const [e336, e337] = documents.map((entry) => entry.document);
    const r336 = record(e336.replay); const c336 = record(e336.canvas); const l336 = record(e336.cameraLease); const b337 = record(e337.buffers); const g337 = record(e337.rendering); const d336 = record(e336.dependency); const d337 = record(e337.dependency); const authority337 = record(e337.authority);
    const sequence = Array.isArray(r336.sequence) ? r336.sequence.filter((entry): entry is string => typeof entry === "string").slice(0, 4) : [];
    const counts = record(authority337.classificationCounts);
    if (sequence.join("|") !== "legacy-v9|science-cinematic-v5-v299|science-cinematic-v6-v300|legacy-v9" || r336.transitionCount !== 3 || r336.sceneRevisionDelta !== 0 || r336.allModifiedGlobalStoreFieldsRestored !== true
      || l336.afterStatus !== "baseline" || l336.identityReturnedToBaseline !== true || c336.stable !== true || e337.status !== "science-cinematic-buffer-replay-v337-qualified-browser-pending-dense-incomplete-0-of-49"
      || b337.allScientificBuffersByteIdentical !== true || b337.rendererOutputsDisjointFromAuthority !== true || g337.scienceOutputProfileInvariant !== true || g337.scienceOutputDeterministic !== true || g337.cinematicOutputDeterministic !== true || g337.cinematicProfileOutputsDistinct !== true || g337.scienceAndCinematicBuffersDisjoint !== true) throw new Error("v338-runtime-boundary-mismatch");
    const current: AtlasRelativityEvidenceSnapshotV338["current"] = {
      ...sanitizedBase.current,
      v336: { status: "runtime-profile-state-replay-qualified-browser-pending", sequence, transitionCount: integer(r336.transitionCount, 0, 3), sceneRevisionDelta: integer(r336.sceneRevisionDelta, -1, 1), stateInvariantsStable: bool(r336.selectionStable) && bool(r336.sceneModeStable) && bool(r336.scaleBandStable) && bool(r336.scaleJourneyStable) && bool(r336.researchStateStable) && bool(r336.focusStateStable) && bool(r336.panelStateStable) && bool(r336.safeViewportStable) && bool(r336.allModifiedGlobalStoreFieldsRestored), cameraLeaseBaseline: bool(l336.identityReturnedToBaseline) && l336.afterStatus === "baseline", singleCanvasStable: bool(c336.stable), resolverReferencesStable: bool(r336.resolverReferencesStable), artifactSha256: sha(d336.runtimeStateReplayArtifactSha256) ? d336.runtimeStateReplayArtifactSha256 as string : null },
      v337: { status: "science-cinematic-buffer-replay-qualified-browser-pending", sampleCount: integer(authority337.sampleCount, 0, 16), classificationCounts: { capture: integer(counts.capture, 0, 16), escape: integer(counts.escape, 0, 16), diskHit: integer(counts.diskHit, 0, 16) }, scientificBufferFieldCount: integer(b337.scientificBufferFieldCount, 0, 128), scientificBufferByteLength: integer(b337.scientificBufferByteLength, 0, 2_000_000), allScientificBuffersByteIdentical: bool(b337.allScientificBuffersByteIdentical), scienceOutputProfileInvariant: bool(g337.scienceOutputProfileInvariant), scienceOutputDeterministic: bool(g337.scienceOutputDeterministic), cinematicOutputDeterministic: bool(g337.cinematicOutputDeterministic), cinematicProfileOutputsDistinct: bool(g337.cinematicProfileOutputsDistinct), scienceAndCinematicBuffersDisjoint: bool(g337.scienceAndCinematicBuffersDisjoint), scienceOutputDigest: typeof g337.scienceOutputDigest === "string" ? g337.scienceOutputDigest : null, v5CinematicOutputDigest: typeof g337.v5CinematicOutputDigest === "string" ? g337.v5CinematicOutputDigest : null, v6CinematicOutputDigest: typeof g337.v6CinematicOutputDigest === "string" ? g337.v6CinematicOutputDigest : null, artifactSha256: sha(d337.bufferReplayArtifactSha256) ? d337.bufferReplayArtifactSha256 as string : null },
    };
    return { ...sanitizedBase, version: "v338-relativity-evidence-snapshot", current };
  } catch {
    const base = await loadAtlasRelativityEvidenceSnapshotV330(root);
    const sanitizedBase = sanitize(base) as AtlasRelativityEvidenceSnapshotV330;
    return { ...sanitizedBase, version: "v338-relativity-evidence-snapshot", status: "corrupt", current: { ...sanitizedBase.current, ...unavailable() } };
  }
}

export function resetRelativityEvidenceServerV338CacheForTests(): void { cache.clear(); }
