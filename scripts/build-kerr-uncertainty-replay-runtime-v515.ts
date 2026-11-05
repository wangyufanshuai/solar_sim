import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "../app/lib/atlasResourceLifecycle";
import {
  getKerrUncertaintyReplaySnapshotV515,
  getKerrUncertaintyReplayTelemetryV515,
  loadKerrUncertaintyReplaySummaryV515,
  resetKerrUncertaintyReplayClientForTestsV515,
  subscribeKerrUncertaintyReplayV515,
} from "../app/lib/kerrUncertaintyReplayClientV515";
import {
  loadKerrUncertaintyReplayV515,
  resetKerrUncertaintyReplayServerCacheForTestsV515,
} from "../app/lib/kerrUncertaintyReplayServerV515";
import {
  KERR_UNCERTAINTY_REPLAY_API_VERSION_V515,
  parseKerrUncertaintyReplayArtifactV515,
} from "../app/lib/kerrUncertaintyReplayV515";

const root = process.cwd();
const paths = {
  replay: "dist/science/kerr-uncertainty-replay-v515/replay.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v514-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v514.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-uncertainty-replay-v515/runtime-audit.json",
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
  const replay = parseKerrUncertaintyReplayArtifactV515(read(paths.replay));
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);

  if (
    sha(replay) !== replay.artifactSha256 ||
    previousEvidence.version !== "orbit-atlas-shadow-v514-evidence-v1" ||
    sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
    previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v514" ||
    sha(previousPointer) !== previousPointer.pointerSha256 ||
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
    throw new Error("v515-runtime-upstream-boundary");
  }

  resetKerrUncertaintyReplayServerCacheForTestsV515();
  const firstServerLoad = await loadKerrUncertaintyReplayV515();
  const secondServerLoad = await loadKerrUncertaintyReplayV515();
  if (
    firstServerLoad !== secondServerLoad ||
    firstServerLoad.artifact.artifactSha256 !== replay.artifactSha256 ||
    firstServerLoad.export.bytes.byteLength > 128 * 1024
  ) {
    throw new Error("v515-runtime-server-boundary");
  }

  const body = JSON.stringify({
    version: KERR_UNCERTAINTY_REPLAY_API_VERSION_V515,
    available: true,
    reason: "ready",
    summary: firstServerLoad.summary,
  });
  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  resetKerrUncertaintyReplayClientForTestsV515();
  const baseline = getAtlasResourceSnapshot();
  let notifications = 0;
  const releases = [
    subscribeKerrUncertaintyReplayV515(() => {
      notifications += 1;
    }),
    subscribeKerrUncertaintyReplayV515(() => {
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
      loadKerrUncertaintyReplaySummaryV515(),
      loadKerrUncertaintyReplaySummaryV515(),
    ]);
  } finally {
    releases.forEach((release) => release());
    releases.forEach((release) => release());
    globalThis.fetch = originalFetch;
  }
  const finalDiff = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const telemetry = getKerrUncertaintyReplayTelemetryV515();
  const snapshot = getKerrUncertaintyReplaySnapshotV515();

  if (
    automaticRequestCount !== 0 ||
    requests.length !== 1 ||
    first !== second ||
    first?.artifactSha256 !== replay.artifactSha256 ||
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
    throw new Error("v515-runtime-client-boundary");
  }
  resetKerrUncertaintyReplayClientForTestsV515();

  const component = text("app/components/KerrUncertaintyReplayLedgerV515.tsx");
  const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV515.tsx");
  const route = text("app/api/atlas/relativity-evidence/v515/uncertainty-replay/route.ts");
  const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (
    !component.includes('data-atlas-v515-transition-count="512"') ||
    !component.includes('data-atlas-v515-automatic-request-count="0"') ||
    !component.includes('data-atlas-v515-scientific-mutation="false"') ||
    component.includes("Math.random") ||
    component.includes("<canvas") ||
    !wrapper.includes('lazy(()=>import("./KerrUncertaintyReplayLedgerV515"))') ||
    wrapper.includes("fetch(") ||
    !route.includes('delivery!=="local-shadow"') ||
    !route.includes('"Cache-Control":"no-store"') ||
    !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV515"') ||
    [component, wrapper, route, workbench].some((source) => source.includes("�"))
  ) {
    throw new Error("v515-runtime-source-boundary");
  }

  const sourcePaths = [
    paths.replay,
    paths.previousEvidence,
    paths.previousPointer,
    paths.dense,
    paths.formal,
    "app/lib/kerrUncertaintyReplayV515.ts",
    "app/lib/kerrUncertaintyReplayV515.test.ts",
    "app/lib/kerrUncertaintyReplayServerV515.ts",
    "app/lib/kerrUncertaintyReplayServerV515.test.ts",
    "app/lib/kerrUncertaintyReplayClientV515.ts",
    "app/lib/kerrUncertaintyReplayClientV515.test.ts",
    "app/api/atlas/relativity-evidence/v515/uncertainty-replay/route.ts",
    "app/api/atlas/relativity-evidence/v515/uncertainty-replay/route.test.ts",
    "app/components/KerrUncertaintyReplayLedgerV515.tsx",
    "app/components/KerrUncertaintyReplayLedgerV515.test.tsx",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV515.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV515.test.ts",
    "app/components/KerrPhotonMetrologyObservatoryIntentV515.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV515.test.tsx",
    "app/components/RelativityResearchWorkbenchV280.tsx",
    "app/lib/atlasResourceLifecycle.ts",
    "scripts/build-kerr-uncertainty-replay-v515.ts",
    "scripts/build-kerr-uncertainty-replay-runtime-v515.ts",
  ];
  const sourceManifest = sourcePaths
    .map((path) => ({ path, sha256: fileSha(path) }))
    .sort((a, b) => a.path.localeCompare(b.path));
  const unsigned = {
    version: "v515-kerr-uncertainty-replay-runtime-audit-v1",
    generatedAt: "2026-08-01T00:00:00Z",
    status: "uncertainty-replay-runtime-qualified-single-flight-baseline",
    source: {
      replayArtifactSha256: replay.artifactSha256,
      v514EvidenceSha256: previousEvidence.evidenceSha256,
      v514PointerSha256: previousPointer.pointerSha256,
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
    replay: replay.replay,
    lifecycle: replay.lifecycle,
    profile: replay.profile,
    boundary: replay.boundary,
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
        replayArtifactSha256: replay.artifactSha256,
        transitions: replay.replay.transitionCount,
        consumers: audit.runtime.singleFlightConsumerCount,
        automaticRequests: audit.runtime.automaticRequestCount,
        explicitRequests: audit.runtime.explicitRequestCount,
        peakSubscriptions: audit.runtime.peakSubscriptionCount,
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
