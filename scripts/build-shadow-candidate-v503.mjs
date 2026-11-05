import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v502-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v502.json",
  readiness:
    "dist/science/kerr-measured-calibration-readiness-v503/readiness.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v503-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v503.json",
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
const readiness = read(paths.readiness);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v502-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v502" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  readiness.version !== "v503-kerr-measured-calibration-readiness-artifact-v1" ||
  sha(readiness) !== readiness.artifactSha256 ||
  readiness.decision.admitted !== false ||
  readiness.decision.readyFileCount !== 0 ||
  readiness.decision.missingFileCount !== 6 ||
  readiness.outputs.scienceRaster !== "unavailable" ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v503-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.readiness,
  paths.dense,
  paths.formal,
  "app/lib/kerrMeasuredCalibrationReadinessV503.ts",
  "app/lib/kerrMeasuredCalibrationReadinessV503.test.ts",
  "app/lib/kerrMeasuredCalibrationReadinessServerV503.ts",
  "app/lib/kerrMeasuredCalibrationReadinessServerV503.test.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV503.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV503.test.ts",
  "app/components/KerrMeasuredCalibrationReadinessV503.tsx",
  "app/components/KerrMeasuredCalibrationReadinessV503.test.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV503.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV503.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/api/atlas/relativity-evidence/v503/detector-calibration-readiness/route.ts",
  "app/api/atlas/relativity-evidence/v503/detector-calibration-readiness/route.test.ts",
  "scripts/build-kerr-measured-calibration-readiness-v503.mjs",
  "scripts/build-shadow-candidate-v503.mjs",
  "scripts/build-shadow-v503.mjs",
  "scripts/verify-shadow-v503-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "v503-measured-calibration-readiness-implemented-pack-missing-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v503-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v502EvidenceSha256: previousEvidence.evidenceSha256,
    v502PointerSha256: previousPointer.pointerSha256,
    v503ReadinessArtifactSha256: readiness.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  observatory: {
    staticAuthorityStageCount: 7,
    automaticComponentImportCount: 1,
    detailComponentCatalogSize: 9,
    concurrentDetailSurfaceCount: 1,
    staticNetworkRequestBudget: 0,
    explicitReadinessRequestBudget: 1,
  },
  readiness: {
    requiredFileCount: 6,
    readyFileCount: 0,
    passedGateCount: readiness.decision.passedGateCount,
    blockingGateCount: readiness.decision.blockingGateCount,
    admitted: false,
    reason: readiness.decision.reason,
    stagingInspectedByV503: false,
    networkAttempted: false,
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
    readinessProtocol: "qualified-fail-closed",
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
    "v503-local-shadow-measured-calibration-readiness-only-zero-of-six-no-staging-inspection-network-synthetic-authority-response-intensity-raster-or-product-mutation",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v503",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v500TopologyMilestone: "source-qualified-5-stages",
    v501DetectorAdmission: "qualified-fail-closed",
    v502Observatory: "source-qualified-8-details",
    v503ReadinessProtocol: "qualified-fail-closed",
    v503MeasuredCalibrationPack: "blocked-0-of-6",
    v503DetectorAuthority: "blocked",
    v503DetectorResponse: "unavailable",
    v503ObservedIntensity: "unavailable",
    v503ScienceRaster: "unavailable",
    v503BrowserQualification: "not-run",
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
      readinessArtifactSha256: readiness.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      measuredFiles: "0/6",
      detectorAuthority: false,
      scienceRaster: "unavailable",
      browserQualification: "not-run",
      denseCampaign: "0/49",
    },
    null,
    2,
  ),
);
