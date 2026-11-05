import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "../app/lib/atlasResourceLifecycle";
import {
  getKerrFixedBandStokesSnapshotV520,
  getKerrFixedBandStokesTelemetryV520,
  loadKerrFixedBandStokesSummaryV520,
  resetKerrFixedBandStokesClientForTestsV520,
  subscribeKerrFixedBandStokesV520,
} from "../app/lib/kerrFixedBandStokesClientV520";
import {
  loadKerrFixedBandStokesV520,
  resetKerrFixedBandStokesServerCacheForTestsV520,
} from "../app/lib/kerrFixedBandStokesServerV520";
import {
  KERR_FIXED_BAND_STOKES_API_VERSION_V520,
  parseKerrFixedBandStokesArtifactV520,
} from "../app/lib/kerrFixedBandStokesV520";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-fixed-band-stokes-v520/stokes-payload.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v519-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v519.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-fixed-band-stokes-v520/runtime-audit.json",
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
  const artifact = parseKerrFixedBandStokesArtifactV520(read(paths.artifact));
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const detector = read(paths.detector);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (
    sha(artifact) !== artifact.artifactSha256 ||
    previousEvidence.version !== "orbit-atlas-shadow-v519-evidence-v1" ||
    sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
    previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v519" ||
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
    throw new Error("v520-runtime-upstream-boundary");
  }

  resetKerrFixedBandStokesServerCacheForTestsV520();
  const firstServerLoad = await loadKerrFixedBandStokesV520();
  const secondServerLoad = await loadKerrFixedBandStokesV520();
  if (
    firstServerLoad !== secondServerLoad ||
    firstServerLoad.artifact.artifactSha256 !== artifact.artifactSha256 ||
    firstServerLoad.export.bytes.byteLength > 128 * 1024
  ) {
    throw new Error("v520-runtime-server-boundary");
  }
  const body = JSON.stringify({
    version: KERR_FIXED_BAND_STOKES_API_VERSION_V520,
    available: true,
    reason: "ready",
    summary: firstServerLoad.summary,
  });
  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  resetKerrFixedBandStokesClientForTestsV520();
  const baseline = getAtlasResourceSnapshot();
  let notifications = 0;
  const releases = [
    subscribeKerrFixedBandStokesV520(() => {
      notifications += 1;
    }),
    subscribeKerrFixedBandStokesV520(() => {
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
      loadKerrFixedBandStokesSummaryV520(),
      loadKerrFixedBandStokesSummaryV520(),
    ]);
  } finally {
    releases.forEach((release) => release());
    releases.forEach((release) => release());
    globalThis.fetch = originalFetch;
  }
  const finalDiff = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const telemetry = getKerrFixedBandStokesTelemetryV520();
  const snapshot = getKerrFixedBandStokesSnapshotV520();
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
    throw new Error("v520-runtime-client-boundary");
  }
  resetKerrFixedBandStokesClientForTestsV520();

  const component = text("app/components/KerrFixedBandStokesV520.tsx");
  const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV520.tsx");
  const route = text("app/api/atlas/relativity-evidence/v520/fixed-band-stokes/route.ts");
  const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (
    !component.includes('data-atlas-v520-row-count="24"') ||
    !component.includes('data-atlas-v520-measured-stokes-row-count="0"') ||
    component.includes("Math.random") ||
    component.includes("<canvas") ||
    component.includes("�") ||
    !wrapper.includes('import("./KerrFixedBandStokesV520")') ||
    wrapper.includes("fetch(") ||
    wrapper.includes("�") ||
    !route.includes('delivery !== "local-shadow"') ||
    !route.includes('"Cache-Control": "no-store"') ||
    !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV520"')
  ) {
    throw new Error("v520-runtime-source-boundary");
  }

  const sourcePaths = [
    paths.artifact,
    paths.previousEvidence,
    paths.previousPointer,
    paths.detector,
    paths.dense,
    paths.formal,
    "app/lib/kerrFixedBandStokesV520.ts",
    "app/lib/kerrFixedBandStokesV520.test.ts",
    "app/lib/kerrFixedBandStokesServerV520.ts",
    "app/lib/kerrFixedBandStokesServerV520.test.ts",
    "app/lib/kerrFixedBandStokesClientV520.ts",
    "app/lib/kerrFixedBandStokesClientV520.test.ts",
    "app/api/atlas/relativity-evidence/v520/fixed-band-stokes/route.ts",
    "app/api/atlas/relativity-evidence/v520/fixed-band-stokes/route.test.ts",
    "app/components/KerrFixedBandStokesV520.tsx",
    "app/components/KerrFixedBandStokesV520.test.tsx",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV520.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV520.test.ts",
    "app/components/KerrPhotonMetrologyObservatoryIntentV520.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV520.test.tsx",
    "app/components/RelativityResearchWorkbenchV280.tsx",
    "app/lib/atlasResourceLifecycle.ts",
    "scripts/run-kerr-fixed-band-stokes-v520.py",
    "scripts/test-kerr-fixed-band-stokes-v520.py",
    "scripts/build-kerr-fixed-band-stokes-runtime-v520.ts",
  ];
  const sourceManifest = sourcePaths
    .map((path) => ({ path, sha256: fileSha(path) }))
    .sort((a, b) => a.path.localeCompare(b.path));
  const unsigned = {
    version: "v520-kerr-fixed-band-stokes-runtime-audit-v1",
    generatedAt: "2026-08-02T00:00:00Z",
    status: "fixed-band-stokes-runtime-qualified-single-flight-baseline",
    source: {
      stokesArtifactSha256: artifact.artifactSha256,
      v519EvidenceSha256: previousEvidence.evidenceSha256,
      v519PointerSha256: previousPointer.pointerSha256,
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
      responseMaximumBytes: 128 * 1024,
      localShadowOnly: true,
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
  console.log(
    JSON.stringify(
      {
        status: audit.status,
        artifactSha256: audit.artifactSha256,
        stokesSha256: artifact.artifactSha256,
        rows: artifact.counts.rowCount,
        consumers: audit.runtime.singleFlightConsumerCount,
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
