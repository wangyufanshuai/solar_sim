import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v510-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v510.json",
  matrix: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  runtime: "dist/science/kerr-instrument-authority-matrix-v511/runtime-audit.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v511-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v511.json",
});
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "evidenceSha256",
  "pointerSha256",
  "stageChainSha256",
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
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const matrix = read(paths.matrix);
const runtime = read(paths.runtime);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v510-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v510" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  matrix.version !== "v511-kerr-instrument-authority-matrix-v1" ||
  sha(matrix) !== matrix.artifactSha256 ||
  runtime.version !== "v511-kerr-instrument-authority-runtime-audit-v1" ||
  sha(runtime) !== runtime.artifactSha256 ||
  runtime.source.matrixArtifactSha256 !== matrix.artifactSha256 ||
  matrix.counts.stageCount !== 6 ||
  matrix.counts.sourcePhotonRows !== 4 ||
  matrix.counts.measuredCalibrationFiles !== 0 ||
  matrix.counts.requiredMeasuredCalibrationFiles !== 6 ||
  matrix.counts.measuredResponseRows !== 0 ||
  matrix.counts.electronExpectationRows !== 0 ||
  matrix.counts.observedCountRows !== 0 ||
  matrix.counts.sciencePixelRows !== 0 ||
  matrix.qualification.measuredDetectorAuthorityGranted !== false ||
  matrix.qualification.productionResponseQualified !== false ||
  matrix.qualification.scienceRasterQualified !== false ||
  runtime.runtime.automaticRequestCount !== 0 ||
  runtime.runtime.explicitRequestCount !== 1 ||
  runtime.runtime.singleFlightConsumerCount !== 2 ||
  runtime.runtime.finalResourceStatus !== "baseline" ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v511-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.matrix,
  paths.runtime,
  paths.dense,
  paths.formal,
  "app/lib/kerrInstrumentAuthorityMatrixV511.ts",
  "app/lib/kerrInstrumentAuthorityMatrixV511.test.ts",
  "app/lib/kerrInstrumentAuthorityMatrixServerV511.ts",
  "app/lib/kerrInstrumentAuthorityMatrixServerV511.test.ts",
  "app/lib/kerrInstrumentAuthorityMatrixClientV511.ts",
  "app/lib/kerrInstrumentAuthorityMatrixClientV511.test.ts",
  "app/api/atlas/relativity-evidence/v511/instrument-authority-matrix/route.ts",
  "app/api/atlas/relativity-evidence/v511/instrument-authority-matrix/route.test.ts",
  "app/components/KerrInstrumentAuthorityMatrixV511.tsx",
  "app/components/KerrInstrumentAuthorityMatrixV511.test.tsx",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV511.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV511.test.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV511.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV511.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/build-kerr-instrument-authority-matrix-v511.ts",
  "scripts/build-kerr-instrument-authority-runtime-v511.ts",
  "scripts/build-shadow-candidate-v511.mjs",
  "scripts/build-shadow-v511.mjs",
  "scripts/verify-shadow-v511-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "v511-instrument-authority-matrix-qualified-measured-response-blocked-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v511-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v510EvidenceSha256: previousEvidence.evidenceSha256,
    v510PointerSha256: previousPointer.pointerSha256,
    v511MatrixArtifactSha256: matrix.artifactSha256,
    v511RuntimeArtifactSha256: runtime.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  authorityMatrix: {
    stages: matrix.stages,
    dimensionalContract: matrix.dimensionalContract,
    transitions: matrix.transitions,
    counts: matrix.counts,
    qualification: matrix.qualification,
  },
  runtime: runtime.runtime,
  scienceBoundary: matrix.boundary,
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
  qualification: [
    "v511-six-canonical-instrument-stages-four-sparse-photon-rows-response-exactly-once-null-not-zero-three-blocked-transitions-zero-measured-response-electrons-counts-or-science-pixels-single-flight-api-one-registry-subscription-returned-to-baseline",
  ],
  boundaryStatement:
    "Computational photon observables remain qualified for four sparse rows; all measured detector response, electron expectation, observed count, intensity, raster, FITS and PNG outputs remain unavailable until the six-file measured calibration and observation authority chain is complete.",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v511",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v510PortableProvenance: "qualified",
    v511InstrumentAuthorityMatrix: "qualified-6-stages",
    v511SparsePhotonObservable: "qualified-4-rows",
    v511ResponseDoubleCountingFirewall: "qualified",
    v511MissingQuantityPolicy: "qualified-null-not-zero",
    v511RuntimeSingleFlight: "qualified-2-consumers-1-request",
    v511SubscriptionLifecycle: "qualified-returned-to-baseline",
    v511MeasuredCalibrationPack: "blocked-0-of-6",
    v511MeasuredDetectorResponse: "unavailable",
    v511ElectronExpectation: "unavailable",
    v511ObservedCounts: "unavailable",
    v511ScienceRaster: "unavailable",
    v511BrowserQualification: "not-run",
    v511VisualMatrixQualification: "not-run",
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
      matrixArtifactSha256: matrix.artifactSha256,
      runtimeArtifactSha256: runtime.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      stages: matrix.counts.stageCount,
      sourcePhotonRows: matrix.counts.sourcePhotonRows,
      measuredFiles: "0/6",
      measuredResponseRows: 0,
      electronExpectationRows: 0,
      observedCountRows: 0,
      sciencePixelRows: 0,
      finalResourceStatus: runtime.runtime.finalResourceStatus,
      browserQualification: "not-run",
      denseCampaign: "0/49",
    },
    null,
    2,
  ),
);
