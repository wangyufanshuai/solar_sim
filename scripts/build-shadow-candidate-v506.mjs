import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v505-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v505.json",
  lifecycle:
    "dist/science/atlas-calibration-hud-lifecycle-v506/lifecycle-audit.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v506-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v506.json",
});
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "stageChainSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const lifecycle = read(paths.lifecycle);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v505-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v505" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  lifecycle.version !== "v506-atlas-calibration-hud-lifecycle-audit-v1" ||
  sha(lifecycle) !== lifecycle.artifactSha256 ||
  lifecycle.store.appShellSubscription !== false ||
  lifecycle.store.activeDetailSubscriptionBudget !== 1 ||
  lifecycle.replay.payloadReferencePreservedAcrossModes !== true ||
  lifecycle.replay.scientificFieldMutationAllowed !== false ||
  lifecycle.resources.returnedToBaseline !== true ||
  lifecycle.resources.finalDiff.status !== "baseline" ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v506-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.lifecycle,
  paths.dense,
  paths.formal,
  "app/lib/atlasCalibrationHudModeStoreV506.ts",
  "app/lib/atlasCalibrationHudModeStoreV506.test.ts",
  "app/lib/atlasCalibrationHudProfileV505.ts",
  "app/components/AtlasCalibrationHudModeRuntimeV506.test.tsx",
  "app/components/AtlasCalibrationHudRuntimeV505.test.tsx",
  "app/components/KerrMeasuredCalibrationReadinessV503.tsx",
  "app/components/KerrMeasuredCalibrationReadinessV503.test.tsx",
  "app/components/KerrMeasuredCalibrationPreflightV504.tsx",
  "app/components/KerrMeasuredCalibrationPreflightV504.test.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV504.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV504.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/build-atlas-calibration-hud-lifecycle-v506.ts",
  "scripts/build-shadow-candidate-v506.mjs",
  "scripts/build-shadow-v506.mjs",
  "scripts/verify-shadow-v506-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "v506-shared-calibration-hud-mode-lifecycle-qualified-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v506-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v505EvidenceSha256: previousEvidence.evidenceSha256,
    v505PointerSha256: previousPointer.pointerSha256,
    v506LifecycleArtifactSha256: lifecycle.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  store: lifecycle.store,
  replay: lifecycle.replay,
  resources: lifecycle.resources,
  runtime: lifecycle.runtime,
  qualification: lifecycle.qualification,
  scienceBoundary: {
    sharedSciencePayloadReferencePreserved: true,
    measuredCalibrationFiles: "0/6",
    detectorAuthority: false,
    detectorResponse: "unavailable",
    observedIntensity: "unavailable",
    scienceRaster: "unavailable",
    sciencePixelRows: 0,
    fitsProducts: 0,
    pngProducts: 0,
  },
  denseCampaign: {
    namespace: "v314",
    status: dense.status,
    completedShardCount: dense.completedShardCount,
    plannedShardCount: dense.plannedShardCount,
    attemptConsumed: dense.attemptConsumed,
    aggregateAvailable: dense.aggregateAvailable,
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
    publicDeploymentBlocked: true,
  },
  boundaryStatement:
    "v506-external-hud-mode-store-stable-snapshot-idempotent-registry-tracked-subscription-lifecycle-final-baseline-shared-science-payload-zero-app-shell-canvas-scene-physics-or-default-mutation",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v506",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v505StableHudProfile: "qualified",
    v505ScienceCinematicIsolation: "qualified",
    v506SharedHudModeStore: "qualified",
    v506StableSnapshot: "qualified",
    v506SubscriptionRegistry: "qualified-peak-2",
    v506LifecycleBaseline: "qualified",
    v506AppShellSubscription: "false",
    v506SciencePayloadIsolation: "qualified",
    v506MeasuredCalibrationPack: "blocked-0-of-6",
    v506DetectorAuthority: "blocked",
    v506ScienceRaster: "unavailable",
    v506BrowserQualification: "not-run",
    v506SoakQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    scienceRasterPayloadAllowed: false,
    fitsWriteAllowed: false,
    pngWriteAllowed: false,
    localShadowDefaultApplied: false,
  },
  evidence: {
    path: paths.evidence,
    fileSha256: fileSha(paths.evidence),
    canonicalSha256: evidence.evidenceSha256,
  },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(
  JSON.stringify(
    {
      status,
      lifecycleArtifactSha256: lifecycle.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      sharedModeStore: "qualified",
      peakSubscriptions: lifecycle.resources.peakDelta.subscriptions,
      finalResourceStatus: lifecycle.resources.finalDiff.status,
      payloadReferencePreserved: true,
      sceneRevisionDelta: 0,
      browserQualification: "not-run",
      denseCampaign: "0/49",
    },
    null,
    2,
  ),
);
