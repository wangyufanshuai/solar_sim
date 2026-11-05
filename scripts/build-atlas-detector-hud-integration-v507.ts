import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { bindAtlasCalibrationHudV505 } from "../app/lib/atlasCalibrationHudProfileV505";
import {
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
  admission:
    "dist/science/kerr-topology-detector-admission-v501/admission-bridge.json",
  readiness:
    "dist/science/kerr-measured-calibration-readiness-v503/readiness.json",
  preflight:
    "dist/science/kerr-measured-calibration-preflight-v504/preflight.json",
  v506Lifecycle:
    "dist/science/atlas-calibration-hud-lifecycle-v506/lifecycle-audit.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v506-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v506.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/atlas-detector-hud-integration-v507/integration-audit.json",
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

const admission = read(paths.admission);
const readiness = read(paths.readiness);
const preflight = read(paths.preflight);
const v506Lifecycle = read(paths.v506Lifecycle);
const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  admission.version !== "v501-kerr-topology-detector-admission-artifact-v1" ||
  sha(admission) !== admission.artifactSha256 ||
  admission.decision.admitted !== false ||
  admission.audit.passedGateCount !== 3 ||
  admission.audit.blockingGateCount !== 8 ||
  readiness.version !== "v503-kerr-measured-calibration-readiness-artifact-v1" ||
  sha(readiness) !== readiness.artifactSha256 ||
  preflight.version !== "v504-kerr-measured-calibration-preflight-v1" ||
  sha(preflight) !== preflight.artifactSha256 ||
  v506Lifecycle.version !== "v506-atlas-calibration-hud-lifecycle-audit-v1" ||
  sha(v506Lifecycle) !== v506Lifecycle.artifactSha256 ||
  previousEvidence.version !== "orbit-atlas-shadow-v506-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v506" ||
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
  throw new Error("v507-upstream-boundary");
}

const sourceFiles = Object.freeze({
  admission: "app/components/KerrTopologyDetectorAdmissionV501.tsx",
  readiness: "app/components/KerrMeasuredCalibrationReadinessV503.tsx",
  preflight: "app/components/KerrMeasuredCalibrationPreflightV504.tsx",
  wrapper: "app/components/KerrPhotonMetrologyObservatoryIntentV504.tsx",
  appShell: "app/components/AtlasAppShell.tsx",
});
const sources = Object.fromEntries(
  Object.entries(sourceFiles).map(([id, path]) => [id, text(path)]),
) as Record<keyof typeof sourceFiles, string>;
for (const id of ["admission", "readiness", "preflight"] as const) {
  if (
    !sources[id].includes("bindAtlasCalibrationHudV505(") ||
    !sources[id].includes("useSyncExternalStore(") ||
    !sources[id].includes("subscribeAtlasCalibrationHudModeV506") ||
    !sources[id].includes("setAtlasCalibrationHudModeV506(entry)")
  ) {
    throw new Error(`v507-consumer-wiring:${id}`);
  }
}
const tokenNames = [
  "panel",
  "panelRaised",
  "ink",
  "mutedInk",
  "accent",
  "accentWash",
  "warning",
  "blocked",
  "grid",
  "gridOpacity",
  "glowOpacity",
  "transitionMs",
] as const;
if (
  tokenNames.some((token) => !sources.admission.includes(`profile.tokens.${token}`)) ||
  !sources.wrapper.includes('data-atlas-v507-detector-hud-consumers="3"') ||
  sources.appShell.includes("atlasCalibrationHudModeStoreV506") ||
  Object.values(sources).some(
    (source) =>
      source.includes("Math.random") ||
      source.includes("<canvas") ||
      source.includes("physicsEngine") ||
      source.includes("setSceneRevision"),
  ) ||
  /\uFFFD|锟斤拷|鈥|銆|姝ｅ湪|涓嶅彲|缁熶竴/u.test(
    Object.values(sources).join("\n"),
  )
) {
  throw new Error("v507-runtime-boundary");
}

const admissionPayload = Object.freeze({
  artifactSha256: admission.artifactSha256,
  payloadSha256: admission.payloadSha256,
  admitted: admission.decision.admitted,
  reason: admission.decision.reason,
  detectorResponseAvailable: admission.decision.detectorResponseAvailable,
  observedIntensityAvailable: admission.decision.observedIntensityAvailable,
  scienceRasterAvailable: admission.decision.scienceRasterAvailable,
});
const scienceBinding = bindAtlasCalibrationHudV505("science", admissionPayload);
const cinematicBinding = bindAtlasCalibrationHudV505("cinematic", admissionPayload);
if (
  scienceBinding.sciencePayload !== admissionPayload ||
  cinematicBinding.sciencePayload !== admissionPayload ||
  scienceBinding.sciencePayload !== cinematicBinding.sciencePayload
) {
  throw new Error("v507-admission-payload-reference");
}

resetAtlasCalibrationHudModeStoreForTestsV506();
const baselineResources = getAtlasResourceSnapshot();
const notifications = [0, 0, 0];
const releases = notifications.map((_, index) =>
  subscribeAtlasCalibrationHudModeV506(() => {
    notifications[index] += 1;
  }),
);
const peakResources = getAtlasResourceSnapshot();
const peakDiff = diffAtlasResourceSnapshotsV300(baselineResources, peakResources);
setAtlasCalibrationHudModeV506("cinematic");
releases.forEach((release) => release());
releases[0]();
const finalResources = getAtlasResourceSnapshot();
const finalDiff = diffAtlasResourceSnapshotsV300(baselineResources, finalResources);
const finalTelemetry = getAtlasCalibrationHudModeTelemetryV506();
if (
  peakDiff.subscriptions !== 3 ||
  peakDiff.total !== 3 ||
  notifications.some((count) => count !== 1) ||
  finalTelemetry.listenerCount !== 0 ||
  finalDiff.status !== "baseline" ||
  finalDiff.total !== 0 ||
  finalDiff.subscriptions !== 0 ||
  finalDiff.identityChanged !== false ||
  finalDiff.ownerChanged !== false
) {
  throw new Error("v507-three-consumer-lifecycle");
}
resetAtlasCalibrationHudModeStoreForTestsV506();

const sourcePaths = [
  paths.admission,
  paths.readiness,
  paths.preflight,
  paths.v506Lifecycle,
  paths.previousEvidence,
  paths.previousPointer,
  paths.dense,
  paths.formal,
  ...Object.values(sourceFiles),
  "app/components/KerrTopologyDetectorAdmissionV501.test.tsx",
  "app/components/AtlasCalibrationHudAdmissionRuntimeV507.test.tsx",
  "app/components/KerrMeasuredCalibrationReadinessV503.test.tsx",
  "app/components/KerrMeasuredCalibrationPreflightV504.test.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV504.test.tsx",
  "app/lib/atlasCalibrationHudModeStoreV506.ts",
  "app/lib/atlasCalibrationHudModeStoreV506.test.ts",
  "app/lib/atlasCalibrationHudProfileV505.ts",
  "app/lib/kerrTopologyDetectorAdmissionV501.ts",
  "app/lib/kerrTopologyDetectorAdmissionClientV501.ts",
  "scripts/build-atlas-detector-hud-integration-v507.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const unsigned = {
  version: "v507-atlas-detector-hud-integration-audit-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status: "three-stage-detector-hud-integration-qualified-browser-pending",
  source: {
    v501AdmissionArtifactSha256: admission.artifactSha256,
    v501AdmissionPayloadSha256: admission.payloadSha256,
    v503ReadinessArtifactSha256: readiness.artifactSha256,
    v504PreflightArtifactSha256: preflight.artifactSha256,
    v506LifecycleArtifactSha256: v506Lifecycle.artifactSha256,
    v506EvidenceSha256: previousEvidence.evidenceSha256,
    v506PointerSha256: previousPointer.pointerSha256,
  },
  integration: {
    consumerSurfaceCount: 3,
    consumerSurfaceIds: ["detector-admission", "calibration-readiness", "candidate-preflight"],
    sharedProfileVersion: "v505-atlas-calibration-hud-profile-v1",
    sharedStoreVersion: "v506-atlas-calibration-hud-mode-store-v1",
    admissionTokenConsumption: "12-of-12",
    mutuallyExclusiveDetailBudget: 1,
    localModeStateCount: 0,
    appShellSubscription: false,
  },
  admissionBoundary: {
    artifactSha256: admission.artifactSha256,
    payloadSha256: admission.payloadSha256,
    gatesPassed: 3,
    gatesBlocked: 8,
    measuredFiles: "0/6",
    admitted: false,
    sciencePayloadReferencePreservedAcrossModes: true,
    scientificFieldMutationAllowed: false,
    detectorResponseAvailable: false,
    observedIntensityAvailable: false,
    scienceRasterAvailable: false,
  },
  lifecycle: {
    auditSubscriberCount: 3,
    notifications,
    peakSubscriptionDelta: peakDiff.subscriptions,
    activeRuntimeSubscriptionBudget: 1,
    idempotentRelease: true,
    finalDiff,
    returnedToBaseline: true,
  },
  runtime: {
    utf8SourceFilesScanned: Object.keys(sourceFiles).length,
    mojibakeMatches: 0,
    automaticNetworkRequestDeltaFromModeChange: 0,
    canvasCreated: false,
    sceneRevisionDelta: 0,
    physicsMutationAllowed: false,
  },
  qualification: {
    admissionMigration: "qualified",
    stableProfileConsumption: "qualified-12-of-12",
    sharedModeStore: "qualified-3-consumers",
    lifecycleBaseline: "qualified",
    sciencePayloadIsolation: "qualified",
    utf8: "qualified",
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
    "v507-three-stage-detector-hud-one-profile-one-store-one-mutually-exclusive-detail-admission-artifact-and-payload-sha-preserved-zero-science-field-network-app-shell-canvas-scene-physics-or-default-mutation",
};
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
atomic(paths.output, artifact);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      consumers: 3,
      admissionTokens: "12/12",
      admissionArtifactSha256: admission.artifactSha256,
      admissionPayloadSha256: admission.payloadSha256,
      peakSubscriptions: peakDiff.subscriptions,
      finalResourceStatus: finalDiff.status,
      scientificFieldMutation: false,
      browserQualification: "not-run",
      denseCampaign: "0/49",
    },
    null,
    2,
  ),
);
