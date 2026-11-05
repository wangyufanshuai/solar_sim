import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  ATLAS_OBSERVATION_LIFECYCLE_REPLAY_SUMMARY_VERSION_V404,
  type AtlasObservationLifecycleReplaySummaryV404,
} from "../app/lib/atlasObservationLifecycleReplaySummaryV404";
import { parseAtlasObservationEvidenceLifecycleReplayV403 } from "../app/lib/atlasObservationEvidenceLifecycleReplayV403";

const root = process.cwd();
const paths = {
  replay: "dist/science/atlas-observation-evidence-lifecycle-v403/replay-campaign.json",
  evidence: "dist/science/orbit-atlas-shadow-v403-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v403.json",
  summary: "dist/science/atlas-observation-lifecycle-summary-v404/summary.json",
} as const;
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8")) as Record<string, unknown>;
const fileSha256 = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !["generatedAt", "artifactSha256", "summarySha256"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha256 = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, target);
};

const replay = parseAtlasObservationEvidenceLifecycleReplayV403(read(paths.replay));
const evidence = read(paths.evidence) as { evidenceSha256?: string; dependency?: { replayArtifactSha256?: string } };
const pointer = read(paths.pointer) as { pointerSha256?: string; evidence?: { fileSha256?: string; canonicalSha256?: string } };
if (
  canonicalSha256(replay) !== replay.artifactSha256
  || evidence.dependency?.replayArtifactSha256 !== replay.artifactSha256
  || pointer.evidence?.fileSha256 !== fileSha256(paths.evidence)
  || pointer.evidence?.canonicalSha256 !== evidence.evidenceSha256
  || !evidence.evidenceSha256
  || !pointer.pointerSha256
) throw new Error("v404-summary-v403-identity");

const summaryUnsigned = {
  version: ATLAS_OBSERVATION_LIFECYCLE_REPLAY_SUMMARY_VERSION_V404,
  generatedAt: new Date().toISOString(),
  status: "fixture-replay-summary-ready-browser-soak-not-run",
  source: {
    replayArtifactSha256: replay.artifactSha256,
    replayArtifactFileSha256: fileSha256(paths.replay),
    v403EvidenceSha256: evidence.evidenceSha256,
    v403PointerSha256: pointer.pointerSha256,
  },
  replay: {
    cycleCount: 30,
    deterministicExecutionCount: 2,
    totalRequestCount: 114,
    successCount: 108,
    failureCount: 4,
    releasedPendingRequestCount: 2,
    baselineCycleCount: 30,
    maximumCacheEntryCount: 4,
    maximumCachedBytes: replay.campaign.maximumCachedBytes,
    deterministicReplay: true,
    networkAttempted: false,
  },
  stages: {
    constraints: {
      lifetimeRequestCount: replay.stageAudit.constraints.lifetimeRequestCount,
      successCount: replay.stageAudit.constraints.successCount,
      failureCount: replay.stageAudit.constraints.failureCount,
      releasedPendingCount: replay.stageAudit.constraints.releasedPendingCount,
    },
    admission: {
      lifetimeRequestCount: replay.stageAudit.admission.lifetimeRequestCount,
      successCount: replay.stageAudit.admission.successCount,
      failureCount: replay.stageAudit.admission.failureCount,
      releasedPendingCount: replay.stageAudit.admission.releasedPendingCount,
    },
    intake: {
      lifetimeRequestCount: replay.stageAudit.intake.lifetimeRequestCount,
      successCount: replay.stageAudit.intake.successCount,
      failureCount: replay.stageAudit.intake.failureCount,
      releasedPendingCount: replay.stageAudit.intake.releasedPendingCount,
    },
    provenance: {
      lifetimeRequestCount: replay.stageAudit.provenance.lifetimeRequestCount,
      successCount: replay.stageAudit.provenance.successCount,
      failureCount: replay.stageAudit.provenance.failureCount,
      releasedPendingCount: replay.stageAudit.provenance.releasedPendingCount,
    },
  },
  qualification: {
    fixtureReplayQualified: true,
    browserSoakQualified: false,
    productionLifecycleQualified: false,
    scientificAuthorityChanged: false,
    cycleDetailsExposed: false,
  },
} as const;
const summary: AtlasObservationLifecycleReplaySummaryV404 = {
  ...summaryUnsigned,
  summarySha256: canonicalSha256(summaryUnsigned),
};
if ("cycles" in summary || JSON.stringify(summary).includes('"cycle":')) throw new Error("v404-summary-cycle-leak");
atomic(paths.summary, summary);
console.log(JSON.stringify({
  status: summary.status,
  summarySha256: summary.summarySha256,
  sourceReplaySha256: summary.source.replayArtifactSha256,
  cycles: summary.replay.cycleCount,
  requests: summary.replay.totalRequestCount,
  cycleDetailsExposed: summary.qualification.cycleDetailsExposed,
  browserSoakQualified: summary.qualification.browserSoakQualified,
}, null, 2));
