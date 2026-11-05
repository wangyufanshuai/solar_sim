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
  previousEvidence: "dist/science/orbit-atlas-shadow-v370-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v370.json",
  inspect: "dist/science/observation-geometry-v371/inspect.json",
  compiled: "dist/science/observation-geometry-v371/compiled.json",
  candidate: "dist/science/observation-geometry-v371/geometry.candidate.json",
  runtimeGeometry: "dist/staging/detector-calibration-v369/observation-geometry.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v371-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v371.json",
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
    "observation-geometry-pack-v370-v10-observatory-implemented-measurements-unavailable-dense-incomplete-0-of-49" ||
  previousPointer.capabilities?.v370GeometryPack !==
    "qualified-empty-five-file-content-addressed-templates" ||
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256 ||
  inspect.version !== "v371-observation-geometry-import-inspect-v1" ||
  inspect.status !== "blocked-measured-geometry-files-unavailable" ||
  inspect.expectedFiles?.join("|") !==
    "identity.json|collecting-area.csv|plate-scale.csv|provenance.json" ||
  inspect.presentFileCount !== 0 ||
  inspect.missingFiles?.length !== 4 ||
  inspect.compilerImplemented !== true ||
  inspect.compileExecuted !== false ||
  inspect.candidatePublished !== false ||
  inspect.runtimeGeometryPublished !== false ||
  inspect.measuredDataRowCount !== 0 ||
  inspect.attemptConsumed !== false ||
  inspect.networkAttempted !== false ||
  inspect.measuredGeometryAuthority !==
    "unavailable-explicit-compile-and-independent-validation-required" ||
  sha(inspect) !== inspect.artifactSha256 ||
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
  throw new Error("v371-boundary");
}

const sourcePaths = [
  "app/lib/observationGeometryCompilerV371.ts",
  "app/lib/observationGeometryCompilerV371.test.ts",
  "app/lib/observationGeometryImportV371.ts",
  "app/lib/observationGeometryImportV371.test.ts",
  "app/lib/observationGeometryImportServerV371.ts",
  "app/lib/observationGeometryImportServerV371.test.ts",
  "app/api/atlas/relativity-evidence/v371/geometry-import/route.ts",
  "app/api/atlas/relativity-evidence/v371/geometry-import/route.test.ts",
  "app/components/ObservationGeometryImportSurfaceV371.tsx",
  "app/components/ObservationGeometryImportSurfaceV371.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV371.ts",
  "app/lib/atlasShadowCapabilityPointerV371.test.ts",
  "scripts/inspect-observation-geometry-v371.ts",
  "scripts/compile-observation-geometry-v371.ts",
  "scripts/build-shadow-candidate-v371.mjs",
  "scripts/verify-shadow-v371-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));

const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v371-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "observation-geometry-import-v371-compiler-implemented-inputs-unavailable-dense-incomplete-0-of-49",
  dependency: {
    v370EvidenceSha256: previousEvidence.evidenceSha256,
    v370PointerSha256: previousPointer.pointerSha256,
    inspectArtifactSha256: inspect.artifactSha256,
  },
  import: {
    status: inspect.status,
    expectedFiles: inspect.expectedFiles,
    presentFileCount: inspect.presentFileCount,
    missingFiles: inspect.missingFiles,
    compilerImplemented: inspect.compilerImplemented,
    compileCommand: inspect.compileCommand,
    compileExecuted: inspect.compileExecuted,
    candidatePublished: inspect.candidatePublished,
    runtimeGeometryPublished: inspect.runtimeGeometryPublished,
    measuredDataRowCount: inspect.measuredDataRowCount,
    attemptConsumed: inspect.attemptConsumed,
    networkAttempted: inspect.networkAttempted,
    measuredGeometryAuthority: inspect.measuredGeometryAuthority,
  },
  publicationBoundary: {
    compiledArtifactExists: false,
    candidateArtifactExists: false,
    runtimeGeometryExists: false,
    independentScientificValidation: "not-run",
    measuredAuthorityGranted: false,
    candidateIsRuntimeAuthority: false,
    boundary:
      "explicit-compile-may-produce-candidate-only-independent-validation-and-admission-still-required",
  },
  visual: {
    profile: "science-cinematic-v10-observatory",
    runtimeConsumer: "ObservationGeometryImportSurfaceV371",
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
    "compiler-implemented-zero-inputs-zero-candidate-zero-runtime-authority-v10-manual-shadow-only",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v371",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v371Compiler: "implemented-strict-candidate-only",
    v371Input: "blocked-0-of-4",
    v371Compile: "not-run-attempt-unconsumed",
    v371Candidate: "unavailable",
    v371RuntimeGeometry: "unavailable",
    v371MeasuredAuthority: "unavailable-independent-validation-required",
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
      input: pointer.capabilities.v371Input,
      compile: pointer.capabilities.v371Compile,
      candidate: pointer.capabilities.v371Candidate,
      runtimeGeometry: pointer.capabilities.v371RuntimeGeometry,
      measuredAuthority: pointer.capabilities.v371MeasuredAuthority,
      dense: pointer.capabilities.v314CorrectedDense,
    },
    null,
    2,
  ),
);
