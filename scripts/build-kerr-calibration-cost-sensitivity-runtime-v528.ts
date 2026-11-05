import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "../app/lib/atlasResourceLifecycle";
import {
  getKerrCalibrationCostSensitivitySnapshotV528,
  getKerrCalibrationCostSensitivityTelemetryV528,
  loadKerrCalibrationCostSensitivitySummaryV528,
  resetKerrCalibrationCostSensitivityClientForTestsV528,
  subscribeKerrCalibrationCostSensitivityV528,
} from "../app/lib/kerrCalibrationCostSensitivityClientV528";
import {
  KERR_CALIBRATION_COST_SENSITIVITY_ARTIFACT_MAX_BYTES_V528,
  loadKerrCalibrationCostSensitivityV528,
  resetKerrCalibrationCostSensitivityServerCacheForTestsV528,
} from "../app/lib/kerrCalibrationCostSensitivityServerV528";
import {
  KERR_CALIBRATION_COST_SENSITIVITY_API_VERSION_V528,
  compareKerrCalibrationCostHudEncodingsV528,
  createKerrCalibrationCostHudEncodingV528,
  parseKerrCalibrationCostSensitivityArtifactV528,
  resolveKerrCalibrationCostHudProfileV528,
} from "../app/lib/kerrCalibrationCostSensitivityV528";
import {
  KERR_PHOTON_METROLOGY_DETAIL_IDS_V528,
  KERR_PHOTON_METROLOGY_DETAILS_V528,
  KERR_PHOTON_METROLOGY_LABELS_V528,
} from "../app/components/kerrPhotonMetrologyDetailCatalogV528";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-calibration-cost-sensitivity-v528/sensitivity.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v527-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v527.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  intake: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-calibration-cost-sensitivity-v528/runtime-audit.json",
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
  const artifact = parseKerrCalibrationCostSensitivityArtifactV528(read(paths.artifact));
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const detector = read(paths.detector);
  const intake = read(paths.intake);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (
    sha(artifact) !== artifact.artifactSha256 ||
    previousEvidence.version !== "orbit-atlas-shadow-v527-evidence-v1" ||
    sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
    previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v527" ||
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
    throw new Error("v528-runtime-upstream-boundary");
  }

  resetKerrCalibrationCostSensitivityServerCacheForTestsV528();
  const firstServerLoad = await loadKerrCalibrationCostSensitivityV528();
  const secondServerLoad = await loadKerrCalibrationCostSensitivityV528();
  if (
    firstServerLoad !== secondServerLoad ||
    firstServerLoad.artifact.artifactSha256 !== artifact.artifactSha256 ||
    firstServerLoad.export.bytes.byteLength >
      KERR_CALIBRATION_COST_SENSITIVITY_ARTIFACT_MAX_BYTES_V528
  ) {
    throw new Error("v528-runtime-server-boundary");
  }

  const body = JSON.stringify({
    version: KERR_CALIBRATION_COST_SENSITIVITY_API_VERSION_V528,
    available: true,
    reason: "ready",
    summary: firstServerLoad.summary,
  });
  if (Buffer.byteLength(body) > 128 * 1024) throw new Error("v528-runtime-summary-size");

  const scienceEncoding = createKerrCalibrationCostHudEncodingV528(
    firstServerLoad.summary,
    "science",
  );
  const cinematicEncoding = createKerrCalibrationCostHudEncodingV528(
    firstServerLoad.summary,
    "cinematic",
  );
  const encodingAudit = compareKerrCalibrationCostHudEncodingsV528(
    scienceEncoding,
    cinematicEncoding,
  );
  const scienceProfile = resolveKerrCalibrationCostHudProfileV528("science");
  const cinematicProfile = resolveKerrCalibrationCostHudProfileV528("cinematic");
  if (
    scienceProfile !== resolveKerrCalibrationCostHudProfileV528("science") ||
    cinematicProfile !== resolveKerrCalibrationCostHudProfileV528("cinematic") ||
    scienceProfile.scienceBoundary.bloomIntensity !== 0 ||
    scienceProfile.scienceBoundary.colorGradeIntensity !== 0 ||
    encodingAudit.scientificPayloadStable !== true ||
    encodingAudit.scientificGeometryStable !== true ||
    encodingAudit.scientificGeometryInputCount !== 34 ||
    encodingAudit.numericScientificStyleInputCount !== 0
  ) {
    throw new Error("v528-runtime-profile-boundary");
  }

  const detailIds = [...KERR_PHOTON_METROLOGY_DETAIL_IDS_V528];
  const detailKeys = Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V528);
  const labelKeys = Object.keys(KERR_PHOTON_METROLOGY_LABELS_V528);
  if (
    detailIds.length !== 30 ||
    new Set(detailIds).size !== 30 ||
    JSON.stringify(detailIds) !== JSON.stringify(detailKeys) ||
    JSON.stringify(detailKeys) !== JSON.stringify(labelKeys) ||
    !Object.isFrozen(KERR_PHOTON_METROLOGY_DETAILS_V528) ||
    !Object.isFrozen(KERR_PHOTON_METROLOGY_LABELS_V528)
  ) {
    throw new Error("v528-runtime-detail-catalog-boundary");
  }

  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  resetKerrCalibrationCostSensitivityClientForTestsV528();
  const baseline = getAtlasResourceSnapshot();
  let notifications = 0;
  const releases = [
    subscribeKerrCalibrationCostSensitivityV528(() => {
      notifications += 1;
    }),
    subscribeKerrCalibrationCostSensitivityV528(() => {
      notifications += 1;
    }),
  ];
  const peak = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const automaticRequestCount = requests.length;
  let first: Awaited<ReturnType<typeof loadKerrCalibrationCostSensitivitySummaryV528>> | undefined;
  let second: Awaited<ReturnType<typeof loadKerrCalibrationCostSensitivitySummaryV528>> | undefined;
  try {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requests.push(String(input));
      return new Response(body, { status: 200 });
    }) as typeof fetch;
    [first, second] = await Promise.all([
      loadKerrCalibrationCostSensitivitySummaryV528(),
      loadKerrCalibrationCostSensitivitySummaryV528(),
    ]);
  } finally {
    releases.forEach((release) => release());
    releases.forEach((release) => release());
    globalThis.fetch = originalFetch;
  }
  const finalDiff = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const telemetry = getKerrCalibrationCostSensitivityTelemetryV528();
  const snapshot = getKerrCalibrationCostSensitivitySnapshotV528();
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
    throw new Error("v528-runtime-client-boundary");
  }
  resetKerrCalibrationCostSensitivityClientForTestsV528();

  const component = text("app/components/KerrCalibrationCostSensitivityV528.tsx");
  const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV528.tsx");
  const catalog = text("app/components/kerrPhotonMetrologyDetailCatalogV528.ts");
  const route = text(
    "app/api/atlas/relativity-evidence/v528/calibration-cost-sensitivity/route.ts",
  );
  const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (
    !component.includes("scientificGeometry.stochastic") ||
    !component.includes("成本比改变解析最优点") ||
    !component.includes("Assumption firewall") ||
    component.includes("Math.random") ||
    component.includes("<canvas") ||
    component.includes("锟") ||
    !wrapper.includes("KERR_PHOTON_METROLOGY_DETAILS_V528[detail]") ||
    !wrapper.includes('data-atlas-v528-cost-request-before-detail="false"') ||
    wrapper.includes("fetch(") ||
    wrapper.includes("锟") ||
    (catalog.match(/lazy\(/g) ?? []).length !== 30 ||
    catalog.includes("fetch(") ||
    !route.includes('delivery!=="local-shadow"') ||
    !route.includes('"Cache-Control":"no-store"') ||
    !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV528"') ||
    workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV527"')
  ) {
    throw new Error("v528-runtime-source-boundary");
  }

  const sourcePaths = [
    paths.artifact,
    paths.previousEvidence,
    paths.previousPointer,
    paths.detector,
    paths.intake,
    paths.dense,
    paths.formal,
    "app/lib/kerrCalibrationCostSensitivityV528.ts",
    "app/lib/kerrCalibrationCostSensitivityV528.test.ts",
    "app/lib/kerrCalibrationCostSensitivityServerV528.ts",
    "app/lib/kerrCalibrationCostSensitivityServerV528.test.ts",
    "app/lib/kerrCalibrationCostSensitivityClientV528.ts",
    "app/lib/kerrCalibrationCostSensitivityClientV528.test.ts",
    "app/api/atlas/relativity-evidence/v528/calibration-cost-sensitivity/route.ts",
    "app/api/atlas/relativity-evidence/v528/calibration-cost-sensitivity/route.test.ts",
    "app/components/KerrCalibrationCostSensitivityV528.tsx",
    "app/components/KerrCalibrationCostSensitivityV528.test.tsx",
    "app/components/kerrPhotonMetrologyDetailCatalogV528.ts",
    "app/components/kerrPhotonMetrologyDetailCatalogV528.test.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV528.ts",
    "app/components/KerrPhotonMetrologyObservatoryIntentV528.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV528.test.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV527.test.tsx",
    "app/components/RelativityResearchWorkbenchV280.tsx",
    "app/lib/atlasResourceLifecycle.ts",
    "scripts/run-kerr-calibration-cost-sensitivity-v528.py",
    "scripts/test-kerr-calibration-cost-sensitivity-v528.py",
    "scripts/build-kerr-calibration-cost-sensitivity-runtime-v528.ts",
  ];
  const sourceManifest = sourcePaths
    .map((path) => ({ path, sha256: fileSha(path) }))
    .sort((a, b) => compare(a.path, b.path));
  const unsigned = {
    version: "v528-kerr-calibration-cost-sensitivity-runtime-audit-v1",
    generatedAt: "2026-08-02T00:00:00Z",
    status: "cost-sensitivity-runtime-qualified-v7r7-science-cinematic-geometry-stable",
    source: {
      sensitivityArtifactSha256: artifact.artifactSha256,
      v527EvidenceSha256: previousEvidence.evidenceSha256,
      v527PointerSha256: previousPointer.pointerSha256,
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
      artifactMaximumBytes: KERR_CALIBRATION_COST_SENSITIVITY_ARTIFACT_MAX_BYTES_V528,
      summaryMaximumBytes: 128 * 1024,
      localShadowOnly: true,
    },
    detailCatalog: {
      detailCount: detailIds.length,
      uniqueDetailCount: new Set(detailIds).size,
      concurrentDetailSurfaceBudget: 1,
      automaticDetailRequestCount: 0,
      sharedFrozenCatalog: true,
      workbenchCurrentBinding: "v528",
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
      costRatioDrivesStyle: false,
      optimumDrivesStyle: false,
      scientificFieldMutation: false,
    },
    counts: artifact.counts,
    assumedCostLaw: artifact.assumedCostLaw,
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
        sensitivitySha256: artifact.artifactSha256,
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
