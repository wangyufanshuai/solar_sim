import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "../app/lib/atlasResourceLifecycle";
import {
  getKerrIdealAnalyzerSensitivitySnapshotV523,
  getKerrIdealAnalyzerSensitivityTelemetryV523,
  loadKerrIdealAnalyzerSensitivitySummaryV523,
  resetKerrIdealAnalyzerSensitivityClientForTestsV523,
  subscribeKerrIdealAnalyzerSensitivityV523,
} from "../app/lib/kerrIdealAnalyzerSensitivityClientV523";
import {
  loadKerrIdealAnalyzerSensitivityV523,
  resetKerrIdealAnalyzerSensitivityServerCacheForTestsV523,
} from "../app/lib/kerrIdealAnalyzerSensitivityServerV523";
import {
  KERR_IDEAL_ANALYZER_SENSITIVITY_API_VERSION_V523,
  parseKerrIdealAnalyzerSensitivityArtifactV523,
} from "../app/lib/kerrIdealAnalyzerSensitivityV523";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-ideal-analyzer-sensitivity-v523/projection.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v522-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v522.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-ideal-analyzer-sensitivity-v523/runtime-audit.json",
} as const;
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"]);
const bytes = (path: string) => readFileSync(resolve(root, path));
const text = (path: string) => bytes(path).toString("utf8");
const read = (path: string) => JSON.parse(text(path));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path: string, value: unknown) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const part = `${target}.${process.pid}.part`; writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8"); renameSync(part, target); };

async function main() {
  const artifact = parseKerrIdealAnalyzerSensitivityArtifactV523(read(paths.artifact));
  const previousEvidence = read(paths.previousEvidence), previousPointer = read(paths.previousPointer);
  const detector = read(paths.detector), dense = read(paths.dense), formal = read(paths.formal), formalEvidence = read(formal.source);
  if (sha(artifact) !== artifact.artifactSha256 || previousEvidence.version !== "orbit-atlas-shadow-v522-evidence-v1" || sha(previousEvidence) !== previousEvidence.evidenceSha256 || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v522" || sha(previousPointer) !== previousPointer.pointerSha256 || detector.counts.measuredCalibrationFiles !== 0 || detector.counts.requiredMeasuredCalibrationFiles !== 6 || dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false || dense.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v523-runtime-upstream-boundary");

  resetKerrIdealAnalyzerSensitivityServerCacheForTestsV523();
  const firstServerLoad = await loadKerrIdealAnalyzerSensitivityV523(), secondServerLoad = await loadKerrIdealAnalyzerSensitivityV523();
  if (firstServerLoad !== secondServerLoad || firstServerLoad.artifact.artifactSha256 !== artifact.artifactSha256 || firstServerLoad.export.bytes.byteLength > 2 * 1024 * 1024) throw new Error("v523-runtime-server-boundary");
  const body = JSON.stringify({ version: KERR_IDEAL_ANALYZER_SENSITIVITY_API_VERSION_V523, available: true, reason: "ready", summary: firstServerLoad.summary });
  if (Buffer.byteLength(body) > 128 * 1024) throw new Error("v523-runtime-summary-size");
  const requests: string[] = [], originalFetch = globalThis.fetch;
  resetKerrIdealAnalyzerSensitivityClientForTestsV523();
  const baseline = getAtlasResourceSnapshot(); let notifications = 0;
  const releases = [subscribeKerrIdealAnalyzerSensitivityV523(() => { notifications += 1; }), subscribeKerrIdealAnalyzerSensitivityV523(() => { notifications += 1; })];
  const peak = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()), automaticRequestCount = requests.length;
  let first, second;
  try { globalThis.fetch = (async (input: RequestInfo | URL) => { requests.push(String(input)); return new Response(body, { status: 200 }); }) as typeof fetch; [first, second] = await Promise.all([loadKerrIdealAnalyzerSensitivitySummaryV523(), loadKerrIdealAnalyzerSensitivitySummaryV523()]); }
  finally { releases.forEach((release) => release()); releases.forEach((release) => release()); globalThis.fetch = originalFetch; }
  const finalDiff = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()), telemetry = getKerrIdealAnalyzerSensitivityTelemetryV523(), snapshot = getKerrIdealAnalyzerSensitivitySnapshotV523();
  if (automaticRequestCount !== 0 || requests.length !== 1 || first !== second || first?.artifactSha256 !== artifact.artifactSha256 || notifications !== 4 || peak.subscriptions !== 2 || telemetry.listenerCount !== 0 || telemetry.requestCount !== 1 || telemetry.status !== "ready" || telemetry.sceneRevisionDelta !== 0 || telemetry.scientificFieldMutationAllowed !== false || snapshot.status !== "ready" || finalDiff.status !== "baseline") throw new Error("v523-runtime-client-boundary");
  resetKerrIdealAnalyzerSensitivityClientForTestsV523();

  const component = text("app/components/KerrIdealAnalyzerSensitivityV523.tsx"), wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV523.tsx"), route = text("app/api/atlas/relativity-evidence/v523/ideal-analyzer/route.ts"), workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (!component.includes('data-atlas-v523-modulation-row-count="864"') || !component.includes('data-atlas-v523-detector-projection-qualified="false"') || component.includes("Math.random") || component.includes("<canvas") || component.includes("�") || !wrapper.includes('import("./KerrIdealAnalyzerSensitivityV523")') || wrapper.includes("fetch(") || wrapper.includes("�") || !route.includes('delivery !== "local-shadow"') || !route.includes('"Cache-Control": "no-store"') || !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV523"')) throw new Error("v523-runtime-source-boundary");

  const sourcePaths = [paths.artifact, paths.previousEvidence, paths.previousPointer, paths.detector, paths.dense, paths.formal, "app/lib/kerrIdealAnalyzerSensitivityV523.ts", "app/lib/kerrIdealAnalyzerSensitivityV523.test.ts", "app/lib/kerrIdealAnalyzerSensitivityServerV523.ts", "app/lib/kerrIdealAnalyzerSensitivityServerV523.test.ts", "app/lib/kerrIdealAnalyzerSensitivityClientV523.ts", "app/lib/kerrIdealAnalyzerSensitivityClientV523.test.ts", "app/api/atlas/relativity-evidence/v523/ideal-analyzer/route.ts", "app/api/atlas/relativity-evidence/v523/ideal-analyzer/route.test.ts", "app/components/KerrIdealAnalyzerSensitivityV523.tsx", "app/components/KerrIdealAnalyzerSensitivityV523.test.tsx", "app/lib/kerrPhotonMetrologyObservatoryIntentV523.ts", "app/lib/kerrPhotonMetrologyObservatoryIntentV523.test.ts", "app/components/KerrPhotonMetrologyObservatoryIntentV523.tsx", "app/components/KerrPhotonMetrologyObservatoryIntentV523.test.tsx", "app/components/RelativityResearchWorkbenchV280.tsx", "app/lib/atlasResourceLifecycle.ts", "scripts/run-kerr-ideal-analyzer-sensitivity-v523.py", "scripts/test-kerr-ideal-analyzer-sensitivity-v523.py", "scripts/build-kerr-ideal-analyzer-sensitivity-runtime-v523.ts"];
  const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) })).sort((a, b) => a.path.localeCompare(b.path));
  const unsigned = { version: "v523-kerr-ideal-analyzer-sensitivity-runtime-audit-v1", generatedAt: "2026-08-02T00:00:00Z", status: "ideal-analyzer-sensitivity-runtime-qualified-single-flight-baseline", source: { analyzerArtifactSha256: artifact.artifactSha256, v522EvidenceSha256: previousEvidence.evidenceSha256, v522PointerSha256: previousPointer.pointerSha256, v314StateSha256: dense.stateSha256 }, runtime: { serverFileBytes: firstServerLoad.export.bytes.byteLength, summaryResponseBytes: Buffer.byteLength(body), serverFingerprintCacheHit: firstServerLoad === secondServerLoad, automaticRequestCount, explicitRequestCount: requests.length, singleFlightConsumerCount: 2, notificationCount: notifications, peakSubscriptionCount: peak.subscriptions, finalSubscriptionCount: finalDiff.subscriptions, finalObjectUrlCount: finalDiff.objectUrls, finalResourceStatus: finalDiff.status, responseCachePolicy: "no-store", artifactMaximumBytes: 2 * 1024 * 1024, summaryMaximumBytes: 128 * 1024, localShadowOnly: true }, counts: artifact.counts, maxima: artifact.maxima, limits: artifact.limits, qualification: artifact.qualification, boundary: artifact.boundary, sourceManifest, sourceSha256: sha(sourceManifest) };
  const audit = { ...unsigned, artifactSha256: sha(unsigned) }; atomic(paths.output, audit);
  console.log(JSON.stringify({ status: audit.status, artifactSha256: audit.artifactSha256, analyzerSha256: artifact.artifactSha256, modulationRows: artifact.counts.modulationRowCount, reconstructions: artifact.counts.reconstructionCount, automaticRequests: audit.runtime.automaticRequestCount, explicitRequests: audit.runtime.explicitRequestCount, finalResourceStatus: audit.runtime.finalResourceStatus }, null, 2));
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
