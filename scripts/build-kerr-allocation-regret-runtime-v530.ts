import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "../app/lib/atlasResourceLifecycle";
import {
  getKerrAllocationRegretSnapshotV530,
  getKerrAllocationRegretTelemetryV530,
  loadKerrAllocationRegretSummaryV530,
  resetKerrAllocationRegretClientForTestsV530,
  subscribeKerrAllocationRegretV530,
} from "../app/lib/kerrAllocationRegretClientV530";
import {
  KERR_ALLOCATION_REGRET_ARTIFACT_MAX_BYTES_V530,
  loadKerrAllocationRegretV530,
  resetKerrAllocationRegretServerCacheForTestsV530,
} from "../app/lib/kerrAllocationRegretServerV530";
import {
  KERR_ALLOCATION_REGRET_API_VERSION_V530,
  compareKerrAllocationRegretHudEncodingsV530,
  createKerrAllocationRegretHudEncodingV530,
  parseKerrAllocationRegretArtifactV530,
  resolveKerrAllocationRegretHudProfileV530,
} from "../app/lib/kerrAllocationRegretV530";
import {
  KERR_PHOTON_METROLOGY_DETAIL_IDS_V530,
  KERR_PHOTON_METROLOGY_DETAILS_V530,
  KERR_PHOTON_METROLOGY_LABELS_V530,
} from "../app/components/kerrPhotonMetrologyDetailCatalogV530";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-allocation-regret-v530/atlas.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v529-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v529.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  intake: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-allocation-regret-v530/runtime-audit.json",
} as const;
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "evidenceSha256",
  "pointerSha256",
  "stageChainSha256",
]);
const bytes = (path: string) => readFileSync(resolve(root, path));
const text = (path: string) => bytes(path).toString("utf8");
const read = (path: string) => JSON.parse(text(path));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(([key]) => !transient.has(key))
            .sort(([a], [b]) => compare(a, b))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

async function main() {
  const artifact = parseKerrAllocationRegretArtifactV530(read(paths.artifact));
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const detector = read(paths.detector);
  const intake = read(paths.intake);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (
    sha(artifact) !== artifact.artifactSha256 ||
    previousEvidence.version !== "orbit-atlas-shadow-v529-evidence-v1" ||
    sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
    previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v529" ||
    sha(previousPointer) !== previousPointer.pointerSha256 ||
    detector.counts.measuredCalibrationFiles !== 0 ||
    detector.counts.requiredMeasuredCalibrationFiles !== 6 ||
    intake.inspect.readyFileCount !== 0 ||
    intake.inspect.attemptConsumed !== false ||
    dense.status !== "incomplete-0-of-49" ||
    dense.completedShardCount !== 0 ||
    dense.attemptConsumed !== false ||
    dense.aggregateAvailable !== false ||
    formal.version !== "v263-current-product-evidence-pointer" ||
    formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
    formalEvidence.contracts?.singleCanvas !== true ||
    formalEvidence.contracts?.legacyRootAttributes !== 603 ||
    formalEvidence.contracts?.evidenceLedgerClaims !== 84
  ) {
    throw new Error("v530-runtime-upstream-boundary");
  }

  resetKerrAllocationRegretServerCacheForTestsV530();
  const firstServerLoad = await loadKerrAllocationRegretV530();
  const secondServerLoad = await loadKerrAllocationRegretV530();
  if (
    firstServerLoad !== secondServerLoad ||
    firstServerLoad.artifact.artifactSha256 !== artifact.artifactSha256 ||
    firstServerLoad.export.bytes.byteLength > KERR_ALLOCATION_REGRET_ARTIFACT_MAX_BYTES_V530
  ) {
    throw new Error("v530-runtime-server-boundary");
  }
  const body = JSON.stringify({
    version: KERR_ALLOCATION_REGRET_API_VERSION_V530,
    available: true,
    reason: "ready",
    summary: firstServerLoad.summary,
  });
  if (Buffer.byteLength(body) > 128 * 1024) throw new Error("v530-runtime-summary-size");

  const scienceEncoding = createKerrAllocationRegretHudEncodingV530(
    firstServerLoad.summary,
    "science",
  );
  const cinematicEncoding = createKerrAllocationRegretHudEncodingV530(
    firstServerLoad.summary,
    "cinematic",
  );
  const encodingAudit = compareKerrAllocationRegretHudEncodingsV530(
    scienceEncoding,
    cinematicEncoding,
  );
  const scienceProfile = resolveKerrAllocationRegretHudProfileV530("science");
  const cinematicProfile = resolveKerrAllocationRegretHudProfileV530("cinematic");
  if (
    scienceProfile !== resolveKerrAllocationRegretHudProfileV530("science") ||
    cinematicProfile !== resolveKerrAllocationRegretHudProfileV530("cinematic") ||
    scienceProfile.scienceBoundary.bloomIntensity !== 0 ||
    scienceProfile.scienceBoundary.colorGradeIntensity !== 0 ||
    encodingAudit.scientificPayloadStable !== true ||
    encodingAudit.scientificGeometryStable !== true ||
    encodingAudit.scientificGeometryInputCount !== 148 ||
    encodingAudit.numericScientificStyleInputCount !== 0
  ) {
    throw new Error("v530-runtime-profile-boundary");
  }

  const detailIds = [...KERR_PHOTON_METROLOGY_DETAIL_IDS_V530];
  const detailKeys = Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V530);
  const labelKeys = Object.keys(KERR_PHOTON_METROLOGY_LABELS_V530);
  if (
    detailIds.length !== 32 ||
    new Set(detailIds).size !== 32 ||
    JSON.stringify(detailIds) !== JSON.stringify(detailKeys) ||
    JSON.stringify(detailKeys) !== JSON.stringify(labelKeys) ||
    !Object.isFrozen(KERR_PHOTON_METROLOGY_DETAILS_V530) ||
    !Object.isFrozen(KERR_PHOTON_METROLOGY_LABELS_V530)
  ) {
    throw new Error("v530-runtime-detail-catalog-boundary");
  }

  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  resetKerrAllocationRegretClientForTestsV530();
  const baseline = getAtlasResourceSnapshot();
  let notifications = 0;
  const releases = [
    subscribeKerrAllocationRegretV530(() => {
      notifications += 1;
    }),
    subscribeKerrAllocationRegretV530(() => {
      notifications += 1;
    }),
  ];
  const peak = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const automaticRequestCount = requests.length;
  let first: Awaited<ReturnType<typeof loadKerrAllocationRegretSummaryV530>> | undefined;
  let second: Awaited<ReturnType<typeof loadKerrAllocationRegretSummaryV530>> | undefined;
  try {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requests.push(String(input));
      return new Response(body, { status: 200 });
    }) as typeof fetch;
    [first, second] = await Promise.all([
      loadKerrAllocationRegretSummaryV530(),
      loadKerrAllocationRegretSummaryV530(),
    ]);
  } finally {
    releases.forEach((release) => release());
    releases.forEach((release) => release());
    globalThis.fetch = originalFetch;
  }
  const finalDiff = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const telemetry = getKerrAllocationRegretTelemetryV530();
  const snapshot = getKerrAllocationRegretSnapshotV530();
  if (
    automaticRequestCount !== 0 ||
    requests.length !== 1 ||
    first !== second ||
    first?.artifactSha256 !== artifact.artifactSha256 ||
    notifications !== 4 ||
    peak.subscriptions !== 2 ||
    telemetry.listenerCount !== 0 ||
    telemetry.requestCount !== 1 ||
    telemetry.status !== "ready" ||
    telemetry.sceneRevisionDelta !== 0 ||
    telemetry.scientificFieldMutationAllowed !== false ||
    snapshot.status !== "ready" ||
    finalDiff.status !== "baseline"
  ) {
    throw new Error("v530-runtime-client-boundary");
  }
  resetKerrAllocationRegretClientForTestsV530();

  const component = text("app/components/KerrAllocationRegretV530.tsx");
  const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV530.tsx");
  const catalog = text("app/components/kerrPhotonMetrologyDetailCatalogV530.ts");
  const route = text("app/api/atlas/relativity-evidence/v530/allocation-regret/route.ts");
  const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (
    !component.includes("stochasticCandidateEnvelope") ||
    !component.includes("数学 minimax") ||
    !component.includes("网格覆盖率不是概率") ||
    component.includes("Math.random") ||
    component.includes("<canvas") ||
    component.includes("锟") ||
    !wrapper.includes("KERR_PHOTON_METROLOGY_DETAILS_V530[detail]") ||
    !wrapper.includes('data-atlas-v530-regret-request-before-detail="false"') ||
    wrapper.includes("fetch(") ||
    wrapper.includes("锟") ||
    (catalog.match(/lazy\(/g) ?? []).length !== 1 ||
    !catalog.includes("...KERR_PHOTON_METROLOGY_DETAILS_V529") ||
    catalog.includes("fetch(") ||
    !route.includes('delivery !== "local-shadow"') ||
    !route.includes('"Cache-Control": "no-store"') ||
    !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV530"') ||
    workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV529"')
  ) {
    throw new Error("v530-runtime-source-boundary");
  }

  const sourcePaths = [
    paths.artifact,
    paths.previousEvidence,
    paths.previousPointer,
    paths.detector,
    paths.intake,
    paths.dense,
    paths.formal,
    "app/lib/kerrAllocationRegretV530.ts",
    "app/lib/kerrAllocationRegretV530.test.ts",
    "app/lib/kerrAllocationRegretServerV530.ts",
    "app/lib/kerrAllocationRegretServerV530.test.ts",
    "app/lib/kerrAllocationRegretClientV530.ts",
    "app/lib/kerrAllocationRegretClientV530.test.ts",
    "app/api/atlas/relativity-evidence/v530/allocation-regret/route.ts",
    "app/api/atlas/relativity-evidence/v530/allocation-regret/route.test.ts",
    "app/components/KerrAllocationRegretV530.tsx",
    "app/components/KerrAllocationRegretV530.test.tsx",
    "app/components/kerrPhotonMetrologyDetailCatalogV530.ts",
    "app/components/kerrPhotonMetrologyDetailCatalogV530.test.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV530.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV530.test.ts",
    "app/components/KerrPhotonMetrologyObservatoryIntentV530.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV530.test.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV529.test.tsx",
    "app/components/RelativityResearchWorkbenchV280.tsx",
    "app/lib/atlasResourceLifecycle.ts",
    "scripts/run-kerr-allocation-regret-v530.py",
    "scripts/test-kerr-allocation-regret-v530.py",
    "scripts/build-kerr-allocation-regret-runtime-v530.ts",
  ];
  const sourceManifest = sourcePaths
    .map((path) => ({ path, sha256: fileSha(path) }))
    .sort((a, b) => compare(a.path, b.path));
  const unsigned = {
    version: "v530-kerr-allocation-regret-runtime-audit-v1",
    generatedAt: "2026-08-02T00:00:00Z",
    status: "allocation-regret-runtime-qualified-v7r9-science-cinematic-geometry-stable",
    source: {
      regretArtifactSha256: artifact.artifactSha256,
      v529EvidenceSha256: previousEvidence.evidenceSha256,
      v529PointerSha256: previousPointer.pointerSha256,
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
      artifactMaximumBytes: KERR_ALLOCATION_REGRET_ARTIFACT_MAX_BYTES_V530,
      summaryMaximumBytes: 128 * 1024,
      localShadowOnly: true,
    },
    detailCatalog: {
      detailCount: detailIds.length,
      uniqueDetailCount: new Set(detailIds).size,
      inheritedDetailCount: 31,
      newLazyImportCount: 1,
      concurrentDetailSurfaceBudget: 1,
      automaticDetailRequestCount: 0,
      sharedFrozenCatalog: true,
      workbenchCurrentBinding: "v530",
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
      scientificGeometryStable: encodingAudit.scientificGeometryStable,
      scientificGeometryInputCount: encodingAudit.scientificGeometryInputCount,
      numericScientificStyleInputCount: encodingAudit.numericScientificStyleInputCount,
      regretDrivesStyle: false,
      minimaxDrivesStyle: false,
      fragilityDrivesStyle: false,
      scientificFieldMutation: false,
    },
    counts: artifact.counts,
    regretDefinition: artifact.regretDefinition,
    regretAudits: artifact.regretAudits,
    selectionBoundary: artifact.selectionBoundary,
    acquisitionBoundary: artifact.acquisitionBoundary,
    qualification: artifact.qualification,
    boundary: artifact.boundary,
    sourceManifest,
    sourceSha256: sha(sourceManifest),
  };
  const audit = { ...unsigned, artifactSha256: sha(unsigned) };
  atomic(paths.output, audit);
  console.log(
    JSON.stringify(
      {
        status: audit.status,
        artifactSha256: audit.artifactSha256,
        regretSha256: artifact.artifactSha256,
        regretEvaluations: audit.counts.regretEvaluationCount,
        scientificGeometryInputs: audit.visualProfile.scientificGeometryInputCount,
        detailCatalogSize: audit.detailCatalog.detailCount,
        automaticRequests: audit.runtime.automaticRequestCount,
        explicitRequests: audit.runtime.explicitRequestCount,
        finalResourceStatus: audit.runtime.finalResourceStatus,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
