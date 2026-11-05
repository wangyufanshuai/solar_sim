import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v396-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v396.json",
  artifact: "dist/science/kerr-physical-observation-admission-v397/observation-admission.json",
  oracle: "dist/science/kerr-physical-observation-admission-v397/python-oracle.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v397-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v397.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const oracle = read(paths.oracle);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) || previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256 || previousPointer.capabilities?.v396StructuralConstraintDesign !== "qualified-60-evaluations-36-lifting-24-controls" || artifact.version !== "v397-kerr-physical-observation-admission-v1" || artifact.status !== "observation-admission-contract-qualified-physical-pack-unavailable" || sha(artifact) !== artifact.artifactSha256 || artifact.schema?.sourceCount !== 3 || artifact.schema?.crossLinkCount !== 3 || artifact.schema?.rowCountPerSource !== 12 || artifact.validator?.qualified !== true || artifact.validator?.rejectedAdversarialFixtureCount !== 9 || artifact.selfTest?.admissionStatus !== "admitted-validation-only" || artifact.selfTest?.publicationAllowed !== false || artifact.selfTest?.maximumPythonOracleRelativeDifference >= 2e-12 || artifact.productionAdmission?.physicalObservationPackAvailable !== false || artifact.productionAdmission?.availableSources !== 0 || artifact.productionAdmission?.availableCrossLinks !== 0 || artifact.productionAdmission?.sourceLicenseVerified !== false || artifact.productionAdmission?.physicalConstraintSelectionExecuted !== false || artifact.qualification?.physicalObservationPackQualified !== false || artifact.qualification?.measuredAuthorityGranted !== false || artifact.networkAttempted !== false || oracle.status !== "qualified-independent-observation-admission-oracle" || oracle.physicalObservationPackAvailable !== false || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.eihOnePnMutation !== "not-applied" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v397-boundary");

const sourcePaths = [
  "app/lib/kerrPhysicalObservationAdmissionV397.ts", "app/lib/kerrPhysicalObservationAdmissionV397.test.ts",
  "app/lib/kerrPhysicalObservationAdmissionServerV397.ts", "app/lib/kerrPhysicalObservationAdmissionServerV397.test.ts",
  "app/lib/atlasShadowCapabilityPointerV397.ts", "app/lib/atlasShadowCapabilityPointerV397.test.ts",
  "app/api/atlas/relativity-evidence/v397/observation-admission/route.ts", "app/api/atlas/relativity-evidence/v397/observation-admission/route.test.ts",
  "app/components/KerrObservationAirlockV397.tsx", "app/components/KerrObservationAirlockV397.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx", "scripts/run-kerr-physical-observation-admission-oracle-v397.py",
  "scripts/build-kerr-physical-observation-admission-v397.ts", "scripts/build-shadow-candidate-v397.mjs",
  "scripts/reseal-shadow-evidence-chain-v397.mjs", "scripts/verify-shadow-v397-light.mjs", "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v397-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "observation-admission-contract-qualified-physical-pack-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: { v396EvidenceSha256: previousEvidence.evidenceSha256, v396PointerSha256: previousPointer.pointerSha256, observationAdmissionArtifactSha256: artifact.artifactSha256, observationAdmissionFileSha256: fileSha(paths.artifact), pythonOracleArtifactSha256: oracle.artifactSha256, pythonOracleFileSha256: fileSha(paths.oracle), v390TransferArtifactSha256: artifact.source.v390TransferArtifactSha256, v393SourceAdmissionArtifactSha256: artifact.source.v393SourceAdmissionArtifactSha256, v396ConstraintDesignArtifactSha256: artifact.source.v396ConstraintDesignArtifactSha256, fullShortAuthoritySha256: artifact.source.fullShortAuthoritySha256 },
  admission: { requiredSources: artifact.productionAdmission.requiredSources, availableSources: 0, requiredCrossLinks: artifact.productionAdmission.requiredCrossLinks, availableCrossLinks: 0, rowCountPerSource: artifact.schema.rowCountPerSource, checkedControlRows: artifact.selfTest.checkedRowCount, rejectedAdversarialFixtureCount: artifact.validator.rejectedAdversarialFixtureCount, correlationMatrixDeterminant: artifact.selfTest.correlationMatrixDeterminant },
  authorityBoundary: { admissionContractQualified: true, provenanceRequirementsQualified: true, physicalObservationPackAvailable: false, sourceLicenseVerified: false, covariancePackBuilt: false, physicalConstraintSelectionExecuted: false, instrumentResponseAvailable: false, confidenceInterval: false, probabilityContentAssigned: false, measuredAuthorityGranted: false, sciencePayloadMutationAllowed: false, cinematicConsumerAllowed: false },
  runtime: { profile: "science-cinematic-v11-v377", consumer: "KerrObservationAirlockV397", endpoint: "/api/atlas/relativity-evidence/v397/observation-admission", responseMaximumBytes: 128 * 1024, noStore: true, localShadowOnly: true, defaultApplied: false, legacyV9Default: true },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  networkAttempted: false, automaticRetryApplied: false, browserQualification: "not-run", sourceManifest, sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  releaseBoundary: "observation-admission-contract-only-never-synthetic-as-physical-never-missing-license-or-cross-covariance-as-zero-never-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v397", generatedAt: new Date().toISOString(), status: evidence.status,
  formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true,
  capabilities: { v396StructuralConstraintDesign: "qualified-60-evaluations-36-lifting-24-controls", v397ObservationAdmissionContract: "qualified-3-sources-3-cross-links-36-rows", v397Validator: "qualified-9-of-9-adversarial-rejections", v397PhysicalObservationPack: "unavailable", v397SourceLicenses: "unverified-0-of-3", v397PhysicalConstraintSelection: "not-executed", v397MeasuredAuthority: "not-granted", v397RuntimeConsumer: "v11-observation-airlock-wired", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable", browserQualification: "not-run" },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, admissionContract: pointer.capabilities.v397ObservationAdmissionContract, physicalPack: pointer.capabilities.v397PhysicalObservationPack, dense: pointer.capabilities.v314CorrectedDense, browser: pointer.capabilities.browserQualification }, null, 2));
