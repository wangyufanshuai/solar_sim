import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v427-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v427.json",
  v427Artifact: "dist/science/kerr-high-energy-response-acquisition-pack-v427/acquisition-pack.json",
  artifact: "dist/science/kerr-high-energy-response-intake-v428/intake-firewall.json",
  report: "dist/science/kerr-high-energy-response-intake-v428/fixture-intake-report.json",
  normalized: "dist/science/kerr-high-energy-response-intake-v428/normalized-fixture-submission.json",
  schema: "dist/science/kerr-high-energy-response-intake-v428/response-submission-schema.json",
  exportManifest: "dist/science/kerr-high-energy-response-intake-v428/export-manifest.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v428-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v428.json",
};
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
function atomic(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8"); renameSync(temporary, target); }

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const v427Artifact = read(paths.v427Artifact);
const artifact = read(paths.artifact);
const report = read(paths.report);
const normalized = read(paths.normalized);
const schema = read(paths.schema);
const exports = read(paths.exportManifest);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const view = artifact.view;
if (
  previousEvidence.evidenceSha256 !== "2df5fb6d4a46422cc2204eedd0b183b6ea54c32fa276dfd322a6b550aff00000" ||
  previousPointer.pointerSha256 !== "04f0de8726748db8de80161908e2baf7a3e33ca64a9294f682376bc0be609d1a" ||
  fileSha(paths.previousEvidence) !== "2ac50f9db5b65007c3a3e901eb1343d3f5173aceaece165668fb16dc8272fdb8" ||
  fileSha(paths.previousPointer) !== "7531e706091aee71d99a8a6e40b4241387c82ee95162a90f6f2caaea83e6a48b" ||
  v427Artifact.artifactSha256 !== "e1a81b23a4c43700706fbeea25db8c0610879508259228c71a9cf200e9de3a52" ||
  fileSha(paths.v427Artifact) !== "0320a996601ce721cc2eacc18204168ba57706f7d8a45081f273e00cf7e62c60" ||
  artifact.version !== "v428-kerr-high-energy-response-intake-firewall-artifact-v1" ||
  sha(artifact) !== artifact.artifactSha256 ||
  report.status !== "qualified-intake-firewall-fixture-rejected-no-measured-submission" ||
  report.rejectedMutationCount !== 12 ||
  report.mutationResults?.length !== 12 ||
  report.mutationResults.some((entry) => entry.rejected !== true) ||
  report.measuredSubmissionPresent !== false ||
  report.measuredImportAttempted !== false ||
  report.measuredAuthorityGranted !== false ||
  report.scienceResponseApplicationCount !== 0 ||
  normalized.identity?.sourceKind !== "test-fixture" ||
  normalized.identity?.measuredAcquisition !== false ||
  schema.version !== "v428-kerr-high-energy-response-submission-schema-v1" ||
  schema.archive?.expectedFiles?.length !== 7 ||
  view?.counts?.expectedArchiveFileCount !== 7 ||
  view.counts.measurementCsvCount !== 6 ||
  view.counts.fixtureDataRowCount !== 900 ||
  view.counts.measuredSubmissionCount !== 0 ||
  view.counts.measuredDataRowCount !== 0 ||
  view.counts.measuredImportAttemptCount !== 0 ||
  view.counts.scienceResponseApplicationCount !== 0 ||
  view.fixture?.rejectedMutationCount !== 12 ||
  view.fixture.pythonTypeScriptMaximumDifference >= 1e-12 ||
  view.authorityBoundary?.intakeSchemaAuthorityGranted !== true ||
  view.authorityBoundary.containerValidatorAuthorityGranted !== true ||
  view.authorityBoundary.csvBridgeAuthorityGranted !== true ||
  view.authorityBoundary.fixturePerformanceAuthorityGranted !== false ||
  view.authorityBoundary.measuredResponseAuthorityGranted !== false ||
  view.authorityBoundary.independentScientificValidationGranted !== false ||
  exports.version !== "v428-kerr-high-energy-response-intake-export-manifest-v1" ||
  exports.artifactSha256 !== artifact.artifactSha256 ||
  exports.fixtureMutationCount !== 12 ||
  exports.fixtureRejectedMutationCount !== 12 ||
  exports.measuredSubmissionCount !== 0 ||
  exports.measuredImportAttemptCount !== 0 ||
  exports.measuredResponseAuthority !== "unavailable" ||
  exports.scienceResponseApplicationCount !== 0 ||
  Object.values(exports.exports ?? {}).some((entry) => entry.sha256 !== fileSha(`dist/science/kerr-high-energy-response-intake-v428/${entry.path}`)) ||
  state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v428-boundary");

const sourcePaths = [
  "app/lib/kerrHighEnergyResponseIntakeV428.ts", "app/lib/kerrHighEnergyResponseIntakeV428.test.ts",
  "app/lib/kerrHighEnergyResponseIntakeServerV428.ts", "app/lib/kerrHighEnergyResponseIntakeServerV428.test.ts",
  "app/lib/kerrHighEnergyResponseIntakeClientV428.ts", "app/lib/kerrHighEnergyResponseIntakeClientV428.test.ts",
  "app/lib/atlasShadowCapabilityPointerV428.ts", "app/lib/atlasShadowCapabilityPointerV428.test.ts",
  "app/api/atlas/relativity-evidence/v428/high-energy-response-intake/route.ts", "app/api/atlas/relativity-evidence/v428/high-energy-response-intake/route.test.ts",
  "app/components/KerrHighEnergyResponseIntakeV428.tsx", "app/components/KerrHighEnergyResponseIntakeV428.test.tsx", "app/components/KerrEvidenceObservatoryV405.tsx",
  "scripts/kerr-high-energy-response-intake-v428.py", "scripts/test-kerr-high-energy-response-intake-v428.py", "scripts/build-kerr-high-energy-response-intake-v428.ts", "scripts/export-kerr-high-energy-response-intake-v428.py", "scripts/build-kerr-high-energy-response-intake-chain-v428.mjs", "scripts/build-shadow-candidate-v428.mjs", "scripts/reseal-shadow-evidence-chain-v428.mjs", "scripts/verify-shadow-v428-light.mjs", "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v428-evidence-v1",
  generatedAt: artifact.generatedAt,
  status: "response-intake-firewall-qualified-fixture-rejected-measured-submission-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: { v427EvidenceSha256: previousEvidence.evidenceSha256, v427PointerSha256: previousPointer.pointerSha256, v427EvidenceFileSha256: fileSha(paths.previousEvidence), v427PointerFileSha256: fileSha(paths.previousPointer), v427ArtifactSha256: v427Artifact.artifactSha256, v427ArtifactFileSha256: fileSha(paths.v427Artifact), v428ArtifactSha256: artifact.artifactSha256, v428ArtifactFileSha256: fileSha(paths.artifact), fixtureReportArtifactSha256: report.artifactSha256, fixtureReportFileSha256: fileSha(paths.report), normalizedFixtureFileSha256: fileSha(paths.normalized), submissionSchemaFileSha256: fileSha(paths.schema), exportManifestFileSha256: fileSha(paths.exportManifest) },
  responseIntake: { status: view.status, limits: view.limits, gates: view.gates, fixture: view.fixture, counts: view.counts, products: view.products, authorityBoundary: view.authorityBoundary, exports: Object.fromEntries(Object.entries(exports.exports).map(([id, entry]) => [id, { fileSha256: entry.sha256, semantic: entry.semantic }])) },
  qualification: { submissionSchemaQualified: true, archiveFirewallQualified: true, csvUnitShaBridgeQualified: true, pythonTypeScriptCrossValidationQualified: true, adversarialMutationRejections: 12, fixtureIntake: "validated-nonpublishable", fixturePerformanceAuthorityQualified: false, measuredSubmissionCount: 0, measuredImportAttemptCount: 0, measuredResponseAuthorityQualified: false, independentScientificValidation: "not-run", scienceResponseApplicationCount: 0, detectorCountsQualified: false, pixelRasterAuthorityQualified: false, denseAuthorityQualified: false, browserQualification: "not-run", visualMatrixQualification: "not-run", soakQualification: "not-run", rtxWebGpuQualification: "not-run" },
  runtimeIntegration: { v13EvidenceObservatory: true, summaryOnlyInReactState: true, normalizedSubmissionInReactState: false, archiveMembersInReactState: false, rawMeasurementRowsInReactState: false, browserUploadEndpointPresent: false, explicitLocalCliOnly: true, fullArtifactDownloadAvailable: true, canvasCreated: false, fixtureValueUseInScience: false, responseValueFabrication: false, measurementClaim: false },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: 0, plannedShardCount: state.plannedShardCount, attemptConsumed: false, aggregateAvailable: false, stateSha256: state.stateSha256 },
  sourceManifest, sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, ordinaryStandaloneProfile: "legacy-v9", liteProfile: "legacy-v9", localShadowDefaultProfile: "legacy-v9", localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  releaseBoundary: "v428-intake-firewall-only-no-measured-submission-import-attempt-independent-validation-response-authority-science-projection-counts-pixel-raster-dense-browser-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v428", generatedAt: artifact.generatedAt, status: evidence.status, formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true,
  capabilities: { v427AcquisitionPack: "qualified-preserved", v428SubmissionSchema: "qualified-seven-files-six-csv", v428ArchiveFirewall: "qualified", v428CsvUnitShaBridge: "qualified", v428PythonTypeScriptCrossValidation: "qualified", v428AdversarialMutations: "rejected-12-of-12", v428FixtureIntake: "validated-nonpublishable", v428MeasuredSubmissionCount: "zero", v428MeasuredImportAttempts: "zero", v428MeasuredResponseAuthority: "unavailable", v428IndependentScientificValidation: "not-run", v428ScienceResponseApplications: "zero", v428DetectorCounts: "unavailable", v428PixelRasterAuthority: "unavailable", v428BrowserQualification: "not-run", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable" },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, artifactSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, counts: view.counts, mutations: `${view.fixture.rejectedMutationCount}/${view.fixture.mutationCount}`, measuredSubmissions: pointer.capabilities.v428MeasuredSubmissionCount, importAttempts: pointer.capabilities.v428MeasuredImportAttempts, measuredAuthority: pointer.capabilities.v428MeasuredResponseAuthority, scienceApplications: pointer.capabilities.v428ScienceResponseApplications, browser: pointer.capabilities.v428BrowserQualification, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
