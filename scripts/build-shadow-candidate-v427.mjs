import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v426-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v426.json",
  v426Artifact: "dist/science/kerr-high-energy-response-v426/response-contract.json",
  artifact: "dist/science/kerr-high-energy-response-acquisition-pack-v427/acquisition-pack.json",
  oracle: "dist/science/kerr-high-energy-response-acquisition-pack-v427/validator-oracle.json",
  fixture: "dist/science/kerr-high-energy-response-acquisition-pack-v427/validator-fixture.json",
  exportManifest: "dist/science/kerr-high-energy-response-acquisition-pack-v427/export-manifest.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v427-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v427.json",
};
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
function atomic(path, value) {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, target);
}

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const v426Artifact = read(paths.v426Artifact);
const artifact = read(paths.artifact);
const oracle = read(paths.oracle);
const fixture = read(paths.fixture);
const exports = read(paths.exportManifest);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const view = artifact.view;
if (
  previousEvidence.evidenceSha256 !== "7170277ec5eb1be52f48fde0ec38cfb449886d72e38ecef6432b0b71171d6d4f" ||
  previousPointer.pointerSha256 !== "4ca644ed3aa2d0298f000e80d7e2bf7776c8e3ea198673482f10bfc950c66f0f" ||
  fileSha(paths.previousEvidence) !== "51776e08d6394082edbbf7593d13eb8fdd010893a1ed19ccbb8a57b60184b9a2" ||
  fileSha(paths.previousPointer) !== "ebef90d600ea0ffe4546e344112db2a4c46edfc48b468fffb9ba9f886023e369" ||
  v426Artifact.artifactSha256 !== "17de5699cef0619dc3ea165ede2d05828ec55bfd3b9cc09a12d24e4c35637c44" ||
  fileSha(paths.v426Artifact) !== "03158769935c494638445adde9689ef94fc3199eefe6db4afd0ec6a824222061" ||
  artifact.version !== "v427-kerr-high-energy-response-acquisition-pack-artifact-v1" ||
  sha(artifact) !== artifact.artifactSha256 ||
  oracle.status !== "qualified-validator-fixture-oracle-nonpublishable-no-measured-authority" ||
  oracle.artifactSha256 !== artifact.pythonOracleArtifactSha256 ||
  oracle.fixtureFileSha256 !== fileSha(paths.fixture) ||
  fixture.identity?.sourceKind !== "test-fixture" ||
  fixture.identity?.measuredAcquisition !== false ||
  view?.counts?.packFileCount !== 9 ||
  view.counts.measurementTemplateCount !== 7 ||
  view.counts.measurementTemplateDataRowCount !== 0 ||
  view.counts.measuredSubmissionCount !== 0 ||
  view.counts.measuredDataRowCount !== 0 ||
  view.counts.scienceResponseApplicationCount !== 0 ||
  view.validator?.fixtureStatus !== "validated-test-fixture-nonpublishable" ||
  view.validator.invalidFixtureMutationCount !== 12 ||
  view.validator.invalidFixtureRejectionCount !== 12 ||
  view.authorityBoundary?.packSchemaAuthorityGranted !== true ||
  view.authorityBoundary.validatorAuthorityGranted !== true ||
  view.authorityBoundary.fixturePerformanceAuthorityGranted !== false ||
  view.authorityBoundary.measuredResponseAuthorityGranted !== false ||
  view.authorityBoundary.scienceProjectionAuthorityGranted !== false ||
  exports.version !== "v427-kerr-high-energy-response-acquisition-export-manifest-v1" ||
  exports.artifactSha256 !== artifact.artifactSha256 ||
  exports.zipEntryCount !== 9 ||
  exports.measurementTemplateCount !== 7 ||
  exports.measurementTemplateDataRowCount !== 0 ||
  exports.validatorFixtureIncludedInZip !== false ||
  exports.measuredResponseAuthority !== "unavailable" ||
  exports.scienceResponseApplicationCount !== 0 ||
  Object.values(exports.exports ?? {}).some((entry) => entry.sha256 !== fileSha(`dist/science/kerr-high-energy-response-acquisition-pack-v427/${entry.path}`)) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v427-boundary");

const sourcePaths = [
  "app/lib/kerrHighEnergyResponseAcquisitionPackV427.ts",
  "app/lib/kerrHighEnergyResponseAcquisitionPackV427.test.ts",
  "app/lib/kerrHighEnergyResponseAcquisitionPackServerV427.ts",
  "app/lib/kerrHighEnergyResponseAcquisitionPackServerV427.test.ts",
  "app/lib/kerrHighEnergyResponseAcquisitionPackClientV427.ts",
  "app/lib/kerrHighEnergyResponseAcquisitionPackClientV427.test.ts",
  "app/lib/atlasShadowCapabilityPointerV427.ts",
  "app/lib/atlasShadowCapabilityPointerV427.test.ts",
  "app/api/atlas/relativity-evidence/v427/high-energy-response-acquisition/route.ts",
  "app/api/atlas/relativity-evidence/v427/high-energy-response-acquisition/route.test.ts",
  "app/components/KerrHighEnergyResponseAcquisitionV427.tsx",
  "app/components/KerrHighEnergyResponseAcquisitionV427.test.tsx",
  "app/components/KerrEvidenceObservatoryV405.tsx",
  "scripts/run-kerr-high-energy-response-acquisition-oracle-v427.py",
  "scripts/build-kerr-high-energy-response-acquisition-pack-v427.ts",
  "scripts/export-kerr-high-energy-response-acquisition-pack-v427.py",
  "scripts/build-kerr-high-energy-response-acquisition-chain-v427.mjs",
  "scripts/build-shadow-candidate-v427.mjs",
  "scripts/reseal-shadow-evidence-chain-v427.mjs",
  "scripts/verify-shadow-v427-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v427-evidence-v1",
  generatedAt: artifact.generatedAt,
  status: "high-energy-response-empty-acquisition-pack-and-validator-qualified-measured-authority-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v426EvidenceSha256: previousEvidence.evidenceSha256,
    v426PointerSha256: previousPointer.pointerSha256,
    v426EvidenceFileSha256: fileSha(paths.previousEvidence),
    v426PointerFileSha256: fileSha(paths.previousPointer),
    v426ArtifactSha256: v426Artifact.artifactSha256,
    v426ArtifactFileSha256: fileSha(paths.v426Artifact),
    v427ArtifactSha256: artifact.artifactSha256,
    v427ArtifactFileSha256: fileSha(paths.artifact),
    pythonOracleArtifactSha256: oracle.artifactSha256,
    pythonOracleFileSha256: fileSha(paths.oracle),
    validatorFixtureFileSha256: fileSha(paths.fixture),
    exportManifestFileSha256: fileSha(paths.exportManifest),
  },
  responseAcquisition: {
    status: view.status,
    files: view.files.map((entry) => ({ id: entry.id, relativePath: entry.relativePath, fileSha256: entry.sha256, bytes: entry.bytes, dataRowCount: entry.dataRowCount, measurementTemplate: entry.measurementTemplate, admissibleAsMeasured: entry.admissibleAsMeasured })),
    counts: view.counts,
    validator: view.validator,
    products: view.products,
    authorityBoundary: view.authorityBoundary,
    exports: Object.fromEntries(Object.entries(exports.exports).map(([id, entry]) => [id, { fileSha256: entry.sha256, semantic: entry.semantic }])),
  },
  qualification: {
    emptyAcquisitionPackQualified: true,
    emptyMeasurementTemplatesQualified: true,
    validatorSchemaQualified: true,
    validatorIndependentFixtureQualified: true,
    invalidFixtureMutationRejections: 12,
    fixturePerformanceAuthorityQualified: false,
    measuredResponseAuthorityQualified: false,
    measuredDataRowCount: 0,
    scienceResponseApplicationCount: 0,
    detectorCountsQualified: false,
    pixelRasterAuthorityQualified: false,
    denseAuthorityQualified: false,
    browserQualification: "not-run",
    visualMatrixQualification: "not-run",
    soakQualification: "not-run",
    rtxWebGpuQualification: "not-run",
  },
  runtimeIntegration: {
    v13EvidenceObservatory: true,
    summaryOnlyInReactState: true,
    fixtureRowsInReactState: false,
    measurementTablesInReactState: false,
    fullArtifactDownloadAvailable: true,
    deterministicZipDownloadAvailable: true,
    canvasCreated: false,
    fixtureValueUseInScience: false,
    responseValueFabrication: false,
    measurementClaim: false,
  },
  correctedCampaign: {
    namespace: "v314",
    status: state.status,
    completedShardCount: 0,
    plannedShardCount: state.plannedShardCount,
    attemptConsumed: false,
    aggregateAvailable: false,
    stateSha256: state.stateSha256,
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
  releaseBoundary: "v427-empty-acquisition-pack-and-validator-only-no-fixture-performance-measured-response-science-projection-counts-pixel-raster-dense-browser-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v427",
  generatedAt: artifact.generatedAt,
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v426ResponseContract: "qualified-preserved",
    v427AcquisitionPack: "qualified-nine-files",
    v427MeasurementTemplates: "qualified-seven-empty-zero-rows",
    v427ValidatorFixture: "qualified-nonpublishable",
    v427InvalidFixtureMutations: "rejected-12-of-12",
    v427DeterministicZip: "available-empty-templates-only",
    v427AcquisitionPlanFits: "available-no-measured-response",
    v427ArchitecturePng: "available-not-detector-image",
    v427MeasuredResponseAuthority: "unavailable",
    v427ScienceResponseApplications: "zero",
    v427DetectorCounts: "unavailable",
    v427PixelRasterAuthority: "unavailable",
    v427BrowserQualification: "not-run",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, artifactSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, counts: view.counts, mutations: `${view.validator.invalidFixtureRejectionCount}/${view.validator.invalidFixtureMutationCount}`, measuredAuthority: pointer.capabilities.v427MeasuredResponseAuthority, scienceApplications: pointer.capabilities.v427ScienceResponseApplications, browser: pointer.capabilities.v427BrowserQualification, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
