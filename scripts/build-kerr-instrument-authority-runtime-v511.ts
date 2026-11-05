import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "../app/lib/atlasResourceLifecycle";
import {
  getKerrInstrumentAuthorityMatrixSnapshotV511,
  getKerrInstrumentAuthorityMatrixTelemetryV511,
  loadKerrInstrumentAuthorityMatrixSummaryV511,
  resetKerrInstrumentAuthorityMatrixClientForTestsV511,
  subscribeKerrInstrumentAuthorityMatrixV511,
} from "../app/lib/kerrInstrumentAuthorityMatrixClientV511";
import {
  KERR_INSTRUMENT_AUTHORITY_MATRIX_API_VERSION_V511,
  canonicalKerrInstrumentAuthorityMatrixV511,
} from "../app/lib/kerrInstrumentAuthorityMatrixV511";
import { loadKerrInstrumentAuthorityMatrixV511 } from "../app/lib/kerrInstrumentAuthorityMatrixServerV511";

const root = process.cwd();
const paths = Object.freeze({
  matrix: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v510-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v510.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-instrument-authority-matrix-v511/runtime-audit.json",
});
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
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => left.localeCompare(right))
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

async function main(): Promise<void> {
  const matrix = read(paths.matrix);
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (
    createHash("sha256")
      .update(canonicalKerrInstrumentAuthorityMatrixV511(matrix))
      .digest("hex") !== matrix.artifactSha256 ||
    previousEvidence.version !== "orbit-atlas-shadow-v510-evidence-v1" ||
    sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
    previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v510" ||
    sha(previousPointer) !== previousPointer.pointerSha256 ||
    dense.status !== "incomplete-0-of-49" ||
    dense.completedShardCount !== 0 ||
    dense.attemptConsumed !== false ||
    formal.version !== "v263-current-product-evidence-pointer" ||
    formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
    formalEvidence.contracts?.singleCanvas !== true ||
    formalEvidence.contracts?.legacyRootAttributes !== 603 ||
    formalEvidence.contracts?.evidenceLedgerClaims !== 84
  ) {
    throw new Error("v511-runtime-upstream-boundary");
  }

  const loaded = await loadKerrInstrumentAuthorityMatrixV511();
  if (
    loaded.artifact.artifactSha256 !== matrix.artifactSha256 ||
    loaded.summary.counts.stageCount !== 6 ||
    loaded.summary.counts.measuredCalibrationFiles !== 0 ||
    loaded.summary.counts.measuredResponseRows !== 0 ||
    loaded.summary.counts.observedCountRows !== 0 ||
    loaded.summary.counts.sciencePixelRows !== 0 ||
    loaded.export.bytes.byteLength > 128 * 1024
  ) {
    throw new Error("v511-runtime-server-boundary");
  }
  const body = JSON.stringify({
    version: KERR_INSTRUMENT_AUTHORITY_MATRIX_API_VERSION_V511,
    available: true,
    reason: "ready",
    summary: loaded.summary,
  });
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requests.push(String(input));
    return new Response(body, { status: 200 });
  }) as typeof fetch;
  resetKerrInstrumentAuthorityMatrixClientForTestsV511();
  const baseline = getAtlasResourceSnapshot();
  let notifications = 0;
  const release = subscribeKerrInstrumentAuthorityMatrixV511(() => {
    notifications += 1;
  });
  const subscriptionPeak = diffAtlasResourceSnapshotsV300(
    baseline,
    getAtlasResourceSnapshot(),
  );
  const automaticRequestCount = requests.length;
  const [first, second] = await Promise.all([
    loadKerrInstrumentAuthorityMatrixSummaryV511(),
    loadKerrInstrumentAuthorityMatrixSummaryV511(),
  ]);
  release();
  release();
  const finalDiff = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const telemetry = getKerrInstrumentAuthorityMatrixTelemetryV511();
  const snapshot = getKerrInstrumentAuthorityMatrixSnapshotV511();
  globalThis.fetch = originalFetch;
  if (
    automaticRequestCount !== 0 ||
    requests.length !== 1 ||
    !requests[0].endsWith("/api/atlas/relativity-evidence/v511/instrument-authority-matrix") ||
    first !== second ||
    first.artifactSha256 !== matrix.artifactSha256 ||
    notifications !== 2 ||
    subscriptionPeak.total !== 1 ||
    subscriptionPeak.subscriptions !== 1 ||
    telemetry.listenerCount !== 0 ||
    telemetry.requestCount !== 1 ||
    telemetry.status !== "ready" ||
    telemetry.hasSummary !== true ||
    telemetry.sceneRevisionDelta !== 0 ||
    telemetry.scientificFieldMutationAllowed !== false ||
    snapshot.status !== "ready" ||
    finalDiff.status !== "baseline" ||
    finalDiff.total !== 0 ||
    finalDiff.subscriptions !== 0
  ) {
    throw new Error("v511-runtime-client-boundary");
  }
  resetKerrInstrumentAuthorityMatrixClientForTestsV511();

  const componentSource = text("app/components/KerrInstrumentAuthorityMatrixV511.tsx");
  const wrapperSource = text("app/components/KerrPhotonMetrologyObservatoryIntentV511.tsx");
  const workbenchSource = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (
    !componentSource.includes('data-atlas-v511-stage-count="6"') ||
    !componentSource.includes('data-atlas-v511-solar-first-screen-request-count="0"') ||
    !componentSource.includes('data-atlas-v511-detector-authority="false"') ||
    !componentSource.includes('data-atlas-v511-science-raster="false"') ||
    componentSource.includes("Math.random") ||
    componentSource.includes("<canvas") ||
    !wrapperSource.includes('lazy(() => import("./KerrInstrumentAuthorityMatrixV511"))') ||
    !wrapperSource.includes('data-atlas-v511-static-network-budget="0"') ||
    wrapperSource.includes("fetch(") ||
    !workbenchSource.includes('from "./KerrPhotonMetrologyObservatoryIntentV511"') ||
    [componentSource, wrapperSource, workbenchSource].some((source) => source.includes("�"))
  ) {
    throw new Error("v511-runtime-source-boundary");
  }

  const sourcePaths = [
    "app/lib/kerrInstrumentAuthorityMatrixV511.ts",
    "app/lib/kerrInstrumentAuthorityMatrixV511.test.ts",
    "app/lib/kerrInstrumentAuthorityMatrixServerV511.ts",
    "app/lib/kerrInstrumentAuthorityMatrixServerV511.test.ts",
    "app/lib/kerrInstrumentAuthorityMatrixClientV511.ts",
    "app/lib/kerrInstrumentAuthorityMatrixClientV511.test.ts",
    "app/api/atlas/relativity-evidence/v511/instrument-authority-matrix/route.ts",
    "app/api/atlas/relativity-evidence/v511/instrument-authority-matrix/route.test.ts",
    "app/components/KerrInstrumentAuthorityMatrixV511.tsx",
    "app/components/KerrInstrumentAuthorityMatrixV511.test.tsx",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV511.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV511.test.ts",
    "app/components/KerrPhotonMetrologyObservatoryIntentV511.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV511.test.tsx",
    "app/components/RelativityResearchWorkbenchV280.tsx",
    "app/lib/atlasResourceLifecycle.ts",
    "scripts/build-kerr-instrument-authority-matrix-v511.ts",
    "scripts/build-kerr-instrument-authority-runtime-v511.ts",
  ];
  const sourceManifest = sourcePaths
    .map((path) => ({ path, sha256: fileSha(path) }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const unsigned = {
    version: "v511-kerr-instrument-authority-runtime-audit-v1",
    generatedAt: "2026-08-01T00:00:00Z",
    status: "instrument-authority-runtime-qualified-measured-response-blocked",
    source: {
      matrixArtifactSha256: matrix.artifactSha256,
      v510EvidenceSha256: previousEvidence.evidenceSha256,
      v510PointerSha256: previousPointer.pointerSha256,
    },
    runtime: {
      serverFileBytes: loaded.export.bytes.byteLength,
      summaryResponseBytes: Buffer.byteLength(body),
      automaticRequestCount,
      explicitRequestCount: requests.length,
      singleFlightConsumerCount: 2,
      notificationCount: notifications,
      peakSubscriptionCount: subscriptionPeak.subscriptions,
      finalResourceStatus: finalDiff.status,
      responseCachePolicy: "no-store",
      responseMaximumBytes: 128 * 1024,
      localShadowOnly: true,
    },
    matrix: {
      stageCount: first.counts.stageCount,
      sourcePhotonRows: first.counts.sourcePhotonRows,
      computationalFixtureRows: first.counts.computationalFixtureRows,
      measuredCalibrationFiles: first.counts.measuredCalibrationFiles,
      requiredMeasuredCalibrationFiles: first.counts.requiredMeasuredCalibrationFiles,
      measuredResponseRows: first.counts.measuredResponseRows,
      electronExpectationRows: first.counts.electronExpectationRows,
      observedCountRows: first.counts.observedCountRows,
      sciencePixelRows: first.counts.sciencePixelRows,
      transitionCount: first.transitions.length,
      dimensionalContract: first.dimensionalContract,
    },
    boundary: first.boundary,
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
        matrixArtifactSha256: matrix.artifactSha256,
        stages: audit.matrix.stageCount,
        sourcePhotonRows: audit.matrix.sourcePhotonRows,
        measuredFiles: `${audit.matrix.measuredCalibrationFiles}/${audit.matrix.requiredMeasuredCalibrationFiles}`,
        automaticRequests: audit.runtime.automaticRequestCount,
        explicitRequests: audit.runtime.explicitRequestCount,
        singleFlightConsumers: audit.runtime.singleFlightConsumerCount,
        finalResourceStatus: audit.runtime.finalResourceStatus,
        detectorResponse: audit.boundary.detectorResponseAvailable,
        scienceRaster: audit.boundary.scienceRasterAvailable,
        denseCampaign: audit.boundary.denseCampaignStatus,
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
