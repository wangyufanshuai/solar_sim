import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v510-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v510.json",
  matrix: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  runtime: "dist/science/kerr-instrument-authority-matrix-v511/runtime-audit.json",
  evidence: "dist/science/orbit-atlas-shadow-v511-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v511.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
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
const text = (path) => bytes(path).toString("utf8");
const read = (path) => JSON.parse(text(path));
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

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const matrix = read(paths.matrix);
const runtime = read(paths.runtime);
const evidence = read(paths.evidence);
const pointer = read(paths.pointer);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v510-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v510" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  matrix.version !== "v511-kerr-instrument-authority-matrix-v1" ||
  runtime.version !== "v511-kerr-instrument-authority-runtime-audit-v1" ||
  evidence.version !== "orbit-atlas-shadow-v511-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v511" ||
  sha(matrix) !== matrix.artifactSha256 ||
  sha(runtime) !== runtime.artifactSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  runtime.source.matrixArtifactSha256 !== matrix.artifactSha256 ||
  evidence.dependency.v510EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v510PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v511MatrixArtifactSha256 !== matrix.artifactSha256 ||
  evidence.dependency.v511RuntimeArtifactSha256 !== runtime.artifactSha256 ||
  pointer.evidence.fileSha256 !== fileSha(paths.evidence) ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256
) {
  throw new Error("v511-canonical-chain");
}
if (
  matrix.status !== "instrument-authority-matrix-qualified-measured-response-blocked" ||
  matrix.stages.length !== 6 ||
  matrix.stages[0].authorityGranted !== true ||
  matrix.stages.slice(1).some((stage) => stage.authorityGranted !== false) ||
  matrix.dimensionalContract.responseAppliedExactlyOnce !== true ||
  matrix.dimensionalContract.collectingAreaGeometricOnly !== true ||
  matrix.dimensionalContract.gainAppliedAfterElectronExpectation !== true ||
  matrix.dimensionalContract.missingQuantityPolicy !== "null-not-zero" ||
  matrix.transitions.length !== 3 ||
  matrix.transitions.some(
    (transition) =>
      transition.status !== "blocked" ||
      transition.syntheticFallbackAllowed !== false,
  ) ||
  matrix.counts.stageCount !== 6 ||
  matrix.counts.sourcePhotonRows !== 4 ||
  matrix.counts.computationalFixtureRows !== 4 ||
  matrix.counts.measuredCalibrationFiles !== 0 ||
  matrix.counts.requiredMeasuredCalibrationFiles !== 6 ||
  matrix.counts.measuredResponseRows !== 0 ||
  matrix.counts.electronExpectationRows !== 0 ||
  matrix.counts.observedCountRows !== 0 ||
  matrix.counts.sciencePixelRows !== 0 ||
  matrix.qualification.measuredDetectorAuthorityGranted !== false ||
  matrix.qualification.productionResponseQualified !== false ||
  matrix.qualification.scienceRasterQualified !== false ||
  matrix.boundary.detectorResponseAvailable !== false ||
  matrix.boundary.observedCountsAvailable !== false ||
  matrix.boundary.observedIntensityAvailable !== false ||
  matrix.boundary.scienceRasterAvailable !== false ||
  matrix.boundary.fitsProducts !== 0 ||
  matrix.boundary.pngProducts !== 0
) {
  throw new Error("v511-matrix-boundary");
}
if (
  runtime.runtime.automaticRequestCount !== 0 ||
  runtime.runtime.explicitRequestCount !== 1 ||
  runtime.runtime.singleFlightConsumerCount !== 2 ||
  runtime.runtime.peakSubscriptionCount !== 1 ||
  runtime.runtime.finalResourceStatus !== "baseline" ||
  runtime.runtime.responseCachePolicy !== "no-store" ||
  runtime.runtime.responseMaximumBytes !== 128 * 1024 ||
  runtime.runtime.localShadowOnly !== true ||
  runtime.matrix.stageCount !== 6 ||
  runtime.boundary.sciencePayloadMutationAllowed !== false ||
  runtime.boundary.cinematicScienceWritebackAllowed !== false
) {
  throw new Error("v511-runtime-boundary");
}
if (
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84 ||
  pointer.formalProductPointer !== "v263" ||
  pointer.formalProductPointerAdvanced !== false ||
  pointer.localShadowDefaultApplied !== false ||
  pointer.capabilities.v511MeasuredCalibrationPack !== "blocked-0-of-6" ||
  pointer.capabilities.v511MeasuredDetectorResponse !== "unavailable" ||
  pointer.capabilities.v511ElectronExpectation !== "unavailable" ||
  pointer.capabilities.v511ObservedCounts !== "unavailable" ||
  pointer.capabilities.v511ScienceRaster !== "unavailable" ||
  pointer.capabilities.v511BrowserQualification !== "not-run" ||
  pointer.capabilities.v314DenseCampaign !== "incomplete-0-of-49"
) {
  throw new Error("v511-continuity-boundary");
}

const component = text("app/components/KerrInstrumentAuthorityMatrixV511.tsx");
const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV511.tsx");
const route = text("app/api/atlas/relativity-evidence/v511/instrument-authority-matrix/route.ts");
const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
if (
  !component.includes('data-atlas-v511-stage-count="6"') ||
  !component.includes('data-atlas-v511-solar-first-screen-request-count="0"') ||
  !component.includes('data-atlas-v511-detector-authority="false"') ||
  !component.includes('data-atlas-v511-science-raster="false"') ||
  component.includes("Math.random") ||
  component.includes("<canvas") ||
  !wrapper.includes('lazy(() => import("./KerrInstrumentAuthorityMatrixV511"))') ||
  !wrapper.includes('data-atlas-v511-detail-catalog-size') ||
  !wrapper.includes('data-atlas-v511-static-network-budget="0"') ||
  wrapper.includes("fetch(") ||
  !route.includes('delivery !== "local-shadow"') ||
  !route.includes('"Cache-Control": "no-store"') ||
  !route.includes("128 * 1024") ||
  !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV511"') ||
  [component, wrapper, route, workbench].some((source) => source.includes("�"))
) {
  throw new Error("v511-source-boundary");
}

for (const [label, manifest, sourceSha256] of [
  ["matrix", matrix.sourceManifest, matrix.sourceSha256],
  ["runtime", runtime.sourceManifest, runtime.sourceSha256],
  ["evidence", evidence.sourceManifest, evidence.sourceSha256],
]) {
  for (const entry of manifest) {
    if (fileSha(entry.path) !== entry.sha256) {
      throw new Error(`v511-${label}-source-manifest:${entry.path}`);
    }
  }
  if (sha(manifest) !== sourceSha256) {
    throw new Error(`v511-${label}-source-manifest-canonical`);
  }
}
for (const path of Object.values(paths)) {
  if (statSync(resolve(root, path)).size <= 0) throw new Error(`v511-empty-artifact:${path}`);
}

console.log(
  JSON.stringify(
    {
      status: "passed-v511-low-memory-instrument-authority-matrix",
      matrixArtifactSha256: matrix.artifactSha256,
      runtimeArtifactSha256: runtime.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      stages: 6,
      sourcePhotonRows: 4,
      measuredFiles: "0/6",
      measuredResponseRows: 0,
      electronExpectationRows: 0,
      observedCountRows: 0,
      sciencePixelRows: 0,
      automaticRequests: 0,
      explicitRequests: 1,
      finalResourceStatus: "baseline",
      browserQualification: "not-run",
      denseCampaign: "0/49",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
