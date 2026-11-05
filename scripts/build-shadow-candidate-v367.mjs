import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v366-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v366.json",
  inspect: "dist/science/detector-calibration-v367/inspect.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v367-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v367.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const inspect = read(paths.inspect);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (previousEvidence.status !== "independent-calibration-validation-v366-blocked-inputs-unavailable-validator-implemented-dense-incomplete-0-of-49"
  || previousPointer.capabilities?.v366MeasuredAuthority !== "unavailable-no-authority-granted"
  || inspect.version !== "v367-detector-calibration-authority-inspect-v1"
  || inspect.status !== "blocked-admission-inputs-unavailable"
  || inspect.presentInputCount !== 0
  || inspect.missingInputs?.length !== 7
  || inspect.admissionControllerImplemented !== true
  || inspect.admissionExecuted !== false
  || inspect.measuredAuthorityGranted !== false
  || inspect.attemptConsumed !== false
  || inspect.networkAttempted !== false
  || inspect.automaticPromotionAllowed !== false
  || state.status !== "incomplete-0-of-49"
  || state.completedShardCount !== 0
  || state.attemptConsumed !== false
  || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied"
  || formalEvidence.contracts?.eihOnePnMutation !== "not-applied"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v367-authority-boundary");

const sourcePaths = [
  "app/lib/detectorCalibrationAuthorityAdmissionV367.ts",
  "app/lib/detectorCalibrationAuthorityAdmissionV367.test.ts",
  "app/lib/detectorCalibrationAuthorityInspectV367.ts",
  "app/lib/detectorCalibrationAuthorityInspectV367.test.ts",
  "app/lib/detectorCalibrationAuthorityInspectServerV367.ts",
  "app/lib/detectorCalibrationAuthorityInspectServerV367.test.ts",
  "app/api/atlas/relativity-evidence/v367/calibration-authority/route.ts",
  "app/api/atlas/relativity-evidence/v367/calibration-authority/route.test.ts",
  "app/components/DetectorCalibrationAuthoritySurfaceV367.tsx",
  "app/components/DetectorCalibrationAuthoritySurfaceV367.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV367.ts",
  "app/lib/atlasShadowCapabilityPointerV367.test.ts",
  "scripts/inspect-detector-calibration-v367.ts",
  "scripts/admit-detector-calibration-v367.ts",
  "scripts/build-shadow-candidate-v367.mjs",
  "scripts/verify-shadow-v367-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v367-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "detector-calibration-authority-admission-v367-blocked-inputs-unavailable-controller-implemented-dense-incomplete-0-of-49",
  dependency: { v366EvidenceSha256: previousEvidence.evidenceSha256, v366PointerSha256: previousPointer.pointerSha256, inspectArtifactSha256: inspect.artifactSha256 },
  controller: {
    version: "v367-detector-calibration-authority-admission-v1",
    implemented: true,
    explicitCommandOnly: true,
    recomputesCompilerOutput: true,
    requiresIndependentV366Validation: true,
    locksManifestCanonicalSha: true,
    locksInstrumentIdentity: true,
    rejectsTestFixture: true,
    automaticPromotionAllowed: false,
    sciencePayloadMutationAllowed: false,
    cinematicMutationAllowed: false,
  },
  admissionInspect: {
    status: inspect.status,
    expectedInputs: inspect.expectedInputs,
    presentInputCount: inspect.presentInputCount,
    missingInputs: inspect.missingInputs,
    admissionExecuted: inspect.admissionExecuted,
    measuredAuthorityGranted: inspect.measuredAuthorityGranted,
    attemptConsumed: inspect.attemptConsumed,
    networkAttempted: inspect.networkAttempted,
  },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  browserQualification: "not-run",
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "authority-controller-implemented-seven-inputs-missing-no-admission-authority-science-cinematic-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v367",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v365Compiler: "implemented-strict-csv-derived-no-authority-grant",
    v366Validator: "implemented-independent-recomputation-frozen-gates",
    v367AdmissionController: "implemented-explicit-identity-sha-independent-validation-fail-closed",
    v367AdmissionInput: "blocked-0-of-7-inputs-present",
    v367AdmissionExecution: "not-run-attempt-not-consumed",
    v367TestFixture: "rejected-nonpublishable-even-if-numerically-qualified",
    v367MeasuredAuthority: "unavailable-no-authority-granted",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, inspectArtifactSha256: inspect.artifactSha256, controller: pointer.capabilities.v367AdmissionController, input: pointer.capabilities.v367AdmissionInput, measuredAuthority: pointer.capabilities.v367MeasuredAuthority, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
