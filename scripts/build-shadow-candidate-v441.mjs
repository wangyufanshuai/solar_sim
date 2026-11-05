import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v440-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v440.json",
  artifact:
    "dist/science/kerr-wcs-projection-availability-v441/wcs-projection-availability.json",
  oracle: "dist/science/kerr-wcs-projection-availability-v441/wcs-projection-oracle.json",
  contract: "dist/science/kerr-wcs-projection-availability-v441/wcs-projection-contract.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v441-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v441.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([a], [b]) => a.localeCompare(b))
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
const artifact = read(paths.artifact);
const oracle = read(paths.oracle);
const contract = read(paths.contract);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  artifact.version !== "v441-kerr-wcs-projection-availability-artifact-v1" ||
  artifact.rows?.length !== 4 ||
  artifact.counts?.joinedSourceCoordinateRowCount !== 24 ||
  artifact.counts?.detectorProjectionCount !== 0 ||
  artifact.counts?.psfModelCount !== 0 ||
  artifact.counts?.rasterProductCount !== 0 ||
  artifact.maxima?.pythonAstropyPixelDifference !== 0 ||
  artifact.maxima?.sourceCoordinateJoinResidualPixel >= 1e-12 ||
  artifact.detectorProjectionAttempted !== false ||
  artifact.psfConvolutionAttempted !== false ||
  artifact.denseCampaignStatus !== "incomplete-0-of-49" ||
  oracle.qualification?.wcsCoordinateAuthorityQualified !== true ||
  oracle.qualification?.sourceCoordinateJoinQualified !== true ||
  oracle.qualification?.detectorProjectionBlocked !== true ||
  oracle.qualification?.rasterizationBlocked !== true ||
  contract.wcsAuthority?.astropyOracleQualified !== true ||
  contract.detectorProjection?.projectionAllowed !== false ||
  contract.scienceRenderer?.psfSynthesisForbidden !== true ||
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
  throw new Error("v441-boundary");
}

const sourcePaths = [
  "app/lib/kerrWcsProjectionAvailabilityV441.ts",
  "app/lib/kerrWcsProjectionAvailabilityServerV441.ts",
  "app/lib/kerrWcsProjectionAvailabilityClientV441.ts",
  "app/api/atlas/relativity-evidence/v441/wcs-projection-availability/route.ts",
  "app/components/KerrWcsProjectionAvailabilityV441.tsx",
  "app/components/KerrEvidenceObservatoryV405.tsx",
  "scripts/run-kerr-wcs-projection-availability-v441.py",
  "scripts/build-kerr-wcs-projection-availability-v441.ts",
  "scripts/build-kerr-wcs-projection-availability-chain-v441.mjs",
  "scripts/build-shadow-candidate-v441.mjs",
  "scripts/verify-shadow-v441-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "qualified-linear-wcs-coordinate-authority-detector-projection-blocked-browser-pending-dense-incomplete-0-of-49";
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v441-evidence-v1",
  generatedAt: oracle.generatedAt,
  status,
  dependency: {
    v440EvidenceSha256: previousEvidence.evidenceSha256,
    v440PointerSha256: previousPointer.pointerSha256,
    v440EvidenceFileSha256: fileSha(paths.previousEvidence),
    v440PointerFileSha256: fileSha(paths.previousPointer),
    v441ArtifactSha256: artifact.artifactSha256,
    v441ArtifactFileSha256: fileSha(paths.artifact),
    v441OracleArtifactSha256: oracle.artifactSha256,
    v441OracleFileSha256: fileSha(paths.oracle),
    v441ContractFileSha256: fileSha(paths.contract),
  },
  wcsProjectionAvailability: {
    status: artifact.status,
    wcsSourceCount: artifact.counts.wcsSourceCount,
    joinedSourceCoordinateRowCount: artifact.counts.joinedSourceCoordinateRowCount,
    maxWorldRoundtripResidualM: artifact.maxima.worldRoundtripResidualM,
    pythonAstropyPixelDifference: artifact.maxima.pythonAstropyPixelDifference,
    maxSourceCoordinateJoinResidualPixel: artifact.maxima.sourceCoordinateJoinResidualPixel,
    detectorGeometryCount: artifact.counts.detectorGeometryCount,
    psfModelCount: artifact.counts.psfModelCount,
    detectorProjectionCount: artifact.counts.detectorProjectionCount,
    rasterProductCount: artifact.counts.rasterProductCount,
    detectorProjectionAttempted: artifact.detectorProjectionAttempted,
    psfConvolutionAttempted: artifact.psfConvolutionAttempted,
  },
  qualification: {
    v440SourceCoordinates: "qualified-24-source-coordinates",
    linearWcsCoordinateAuthority: "qualified",
    astropyOracle: "qualified",
    sourceCoordinateJoin: "qualified",
    detectorGeometryAuthority: "unavailable",
    psfAuthority: "unavailable",
    pixelResponseAuthority: "unavailable",
    detectorProjection: "blocked",
    rasterization: "blocked",
    scienceImageApplication: "blocked",
    cinematicWcsOverlay: "qualified-presentation-only",
    browserQualification: "not-run",
    visualMatrixQualification: "not-run",
    soakQualification: "not-run",
    rtxWebGpuQualification: "not-run",
  },
  runtimeIntegration: {
    evidenceObservatory: true,
    summaryOnlyInReactState: true,
    fullExecutionRecordsInReactState: false,
    canvasCreated: false,
    detectorProjectionRequested: false,
    psfSynthesisRequested: false,
    rasterizationRequested: false,
    scienceFieldMutation: false,
    cinematicScienceWriteback: false,
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
  releaseBoundary:
    "v441-linear-wcs-coordinate-authority-only-no-measured-detector-projection-psf-raster-or-science-image",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v441",
  generatedAt: oracle.generatedAt,
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v440: "qualified-source-coordinate-audit-detector-projection-unavailable",
    v441LinearWcsCoordinateAuthority: "qualified",
    v441AstropyOracle: "qualified",
    v441SourceCoordinateJoin: "qualified-24-rows",
    v441DetectorGeometryAuthority: "unavailable",
    v441PsfAuthority: "unavailable",
    v441PixelResponseAuthority: "unavailable",
    v441DetectorProjection: "blocked",
    v441Rasterization: "blocked",
    v441ScienceImageApplication: "blocked",
    v441BrowserQualification: "not-run",
    v441DenseCampaign: "incomplete-0-of-49",
    v314DenseAggregate: "unavailable",
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
      artifactSha256: artifact.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      wcsSources: artifact.counts.wcsSourceCount,
      joinedCoordinates: artifact.counts.joinedSourceCoordinateRowCount,
      detectorProjection: artifact.counts.detectorProjectionCount,
      psfModels: artifact.counts.psfModelCount,
      denseCampaign: state.status,
    },
    null,
    2,
  ),
);
