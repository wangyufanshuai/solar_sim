import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v450-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v450.json",
  artifact: "dist/science/kerr-detector-input-admission-v451/input-admission-qualification.json",
  v443: "dist/science/kerr-detector-geometry-staging-v443/staging-inspect.json",
  v450: "dist/science/kerr-detector-image-formation-v450/image-formation-qualification.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v451-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v451.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const v443 = read(paths.v443);
const v450 = read(paths.v450);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v450-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v450" ||
  artifact.version !== "v451-kerr-detector-input-admission-artifact-v1" ||
  artifact.status !== "blocked-v443-detector-inputs-missing" ||
  artifact.detector?.requiredFileCount !== 6 ||
  artifact.detector?.readyFileCount !== 0 ||
  artifact.detector?.missingFileIds?.length !== 6 ||
  artifact.detector?.invalidFileIds?.length !== 0 ||
  artifact.qualification?.inputInventoryQualified !== false ||
  artifact.qualification?.provenanceShaLinkageQualified !== false ||
  artifact.qualification?.measuredDetectorAuthorityGranted !== false ||
  artifact.qualification?.runtimeProjectionAllowed !== false ||
  artifact.qualification?.scienceRasterAuthority !== false ||
  artifact.boundary?.currentInputRowsAreMeasured !== false ||
  artifact.boundary?.detectorProjectionMayRun !== false ||
  artifact.boundary?.scienceImageMayBeMaterialized !== false ||
  v443.status !== "blocked-staging-directory-missing" ||
  v443.readyFileCount !== 0 ||
  v450.status !== "expected-electron-image-fixture-qualified-detector-projection-blocked" ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v451-boundary");
}

const sourceManifest = [
  paths.artifact,
  paths.v443,
  paths.v450,
  "app/lib/kerrDetectorInputAdmissionV451.ts",
  "app/lib/kerrDetectorInputAdmissionServerV451.ts",
  "app/lib/kerrDetectorInputAdmissionClientV451.ts",
  "app/components/KerrDetectorInputAdmissionV451.tsx",
  "app/api/atlas/relativity-evidence/v451/detector-admission/route.ts",
  "app/local-shadow-v451/page.tsx",
  "scripts/build-kerr-detector-input-admission-v451.ts",
  "scripts/build-kerr-detector-input-admission-chain-v451.mjs",
  "scripts/build-shadow-candidate-v451.mjs",
  "scripts/verify-shadow-v451-light.mjs",
].map((path) => ({ path, sha256: fileSha(path) }));
const status = "v451-detector-input-admission-blocked-six-required-files-missing-independent-validation-not-run-browser-pending-dense-incomplete-0-of-49";
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v451-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v450EvidenceSha256: previousEvidence.evidenceSha256,
    v450PointerSha256: previousPointer.pointerSha256,
    v450EvidenceFileSha256: fileSha(paths.previousEvidence),
    v450PointerFileSha256: fileSha(paths.previousPointer),
    v451ArtifactSha256: artifact.artifactSha256,
    v451ArtifactFileSha256: fileSha(paths.artifact),
    v443ArtifactSha256: v443.artifactSha256,
  },
  detectorAdmission: {
    status: artifact.status,
    stagingPath: artifact.detector.stagingPath,
    requiredFileCount: artifact.detector.requiredFileCount,
    readyFileCount: artifact.detector.readyFileCount,
    missingFileIds: artifact.detector.missingFileIds,
    invalidFileIds: artifact.detector.invalidFileIds,
    inputInventory: "blocked",
    provenanceShaLinkage: "blocked",
    independentV372ToV374Validation: "required-not-run",
    measuredDetectorAuthority: "not-granted",
    runtimeProjection: "blocked",
    scienceRaster: "blocked",
  },
  semanticContract: artifact.semanticContract,
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v451/page.tsx",
    component: "KerrDetectorInputAdmissionV451",
    boundedSummaryBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    rawStagingFilesExposed: false,
    detectorProjectionAttempted: false,
    scienceImageMaterialized: false,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    v450ExpectedElectronFixture: "qualified-fixture-only",
    v451InputInventory: "blocked-six-required-files-missing",
    v451UnitSemanticBoundary: "qualified",
    v451ProvenanceShaLinkage: "blocked",
    v451IndependentValidation: "not-run",
    v451MeasuredDetectorAuthority: "not-granted",
    browserQualification: "not-run",
    visualMatrixQualification: "not-run",
    soakQualification: "not-run",
    rtxWebGpuQualification: "not-run",
  },
  denseCampaign: {
    namespace: "v314",
    status: state.status,
    completedShardCount: state.completedShardCount,
    plannedShardCount: state.plannedShardCount,
    attemptConsumed: state.attemptConsumed,
    aggregateAvailable: state.aggregateAvailable,
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerSha256: fileSha(paths.formal),
    formalProductPointerAdvanced: false,
    ordinaryStandaloneProfile: "legacy-v9",
    liteProfile: "legacy-v9",
    localShadowDefaultProfile: "legacy-v9",
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  boundary: "v451-read-only-detector-input-admission-no-measured-authority-no-raster-no-network",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v451",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v450ExpectedElectronImageFormation: "qualified-fixture-only",
    v451DetectorInputInventory: "blocked-six-required-files-missing",
    v451ProvenanceShaLinkage: "blocked",
    v451IndependentValidation: "not-run",
    v451MeasuredDetectorAuthority: "not-granted",
    v451RuntimeProjection: "blocked",
    v451ScienceRaster: "blocked",
    v451BrowserQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
    denseAggregate: "unavailable",
  },
  evidence: {
    path: paths.evidence,
    fileSha256: fileSha(paths.evidence),
    canonicalSha256: evidence.evidenceSha256,
  },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({
  status,
  artifactSha256: artifact.artifactSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  requiredFileCount: 6,
  readyFileCount: 0,
  measuredDetectorAuthority: "not-granted",
  scienceRaster: "blocked",
  denseCampaign: state.status,
}, null, 2));
