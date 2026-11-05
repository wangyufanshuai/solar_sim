import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "../app/lib/atlasResourceLifecycle";
import {
  getKerrFixedBandStokesOracleSnapshotV521,
  getKerrFixedBandStokesOracleTelemetryV521,
  loadKerrFixedBandStokesOracleSummaryV521,
  resetKerrFixedBandStokesOracleClientForTestsV521,
  subscribeKerrFixedBandStokesOracleV521,
} from "../app/lib/kerrFixedBandStokesOracleClientV521";
import {
  loadKerrFixedBandStokesOracleV521,
  resetKerrFixedBandStokesOracleServerCacheForTestsV521,
} from "../app/lib/kerrFixedBandStokesOracleServerV521";
import {
  KERR_FIXED_BAND_STOKES_ORACLE_API_VERSION_V521,
  parseKerrFixedBandStokesOracleArtifactV521,
} from "../app/lib/kerrFixedBandStokesOracleV521";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-fixed-band-stokes-oracle-v521/oracle.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v520-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v520.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-fixed-band-stokes-oracle-v521/runtime-audit.json",
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
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(([key]) => !transient.has(key))
            .sort(([a], [b]) => a.localeCompare(b))
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
  const artifact = parseKerrFixedBandStokesOracleArtifactV521(read(paths.artifact));
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const detector = read(paths.detector);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (
    sha(artifact) !== artifact.artifactSha256 ||
    previousEvidence.version !== "orbit-atlas-shadow-v520-evidence-v1" ||
    sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
    previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v520" ||
    sha(previousPointer) !== previousPointer.pointerSha256 ||
    detector.counts.measuredCalibrationFiles !== 0 ||
    detector.counts.requiredMeasuredCalibrationFiles !== 6 ||
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
    throw new Error("v521-runtime-upstream-boundary");
  }

  resetKerrFixedBandStokesOracleServerCacheForTestsV521();
  const firstServerLoad = await loadKerrFixedBandStokesOracleV521();
  const secondServerLoad = await loadKerrFixedBandStokesOracleV521();
  if (
    firstServerLoad !== secondServerLoad ||
    firstServerLoad.artifact.artifactSha256 !== artifact.artifactSha256 ||
    firstServerLoad.export.bytes.byteLength > 192 * 1024
  ) {
    throw new Error("v521-runtime-server-boundary");
  }
  const body = JSON.stringify({
    version: KERR_FIXED_BAND_STOKES_ORACLE_API_VERSION_V521,
    available: true,
    reason: "ready",
    summary: firstServerLoad.summary,
  });
  if (Buffer.byteLength(body) > 128 * 1024) throw new Error("v521-runtime-summary-size");
  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  resetKerrFixedBandStokesOracleClientForTestsV521();
  const baseline = getAtlasResourceSnapshot();
  let notifications = 0;
  const releases = [
    subscribeKerrFixedBandStokesOracleV521(() => {
      notifications += 1;
    }),
    subscribeKerrFixedBandStokesOracleV521(() => {
      notifications += 1;
    }),
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
      loadKerrFixedBandStokesOracleSummaryV521(),
      loadKerrFixedBandStokesOracleSummaryV521(),
    ]);
  } finally {
    releases.forEach((release) => release());
    releases.forEach((release) => release());
    globalThis.fetch = originalFetch;
  }
  const finalDiff = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const telemetry = getKerrFixedBandStokesOracleTelemetryV521();
  const snapshot = getKerrFixedBandStokesOracleSnapshotV521();
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
    throw new Error("v521-runtime-client-boundary");
  }
  resetKerrFixedBandStokesOracleClientForTestsV521();

  const component = text("app/components/KerrFixedBandStokesOracleV521.tsx");
  const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV521.tsx");
  const route = text("app/api/atlas/relativity-evidence/v521/stokes-oracle/route.ts");
  const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (
    !component.includes('data-atlas-v521-direct-integral-count="144"') ||
    !component.includes('data-atlas-v521-measured-stokes-row-count="0"') ||
    component.includes("Math.random") ||
    component.includes("<canvas") ||
    component.includes("�") ||
    !wrapper.includes('import("./KerrFixedBandStokesOracleV521")') ||
    wrapper.includes("fetch(") ||
    wrapper.includes("�") ||
    !route.includes('delivery !== "local-shadow"') ||
    !route.includes('"Cache-Control": "no-store"') ||
    !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV521"')
  ) {
    throw new Error("v521-runtime-source-boundary");
  }

  const sourcePaths = [
    paths.artifact,
    paths.previousEvidence,
    paths.previousPointer,
    paths.detector,
    paths.dense,
    paths.formal,
    "app/lib/kerrFixedBandStokesOracleV521.ts",
    "app/lib/kerrFixedBandStokesOracleV521.test.ts",
    "app/lib/kerrFixedBandStokesOracleServerV521.ts",
    "app/lib/kerrFixedBandStokesOracleServerV521.test.ts",
    "app/lib/kerrFixedBandStokesOracleClientV521.ts",
    "app/lib/kerrFixedBandStokesOracleClientV521.test.ts",
    "app/api/atlas/relativity-evidence/v521/stokes-oracle/route.ts",
    "app/api/atlas/relativity-evidence/v521/stokes-oracle/route.test.ts",
    "app/components/KerrFixedBandStokesOracleV521.tsx",
    "app/components/KerrFixedBandStokesOracleV521.test.tsx",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV521.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV521.test.ts",
    "app/components/KerrPhotonMetrologyObservatoryIntentV521.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV521.test.tsx",
    "app/components/RelativityResearchWorkbenchV280.tsx",
    "app/lib/atlasResourceLifecycle.ts",
    "scripts/run-kerr-fixed-band-stokes-oracle-v521.py",
    "scripts/test-kerr-fixed-band-stokes-oracle-v521.py",
    "scripts/build-kerr-fixed-band-stokes-oracle-runtime-v521.ts",
  ];
  const sourceManifest = sourcePaths
    .map((path) => ({ path, sha256: fileSha(path) }))
    .sort((a, b) => a.path.localeCompare(b.path));
  const unsigned = {
    version: "v521-kerr-fixed-band-stokes-oracle-runtime-audit-v1",
    generatedAt: "2026-08-02T00:00:00Z",
    status: "direct-stokes-oracle-runtime-qualified-single-flight-baseline",
    source: {
      oracleArtifactSha256: artifact.artifactSha256,
      v520EvidenceSha256: previousEvidence.evidenceSha256,
      v520PointerSha256: previousPointer.pointerSha256,
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
      artifactMaximumBytes: 192 * 1024,
      summaryMaximumBytes: 128 * 1024,
      localShadowOnly: true,
    },
    counts: artifact.counts,
    maxima: artifact.maxima,
    limits: artifact.limits,
    qualification: artifact.qualification,
    uncertaintyPolicy: artifact.uncertaintyPolicy,
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
        oracleSha256: artifact.artifactSha256,
        rows: artifact.counts.rowCount,
        directAdaptiveIntegrals: artifact.counts.directAdaptiveIntegralCount,
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
