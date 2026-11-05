import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "../app/lib/atlasResourceLifecycle";
import {
  getKerrAnalyzerIdentifiabilitySnapshotV524,
  getKerrAnalyzerIdentifiabilityTelemetryV524,
  loadKerrAnalyzerIdentifiabilitySummaryV524,
  resetKerrAnalyzerIdentifiabilityClientForTestsV524,
  subscribeKerrAnalyzerIdentifiabilityV524,
} from "../app/lib/kerrAnalyzerIdentifiabilityClientV524";
import {
  KERR_ANALYZER_IDENTIFIABILITY_ARTIFACT_MAX_BYTES_V524,
  loadKerrAnalyzerIdentifiabilityV524,
  resetKerrAnalyzerIdentifiabilityServerCacheForTestsV524,
} from "../app/lib/kerrAnalyzerIdentifiabilityServerV524";
import {
  KERR_ANALYZER_IDENTIFIABILITY_API_VERSION_V524,
  compareKerrInstrumentHudEncodingsV524,
  createKerrInstrumentHudEncodingV524,
  parseKerrAnalyzerIdentifiabilityArtifactV524,
  resolveKerrInstrumentHudProfileV524,
} from "../app/lib/kerrAnalyzerIdentifiabilityV524";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-analyzer-identifiability-v524/identifiability.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v523-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v523.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-analyzer-identifiability-v524/runtime-audit.json",
} as const;
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"]);
const bytes = (path: string) => readFileSync(resolve(root, path));
const text = (path: string) => bytes(path).toString("utf8");
const read = (path: string) => JSON.parse(text(path));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !transient.has(key))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

async function main() {
  const artifact = parseKerrAnalyzerIdentifiabilityArtifactV524(read(paths.artifact));
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const detector = read(paths.detector);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (
    sha(artifact) !== artifact.artifactSha256
    || previousEvidence.version !== "orbit-atlas-shadow-v523-evidence-v1"
    || sha(previousEvidence) !== previousEvidence.evidenceSha256
    || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v523"
    || sha(previousPointer) !== previousPointer.pointerSha256
    || detector.counts.measuredCalibrationFiles !== 0
    || detector.counts.requiredMeasuredCalibrationFiles !== 6
    || dense.status !== "incomplete-0-of-49"
    || dense.completedShardCount !== 0
    || dense.attemptConsumed !== false
    || dense.aggregateAvailable !== false
    || formal.version !== "v263-current-product-evidence-pointer"
    || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
    || formalEvidence.contracts?.singleCanvas !== true
    || formalEvidence.contracts?.legacyRootAttributes !== 603
    || formalEvidence.contracts?.evidenceLedgerClaims !== 84
  ) throw new Error("v524-runtime-upstream-boundary");

  resetKerrAnalyzerIdentifiabilityServerCacheForTestsV524();
  const firstServerLoad = await loadKerrAnalyzerIdentifiabilityV524();
  const secondServerLoad = await loadKerrAnalyzerIdentifiabilityV524();
  if (
    firstServerLoad !== secondServerLoad
    || firstServerLoad.artifact.artifactSha256 !== artifact.artifactSha256
    || firstServerLoad.export.bytes.byteLength > KERR_ANALYZER_IDENTIFIABILITY_ARTIFACT_MAX_BYTES_V524
  ) throw new Error("v524-runtime-server-boundary");
  const body = JSON.stringify({
    version: KERR_ANALYZER_IDENTIFIABILITY_API_VERSION_V524,
    available: true,
    reason: "ready",
    summary: firstServerLoad.summary,
  });
  if (Buffer.byteLength(body) > 128 * 1024) throw new Error("v524-runtime-summary-size");

  const scienceEncoding = createKerrInstrumentHudEncodingV524(firstServerLoad.summary, "science");
  const cinematicEncoding = createKerrInstrumentHudEncodingV524(firstServerLoad.summary, "cinematic");
  const encodingAudit = compareKerrInstrumentHudEncodingsV524(scienceEncoding, cinematicEncoding);
  const scienceProfile = resolveKerrInstrumentHudProfileV524("science");
  const cinematicProfile = resolveKerrInstrumentHudProfileV524("cinematic");
  if (
    scienceProfile !== resolveKerrInstrumentHudProfileV524("science")
    || cinematicProfile !== resolveKerrInstrumentHudProfileV524("cinematic")
    || scienceProfile.scienceBoundary.bloomIntensity !== 0
    || scienceProfile.scienceBoundary.colorGradeIntensity !== 0
    || encodingAudit.scientificPayloadStable !== true
    || encodingAudit.scientificRowsStable !== true
    || encodingAudit.numericScientificStyleInputCount !== 0
  ) throw new Error("v524-runtime-profile-boundary");

  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  resetKerrAnalyzerIdentifiabilityClientForTestsV524();
  const baseline = getAtlasResourceSnapshot();
  let notifications = 0;
  const releases = [
    subscribeKerrAnalyzerIdentifiabilityV524(() => { notifications += 1; }),
    subscribeKerrAnalyzerIdentifiabilityV524(() => { notifications += 1; }),
  ];
  const peak = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const automaticRequestCount = requests.length;
  let first;
  let second;
  try {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requests.push(String(input));
      return new Response(body, { status: 200 });
    }) as typeof fetch;
    [first, second] = await Promise.all([
      loadKerrAnalyzerIdentifiabilitySummaryV524(),
      loadKerrAnalyzerIdentifiabilitySummaryV524(),
    ]);
  } finally {
    releases.forEach((release) => release());
    releases.forEach((release) => release());
    globalThis.fetch = originalFetch;
  }
  const finalDiff = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const telemetry = getKerrAnalyzerIdentifiabilityTelemetryV524();
  const snapshot = getKerrAnalyzerIdentifiabilitySnapshotV524();
  if (
    automaticRequestCount !== 0
    || requests.length !== 1
    || first !== second
    || first?.artifactSha256 !== artifact.artifactSha256
    || notifications !== 4
    || peak.subscriptions !== 2
    || telemetry.listenerCount !== 0
    || telemetry.requestCount !== 1
    || telemetry.status !== "ready"
    || telemetry.sceneRevisionDelta !== 0
    || telemetry.scientificFieldMutationAllowed !== false
    || snapshot.status !== "ready"
    || finalDiff.status !== "baseline"
  ) throw new Error("v524-runtime-client-boundary");
  resetKerrAnalyzerIdentifiabilityClientForTestsV524();

  const component = text("app/components/KerrAnalyzerIdentifiabilityV524.tsx");
  const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV524.tsx");
  const route = text("app/api/atlas/relativity-evidence/v524/analyzer-identifiability/route.ts");
  const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (
    !component.includes("data-atlas-v524-numeric-scientific-style-input-count")
    || !component.includes("compareKerrInstrumentHudEncodingsV524")
    || component.includes("Math.random")
    || component.includes("<canvas")
    || component.includes("锟")
    || !wrapper.includes('import("./KerrAnalyzerIdentifiabilityV524")')
    || wrapper.includes("fetch(")
    || wrapper.includes("锟")
    || !route.includes('delivery !== "local-shadow"')
    || !route.includes('"Cache-Control": "no-store"')
    || !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV524"')
  ) throw new Error("v524-runtime-source-boundary");

  const sourcePaths = [
    paths.artifact,
    paths.previousEvidence,
    paths.previousPointer,
    paths.detector,
    paths.dense,
    paths.formal,
    "app/lib/kerrAnalyzerIdentifiabilityV524.ts",
    "app/lib/kerrAnalyzerIdentifiabilityV524.test.ts",
    "app/lib/kerrAnalyzerIdentifiabilityServerV524.ts",
    "app/lib/kerrAnalyzerIdentifiabilityServerV524.test.ts",
    "app/lib/kerrAnalyzerIdentifiabilityClientV524.ts",
    "app/lib/kerrAnalyzerIdentifiabilityClientV524.test.ts",
    "app/api/atlas/relativity-evidence/v524/analyzer-identifiability/route.ts",
    "app/api/atlas/relativity-evidence/v524/analyzer-identifiability/route.test.ts",
    "app/components/KerrAnalyzerIdentifiabilityV524.tsx",
    "app/components/KerrAnalyzerIdentifiabilityV524.test.tsx",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV524.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV524.test.ts",
    "app/components/KerrPhotonMetrologyObservatoryIntentV524.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV524.test.tsx",
    "app/components/RelativityResearchWorkbenchV280.tsx",
    "app/lib/atlasResourceLifecycle.ts",
    "scripts/run-kerr-analyzer-identifiability-v524.py",
    "scripts/test-kerr-analyzer-identifiability-v524.py",
    "scripts/build-kerr-analyzer-identifiability-runtime-v524.ts",
  ];
  const sourceManifest = sourcePaths
    .map((path) => ({ path, sha256: fileSha(path) }))
    .sort((a, b) => a.path.localeCompare(b.path));
  const unsigned = {
    version: "v524-kerr-analyzer-identifiability-runtime-audit-v1",
    generatedAt: "2026-08-02T00:00:00Z",
    status: "analyzer-identifiability-runtime-qualified-v7r3-science-cinematic-payload-stable",
    source: {
      identifiabilityArtifactSha256: artifact.artifactSha256,
      v523EvidenceSha256: previousEvidence.evidenceSha256,
      v523PointerSha256: previousPointer.pointerSha256,
      v314StateSha256: dense.stateSha256,
    },
    runtime: {
      serverFileBytes: firstServerLoad.export.bytes.byteLength,
      summaryResponseBytes: Buffer.byteLength(body),
      serverFingerprintCacheHit: firstServerLoad === secondServerLoad,
      automaticRequestCount,
      explicitRequestCount: requests.length,
      singleFlightConsumerCount: 2,
      notificationCount: notifications,
      peakSubscriptionCount: peak.subscriptions,
      finalSubscriptionCount: finalDiff.subscriptions,
      finalObjectUrlCount: finalDiff.objectUrls,
      finalResourceStatus: finalDiff.status,
      responseCachePolicy: "no-store",
      artifactMaximumBytes: KERR_ANALYZER_IDENTIFIABILITY_ARTIFACT_MAX_BYTES_V524,
      summaryMaximumBytes: 128 * 1024,
      localShadowOnly: true,
    },
    visualProfile: {
      profileId: scienceProfile.id,
      scienceLinearDisplay: scienceProfile.scienceBoundary.linearDisplay,
      scienceBloomIntensity: scienceProfile.scienceBoundary.bloomIntensity,
      scienceColorGradeIntensity: scienceProfile.scienceBoundary.colorGradeIntensity,
      cinematicBloomIntensity: cinematicProfile.scienceBoundary.bloomIntensity,
      cinematicColorGradeIntensity: cinematicProfile.scienceBoundary.colorGradeIntensity,
      cinematicSeed: cinematicProfile.cinematicSeed,
      scientificPayloadStable: encodingAudit.scientificPayloadStable,
      scientificRowsStable: encodingAudit.scientificRowsStable,
      numericScientificStyleInputCount: encodingAudit.numericScientificStyleInputCount,
      rankDrivesStyle: false,
      conditionNumberDrivesStyle: false,
      nullityDrivesStyle: false,
      scientificFieldMutation: false,
    },
    counts: artifact.counts,
    maxima: artifact.maxima,
    limits: artifact.limits,
    qualification: artifact.qualification,
    boundary: artifact.boundary,
    sourceManifest,
    sourceSha256: sha(sourceManifest),
  };
  const audit = { ...unsigned, artifactSha256: sha(unsigned) };
  atomic(paths.output, audit);
  console.log(JSON.stringify({
    status: audit.status,
    artifactSha256: audit.artifactSha256,
    identifiabilitySha256: artifact.artifactSha256,
    matrixCount: artifact.counts.matrixCount,
    nullspaceDimension: artifact.counts.nullspaceDimension,
    automaticRequests: audit.runtime.automaticRequestCount,
    explicitRequests: audit.runtime.explicitRequestCount,
    finalResourceStatus: audit.runtime.finalResourceStatus,
    scientificRowsStable: audit.visualProfile.scientificRowsStable,
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
