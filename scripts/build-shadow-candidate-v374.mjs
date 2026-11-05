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
  previousEvidence: "dist/science/orbit-atlas-shadow-v373-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v373.json",
  inspect: "dist/science/observation-geometry-v374/inspect.json",
  receipt: "dist/science/observation-geometry-v374/publication.json",
  authorityPointer: "dist/release/orbit-atlas-observation-geometry-authority-v373.json",
  admission: "dist/science/observation-geometry-v373/admission.json",
  validation: "dist/science/observation-geometry-v372/validation.json",
  candidate: "dist/science/observation-geometry-v371/geometry.candidate.json",
  runtimeGeometry: "dist/staging/detector-calibration-v369/observation-geometry.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v374-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v374.json",
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
    "observation-geometry-authority-v373-controller-implemented-inputs-unavailable-dense-incomplete-0-of-49" ||
  previousPointer.capabilities?.v373AdmissionController !==
    "implemented-identity-sha-validation-fail-closed" ||
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256 ||
  inspect.version !== "v374-observation-geometry-runtime-publication-inspect-v1" ||
  inspect.status !== "blocked-publication-inputs-unavailable" ||
  inspect.expectedInputs?.join("|") !==
    "v373-authority-pointer|v373-admission-artifact|v372-validation-artifact|v371-compiled-artifact|v371-geometry-candidate|identity-json|collecting-area-csv|plate-scale-csv|provenance-json" ||
  inspect.presentInputCount !== 0 ||
  inspect.missingInputs?.length !== 9 ||
  inspect.publicationControllerImplemented !== true ||
  inspect.publicationExecuted !== false ||
  inspect.runtimeGeometryPublished !== false ||
  inspect.measuredAuthorityAvailable !== false ||
  inspect.measuredExpectationAvailable !== false ||
  inspect.attemptConsumed !== false ||
  inspect.networkAttempted !== false ||
  inspect.automaticPromotionAllowed !== false ||
  sha(inspect) !== inspect.artifactSha256 ||
  existsSync(resolve(root, paths.receipt)) ||
  existsSync(resolve(root, paths.authorityPointer)) ||
  existsSync(resolve(root, paths.admission)) ||
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
  throw new Error("v374-boundary");
}

const sourcePaths = [
  "app/lib/observationGeometryRuntimePublicationV374.ts",
  "app/lib/observationGeometryRuntimePublicationV374.test.ts",
  "app/lib/observationGeometryRuntimePublicationInspectV374.ts",
  "app/lib/observationGeometryRuntimePublicationInspectV374.test.ts",
  "app/lib/observationGeometryRuntimePublicationInspectServerV374.ts",
  "app/lib/observationGeometryRuntimePublicationInspectServerV374.test.ts",
  "app/api/atlas/relativity-evidence/v374/geometry-publication/route.ts",
  "app/api/atlas/relativity-evidence/v374/geometry-publication/route.test.ts",
  "app/components/ObservationGeometryRuntimePublicationSurfaceV374.tsx",
  "app/components/ObservationGeometryRuntimePublicationSurfaceV374.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV374.ts",
  "app/lib/atlasShadowCapabilityPointerV374.test.ts",
  "scripts/inspect-observation-geometry-v374.ts",
  "scripts/publish-observation-geometry-v374.ts",
  "scripts/build-shadow-candidate-v374.mjs",
  "scripts/verify-shadow-v374-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));

const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v374-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "observation-geometry-runtime-v374-publisher-implemented-inputs-unavailable-dense-incomplete-0-of-49",
  dependency: {
    v373EvidenceSha256: previousEvidence.evidenceSha256,
    v373PointerSha256: previousPointer.pointerSha256,
    inspectArtifactSha256: inspect.artifactSha256,
  },
  publication: {
    status: inspect.status,
    expectedInputs: inspect.expectedInputs,
    presentInputCount: inspect.presentInputCount,
    missingInputs: inspect.missingInputs,
    controllerImplemented: inspect.publicationControllerImplemented,
    publicationCommand: inspect.publicationCommand,
    publicationExecuted: inspect.publicationExecuted,
    runtimeGeometryPublished: inspect.runtimeGeometryPublished,
    measuredAuthorityAvailable: inspect.measuredAuthorityAvailable,
    measuredExpectationAvailable: inspect.measuredExpectationAvailable,
    attemptConsumed: inspect.attemptConsumed,
    networkAttempted: inspect.networkAttempted,
    automaticPromotionAllowed: inspect.automaticPromotionAllowed,
    revalidation: [
      "v373-authority-pointer-canonical-sha",
      "v373-admission-canonical-and-file-sha",
      "v372-validation-canonical-and-file-sha",
      "v371-candidate-canonical-and-file-sha",
      "v371-compiler-candidate-sha",
      "identity-and-four-raw-file-sha",
    ],
  },
  runtimeBoundary: {
    publicationReceiptExists: false,
    authorityPointerExists: false,
    admissionArtifactExists: false,
    validationArtifactExists: false,
    candidateArtifactExists: false,
    runtimeGeometryExists: false,
    expectedRuntimePath:
      "dist/staging/detector-calibration-v369/observation-geometry.json",
    detectorAuthorityStillRequired: true,
    measuredExpectationAvailable: false,
    syntheticFallbackUsed: false,
    boundary:
      "runtime-geometry-alone-never-grants-detector-authority-or-measured-expectation",
  },
  visual: {
    profile: "science-cinematic-v10-observatory",
    runtimeConsumer: "ObservationGeometryRuntimePublicationSurfaceV374",
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
    "runtime-publisher-implemented-zero-inputs-zero-publication-zero-expectation-v10-manual-shadow-only",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v374",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v373AdmissionController: "implemented-identity-sha-validation-fail-closed",
    v374Publisher: "implemented-nine-input-authority-revalidation",
    v374Input: "blocked-0-of-9",
    v374Publication: "not-run-attempt-unconsumed",
    v374RuntimeGeometry: "unavailable",
    v374MeasuredAuthority: "unavailable-no-v373-authority-pointer",
    v374MeasuredExpectation:
      "unavailable-detector-and-geometry-authority-required",
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
      publisher: pointer.capabilities.v374Publisher,
      input: pointer.capabilities.v374Input,
      publication: pointer.capabilities.v374Publication,
      runtimeGeometry: pointer.capabilities.v374RuntimeGeometry,
      measuredAuthority: pointer.capabilities.v374MeasuredAuthority,
      measuredExpectation: pointer.capabilities.v374MeasuredExpectation,
      dense: pointer.capabilities.v314CorrectedDense,
    },
    null,
    2,
  ),
);
