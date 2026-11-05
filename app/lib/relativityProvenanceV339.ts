import { acquireAtlasResource, diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot, type AtlasResourceBaselineDiffV300 } from "./atlasResourceLifecycle";
import type { AtlasRelativityEvidenceSnapshotV338 } from "./relativityWorkbenchEvidenceV338";

export const RELATIVITY_PROVENANCE_VERSION_V339 = "v339-relativity-sanitized-provenance-v1" as const;

export type RelativityProvenanceRowV339 = Readonly<{
  phase: "v314" | "v336" | "v337";
  status: string;
  metric: string;
  artifactSha256: string | null;
}>;

export type RelativityProvenanceBundleV339 = Readonly<{
  version: typeof RELATIVITY_PROVENANCE_VERSION_V339;
  authority: Readonly<{
    scienceAuthority: "v312-v313-short-gate-sparse";
    fullShortAuthoritySha256: string | null;
    geometryAuthoritySha256: string | null;
    polarizationAuthoritySha256: string | null;
    rayPlanAuthoritySha256: string | null;
  }>;
  rows: readonly RelativityProvenanceRowV339[];
  dense: Readonly<{
    namespace: "v314";
    status: "incomplete-0-of-49";
    aggregateAvailable: false;
    rawRayBufferIncluded: false;
  }>;
  sanitization: Readonly<{
    rawRayBufferIncluded: false;
    screenshotsIncluded: false;
    absolutePathsIncluded: false;
    pidIncluded: false;
    hostIncluded: false;
    transientMemoryIncluded: false;
  }>;
}>;

export type RelativityProvenanceObjectUrlReplayV339 = Readonly<{
  version: "v339-object-url-lifecycle-replay-v1";
  status: "qualified-object-url-release-baseline-return";
  acquiredCount: 2;
  during: AtlasResourceBaselineDiffV300;
  afterFirstRelease: AtlasResourceBaselineDiffV300;
  afterDuplicateRelease: AtlasResourceBaselineDiffV300;
  idempotentRelease: true;
  baselineReturned: true;
  boundary: "bounded-browser-export-fixture-no-network-no-file-write";
}>;

function freezeRow(row: RelativityProvenanceRowV339): RelativityProvenanceRowV339 { return Object.freeze(row); }

export function createRelativityProvenanceBundleV339(snapshot: AtlasRelativityEvidenceSnapshotV338): RelativityProvenanceBundleV339 {
  const v314 = snapshot.current.v314;
  const v336 = snapshot.current.v336;
  const v337 = snapshot.current.v337;
  const v315 = snapshot.current.v315;
  if (v314.status !== "incomplete-0-of-49" || v314.aggregateAvailable !== false || v336.status !== "runtime-profile-state-replay-qualified-browser-pending" || v337.status !== "science-cinematic-buffer-replay-qualified-browser-pending") throw new Error("v339-provenance-authority-boundary");
  return Object.freeze({
    version: RELATIVITY_PROVENANCE_VERSION_V339,
    authority: Object.freeze({ scienceAuthority: "v312-v313-short-gate-sparse", fullShortAuthoritySha256: v315.fullShortAuthoritySha256, geometryAuthoritySha256: v315.geometryAuthoritySha256, polarizationAuthoritySha256: v315.polarizationAuthoritySha256, rayPlanAuthoritySha256: v315.rayPlanAuthoritySha256 }),
    rows: Object.freeze([
      freezeRow({ phase: "v314", status: v314.status, metric: `dense campaign ${v314.completedShardCount}/49 · aggregate unavailable · runNext disabled`, artifactSha256: v314.artifactSha256 }),
      freezeRow({ phase: "v336", status: v336.status, metric: `${v336.sequence.join(" → ")} · sceneRevision Δ${v336.sceneRevisionDelta} · camera ${v336.cameraLeaseBaseline ? "baseline" : "drift"} · Canvas ${v336.singleCanvasStable ? "1" : "pending"}`, artifactSha256: v336.artifactSha256 }),
      freezeRow({ phase: "v337", status: v337.status, metric: `${v337.sampleCount} rays · ${v337.scientificBufferFieldCount} scientific fields · Science ${v337.scienceOutputProfileInvariant ? "invariant" : "pending"} · Cinematic ${v337.cinematicProfileOutputsDistinct ? "distinct" : "pending"}`, artifactSha256: v337.artifactSha256 }),
    ]),
    dense: Object.freeze({ namespace: "v314", status: "incomplete-0-of-49", aggregateAvailable: false, rawRayBufferIncluded: false }),
    sanitization: Object.freeze({ rawRayBufferIncluded: false, screenshotsIncluded: false, absolutePathsIncluded: false, pidIncluded: false, hostIncluded: false, transientMemoryIncluded: false }),
  });
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
}

export function serializeRelativityProvenanceJsonV339(bundle: RelativityProvenanceBundleV339): string {
  return `${JSON.stringify(canonicalize(bundle), null, 2)}\n`;
}

function csvCell(value: string): string { return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value; }

export function serializeRelativityProvenanceCsvV339(bundle: RelativityProvenanceBundleV339): string {
  const header = "phase,status,metric,artifactSha256";
  const rows = bundle.rows.map((row) => [row.phase, row.status, row.metric, row.artifactSha256 ?? "unavailable"].map(csvCell).join(","));
  return `${header}\n${rows.join("\n")}\n`;
}

export function runRelativityProvenanceObjectUrlReplayV339(jsonBytes: number, csvBytes: number): RelativityProvenanceObjectUrlReplayV339 {
  const baseline = getAtlasResourceSnapshot();
  const releases = [
    acquireAtlasResource("object-url", "relativity-lab", "v339:provenance-json", { owner: "v339-provenance-export", estimatedBytes: jsonBytes }),
    acquireAtlasResource("object-url", "relativity-lab", "v339:provenance-csv", { owner: "v339-provenance-export", estimatedBytes: csvBytes }),
  ];
  const during = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  for (let index = releases.length - 1; index >= 0; index -= 1) releases[index]();
  const afterFirstRelease = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  releases.forEach((release) => release());
  const afterDuplicateRelease = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  if (during.total !== 2 || during.objectUrls !== 2 || afterFirstRelease.status !== "baseline" || afterDuplicateRelease.status !== "baseline") throw new Error("v339-object-url-lifecycle-replay-failed");
  return Object.freeze({ version: "v339-object-url-lifecycle-replay-v1", status: "qualified-object-url-release-baseline-return", acquiredCount: 2, during, afterFirstRelease, afterDuplicateRelease, idempotentRelease: true, baselineReturned: true, boundary: "bounded-browser-export-fixture-no-network-no-file-write" });
}
