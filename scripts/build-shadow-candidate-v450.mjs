import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v449-evidence.json",
  previousPointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v449.json",
  artifact:
    "dist/science/kerr-detector-image-formation-v450/image-formation-qualification.json",
  fixture:
    "dist/science/kerr-detector-image-formation-v450/typescript-formation.json",
  oracle:
    "dist/science/kerr-detector-image-formation-v450/python-oracle.json",
  detector:
    "dist/science/kerr-detector-geometry-staging-v443/staging-inspect.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v450-evidence.json",
  pointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v450.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) =>
  createHash("sha256").update(bytes(path)).digest("hex");
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);
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
  createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex");
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
const fixture = read(paths.fixture);
const oracle = read(paths.oracle);
const detector = read(paths.detector);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const maximumOracleDifference = Math.max(
  artifact.maxima.pythonWeightAbsoluteDifference,
  artifact.maxima.pythonElectronRelativeDifference,
);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v449-evidence-v1" ||
  previousPointer.version !==
    "orbit-atlas-current-local-shadow-candidate-v449" ||
  artifact.version !==
    "v450-kerr-detector-expected-image-formation-artifact-v1" ||
  artifact.status !==
    "expected-electron-image-fixture-qualified-detector-projection-blocked" ||
  artifact.rows?.length !== 4 ||
  artifact.counts?.sourceRowCount !== 4 ||
  artifact.counts?.sparseDepositRowCount !== 16 ||
  artifact.counts?.measuredDetectorGeometryRows !== 0 ||
  artifact.counts?.psfRows !== 0 ||
  artifact.counts?.pixelResponseRows !== 0 ||
  artifact.counts?.scienceRasterRows !== 0 ||
  artifact.counts?.observedImageRows !== 0 ||
  artifact.maxima?.weightConservationAbsolute > 1e-15 ||
  artifact.maxima?.electronConservationRelative > 1e-15 ||
  maximumOracleDifference >= 1e-12 ||
  artifact.qualification?.wcsCoordinateAuthorityQualified !== true ||
  artifact.qualification?.expectedElectronFormationFixtureQualified !== true ||
  artifact.qualification?.deterministicReplayQualified !== true ||
  artifact.qualification?.pythonDecimalOracleQualified !== true ||
  artifact.qualification?.pixelIndexBoundaryQualified !== true ||
  artifact.qualification?.detectorProjectionAuthority !== false ||
  artifact.qualification?.psfAuthority !== false ||
  artifact.qualification?.pixelResponseAuthority !== false ||
  artifact.qualification?.scienceRasterAuthority !== false ||
  artifact.qualification?.observedImageAvailable !== false ||
  artifact.boundary?.sparseFixtureOnly !== true ||
  artifact.boundary?.fullRasterMaterialized !== false ||
  artifact.boundary?.pngGenerated !== false ||
  artifact.boundary?.fitsGenerated !== false ||
  fixture.scienceRasterAllowed !== false ||
  fixture.observedImageAvailable !== false ||
  oracle.precisionDigits !== 60 ||
  oracle.scienceRasterAllowed !== false ||
  detector.status !== "blocked-staging-directory-missing" ||
  detector.readyFileCount !== 0 ||
  detector.measuredAuthorityGranted !== false ||
  detector.runtimeProjectionAllowed !== false ||
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
  throw new Error("v450-boundary");
}

const sourceManifest = [
  paths.artifact,
  paths.fixture,
  paths.oracle,
  "app/lib/kerrDetectorExpectedImageFormationV450.ts",
  "app/lib/kerrDetectorExpectedImageFormationServerV450.ts",
  "app/lib/kerrDetectorExpectedImageFormationClientV450.ts",
  "app/components/KerrDetectorExpectedImageFormationV450.tsx",
  "app/api/atlas/relativity-evidence/v450/expected-image-formation/route.ts",
  "app/local-shadow-v450/page.tsx",
  "scripts/build-kerr-detector-image-formation-fixture-v450.ts",
  "scripts/run-kerr-detector-image-formation-oracle-v450.py",
  "scripts/build-kerr-detector-image-formation-v450.ts",
  "scripts/build-kerr-detector-image-formation-chain-v450.mjs",
  "scripts/build-shadow-candidate-v450.mjs",
  "scripts/verify-shadow-v450-light.mjs",
].map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "expected-electron-image-fixture-qualified-detector-projection-and-science-raster-blocked-browser-pending-dense-incomplete-0-of-49";
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v450-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v449EvidenceSha256: previousEvidence.evidenceSha256,
    v449PointerSha256: previousPointer.pointerSha256,
    v449EvidenceFileSha256: fileSha(paths.previousEvidence),
    v449PointerFileSha256: fileSha(paths.previousPointer),
    v450ArtifactSha256: artifact.artifactSha256,
    v450ArtifactFileSha256: fileSha(paths.artifact),
    v443DetectorStagingArtifactSha256: detector.artifactSha256,
  },
  imageFormation: {
    status: artifact.status,
    coordinateAuthority: "v441-linear-wcs-qualified",
    electronExpectationAuthority: "v447-fixture-qualified",
    kernel: "deterministic-bilinear-four-pixel-unit-normalized",
    sourceRows: 4,
    sparseDepositRows: 16,
    maximumWeightConservationAbsolute:
      artifact.maxima.weightConservationAbsolute,
    maximumElectronConservationRelative:
      artifact.maxima.electronConservationRelative,
    maximumPythonOracleDifference: maximumOracleDifference,
    sourceCoordinateJoinResidualPixel:
      artifact.maxima.sourceCoordinateJoinResidualPixel,
  },
  authorityBoundary: {
    expectedElectronImageFixture: "qualified",
    measuredDetectorGeometry: "blocked-staging-directory-missing-0-of-6",
    psfAuthority: "unavailable",
    pixelResponseAuthority: "unavailable",
    scienceRasterAuthority: "blocked",
    observedImage: "unavailable",
    fullRasterMaterialized: false,
    pngGenerated: false,
    fitsGenerated: false,
  },
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v450/page.tsx",
    component: "KerrDetectorExpectedImageFormationV450",
    boundedSummaryBytes: 128 * 1024,
    summaryOnlyInReactState: true,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    canvasCreated: false,
    sciencePayloadMutation: false,
    cinematicScienceWriteback: false,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    v450WcsCoordinateAuthority: "qualified-from-v441",
    v450ExpectedElectronImageFormation: "qualified-fixture-only",
    v450PythonDecimalOracle: "qualified-60-digit",
    v450DetectorProjectionAuthority: "blocked",
    v450PsfAuthority: "unavailable",
    v450PixelResponseAuthority: "unavailable",
    v450ScienceRasterAuthority: "blocked",
    v450ObservedImage: "unavailable",
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
  boundary:
    "v450-sparse-expected-electron-fixture-only-no-measured-detector-geometry-psf-pixel-response-science-raster-or-observed-image-authority",
};
const evidence = {
  ...evidenceUnsigned,
  evidenceSha256: sha(evidenceUnsigned),
};
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v450",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v449ExactPoissonGaussianReference: "qualified-fixture-only",
    v450WcsCoordinateAuthority: "qualified-from-v441",
    v450ExpectedElectronImageFormation: "qualified-fixture-only",
    v450DetectorProjectionAuthority: "blocked-staging-0-of-6",
    v450PsfAuthority: "unavailable",
    v450PixelResponseAuthority: "unavailable",
    v450ScienceRasterAuthority: "blocked",
    v450ObservedImage: "unavailable",
    v450BrowserQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
    denseAggregate: "unavailable",
  },
  evidence: {
    path: paths.evidence,
    fileSha256: fileSha(paths.evidence),
    canonicalSha256: evidence.evidenceSha256,
  },
};
const pointer = {
  ...pointerUnsigned,
  pointerSha256: sha(pointerUnsigned),
};
atomic(paths.pointer, pointer);
console.log(
  JSON.stringify(
    {
      status,
      artifactSha256: artifact.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      sourceRows: 4,
      sparseDeposits: 16,
      maximumOracleDifference,
      detectorProjectionAuthority: "blocked",
      scienceRasterAuthority: "blocked",
      denseCampaign: state.status,
    },
    null,
    2,
  ),
);
