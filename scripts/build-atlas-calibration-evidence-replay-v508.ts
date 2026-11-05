import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  getAtlasCalibrationEvidenceTelemetryV508,
  getAtlasCalibrationReadinessSnapshotV508,
  loadAtlasCalibrationPreflightV508,
  loadAtlasCalibrationReadinessV508,
  resetAtlasCalibrationEvidenceClientForTestsV508,
  subscribeAtlasCalibrationPreflightV508,
  subscribeAtlasCalibrationReadinessV508,
} from "../app/lib/atlasCalibrationEvidenceClientV508";
import {
  getAtlasCalibrationHudModeSnapshotV506,
  resetAtlasCalibrationHudModeStoreForTestsV506,
  setAtlasCalibrationHudModeV506,
} from "../app/lib/atlasCalibrationHudModeStoreV506";
import {
  createKerrMeasuredCalibrationReadinessSummaryV503,
  KERR_MEASURED_CALIBRATION_READINESS_API_VERSION_V503,
} from "../app/lib/kerrMeasuredCalibrationReadinessV503";
import {
  createKerrMeasuredCalibrationPreflightSummaryV504,
  KERR_MEASURED_CALIBRATION_PREFLIGHT_API_VERSION_V504,
} from "../app/lib/kerrMeasuredCalibrationPreflightV504";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "../app/lib/atlasResourceLifecycle";

const root = process.cwd();
const paths = Object.freeze({
  readiness:
    "dist/science/kerr-measured-calibration-readiness-v503/readiness.json",
  preflight:
    "dist/science/kerr-measured-calibration-preflight-v504/preflight.json",
  v507Integration:
    "dist/science/atlas-detector-hud-integration-v507/integration-audit.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v507-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v507.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/atlas-calibration-evidence-replay-v508/replay-audit.json",
});
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "stageChainSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8"));
const text = (path: string) => bytes(path).toString("utf8");
const fileSha = (path: string) =>
  createHash("sha256").update(bytes(path)).digest("hex");
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
const readinessArtifact = read(paths.readiness);
const preflightArtifact = read(paths.preflight);
const v507Integration = read(paths.v507Integration);
const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  readinessArtifact.version !== "v503-kerr-measured-calibration-readiness-artifact-v1" ||
  sha(readinessArtifact) !== readinessArtifact.artifactSha256 ||
  preflightArtifact.version !== "v504-kerr-measured-calibration-preflight-v1" ||
  sha(preflightArtifact) !== preflightArtifact.artifactSha256 ||
  v507Integration.version !== "v507-atlas-detector-hud-integration-audit-v1" ||
  sha(v507Integration) !== v507Integration.artifactSha256 ||
  previousEvidence.version !== "orbit-atlas-shadow-v507-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v507" ||
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
  throw new Error("v508-upstream-boundary");
}

const readinessSummary = createKerrMeasuredCalibrationReadinessSummaryV503(
  readinessArtifact,
);
const preflightSummary = createKerrMeasuredCalibrationPreflightSummaryV504(
  preflightArtifact,
);
const responseBodies = Object.freeze({
  readiness: JSON.stringify({
    version: KERR_MEASURED_CALIBRATION_READINESS_API_VERSION_V503,
    available: true,
    reason: "ready",
    summary: readinessSummary,
  }),
  preflight: JSON.stringify({
    version: KERR_MEASURED_CALIBRATION_PREFLIGHT_API_VERSION_V504,
    available: true,
    reason: "ready",
    summary: preflightSummary,
  }),
});
const requests: string[] = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input);
  requests.push(url);
  const body = url.includes("v503") ? responseBodies.readiness : responseBodies.preflight;
  return new Response(body, { status: 200 });
}) as typeof fetch;

resetAtlasCalibrationEvidenceClientForTestsV508();
resetAtlasCalibrationHudModeStoreForTestsV506();
const baselineResources = getAtlasResourceSnapshot();
let readinessNotifications = 0;
let preflightNotifications = 0;
const releaseReadiness = subscribeAtlasCalibrationReadinessV508(() => {
  readinessNotifications += 1;
});
const readinessFirstPromise = loadAtlasCalibrationReadinessV508();
const readinessSecondPromise = loadAtlasCalibrationReadinessV508();
const readinessPromiseSingleFlight = readinessFirstPromise === readinessSecondPromise;
const readinessLoaded = await readinessFirstPromise;
releaseReadiness();

setAtlasCalibrationHudModeV506("cinematic");
const releasePreflight = subscribeAtlasCalibrationPreflightV508(() => {
  preflightNotifications += 1;
});
const preflightFirstPromise = loadAtlasCalibrationPreflightV508();
const preflightSecondPromise = loadAtlasCalibrationPreflightV508();
const preflightPromiseSingleFlight = preflightFirstPromise === preflightSecondPromise;
const preflightLoaded = await preflightFirstPromise;
releasePreflight();

const releaseReadinessRemount = subscribeAtlasCalibrationReadinessV508(() => {
  readinessNotifications += 1;
});
const readinessReferenceBeforeRemount = getAtlasCalibrationReadinessSnapshotV508().summary;
const readinessReloaded = await loadAtlasCalibrationReadinessV508();
const readinessReferencePreserved =
  readinessReferenceBeforeRemount === readinessLoaded && readinessReloaded === readinessLoaded;
releaseReadinessRemount();
const finalResources = getAtlasResourceSnapshot();
const finalDiff = diffAtlasResourceSnapshotsV300(baselineResources, finalResources);
const telemetry = getAtlasCalibrationEvidenceTelemetryV508();
const modeSnapshot = getAtlasCalibrationHudModeSnapshotV506();
globalThis.fetch = originalFetch;

if (
  readinessPromiseSingleFlight !== true ||
  preflightPromiseSingleFlight !== true ||
  readinessReferencePreserved !== true ||
  requests.length !== 2 ||
  requests.filter((url) => url.includes("v503")).length !== 1 ||
  requests.filter((url) => url.includes("v504")).length !== 1 ||
  readinessNotifications !== 2 ||
  preflightNotifications !== 2 ||
  readinessLoaded.decision.admitted !== false ||
  preflightLoaded.decision.measuredDetectorAuthorityGranted !== false ||
  telemetry.totalListenerCount !== 0 ||
  telemetry.totalRequestCount !== 2 ||
  telemetry.readiness.status !== "ready" ||
  telemetry.preflight.status !== "ready" ||
  modeSnapshot.mode !== "cinematic" ||
  modeSnapshot.hudRevision !== 1 ||
  finalDiff.status !== "baseline" ||
  finalDiff.subscriptions !== 0 ||
  finalDiff.identityChanged !== false ||
  finalDiff.ownerChanged !== false
) {
  throw new Error("v508-replay-boundary");
}
resetAtlasCalibrationEvidenceClientForTestsV508();
resetAtlasCalibrationHudModeStoreForTestsV506();

const sourceFiles = Object.freeze({
  client: "app/lib/atlasCalibrationEvidenceClientV508.ts",
  readiness: "app/components/KerrMeasuredCalibrationReadinessV503.tsx",
  preflight: "app/components/KerrMeasuredCalibrationPreflightV504.tsx",
  wrapper: "app/components/KerrPhotonMetrologyObservatoryIntentV504.tsx",
  appShell: "app/components/AtlasAppShell.tsx",
});
const sources = Object.fromEntries(
  Object.entries(sourceFiles).map(([id, path]) => [id, text(path)]),
) as Record<keyof typeof sourceFiles, string>;
if (
  sources.readiness.includes("fetch(") ||
  sources.preflight.includes("fetch(") ||
  sources.readiness.includes("useRef") ||
  sources.preflight.includes("useRef") ||
  !sources.readiness.includes("subscribeAtlasCalibrationReadinessV508") ||
  !sources.preflight.includes("subscribeAtlasCalibrationPreflightV508") ||
  !sources.wrapper.includes(
    'data-atlas-v508-evidence-client="external-single-flight-two-channel"',
  ) ||
  sources.appShell.includes("atlasCalibrationEvidenceClientV508") ||
  !sources.client.includes('fetch(url, { cache: "no-store" })') ||
  !sources.client.includes("128 * 1024") ||
  [sources.client, sources.readiness, sources.preflight, sources.wrapper].some(
    (source) =>
      source.includes("Math.random") ||
      source.includes("<canvas") ||
      source.includes("physicsEngine") ||
      source.includes("setSceneRevision"),
  )
) {
  throw new Error("v508-runtime-source-boundary");
}

const sourcePaths = [
  paths.readiness,
  paths.preflight,
  paths.v507Integration,
  paths.previousEvidence,
  paths.previousPointer,
  paths.dense,
  paths.formal,
  ...Object.values(sourceFiles),
  "app/lib/atlasCalibrationEvidenceClientV508.test.ts",
  "app/lib/atlasCalibrationHudModeStoreV506.ts",
  "app/lib/atlasCalibrationHudModeStoreV506.test.ts",
  "app/components/KerrMeasuredCalibrationReadinessV503.test.tsx",
  "app/components/KerrMeasuredCalibrationPreflightV504.test.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV504.test.tsx",
  "app/components/AtlasCalibrationHudAdmissionRuntimeV507.test.tsx",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/build-atlas-calibration-evidence-replay-v508.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const unsigned = {
  version: "v508-atlas-calibration-evidence-replay-audit-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status: "external-evidence-single-flight-replay-qualified-browser-pending",
  source: {
    v503ReadinessArtifactSha256: readinessArtifact.artifactSha256,
    v504PreflightArtifactSha256: preflightArtifact.artifactSha256,
    v507IntegrationArtifactSha256: v507Integration.artifactSha256,
    v507EvidenceSha256: previousEvidence.evidenceSha256,
    v507PointerSha256: previousPointer.pointerSha256,
  },
  replay: {
    sequence: [
      "mount-readiness",
      "load-readiness-twice",
      "unmount-readiness",
      "set-cinematic",
      "mount-preflight",
      "load-preflight-twice",
      "unmount-preflight",
      "remount-readiness",
      "reuse-readiness-summary",
      "unmount-readiness",
    ],
    requestCount: requests.length,
    readinessRequestCount: requests.filter((url) => url.includes("v503")).length,
    preflightRequestCount: requests.filter((url) => url.includes("v504")).length,
    readinessPromiseSingleFlight,
    preflightPromiseSingleFlight,
    readinessReferencePreserved,
    readinessNotifications,
    preflightNotifications,
    finalMode: modeSnapshot.mode,
    finalHudRevision: modeSnapshot.hudRevision,
  },
  evidenceStores: {
    channelCount: 2,
    readiness: telemetry.readiness,
    preflight: telemetry.preflight,
    totalListenerCount: telemetry.totalListenerCount,
    totalRequestCount: telemetry.totalRequestCount,
    responseLimitBytes: 128 * 1024,
    noStoreTransport: true,
    implicitRetryAllowed: false,
    appShellSubscription: false,
  },
  scienceBoundary: {
    readinessPayloadReferencePreserved: true,
    calibrationAdmitted: false,
    measuredDetectorAuthorityGranted: false,
    detectorResponse: "unavailable",
    observedIntensity: "unavailable",
    scienceRaster: "unavailable",
    scientificFieldMutationAllowed: false,
    sceneRevisionDelta: 0,
  },
  resources: {
    finalDiff,
    returnedToBaseline: true,
  },
  qualification: {
    readinessSingleFlight: "qualified",
    preflightSingleFlight: "qualified",
    crossUnmountCache: "qualified",
    modePersistence: "qualified",
    subscriptionLifecycle: "qualified",
    sciencePayloadIsolation: "qualified",
    browser: "not-run",
    visualMatrix: "not-run",
    soak: "not-run",
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerAdvanced: false,
    ordinaryStandaloneProfile: "legacy-v9",
    liteProfile: "legacy-v9",
    localShadowDefaultProfile: "legacy-v9",
    localShadowDefaultApplied: false,
  },
  denseCampaignStatus: "incomplete-0-of-49",
  formalDefaultKernel: "legacy-eih-1pn",
  boundary:
    "v508-two-external-evidence-channels-real-client-fetch-replay-one-request-per-channel-cross-unmount-summary-and-mode-persistence-final-subscription-baseline-zero-science-field-app-shell-canvas-scene-physics-or-default-mutation",
};
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
atomic(paths.output, artifact);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      requests: `${artifact.replay.readinessRequestCount}/${artifact.replay.preflightRequestCount}`,
      totalRequests: artifact.replay.requestCount,
      readinessReferencePreserved: true,
      finalMode: artifact.replay.finalMode,
      finalResourceStatus: artifact.resources.finalDiff.status,
      scienceMutation: false,
      browserQualification: "not-run",
      denseCampaign: "0/49",
    },
    null,
    2,
  ),
);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
