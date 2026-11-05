import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "../app/lib/atlasResourceLifecycle";
import {
  getKerrCostLawRobustnessSnapshotV529,
  getKerrCostLawRobustnessTelemetryV529,
  loadKerrCostLawRobustnessSummaryV529,
  resetKerrCostLawRobustnessClientForTestsV529,
  subscribeKerrCostLawRobustnessV529,
} from "../app/lib/kerrCostLawRobustnessClientV529";
import {
  KERR_COST_LAW_ROBUSTNESS_ARTIFACT_MAX_BYTES_V529,
  loadKerrCostLawRobustnessV529,
  resetKerrCostLawRobustnessServerCacheForTestsV529,
} from "../app/lib/kerrCostLawRobustnessServerV529";
import {
  KERR_COST_LAW_ROBUSTNESS_API_VERSION_V529,
  compareKerrCostLawHudEncodingsV529,
  createKerrCostLawHudEncodingV529,
  parseKerrCostLawRobustnessArtifactV529,
  resolveKerrCostLawHudProfileV529,
} from "../app/lib/kerrCostLawRobustnessV529";
import {
  KERR_PHOTON_METROLOGY_DETAIL_IDS_V529,
  KERR_PHOTON_METROLOGY_DETAILS_V529,
  KERR_PHOTON_METROLOGY_LABELS_V529,
} from "../app/components/kerrPhotonMetrologyDetailCatalogV529";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-cost-law-robustness-v529/envelope.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v528-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v528.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  intake: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-cost-law-robustness-v529/runtime-audit.json",
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
  const artifact = parseKerrCostLawRobustnessArtifactV529(read(paths.artifact));
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const detector = read(paths.detector);
  const intake = read(paths.intake);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (
    sha(artifact) !== artifact.artifactSha256 ||
    previousEvidence.version !== "orbit-atlas-shadow-v528-evidence-v1" ||
    sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
    previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v528" ||
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
    throw new Error("v529-runtime-upstream-boundary");
  }

  resetKerrCostLawRobustnessServerCacheForTestsV529();
  const firstServerLoad = await loadKerrCostLawRobustnessV529();
  const secondServerLoad = await loadKerrCostLawRobustnessV529();
  if (
    firstServerLoad !== secondServerLoad ||
    firstServerLoad.artifact.artifactSha256 !== artifact.artifactSha256 ||
    firstServerLoad.export.bytes.byteLength > KERR_COST_LAW_ROBUSTNESS_ARTIFACT_MAX_BYTES_V529
  ) {
    throw new Error("v529-runtime-server-boundary");
  }
  const body = JSON.stringify({
    version: KERR_COST_LAW_ROBUSTNESS_API_VERSION_V529,
    available: true,
    reason: "ready",
    summary: firstServerLoad.summary,
  });
  if (Buffer.byteLength(body) > 128 * 1024) throw new Error("v529-runtime-summary-size");

  const scienceEncoding = createKerrCostLawHudEncodingV529(firstServerLoad.summary, "science");
  const cinematicEncoding = createKerrCostLawHudEncodingV529(
    firstServerLoad.summary,
    "cinematic",
  );
  const encodingAudit = compareKerrCostLawHudEncodingsV529(
    scienceEncoding,
    cinematicEncoding,
  );
  const scienceProfile = resolveKerrCostLawHudProfileV529("science");
  const cinematicProfile = resolveKerrCostLawHudProfileV529("cinematic");
  if (
    scienceProfile !== resolveKerrCostLawHudProfileV529("science") ||
    cinematicProfile !== resolveKerrCostLawHudProfileV529("cinematic") ||
    scienceProfile.scienceBoundary.bloomIntensity !== 0 ||
    scienceProfile.scienceBoundary.colorGradeIntensity !== 0 ||
    encodingAudit.scientificPayloadStable !== true ||
    encodingAudit.scientificGeometryStable !== true ||
    encodingAudit.scientificGeometryInputCount !== 68 ||
    encodingAudit.numericScientificStyleInputCount !== 0
  ) {
    throw new Error("v529-runtime-profile-boundary");
  }

  const detailIds = [...KERR_PHOTON_METROLOGY_DETAIL_IDS_V529];
  const detailKeys = Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V529);
  const labelKeys = Object.keys(KERR_PHOTON_METROLOGY_LABELS_V529);
  if (
    detailIds.length !== 31 ||
    new Set(detailIds).size !== 31 ||
    JSON.stringify(detailIds) !== JSON.stringify(detailKeys) ||
    JSON.stringify(detailKeys) !== JSON.stringify(labelKeys) ||
    !Object.isFrozen(KERR_PHOTON_METROLOGY_DETAILS_V529) ||
    !Object.isFrozen(KERR_PHOTON_METROLOGY_LABELS_V529)
  ) {
    throw new Error("v529-runtime-detail-catalog-boundary");
  }

  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  resetKerrCostLawRobustnessClientForTestsV529();
  const baseline = getAtlasResourceSnapshot();
  let notifications = 0;
  const releases = [
    subscribeKerrCostLawRobustnessV529(() => {
      notifications += 1;
    }),
    subscribeKerrCostLawRobustnessV529(() => {
      notifications += 1;
    }),
  ];
  const peak = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const automaticRequestCount = requests.length;
  let first: Awaited<ReturnType<typeof loadKerrCostLawRobustnessSummaryV529>> | undefined;
  let second: Awaited<ReturnType<typeof loadKerrCostLawRobustnessSummaryV529>> | undefined;
  try {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requests.push(String(input));
      return new Response(body, { status: 200 });
    }) as typeof fetch;
    [first, second] = await Promise.all([
      loadKerrCostLawRobustnessSummaryV529(),
      loadKerrCostLawRobustnessSummaryV529(),
    ]);
  } finally {
    releases.forEach((release) => release());
    releases.forEach((release) => release());
    globalThis.fetch = originalFetch;
  }
  const finalDiff = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const telemetry = getKerrCostLawRobustnessTelemetryV529();
  const snapshot = getKerrCostLawRobustnessSnapshotV529();
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
    throw new Error("v529-runtime-client-boundary");
  }
  resetKerrCostLawRobustnessClientForTestsV529();

  const component = text("app/components/KerrCostLawRobustnessV529.tsx");
  const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV529.tsx");
  const catalog = text("app/components/kerrPhotonMetrologyDetailCatalogV529.ts");
  const route = text(
    "app/api/atlas/relativity-evidence/v529/cost-law-robustness/route.ts",
  );
  const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (
    !component.includes("stochasticExponentRatioSurface") ||
    !component.includes("这些坐标用于压力测试，不是实测成本模型") ||
    !component.includes("禁止自动选型") ||
    component.includes("Math.random") ||
    component.includes("<canvas") ||
    component.includes("锟") ||
    !wrapper.includes("KERR_PHOTON_METROLOGY_DETAILS_V529[detail]") ||
    !wrapper.includes('data-atlas-v529-robustness-request-before-detail="false"') ||
    wrapper.includes("fetch(") ||
    wrapper.includes("锟") ||
    (catalog.match(/lazy\(/g) ?? []).length !== 1 ||
    !catalog.includes("...KERR_PHOTON_METROLOGY_DETAILS_V528") ||
    catalog.includes("fetch(") ||
    !route.includes('delivery !== "local-shadow"') ||
    !route.includes('"Cache-Control": "no-store"') ||
    !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV529"') ||
    workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV528"')
  ) {
    throw new Error("v529-runtime-source-boundary");
  }

  const sourcePaths = [
    paths.artifact,
    paths.previousEvidence,
    paths.previousPointer,
    paths.detector,
    paths.intake,
    paths.dense,
    paths.formal,
    "app/lib/kerrCostLawRobustnessV529.ts",
    "app/lib/kerrCostLawRobustnessV529.test.ts",
    "app/lib/kerrCostLawRobustnessServerV529.ts",
    "app/lib/kerrCostLawRobustnessServerV529.test.ts",
    "app/lib/kerrCostLawRobustnessClientV529.ts",
    "app/lib/kerrCostLawRobustnessClientV529.test.ts",
    "app/api/atlas/relativity-evidence/v529/cost-law-robustness/route.ts",
    "app/api/atlas/relativity-evidence/v529/cost-law-robustness/route.test.ts",
    "app/components/KerrCostLawRobustnessV529.tsx",
    "app/components/KerrCostLawRobustnessV529.test.tsx",
    "app/components/kerrPhotonMetrologyDetailCatalogV529.ts",
    "app/components/kerrPhotonMetrologyDetailCatalogV529.test.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV529.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV529.test.ts",
    "app/components/KerrPhotonMetrologyObservatoryIntentV529.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV529.test.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV528.test.tsx",
    "app/components/RelativityResearchWorkbenchV280.tsx",
    "app/lib/atlasResourceLifecycle.ts",
    "scripts/run-kerr-cost-law-robustness-v529.py",
    "scripts/test-kerr-cost-law-robustness-v529.py",
    "scripts/build-kerr-cost-law-robustness-runtime-v529.ts",
  ];
  const sourceManifest = sourcePaths
    .map((path) => ({ path, sha256: fileSha(path) }))
    .sort((a, b) => compare(a.path, b.path));
  const unsigned = {
    version: "v529-kerr-cost-law-robustness-runtime-audit-v1",
    generatedAt: "2026-08-02T00:00:00Z",
    status: "cost-law-robustness-runtime-qualified-v7r8-science-cinematic-geometry-stable",
    source: {
      envelopeArtifactSha256: artifact.artifactSha256,
      v528EvidenceSha256: previousEvidence.evidenceSha256,
      v528PointerSha256: previousPointer.pointerSha256,
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
      artifactMaximumBytes: KERR_COST_LAW_ROBUSTNESS_ARTIFACT_MAX_BYTES_V529,
      summaryMaximumBytes: 128 * 1024,
      localShadowOnly: true,
    },
    detailCatalog: {
      detailCount: detailIds.length,
      uniqueDetailCount: new Set(detailIds).size,
      inheritedDetailCount: 30,
      newLazyImportCount: 1,
      concurrentDetailSurfaceBudget: 1,
      automaticDetailRequestCount: 0,
      sharedFrozenCatalog: true,
      workbenchCurrentBinding: "v529",
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
      exponentDrivesStyle: false,
      floorDrivesStyle: false,
      overheadDrivesStyle: false,
      scientificFieldMutation: false,
    },
    counts: artifact.counts,
    parameterGrid: artifact.parameterGrid,
    costLaw: artifact.costLaw,
    robustnessAudits: artifact.robustnessAudits,
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
        envelopeSha256: artifact.artifactSha256,
        fullFactorialCells: audit.counts.fullFactorialCellCount,
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
