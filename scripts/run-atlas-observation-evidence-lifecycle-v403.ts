import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401,
  acquireAtlasObservationEvidenceCacheScopeV402,
  getAtlasObservationEvidenceCacheSnapshotV401,
  getAtlasObservationEvidenceLifecycleSnapshotV402,
  loadAtlasObservationEvidenceStageV401,
  resetAtlasObservationEvidenceCacheForTestsV401,
  type AtlasObservationEvidenceStageIdV401,
} from "../app/lib/atlasObservationEvidenceCacheV401";
import { ATLAS_OBSERVATION_EVIDENCE_LIFECYCLE_REPLAY_VERSION_V403, parseAtlasObservationEvidenceLifecycleReplayV403 } from "../app/lib/atlasObservationEvidenceLifecycleReplayV403";

const root = process.cwd();
const artifactPaths = { constraints: "dist/science/kerr-auxiliary-constraint-design-v396/constraint-design.json", admission: "dist/science/kerr-physical-observation-admission-v397/observation-admission.json", intake: "dist/science/kerr-physical-observation-intake-v398/intake-inspect.json", provenance: "dist/science/kerr-physical-observation-template-v399/template-diagnostic.json" } as const;
const artifacts = Object.fromEntries(Object.entries(artifactPaths).map(([stage, path]) => [stage, JSON.parse(readFileSync(resolve(root, path), "utf8"))])) as Record<AtlasObservationEvidenceStageIdV401, unknown>;
const v402Artifact = JSON.parse(readFileSync(resolve(root, "dist/science/atlas-observation-evidence-lifecycle-v402/lifecycle-qualification.json"), "utf8"));
const v402Evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v402-evidence.json"), "utf8"));
const v402Pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v402.json"), "utf8"));
const failureCycles = new Map<number, AtlasObservationEvidenceStageIdV401>([[6, "constraints"], [12, "admission"], [18, "intake"], [24, "provenance"]]);
const releasedPendingCycles = new Set([10, 20]);
const stageFromUrl = (url: string): AtlasObservationEvidenceStageIdV401 => url.includes("v396") ? "constraints" : url.includes("v397") ? "admission" : url.includes("v398") ? "intake" : "provenance";
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => key !== "generatedAt" && key !== "artifactSha256").sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

async function runCampaign() {
  resetAtlasObservationEvidenceCacheForTestsV401();
  let currentCycle = 0;
  let maximumCacheEntryCount = 0;
  let maximumCachedBytes = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    const stage = stageFromUrl(String(input));
    const signal = init?.signal;
    if (releasedPendingCycles.has(currentCycle)) {
      return new Promise<Response>((_resolve, reject) => {
        if (!(signal instanceof AbortSignal)) throw new Error("v403-missing-abort-signal");
        signal.addEventListener("abort", () => reject(new DOMException("fixture scope release", "AbortError")), { once: true });
      });
    }
    if (failureCycles.get(currentCycle) === stage) return Promise.resolve(new Response(JSON.stringify({ available: false, reason: "evidence-corrupt", artifact: null }), { status: 503 }));
    return Promise.resolve(new Response(JSON.stringify({ available: true, reason: "ready", artifact: artifacts[stage] }), { status: 200, headers: { "Content-Type": "application/json" } }));
  }) as typeof fetch;
  const cycles = [];
  try {
    for (currentCycle = 1; currentCycle <= 30; currentCycle += 1) {
      const before = getAtlasObservationEvidenceLifecycleSnapshotV402().lifetimeRequestCount;
      const release = acquireAtlasObservationEvidenceCacheScopeV402("v12-observation-hub");
      const unavailableStage = failureCycles.get(currentCycle) ?? null;
      if (releasedPendingCycles.has(currentCycle)) {
        const pending = loadAtlasObservationEvidenceStageV401("constraints");
        release();
        await Promise.resolve();
        try { await pending; throw new Error("v403-pending-request-not-aborted"); }
        catch (error: unknown) { if (!(error instanceof Error) || !error.message.includes("scope-released")) throw error; }
      } else {
        for (const stage of ATLAS_OBSERVATION_EVIDENCE_STAGE_IDS_V401) {
          try { await loadAtlasObservationEvidenceStageV401(stage); }
          catch (error: unknown) { if (stage !== unavailableStage || !(error instanceof Error) || !error.message.includes("evidence-corrupt")) throw error; }
        }
        const loaded = getAtlasObservationEvidenceCacheSnapshotV401();
        maximumCacheEntryCount = Math.max(maximumCacheEntryCount, loaded.cacheEntryCount);
        maximumCachedBytes = Math.max(maximumCachedBytes, loaded.cachedBytes);
        release();
        await Promise.resolve();
      }
      const cache = getAtlasObservationEvidenceCacheSnapshotV401();
      const lifecycle = getAtlasObservationEvidenceLifecycleSnapshotV402();
      if (cache.cacheEntryCount !== 0 || cache.cachedBytes !== 0 || cache.requestCount !== 0 || lifecycle.activeScopeCount !== 0 || !lifecycle.cacheAtBaseline) throw new Error(`v403-baseline-cycle:${currentCycle}`);
      cycles.push({ cycle: currentCycle, kind: releasedPendingCycles.has(currentCycle) ? "released-pending" : unavailableStage ? "unavailable" : "success", unavailableStage, requestDelta: lifecycle.lifetimeRequestCount - before, cacheEntriesAfterRelease: 0, cachedBytesAfterRelease: 0, activeScopesAfterRelease: 0, baseline: true });
    }
  } finally { globalThis.fetch = originalFetch; }
  const finalLifecycle = getAtlasObservationEvidenceLifecycleSnapshotV402();
  const successCount = Object.values(finalLifecycle.stages).reduce((total, stage) => total + stage.successCount, 0);
  const failureCount = Object.values(finalLifecycle.stages).reduce((total, stage) => total + stage.failureCount, 0);
  return { campaign: { cycleCount: 30, successfulCycleCount: 24, unavailableCycleCount: 4, releasedPendingCycleCount: 2, totalRequestCount: finalLifecycle.lifetimeRequestCount, successCount, failureCount, releasedPendingRequestCount: finalLifecycle.releasedPendingRequestCount, baselineCycleCount: cycles.filter((cycle) => cycle.baseline).length, maximumCacheEntryCount, maximumCachedBytes, networkAttempted: false }, stageAudit: finalLifecycle.stages, cycles, finalLifecycle: { activeScopeCount: finalLifecycle.activeScopeCount, releaseCount: finalLifecycle.releaseCount, lifetimeRequestCount: finalLifecycle.lifetimeRequestCount, releasedPendingRequestCount: finalLifecycle.releasedPendingRequestCount, cacheEntryCount: finalLifecycle.cacheEntryCount, cachedBytes: finalLifecycle.cachedBytes, cacheAtBaseline: finalLifecycle.cacheAtBaseline } };
}

async function main() {
  const first = await runCampaign(); const second = await runCampaign();
  if (canonicalSha(first) !== canonicalSha(second)) throw new Error("v403-nondeterministic-replay");
  const unsigned = { version: ATLAS_OBSERVATION_EVIDENCE_LIFECYCLE_REPLAY_VERSION_V403, generatedAt: new Date().toISOString(), status: "fixture-lifecycle-replay-qualified-browser-soak-pending", source: { v402ArtifactSha256: v402Artifact.artifactSha256, v402EvidenceSha256: v402Evidence.evidenceSha256, v402PointerSha256: v402Pointer.pointerSha256 }, campaign: { ...first.campaign, deterministicExecutionCount: 2, deterministicReplay: true }, stageAudit: first.stageAudit, cycles: first.cycles, finalLifecycle: first.finalLifecycle, qualification: { fixtureReplayQualified: true, browserSoakQualified: false, productionLifecycleQualified: false, scientificAuthorityChanged: false } } as const;
  const artifact = parseAtlasObservationEvidenceLifecycleReplayV403({ ...unsigned, artifactSha256: canonicalSha(unsigned) });
  const target = resolve(root, "dist/science/atlas-observation-evidence-lifecycle-v403/replay-campaign.json"); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`); renameSync(temporary, target);
  console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, cycles: artifact.campaign.cycleCount, requests: artifact.campaign.totalRequestCount, success: artifact.campaign.successCount, failure: artifact.campaign.failureCount, releasedPending: artifact.campaign.releasedPendingRequestCount, baselineCycles: artifact.campaign.baselineCycleCount, maximumCacheEntryCount: artifact.campaign.maximumCacheEntryCount, maximumCachedBytes: artifact.campaign.maximumCachedBytes, browserSoak: artifact.qualification.browserSoakQualified }, null, 2));
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
