import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v503-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v503.json",
  preflight:
    "dist/science/kerr-measured-calibration-preflight-v504/preflight.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v504-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v504.json",
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
const preflight = read(paths.preflight);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v503-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v503" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  preflight.version !== "v504-kerr-measured-calibration-preflight-v1" ||
  sha(preflight) !== preflight.artifactSha256 ||
  preflight.status !== "blocked-inputs-missing" ||
  preflight.observation.readyFileCount !== 0 ||
  preflight.observation.bytesRead !== 0 ||
  preflight.decision.measuredDetectorAuthorityGranted !== false ||
  preflight.boundary.stagingWritePerformed !== false ||
  preflight.boundary.networkAttempted !== false ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v504-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.preflight,
  paths.dense,
  paths.formal,
  "scripts/atlas.mjs",
  "scripts/build-kerr-measured-calibration-preflight-v504.ts",
  "scripts/build-shadow-candidate-v504.mjs",
  "scripts/build-shadow-v504.mjs",
  "scripts/verify-shadow-v504-light.mjs",
  "app/lib/kerrMeasuredCalibrationPreflightV504.ts",
  "app/lib/kerrMeasuredCalibrationPreflightV504.test.ts",
  "app/lib/kerrMeasuredCalibrationPreflightNodeV504.ts",
  "app/lib/kerrMeasuredCalibrationPreflightNodeV504.test.ts",
  "app/lib/kerrMeasuredCalibrationPreflightServerV504.ts",
  "app/lib/kerrMeasuredCalibrationPreflightServerV504.test.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV504.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV504.test.ts",
  "app/components/KerrMeasuredCalibrationPreflightV504.tsx",
  "app/components/KerrMeasuredCalibrationPreflightV504.test.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV504.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV504.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/api/atlas/relativity-evidence/v504/detector-calibration-preflight/route.ts",
  "app/api/atlas/relativity-evidence/v504/detector-calibration-preflight/route.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "v504-explicit-read-only-calibration-preflight-implemented-inputs-missing-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v504-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v503EvidenceSha256: previousEvidence.evidenceSha256,
    v503PointerSha256: previousPointer.pointerSha256,
    v504PreflightArtifactSha256: preflight.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  command: {
    cli: "npm run atlas -- relativity detector-calibration-v504-preflight",
    explicitIntentRequired: true,
    automaticInvocationAllowed: false,
    networkAllowed: false,
    stagingWriteAllowed: false,
    automaticRetryAllowed: false,
  },
  observatory: {
    staticAuthorityStageCount: 8,
    automaticComponentImportCount: 1,
    detailComponentCatalogSize: 10,
    concurrentDetailSurfaceCount: 1,
    staticNetworkRequestBudget: 0,
    explicitPreflightSummaryRequestBudget: 1,
  },
  preflight: {
    status: preflight.status,
    stagingRootPresent: preflight.observation.stagingRootPresent,
    stagingRootSafe: preflight.observation.stagingRootSafe,
    requiredFileCount: 6,
    readyFileCount: preflight.observation.readyFileCount,
    missingFileIds: preflight.observation.missingFileIds,
    invalidFileIds: preflight.observation.invalidFileIds,
    bytesRead: preflight.observation.bytesRead,
    candidateReadyForIndependentValidation:
      preflight.observation.candidateReadyForIndependentValidation,
    authorityGranted: false,
    nextAction: preflight.decision.nextAction,
  },
  scienceBoundary: {
    detectorResponse: "unavailable",
    observedCounts: "unavailable",
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
  qualification: {
    safeReadOnlyPreflight: "qualified",
    measuredCalibrationPack: "blocked-0-of-6",
    detectorAuthority: "blocked",
    browser: "not-run",
    visualMatrix: "not-run",
    soak: "not-run",
    rtxWebGpu: "not-run",
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
    "v504-local-shadow-explicit-read-only-six-file-preflight-zero-bytes-read-no-staging-write-network-retry-authority-response-intensity-raster-or-product-mutation",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v504",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v500TopologyMilestone: "source-qualified-5-stages",
    v501DetectorAdmission: "qualified-fail-closed",
    v503ReadinessProtocol: "qualified-fail-closed",
    v504ReadOnlyPreflight: "qualified",
    v504MeasuredCalibrationPack: "blocked-0-of-6",
    v504CandidateForIndependentValidation: "false",
    v504DetectorAuthority: "blocked",
    v504DetectorResponse: "unavailable",
    v504ObservedIntensity: "unavailable",
    v504ScienceRaster: "unavailable",
    v504BrowserQualification: "not-run",
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
      preflightArtifactSha256: preflight.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      files: "0/6",
      bytesRead: 0,
      authorityGranted: false,
      scienceRaster: "unavailable",
      browserQualification: "not-run",
      denseCampaign: "0/49",
    },
    null,
    2,
  ),
);
