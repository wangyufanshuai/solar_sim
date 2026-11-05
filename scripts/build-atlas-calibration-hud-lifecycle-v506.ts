import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { bindAtlasCalibrationHudV505 } from "../app/lib/atlasCalibrationHudProfileV505";
import {
  getAtlasCalibrationHudModeSnapshotV506,
  getAtlasCalibrationHudModeTelemetryV506,
  resetAtlasCalibrationHudModeStoreForTestsV506,
  setAtlasCalibrationHudModeV506,
  subscribeAtlasCalibrationHudModeV506,
} from "../app/lib/atlasCalibrationHudModeStoreV506";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "../app/lib/atlasResourceLifecycle";

const root = process.cwd();
const paths = Object.freeze({
  v505Hud: "dist/science/atlas-calibration-hud-v505/hud-audit.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v505-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v505.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/atlas-calibration-hud-lifecycle-v506/lifecycle-audit.json",
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

const v505Hud = read(paths.v505Hud);
const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  v505Hud.version !== "v505-atlas-calibration-hud-audit-v1" ||
  sha(v505Hud) !== v505Hud.artifactSha256 ||
  previousEvidence.version !== "orbit-atlas-shadow-v505-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v505" ||
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
  throw new Error("v506-upstream-boundary");
}

resetAtlasCalibrationHudModeStoreForTestsV506();
const initialStore = getAtlasCalibrationHudModeSnapshotV506();
const baselineResources = getAtlasResourceSnapshot();
let firstNotifications = 0;
let secondNotifications = 0;
const releaseFirst = subscribeAtlasCalibrationHudModeV506(() => {
  firstNotifications += 1;
});
const releaseSecond = subscribeAtlasCalibrationHudModeV506(() => {
  secondNotifications += 1;
});
const peakResources = getAtlasResourceSnapshot();
const peakDiff = diffAtlasResourceSnapshotsV300(baselineResources, peakResources);
const cinematicStore = setAtlasCalibrationHudModeV506("cinematic");
const repeatedSnapshot = setAtlasCalibrationHudModeV506("cinematic");
const payload = Object.freeze({
  hudPayloadSha256: v505Hud.payloadBoundary.sharedPayloadSha256,
  detectorResponse: "unavailable",
  observedIntensity: "unavailable",
  scienceRaster: "unavailable",
});
const scienceBinding = bindAtlasCalibrationHudV505("science", payload);
const cinematicBinding = bindAtlasCalibrationHudV505("cinematic", payload);
releaseFirst();
releaseSecond();
releaseSecond();
const finalResources = getAtlasResourceSnapshot();
const finalDiff = diffAtlasResourceSnapshotsV300(baselineResources, finalResources);
const finalTelemetry = getAtlasCalibrationHudModeTelemetryV506();
if (
  initialStore.mode !== "science" ||
  initialStore.hudRevision !== 0 ||
  peakDiff.subscriptions !== 2 ||
  peakDiff.total !== 2 ||
  cinematicStore.mode !== "cinematic" ||
  cinematicStore.hudRevision !== 1 ||
  repeatedSnapshot !== cinematicStore ||
  firstNotifications !== 1 ||
  secondNotifications !== 1 ||
  scienceBinding.sciencePayload !== payload ||
  cinematicBinding.sciencePayload !== payload ||
  scienceBinding.sciencePayload !== cinematicBinding.sciencePayload ||
  finalTelemetry.listenerCount !== 0 ||
  finalTelemetry.sceneRevisionDelta !== 0 ||
  finalTelemetry.scientificFieldMutationAllowed !== false ||
  finalDiff.status !== "baseline" ||
  finalDiff.subscriptions !== 0 ||
  finalDiff.total !== 0 ||
  finalDiff.identityChanged !== false ||
  finalDiff.ownerChanged !== false
) {
  throw new Error("v506-lifecycle-boundary");
}
resetAtlasCalibrationHudModeStoreForTestsV506();
const resetStore = getAtlasCalibrationHudModeSnapshotV506();

const sourceFiles = Object.freeze({
  store: "app/lib/atlasCalibrationHudModeStoreV506.ts",
  readiness: "app/components/KerrMeasuredCalibrationReadinessV503.tsx",
  preflight: "app/components/KerrMeasuredCalibrationPreflightV504.tsx",
  wrapper: "app/components/KerrPhotonMetrologyObservatoryIntentV504.tsx",
  appShell: "app/components/AtlasAppShell.tsx",
});
const sources = Object.fromEntries(
  Object.entries(sourceFiles).map(([id, path]) => [id, text(path)]),
) as Record<keyof typeof sourceFiles, string>;
if (
  sources.appShell.includes("atlasCalibrationHudModeStoreV506") ||
  !sources.readiness.includes("useSyncExternalStore(") ||
  !sources.preflight.includes("useSyncExternalStore(") ||
  !sources.readiness.includes("subscribeAtlasCalibrationHudModeV506") ||
  !sources.preflight.includes("subscribeAtlasCalibrationHudModeV506") ||
  !sources.wrapper.includes('data-atlas-v506-hud-mode-store="external-persistent"') ||
  !sources.store.includes('acquireAtlasResource(\n    "subscription"') ||
  [sources.store, sources.readiness, sources.preflight, sources.wrapper].some(
    (source) =>
      source.includes("Math.random") ||
      source.includes("<canvas") ||
      source.includes("physicsEngine") ||
      source.includes("setSceneRevision"),
  )
) {
  throw new Error("v506-runtime-source-boundary");
}

const sourcePaths = [
  paths.v505Hud,
  paths.previousEvidence,
  paths.previousPointer,
  paths.dense,
  paths.formal,
  ...Object.values(sourceFiles),
  "app/lib/atlasCalibrationHudModeStoreV506.test.ts",
  "app/components/AtlasCalibrationHudModeRuntimeV506.test.tsx",
  "app/components/AtlasCalibrationHudRuntimeV505.test.tsx",
  "app/components/KerrMeasuredCalibrationReadinessV503.test.tsx",
  "app/components/KerrMeasuredCalibrationPreflightV504.test.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV504.test.tsx",
  "app/lib/atlasCalibrationHudProfileV505.ts",
  "scripts/build-atlas-calibration-hud-lifecycle-v506.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const unsigned = {
  version: "v506-atlas-calibration-hud-lifecycle-audit-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status: "shared-hud-mode-store-lifecycle-qualified-browser-pending",
  source: {
    v505HudArtifactSha256: v505Hud.artifactSha256,
    v505EvidenceSha256: previousEvidence.evidenceSha256,
    v505PointerSha256: previousPointer.pointerSha256,
  },
  store: {
    version: initialStore.version,
    initialMode: initialStore.mode,
    initialHudRevision: initialStore.hudRevision,
    changedMode: cinematicStore.mode,
    changedHudRevision: cinematicStore.hudRevision,
    repeatedWriteReturnedSameSnapshot: true,
    finalResetMode: resetStore.mode,
    finalResetHudRevision: resetStore.hudRevision,
    appShellSubscription: false,
    activeDetailSubscriptionBudget: 1,
  },
  replay: {
    subscriberCount: 2,
    firstSubscriberNotifications: firstNotifications,
    secondSubscriberNotifications: secondNotifications,
    duplicateWriteNotifications: 0,
    idempotentReleaseCalls: 3,
    payloadReferencePreservedAcrossModes: true,
    scientificFieldMutationAllowed: false,
    sceneRevisionDelta: 0,
  },
  resources: {
    baseline: {
      total: baselineResources.total,
      subscriptions: baselineResources.subscriptions,
      identityDigest: baselineResources.identityDigest,
    },
    peakDelta: {
      total: peakDiff.total,
      subscriptions: peakDiff.subscriptions,
      estimatedBytes: peakDiff.estimatedBytes,
    },
    finalDiff,
    returnedToBaseline: true,
  },
  runtime: {
    consumerSurfaceCount: 2,
    mutuallyExclusiveDetailBudget: 1,
    localModeUseStateCount: 0,
    externalStoreConsumerCount: 2,
    registryTrackedSubscriptionCountAtPeak: 2,
    automaticNetworkRequestDelta: 0,
    canvasCreated: false,
    physicsMutationAllowed: false,
  },
  qualification: {
    stableSnapshot: "qualified",
    sharedModePersistence: "qualified",
    duplicateWriteNoop: "qualified",
    subscriptionRegistry: "qualified",
    lifecycleBaseline: "qualified",
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
    "v506-external-calibration-hud-mode-store-two-consumer-replay-idempotent-registry-tracked-subscriptions-final-baseline-shared-science-payload-zero-app-shell-canvas-scene-physics-or-default-mutation",
};
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
atomic(paths.output, artifact);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      initialMode: "science",
      changedMode: "cinematic",
      notifications: `${firstNotifications}/${secondNotifications}`,
      peakSubscriptions: peakDiff.subscriptions,
      finalResourceStatus: finalDiff.status,
      payloadReferencePreserved: true,
      sceneRevisionDelta: 0,
      browserQualification: "not-run",
      denseCampaign: "0/49",
    },
    null,
    2,
  ),
);
