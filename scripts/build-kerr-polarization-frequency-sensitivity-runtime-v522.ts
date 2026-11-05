import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "../app/lib/atlasResourceLifecycle";
import {
  getKerrPolarizationFrequencySensitivitySnapshotV522,
  getKerrPolarizationFrequencySensitivityTelemetryV522,
  loadKerrPolarizationFrequencySensitivitySummaryV522,
  resetKerrPolarizationFrequencySensitivityClientForTestsV522,
  subscribeKerrPolarizationFrequencySensitivityV522,
} from "../app/lib/kerrPolarizationFrequencySensitivityClientV522";
import {
  loadKerrPolarizationFrequencySensitivityV522,
  resetKerrPolarizationFrequencySensitivityServerCacheForTestsV522,
} from "../app/lib/kerrPolarizationFrequencySensitivityServerV522";
import {
  KERR_POLARIZATION_FREQUENCY_SENSITIVITY_API_VERSION_V522,
  parseKerrPolarizationFrequencySensitivityArtifactV522,
} from "../app/lib/kerrPolarizationFrequencySensitivityV522";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-polarization-frequency-sensitivity-v522/envelope.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v521-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v521.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-polarization-frequency-sensitivity-v522/runtime-audit.json",
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
  const artifact = parseKerrPolarizationFrequencySensitivityArtifactV522(
    read(paths.artifact),
  );
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const detector = read(paths.detector);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (
    sha(artifact) !== artifact.artifactSha256 ||
    previousEvidence.version !== "orbit-atlas-shadow-v521-evidence-v1" ||
    sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
    previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v521" ||
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
    throw new Error("v522-runtime-upstream-boundary");
  }

  resetKerrPolarizationFrequencySensitivityServerCacheForTestsV522();
  const firstServerLoad = await loadKerrPolarizationFrequencySensitivityV522();
  const secondServerLoad = await loadKerrPolarizationFrequencySensitivityV522();
  if (
    firstServerLoad !== secondServerLoad ||
    firstServerLoad.artifact.artifactSha256 !== artifact.artifactSha256 ||
    firstServerLoad.export.bytes.byteLength > 512 * 1024
  ) {
    throw new Error("v522-runtime-server-boundary");
  }
  const body = JSON.stringify({
    version: KERR_POLARIZATION_FREQUENCY_SENSITIVITY_API_VERSION_V522,
    available: true,
    reason: "ready",
    summary: firstServerLoad.summary,
  });
  if (Buffer.byteLength(body) > 128 * 1024) throw new Error("v522-runtime-summary-size");
  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  resetKerrPolarizationFrequencySensitivityClientForTestsV522();
  const baseline = getAtlasResourceSnapshot();
  let notifications = 0;
  const releases = [
    subscribeKerrPolarizationFrequencySensitivityV522(() => {
      notifications += 1;
    }),
    subscribeKerrPolarizationFrequencySensitivityV522(() => {
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
      loadKerrPolarizationFrequencySensitivitySummaryV522(),
      loadKerrPolarizationFrequencySensitivitySummaryV522(),
    ]);
  } finally {
    releases.forEach((release) => release());
    releases.forEach((release) => release());
    globalThis.fetch = originalFetch;
  }
  const finalDiff = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const telemetry = getKerrPolarizationFrequencySensitivityTelemetryV522();
  const snapshot = getKerrPolarizationFrequencySensitivitySnapshotV522();
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
    throw new Error("v522-runtime-client-boundary");
  }
  resetKerrPolarizationFrequencySensitivityClientForTestsV522();

  const component = text("app/components/KerrPolarizationFrequencySensitivityV522.tsx");
  const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV522.tsx");
  const route = text(
    "app/api/atlas/relativity-evidence/v522/polarization-sensitivity/route.ts",
  );
  const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (
    !component.includes('data-atlas-v522-direct-integral-count="888"') ||
    !component.includes('data-atlas-v522-physical-prior-qualified="false"') ||
    component.includes("Math.random") ||
    component.includes("<canvas") ||
    component.includes("�") ||
    !wrapper.includes('import("./KerrPolarizationFrequencySensitivityV522")') ||
    wrapper.includes("fetch(") ||
    wrapper.includes("�") ||
    !route.includes('delivery !== "local-shadow"') ||
    !route.includes('"Cache-Control": "no-store"') ||
    !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV522"')
  ) {
    throw new Error("v522-runtime-source-boundary");
  }

  const sourcePaths = [
    paths.artifact,
    paths.previousEvidence,
    paths.previousPointer,
    paths.detector,
    paths.dense,
    paths.formal,
    "app/lib/kerrPolarizationFrequencySensitivityV522.ts",
    "app/lib/kerrPolarizationFrequencySensitivityV522.test.ts",
    "app/lib/kerrPolarizationFrequencySensitivityServerV522.ts",
    "app/lib/kerrPolarizationFrequencySensitivityServerV522.test.ts",
    "app/lib/kerrPolarizationFrequencySensitivityClientV522.ts",
    "app/lib/kerrPolarizationFrequencySensitivityClientV522.test.ts",
    "app/api/atlas/relativity-evidence/v522/polarization-sensitivity/route.ts",
    "app/api/atlas/relativity-evidence/v522/polarization-sensitivity/route.test.ts",
    "app/components/KerrPolarizationFrequencySensitivityV522.tsx",
    "app/components/KerrPolarizationFrequencySensitivityV522.test.tsx",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV522.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV522.test.ts",
    "app/components/KerrPhotonMetrologyObservatoryIntentV522.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV522.test.tsx",
    "app/components/RelativityResearchWorkbenchV280.tsx",
    "app/lib/atlasResourceLifecycle.ts",
    "scripts/run-kerr-polarization-frequency-sensitivity-v522.py",
    "scripts/test-kerr-polarization-frequency-sensitivity-v522.py",
    "scripts/build-kerr-polarization-frequency-sensitivity-runtime-v522.ts",
  ];
  const sourceManifest = sourcePaths
    .map((path) => ({ path, sha256: fileSha(path) }))
    .sort((a, b) => a.path.localeCompare(b.path));
  const unsigned = {
    version: "v522-kerr-polarization-frequency-sensitivity-runtime-audit-v1",
    generatedAt: "2026-08-02T00:00:00Z",
    status: "polarization-frequency-sensitivity-runtime-qualified-single-flight-baseline",
    source: {
      sensitivityArtifactSha256: artifact.artifactSha256,
      v521EvidenceSha256: previousEvidence.evidenceSha256,
      v521PointerSha256: previousPointer.pointerSha256,
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
      artifactMaximumBytes: 512 * 1024,
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
        sensitivitySha256: artifact.artifactSha256,
        scenarioRows: artifact.counts.scenarioRowCount,
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
