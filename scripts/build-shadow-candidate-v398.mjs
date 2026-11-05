import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v397-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v397.json",
  artifact: "dist/science/kerr-physical-observation-intake-v398/intake-inspect.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v398-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v398.json",
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
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) || previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256 || previousPointer.capabilities?.v397ObservationAdmissionContract !== "qualified-3-sources-3-cross-links-36-rows" || artifact.version !== "v398-kerr-physical-observation-intake-v1" || artifact.status !== "local-intake-compiler-qualified-physical-staging-unavailable-compile-not-run" || sha(artifact) !== artifact.artifactSha256 || artifact.schema?.expectedFileCount !== 13 || artifact.schema?.pathTraversalForbidden !== true || artifact.schema?.absolutePathForbidden !== true || artifact.schema?.atomicPublicationRequired !== true || artifact.validator?.rejectedAdversarialFixtureCount !== 10 || artifact.inspect?.stagingManifestPresent !== false || artifact.inspect?.compileExecuted !== false || artifact.inspect?.candidatePublished !== false || artifact.inspect?.attemptConsumed !== false || artifact.productionAdmission?.physicalObservationPackAvailable !== false || artifact.productionAdmission?.physicalPackCompiled !== false || artifact.productionAdmission?.measuredAuthorityGranted !== false || artifact.qualification?.atomicCompilerImplemented !== true || artifact.qualification?.physicalObservationIntakeQualified !== false || artifact.networkAttempted !== false || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.eihOnePnMutation !== "not-applied" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v398-boundary");

const sourcePaths = [
  "app/lib/kerrPhysicalObservationIntakeV398.ts", "app/lib/kerrPhysicalObservationIntakeV398.test.ts",
  "app/lib/kerrPhysicalObservationIntakeServerV398.ts", "app/lib/kerrPhysicalObservationIntakeServerV398.test.ts",
  "app/lib/atlasShadowCapabilityPointerV398.ts", "app/lib/atlasShadowCapabilityPointerV398.test.ts",
  "app/api/atlas/relativity-evidence/v398/observation-intake/route.ts", "app/api/atlas/relativity-evidence/v398/observation-intake/route.test.ts",
  "app/components/KerrObservationDockV398.tsx", "app/components/KerrObservationDockV398.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx", "scripts/build-kerr-physical-observation-intake-v398.ts",
  "scripts/compile-kerr-physical-observation-v398.ts", "scripts/build-shadow-candidate-v398.mjs",
  "scripts/reseal-shadow-evidence-chain-v398.mjs", "scripts/verify-shadow-v398-light.mjs", "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v398-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "local-intake-compiler-qualified-physical-staging-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: { v397EvidenceSha256: previousEvidence.evidenceSha256, v397PointerSha256: previousPointer.pointerSha256, intakeArtifactSha256: artifact.artifactSha256, intakeArtifactFileSha256: fileSha(paths.artifact), v397AdmissionArtifactSha256: artifact.source.v397AdmissionArtifactSha256, fullShortAuthoritySha256: artifact.source.fullShortAuthoritySha256 },
  intake: { stagingRoot: artifact.schema.stagingRoot, expectedFileCount: artifact.schema.expectedFileCount, presentFileCount: artifact.inspect.presentFileCount, maximumPackBytes: artifact.schema.maximumPackBytes, maximumFileBytes: artifact.schema.maximumFileBytes, maximumTotalBytes: artifact.schema.maximumTotalBytes, rejectedAdversarialFixtureCount: artifact.validator.rejectedAdversarialFixtureCount, pathTraversalForbidden: true, absolutePathForbidden: true, atomicPublicationRequired: true },
  authorityBoundary: { intakeManifestContractQualified: true, boundedFileVerifierQualified: true, atomicCompilerImplemented: true, physicalIntakeManifestAvailable: false, physicalObservationPackAvailable: false, compileExecuted: false, candidatePublished: false, runtimePublished: false, measuredAuthorityGranted: false, sciencePayloadMutationAllowed: false, cinematicConsumerAllowed: false },
  runtime: { profile: "science-cinematic-v11-v377", consumer: "KerrObservationDockV398", endpoint: "/api/atlas/relativity-evidence/v398/observation-intake", responseMaximumBytes: 128 * 1024, noStore: true, localShadowOnly: true, defaultApplied: false, legacyV9Default: true },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  networkAttempted: false, automaticRetryApplied: false, browserQualification: "not-run", sourceManifest, sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  releaseBoundary: "local-intake-compiler-only-no-staging-no-attempt-no-candidate-no-runtime-no-measured-authority-no-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v398", generatedAt: new Date().toISOString(), status: evidence.status,
  formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true,
  capabilities: { v397ObservationAdmissionContract: "qualified-3-sources-3-cross-links-36-rows", v398IntakeManifestContract: "qualified-13-file-graph", v398BoundedVerifier: "qualified-path-sha-size-license-cross-evidence", v398Validator: "qualified-10-of-10-adversarial-rejections", v398StagingManifest: "unavailable", v398Compile: "not-run", v398Candidate: "unavailable", v398MeasuredAuthority: "not-granted", v398RuntimeConsumer: "v11-observation-dock-wired", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable", browserQualification: "not-run" },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, intakeContract: pointer.capabilities.v398IntakeManifestContract, staging: pointer.capabilities.v398StagingManifest, compile: pointer.capabilities.v398Compile, authority: pointer.capabilities.v398MeasuredAuthority, dense: pointer.capabilities.v314CorrectedDense, browser: pointer.capabilities.browserQualification }, null, 2));
