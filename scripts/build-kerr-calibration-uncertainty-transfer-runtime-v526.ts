import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "../app/lib/atlasResourceLifecycle";
import {
  getKerrCalibrationUncertaintyTransferSnapshotV526,
  getKerrCalibrationUncertaintyTransferTelemetryV526,
  loadKerrCalibrationUncertaintyTransferSummaryV526,
  resetKerrCalibrationUncertaintyTransferClientForTestsV526,
  subscribeKerrCalibrationUncertaintyTransferV526,
} from "../app/lib/kerrCalibrationUncertaintyTransferClientV526";
import {
  KERR_CALIBRATION_UNCERTAINTY_TRANSFER_ARTIFACT_MAX_BYTES_V526,
  loadKerrCalibrationUncertaintyTransferV526,
  resetKerrCalibrationUncertaintyTransferServerCacheForTestsV526,
} from "../app/lib/kerrCalibrationUncertaintyTransferServerV526";
import {
  KERR_CALIBRATION_UNCERTAINTY_TRANSFER_API_VERSION_V526,
  compareKerrCalibrationUncertaintyHudEncodingsV526,
  createKerrCalibrationUncertaintyHudEncodingV526,
  parseKerrCalibrationUncertaintyTransferArtifactV526,
  resolveKerrCalibrationUncertaintyHudProfileV526,
} from "../app/lib/kerrCalibrationUncertaintyTransferV526";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-calibration-uncertainty-transfer-v526/transfer.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v525-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v525.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  intake: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-calibration-uncertainty-transfer-v526/runtime-audit.json",
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
  const artifact = parseKerrCalibrationUncertaintyTransferArtifactV526(read(paths.artifact));
  const previousEvidence = read(paths.previousEvidence), previousPointer = read(paths.previousPointer), detector = read(paths.detector), intake = read(paths.intake), dense = read(paths.dense), formal = read(paths.formal), formalEvidence = read(formal.source);
  if (sha(artifact) !== artifact.artifactSha256 || previousEvidence.version !== "orbit-atlas-shadow-v525-evidence-v1" || sha(previousEvidence) !== previousEvidence.evidenceSha256 || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v525" || sha(previousPointer) !== previousPointer.pointerSha256 || detector.counts.measuredCalibrationFiles !== 0 || detector.counts.requiredMeasuredCalibrationFiles !== 6 || intake.inspect.readyFileCount !== 0 || intake.inspect.attemptConsumed !== false || dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false || dense.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v526-runtime-upstream-boundary");

  resetKerrCalibrationUncertaintyTransferServerCacheForTestsV526();
  const firstServerLoad = await loadKerrCalibrationUncertaintyTransferV526(), secondServerLoad = await loadKerrCalibrationUncertaintyTransferV526();
  if (firstServerLoad !== secondServerLoad || firstServerLoad.artifact.artifactSha256 !== artifact.artifactSha256 || firstServerLoad.export.bytes.byteLength > KERR_CALIBRATION_UNCERTAINTY_TRANSFER_ARTIFACT_MAX_BYTES_V526) throw new Error("v526-runtime-server-boundary");
  const body = JSON.stringify({ version: KERR_CALIBRATION_UNCERTAINTY_TRANSFER_API_VERSION_V526, available: true, reason: "ready", summary: firstServerLoad.summary });
  if (Buffer.byteLength(body) > 128 * 1024) throw new Error("v526-runtime-summary-size");
  const scienceEncoding = createKerrCalibrationUncertaintyHudEncodingV526(firstServerLoad.summary, "science"), cinematicEncoding = createKerrCalibrationUncertaintyHudEncodingV526(firstServerLoad.summary, "cinematic"), encodingAudit = compareKerrCalibrationUncertaintyHudEncodingsV526(scienceEncoding, cinematicEncoding), scienceProfile = resolveKerrCalibrationUncertaintyHudProfileV526("science"), cinematicProfile = resolveKerrCalibrationUncertaintyHudProfileV526("cinematic");
  if (scienceProfile !== resolveKerrCalibrationUncertaintyHudProfileV526("science") || cinematicProfile !== resolveKerrCalibrationUncertaintyHudProfileV526("cinematic") || scienceProfile.scienceBoundary.bloomIntensity !== 0 || scienceProfile.scienceBoundary.colorGradeIntensity !== 0 || encodingAudit.scientificPayloadStable !== true || encodingAudit.scientificRowsStable !== true || encodingAudit.numericScientificStyleInputCount !== 0) throw new Error("v526-runtime-profile-boundary");

  const requests: string[] = [], originalFetch = globalThis.fetch;
  resetKerrCalibrationUncertaintyTransferClientForTestsV526();
  const baseline = getAtlasResourceSnapshot(); let notifications = 0;
  const releases = [subscribeKerrCalibrationUncertaintyTransferV526(() => { notifications += 1; }), subscribeKerrCalibrationUncertaintyTransferV526(() => { notifications += 1; })];
  const peak = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()), automaticRequestCount = requests.length;
  let first, second;
  try {
    globalThis.fetch = (async (input: RequestInfo | URL) => { requests.push(String(input)); return new Response(body, { status: 200 }); }) as typeof fetch;
    [first, second] = await Promise.all([loadKerrCalibrationUncertaintyTransferSummaryV526(), loadKerrCalibrationUncertaintyTransferSummaryV526()]);
  } finally {
    releases.forEach((release) => release()); releases.forEach((release) => release()); globalThis.fetch = originalFetch;
  }
  const finalDiff = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()), telemetry = getKerrCalibrationUncertaintyTransferTelemetryV526(), snapshot = getKerrCalibrationUncertaintyTransferSnapshotV526();
  if (automaticRequestCount !== 0 || requests.length !== 1 || first !== second || first?.artifactSha256 !== artifact.artifactSha256 || notifications !== 4 || peak.subscriptions !== 2 || telemetry.listenerCount !== 0 || telemetry.requestCount !== 1 || telemetry.status !== "ready" || telemetry.sceneRevisionDelta !== 0 || telemetry.scientificFieldMutationAllowed !== false || snapshot.status !== "ready" || finalDiff.status !== "baseline") throw new Error("v526-runtime-client-boundary");
  resetKerrCalibrationUncertaintyTransferClientForTestsV526();

  const component = text("app/components/KerrCalibrationUncertaintyTransferV526.tsx"), wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV526.tsx"), route = text("app/api/atlas/relativity-evidence/v526/calibration-uncertainty-transfer/route.ts"), workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (!component.includes("compareKerrCalibrationUncertaintyHudEncodingsV526") || !component.includes("physical uncertainty unavailable") || component.includes("Math.random") || component.includes("<canvas") || component.includes("锟") || !wrapper.includes('import("./KerrCalibrationUncertaintyTransferV526")') || wrapper.includes("fetch(") || wrapper.includes("锟") || !route.includes('delivery !== "local-shadow"') || !route.includes('"Cache-Control": "no-store"') || !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV526"')) throw new Error("v526-runtime-source-boundary");

  const sourcePaths = [paths.artifact, paths.previousEvidence, paths.previousPointer, paths.detector, paths.intake, paths.dense, paths.formal, "app/lib/kerrCalibrationUncertaintyTransferV526.ts", "app/lib/kerrCalibrationUncertaintyTransferV526.test.ts", "app/lib/kerrCalibrationUncertaintyTransferServerV526.ts", "app/lib/kerrCalibrationUncertaintyTransferServerV526.test.ts", "app/lib/kerrCalibrationUncertaintyTransferClientV526.ts", "app/lib/kerrCalibrationUncertaintyTransferClientV526.test.ts", "app/api/atlas/relativity-evidence/v526/calibration-uncertainty-transfer/route.ts", "app/api/atlas/relativity-evidence/v526/calibration-uncertainty-transfer/route.test.ts", "app/components/KerrCalibrationUncertaintyTransferV526.tsx", "app/components/KerrCalibrationUncertaintyTransferV526.test.tsx", "app/lib/kerrPhotonMetrologyObservatoryIntentV526.ts", "app/lib/kerrPhotonMetrologyObservatoryIntentV526.test.ts", "app/components/KerrPhotonMetrologyObservatoryIntentV526.tsx", "app/components/KerrPhotonMetrologyObservatoryIntentV526.test.tsx", "app/components/RelativityResearchWorkbenchV280.tsx", "app/lib/atlasResourceLifecycle.ts", "scripts/run-kerr-calibration-uncertainty-transfer-v526.py", "scripts/test-kerr-calibration-uncertainty-transfer-v526.py", "scripts/build-kerr-calibration-uncertainty-transfer-runtime-v526.ts"];
  const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) })).sort((a, b) => a.path.localeCompare(b.path));
  const unsigned = {
    version: "v526-kerr-calibration-uncertainty-transfer-runtime-audit-v1", generatedAt: "2026-08-02T00:00:00Z", status: "uncertainty-transfer-runtime-qualified-v7r5-science-cinematic-payload-stable",
    source: { transferArtifactSha256: artifact.artifactSha256, v525EvidenceSha256: previousEvidence.evidenceSha256, v525PointerSha256: previousPointer.pointerSha256, v314StateSha256: dense.stateSha256 },
    runtime: { serverFileBytes: firstServerLoad.export.bytes.byteLength, summaryResponseBytes: Buffer.byteLength(body), serverFingerprintCacheHit: firstServerLoad === secondServerLoad, automaticRequestCount, explicitRequestCount: requests.length, singleFlightConsumerCount: 2, notificationCount: notifications, peakSubscriptionCount: peak.subscriptions, finalSubscriptionCount: finalDiff.subscriptions, finalObjectUrlCount: finalDiff.objectUrls, finalResourceStatus: finalDiff.status, responseCachePolicy: "no-store", artifactMaximumBytes: KERR_CALIBRATION_UNCERTAINTY_TRANSFER_ARTIFACT_MAX_BYTES_V526, summaryMaximumBytes: 128 * 1024, localShadowOnly: true },
    visualProfile: { profileId: scienceProfile.id, scienceLinearDisplay: scienceProfile.scienceBoundary.linearDisplay, scienceBloomIntensity: scienceProfile.scienceBoundary.bloomIntensity, scienceColorGradeIntensity: scienceProfile.scienceBoundary.colorGradeIntensity, cinematicBloomIntensity: cinematicProfile.scienceBoundary.bloomIntensity, cinematicColorGradeIntensity: cinematicProfile.scienceBoundary.colorGradeIntensity, cinematicSeed: cinematicProfile.cinematicSeed, scientificPayloadStable: encodingAudit.scientificPayloadStable, scientificRowsStable: encodingAudit.scientificRowsStable, numericScientificStyleInputCount: encodingAudit.numericScientificStyleInputCount, varianceDrivesStyle: false, correlationDrivesStyle: false, boundDrivesStyle: false, scientificFieldMutation: false },
    observableTransfer: artifact.observableTransfer, unitVarianceTransfer: artifact.unitVarianceTransfer, boundedUnitErrorTransfer: artifact.boundedUnitErrorTransfer, acquisitionBoundary: artifact.acquisitionBoundary, counts: artifact.counts, qualification: artifact.qualification, boundary: artifact.boundary, sourceManifest, sourceSha256: sha(sourceManifest),
  };
  const audit = { ...unsigned, artifactSha256: sha(unsigned) }; atomic(paths.output, audit);
  console.log(JSON.stringify({ status: audit.status, artifactSha256: audit.artifactSha256, transferSha256: artifact.artifactSha256, unitBoxVertices: artifact.counts.unitBoxVertexCount, maximumScalarCoefficient: artifact.boundedUnitErrorTransfer.maximumQOverIAbsoluteCoefficient, automaticRequests: audit.runtime.automaticRequestCount, explicitRequests: audit.runtime.explicitRequestCount, finalResourceStatus: audit.runtime.finalResourceStatus, scientificRowsStable: audit.visualProfile.scientificRowsStable }, null, 2));
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
