import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v372-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v372.json",
  inspect: "dist/science/observation-geometry-v373/inspect.json",
  admission: "dist/science/observation-geometry-v373/admission.json",
  authorityPointer: "dist/release/orbit-atlas-observation-geometry-authority-v373.json",
  validation: "dist/science/observation-geometry-v372/validation.json",
  candidate: "dist/science/observation-geometry-v371/geometry.candidate.json",
  runtimeGeometry: "dist/staging/detector-calibration-v369/observation-geometry.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v373-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v373.json",
};

const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(
              ([key]) =>
                ![
                  "generatedAt",
                  "artifactSha256",
                  "evidenceSha256",
                  "pointerSha256",
                ].includes(key),
            )
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
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

if (
  previousEvidence.status !==
    "observation-geometry-validation-v372-validator-implemented-inputs-unavailable-dense-incomplete-0-of-49" ||
  previousPointer.capabilities?.v372Validator !==
    "implemented-independent-raw-recomputation" ||
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256 ||
  inspect.version !== "v373-observation-geometry-authority-inspect-v1" ||
  inspect.status !== "blocked-admission-inputs-unavailable" ||
  inspect.expectedInputs?.join("|") !==
    "v371-compiled-artifact|v371-geometry-candidate|v372-validation-artifact|identity-json|collecting-area-csv|plate-scale-csv|provenance-json" ||
  inspect.presentInputCount !== 0 ||
  inspect.missingInputs?.length !== 7 ||
  inspect.admissionControllerImplemented !== true ||
  inspect.admissionExecuted !== false ||
  inspect.authorityPointerPublished !== false ||
  inspect.runtimeGeometryPublished !== false ||
  inspect.measuredAuthorityGranted !== false ||
  inspect.attemptConsumed !== false ||
  inspect.networkAttempted !== false ||
  inspect.automaticPromotionAllowed !== false ||
  sha(inspect) !== inspect.artifactSha256 ||
  existsSync(resolve(root, paths.admission)) ||
  existsSync(resolve(root, paths.authorityPointer)) ||
  existsSync(resolve(root, paths.validation)) ||
  existsSync(resolve(root, paths.candidate)) ||
  existsSync(resolve(root, paths.runtimeGeometry)) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" ||
  formalEvidence.contracts?.eihOnePnMutation !== "not-applied" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v373-boundary");
}

const sourcePaths = [
  "app/lib/observationGeometryAuthorityAdmissionV373.ts",
  "app/lib/observationGeometryAuthorityAdmissionV373.test.ts",
  "app/lib/observationGeometryAuthorityInspectV373.ts",
  "app/lib/observationGeometryAuthorityInspectV373.test.ts",
  "app/lib/observationGeometryAuthorityInspectServerV373.ts",
  "app/lib/observationGeometryAuthorityInspectServerV373.test.ts",
  "app/api/atlas/relativity-evidence/v373/geometry-authority/route.ts",
  "app/api/atlas/relativity-evidence/v373/geometry-authority/route.test.ts",
  "app/components/ObservationGeometryAuthoritySurfaceV373.tsx",
  "app/components/ObservationGeometryAuthoritySurfaceV373.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV373.ts",
  "app/lib/atlasShadowCapabilityPointerV373.test.ts",
  "scripts/inspect-observation-geometry-v373.ts",
  "scripts/admit-observation-geometry-v373.ts",
  "scripts/build-shadow-candidate-v373.mjs",
  "scripts/verify-shadow-v373-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));

const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v373-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "observation-geometry-authority-v373-controller-implemented-inputs-unavailable-dense-incomplete-0-of-49",
  dependency: {
    v372EvidenceSha256: previousEvidence.evidenceSha256,
    v372PointerSha256: previousPointer.pointerSha256,
    inspectArtifactSha256: inspect.artifactSha256,
  },
  admission: {
    status: inspect.status,
    expectedInputs: inspect.expectedInputs,
    presentInputCount: inspect.presentInputCount,
    missingInputs: inspect.missingInputs,
    controllerImplemented: inspect.admissionControllerImplemented,
    admissionCommand: inspect.admissionCommand,
    admissionExecuted: inspect.admissionExecuted,
    authorityPointerPublished: inspect.authorityPointerPublished,
    runtimeGeometryPublished: inspect.runtimeGeometryPublished,
    measuredAuthorityGranted: inspect.measuredAuthorityGranted,
    attemptConsumed: inspect.attemptConsumed,
    networkAttempted: inspect.networkAttempted,
    automaticPromotionAllowed: inspect.automaticPromotionAllowed,
    identityLocks: [
      "compiler-candidate-canonical-sha",
      "candidate-self-canonical-sha",
      "validation-artifact-canonical-sha",
      "validation-input-file-sha",
      "instrument-serial-or-campaign-id",
    ],
  },
  publicationBoundary: {
    admissionArtifactExists: false,
    authorityPointerExists: false,
    validationArtifactExists: false,
    candidateArtifactExists: false,
    runtimeGeometryExists: false,
    runtimeGeometryPublicationAllowed: false,
    authorityPointerIsRuntimeGeometry: false,
    measuredAuthorityGranted: false,
    boundary:
      "qualified-admission-may-sign-authority-pointer-only-runtime-publication-remains-separate",
  },
  visual: {
    profile: "science-cinematic-v10-observatory",
    runtimeConsumer: "ObservationGeometryAuthoritySurfaceV373",
    localShadowManualOnly: true,
    defaultApplied: false,
    legacyV9Default: true,
    scienceBufferMutationAllowed: false,
  },
  correctedCampaign: {
    namespace: "v314",
    status: state.status,
    completedShardCount: state.completedShardCount,
    plannedShardCount: state.plannedShardCount,
    attemptConsumed: state.attemptConsumed,
    aggregateAvailable: state.aggregateAvailable,
    stateSha256: state.stateSha256,
  },
  browserQualification: "not-run",
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerSha256: fileSha(paths.formal),
    formalProductPointerAdvanced: false,
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  boundary:
    "admission-controller-implemented-zero-inputs-zero-authority-zero-runtime-publication-v10-manual-shadow-only",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v373",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v371Compiler: "implemented-strict-candidate-only",
    v372Validator: "implemented-independent-raw-recomputation",
    v373AdmissionController: "implemented-identity-sha-validation-fail-closed",
    v373Input: "blocked-0-of-7",
    v373Admission: "not-run-attempt-unconsumed",
    v373AuthorityPointer: "unavailable",
    v373RuntimeGeometry: "unavailable-separate-publication-required",
    v373MeasuredAuthority: "unavailable-no-authority-granted",
    v370VisualProfile: "science-cinematic-v10-observatory",
    v370DefaultBoundary: "manual-local-shadow-only-default-legacy-v9",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
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
      status: pointer.status,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      controller: pointer.capabilities.v373AdmissionController,
      input: pointer.capabilities.v373Input,
      admission: pointer.capabilities.v373Admission,
      authorityPointer: pointer.capabilities.v373AuthorityPointer,
      runtimeGeometry: pointer.capabilities.v373RuntimeGeometry,
      measuredAuthority: pointer.capabilities.v373MeasuredAuthority,
      dense: pointer.capabilities.v314CorrectedDense,
    },
    null,
    2,
  ),
);
