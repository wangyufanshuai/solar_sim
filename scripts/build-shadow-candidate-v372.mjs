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
  previousEvidence: "dist/science/orbit-atlas-shadow-v371-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v371.json",
  inspect: "dist/science/observation-geometry-v372/inspect.json",
  validation: "dist/science/observation-geometry-v372/validation.json",
  compiled: "dist/science/observation-geometry-v371/compiled.json",
  candidate: "dist/science/observation-geometry-v371/geometry.candidate.json",
  runtimeGeometry: "dist/staging/detector-calibration-v369/observation-geometry.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v372-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v372.json",
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
    "observation-geometry-import-v371-compiler-implemented-inputs-unavailable-dense-incomplete-0-of-49" ||
  previousPointer.capabilities?.v371Compiler !== "implemented-strict-candidate-only" ||
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256 ||
  inspect.version !== "v372-independent-observation-geometry-validation-inspect-v1" ||
  inspect.status !== "blocked-validation-inputs-unavailable" ||
  inspect.expectedInputs?.join("|") !==
    "v371-compiled-artifact|v371-geometry-candidate|identity-json|collecting-area-csv|plate-scale-csv|provenance-json" ||
  inspect.presentInputCount !== 0 ||
  inspect.missingInputs?.length !== 6 ||
  inspect.validatorImplemented !== true ||
  inspect.validationExecuted !== false ||
  inspect.measuredValidationQualified !== false ||
  inspect.runtimeGeometryPublished !== false ||
  inspect.measuredAuthorityGranted !== false ||
  inspect.attemptConsumed !== false ||
  inspect.networkAttempted !== false ||
  sha(inspect) !== inspect.artifactSha256 ||
  existsSync(resolve(root, paths.validation)) ||
  existsSync(resolve(root, paths.compiled)) ||
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
  throw new Error("v372-boundary");
}

const sourcePaths = [
  "app/lib/observationGeometryValidationV372.ts",
  "app/lib/observationGeometryValidationV372.test.ts",
  "app/lib/observationGeometryValidationInspectV372.ts",
  "app/lib/observationGeometryValidationInspectV372.test.ts",
  "app/lib/observationGeometryValidationInspectServerV372.ts",
  "app/lib/observationGeometryValidationInspectServerV372.test.ts",
  "app/api/atlas/relativity-evidence/v372/geometry-validation/route.ts",
  "app/api/atlas/relativity-evidence/v372/geometry-validation/route.test.ts",
  "app/components/ObservationGeometryValidationSurfaceV372.tsx",
  "app/components/ObservationGeometryValidationSurfaceV372.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV372.ts",
  "app/lib/atlasShadowCapabilityPointerV372.test.ts",
  "scripts/inspect-observation-geometry-v372.ts",
  "scripts/validate-observation-geometry-v372.ts",
  "scripts/build-shadow-candidate-v372.mjs",
  "scripts/verify-shadow-v372-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));

const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v372-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "observation-geometry-validation-v372-validator-implemented-inputs-unavailable-dense-incomplete-0-of-49",
  dependency: {
    v371EvidenceSha256: previousEvidence.evidenceSha256,
    v371PointerSha256: previousPointer.pointerSha256,
    inspectArtifactSha256: inspect.artifactSha256,
  },
  validation: {
    status: inspect.status,
    expectedInputs: inspect.expectedInputs,
    presentInputCount: inspect.presentInputCount,
    missingInputs: inspect.missingInputs,
    validatorImplemented: inspect.validatorImplemented,
    validationCommand: inspect.validationCommand,
    validationExecuted: inspect.validationExecuted,
    measuredValidationQualified: inspect.measuredValidationQualified,
    runtimeGeometryPublished: inspect.runtimeGeometryPublished,
    measuredAuthorityGranted: inspect.measuredAuthorityGranted,
    attemptConsumed: inspect.attemptConsumed,
    networkAttempted: inspect.networkAttempted,
    independentRecomputation: {
      source: "raw-identity-area-scale-provenance",
      compilerDerivedValuesTrusted: false,
      collectingArea: "recomputed-from-repeat-rows",
      pixelSolidAngle: "recomputed-from-angle-and-pixel-separation",
      repeatabilityAndResiduals: "recomputed-with-frozen-gates",
      candidateCanonicalShaRequired: true,
    },
  },
  publicationBoundary: {
    validationArtifactExists: false,
    compiledArtifactExists: false,
    candidateArtifactExists: false,
    runtimeGeometryExists: false,
    explicitAdmissionImplemented: false,
    measuredAuthorityGranted: false,
    validationIsAuthority: false,
    boundary:
      "independent-validation-result-still-requires-separate-explicit-admission-before-runtime-publication",
  },
  visual: {
    profile: "science-cinematic-v10-observatory",
    runtimeConsumer: "ObservationGeometryValidationSurfaceV372",
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
    "validator-implemented-zero-inputs-zero-validation-zero-runtime-authority-v10-manual-shadow-only",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v372",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v371Compiler: "implemented-strict-candidate-only",
    v371Input: "blocked-0-of-4",
    v372Validator: "implemented-independent-raw-recomputation",
    v372Input: "blocked-0-of-6",
    v372Validation: "not-run-attempt-unconsumed",
    v372MeasuredValidation: "unavailable",
    v372RuntimeGeometry: "unavailable",
    v372MeasuredAuthority: "unavailable-explicit-admission-required",
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
      validator: pointer.capabilities.v372Validator,
      input: pointer.capabilities.v372Input,
      validation: pointer.capabilities.v372Validation,
      measuredValidation: pointer.capabilities.v372MeasuredValidation,
      measuredAuthority: pointer.capabilities.v372MeasuredAuthority,
      dense: pointer.capabilities.v314CorrectedDense,
    },
    null,
    2,
  ),
);
