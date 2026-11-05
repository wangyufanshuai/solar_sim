import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "../app/lib/atlasResourceLifecycle";
import {
  getKerrUncertaintyIndependentVerificationSnapshotV517,
  getKerrUncertaintyIndependentVerificationTelemetryV517,
  loadKerrUncertaintyIndependentVerificationSummaryV517,
  resetKerrUncertaintyIndependentVerificationClientForTestsV517,
  subscribeKerrUncertaintyIndependentVerificationV517,
} from "../app/lib/kerrUncertaintyIndependentVerificationClientV517";
import {
  loadKerrUncertaintyIndependentVerificationV517,
  resetKerrUncertaintyIndependentVerificationServerCacheForTestsV517,
} from "../app/lib/kerrUncertaintyIndependentVerificationServerV517";
import {
  KERR_UNCERTAINTY_INDEPENDENT_VERIFICATION_API_VERSION_V517,
  parseKerrUncertaintyIndependentVerificationReceiptV517,
} from "../app/lib/kerrUncertaintyIndependentVerificationV517";

const root = process.cwd();
const paths = {
  receipt:
    "dist/science/kerr-uncertainty-independent-verification-v517/verification-receipt.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v516-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v516.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-uncertainty-independent-verification-v517/runtime-audit.json",
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
  const receipt = parseKerrUncertaintyIndependentVerificationReceiptV517(read(paths.receipt));
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const detector = read(paths.detector);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (
    sha(receipt) !== receipt.artifactSha256 ||
    previousEvidence.version !== "orbit-atlas-shadow-v516-evidence-v1" ||
    sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
    previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v516" ||
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
    throw new Error("v517-runtime-upstream-boundary");
  }

  resetKerrUncertaintyIndependentVerificationServerCacheForTestsV517();
  const firstServerLoad = await loadKerrUncertaintyIndependentVerificationV517();
  const secondServerLoad = await loadKerrUncertaintyIndependentVerificationV517();
  if (
    firstServerLoad !== secondServerLoad ||
    firstServerLoad.receipt.artifactSha256 !== receipt.artifactSha256 ||
    firstServerLoad.export.bytes.byteLength > 128 * 1024
  ) {
    throw new Error("v517-runtime-server-boundary");
  }

  const body = JSON.stringify({
    version: KERR_UNCERTAINTY_INDEPENDENT_VERIFICATION_API_VERSION_V517,
    available: true,
    reason: "ready",
    summary: firstServerLoad.summary,
  });
  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  resetKerrUncertaintyIndependentVerificationClientForTestsV517();
  const baseline = getAtlasResourceSnapshot();
  let notifications = 0;
  const releases = [
    subscribeKerrUncertaintyIndependentVerificationV517(() => {
      notifications += 1;
    }),
    subscribeKerrUncertaintyIndependentVerificationV517(() => {
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
      loadKerrUncertaintyIndependentVerificationSummaryV517(),
      loadKerrUncertaintyIndependentVerificationSummaryV517(),
    ]);
  } finally {
    releases.forEach((release) => release());
    releases.forEach((release) => release());
    globalThis.fetch = originalFetch;
  }
  const finalDiff = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const telemetry = getKerrUncertaintyIndependentVerificationTelemetryV517();
  const snapshot = getKerrUncertaintyIndependentVerificationSnapshotV517();
  if (
    automaticRequestCount !== 0 ||
    requests.length !== 1 ||
    first !== second ||
    first?.artifactSha256 !== receipt.artifactSha256 ||
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
    throw new Error("v517-runtime-client-boundary");
  }
  resetKerrUncertaintyIndependentVerificationClientForTestsV517();

  const component = text("app/components/KerrUncertaintyIndependentVerificationV517.tsx");
  const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV517.tsx");
  const route = text(
    "app/api/atlas/relativity-evidence/v517/independent-verification/route.ts",
  );
  const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (
    !component.includes('data-atlas-v517-recomputed-witness-count="512"') ||
    !component.includes('data-atlas-v517-imported-v516-parser="false"') ||
    component.includes("Math.random") ||
    component.includes("<canvas") ||
    !wrapper.includes('import("./KerrUncertaintyIndependentVerificationV517")') ||
    wrapper.includes("fetch(") ||
    !route.includes('delivery !== "local-shadow"') ||
    !route.includes('"Cache-Control": "no-store"') ||
    !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV517"') ||
    [component, wrapper, route, workbench].some((source) => source.includes("�"))
  ) {
    throw new Error("v517-runtime-source-boundary");
  }

  const sourcePaths = [
    paths.receipt,
    paths.previousEvidence,
    paths.previousPointer,
    paths.detector,
    paths.dense,
    paths.formal,
    "app/lib/kerrUncertaintyIndependentVerificationV517.ts",
    "app/lib/kerrUncertaintyIndependentVerificationV517.test.ts",
    "app/lib/kerrUncertaintyIndependentVerificationServerV517.ts",
    "app/lib/kerrUncertaintyIndependentVerificationServerV517.test.ts",
    "app/lib/kerrUncertaintyIndependentVerificationClientV517.ts",
    "app/lib/kerrUncertaintyIndependentVerificationClientV517.test.ts",
    "app/api/atlas/relativity-evidence/v517/independent-verification/route.ts",
    "app/api/atlas/relativity-evidence/v517/independent-verification/route.test.ts",
    "app/components/KerrUncertaintyIndependentVerificationV517.tsx",
    "app/components/KerrUncertaintyIndependentVerificationV517.test.tsx",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV517.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV517.test.ts",
    "app/components/KerrPhotonMetrologyObservatoryIntentV517.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV517.test.tsx",
    "app/components/RelativityResearchWorkbenchV280.tsx",
    "app/lib/atlasResourceLifecycle.ts",
    "scripts/verify-kerr-uncertainty-replay-witness-v517.ts",
    "scripts/build-kerr-uncertainty-independent-verification-runtime-v517.ts",
  ];
  const sourceManifest = sourcePaths
    .map((path) => ({ path, sha256: fileSha(path) }))
    .sort((a, b) => a.path.localeCompare(b.path));
  const unsigned = {
    version: "v517-kerr-uncertainty-independent-verification-runtime-audit-v1",
    generatedAt: "2026-08-01T00:00:00Z",
    status: "independent-verification-runtime-qualified-single-flight-baseline",
    source: {
      verificationReceiptSha256: receipt.artifactSha256,
      v516EvidenceSha256: previousEvidence.evidenceSha256,
      v516PointerSha256: previousPointer.pointerSha256,
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
    verification: receipt.verification,
    lifecycle: receipt.lifecycle,
    boundary: receipt.boundary,
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
        receiptSha256: receipt.artifactSha256,
        witnesses: receipt.verification.recomputedWitnessCount,
        checkpoints: receipt.verification.matchedCheckpointCount,
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
