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
  previousEvidence: "dist/science/orbit-atlas-shadow-v375-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v375.json",
  inspect: "dist/science/expected-electron-image-v376/inspect.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v376-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v376.json",
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
    "measured-expectation-v375-dual-authority-builder-implemented-inputs-partial-1-of-8-dense-incomplete-0-of-49" ||
  previousPointer.capabilities?.v375MeasuredExpectation !== "unavailable-0-of-12" ||
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256 ||
  inspect.version !== "v376-expected-electron-science-image-inspect-v1" ||
  inspect.status !== "blocked-envelope-unavailable" ||
  inspect.presentInputCount !== 0 ||
  inspect.missingInputs?.join("|") !== "v375-dual-authority-envelope" ||
  inspect.compilerImplemented !== true ||
  inspect.buildExecuted !== false ||
  inspect.imageAvailable !== false ||
  inspect.jsonPublished !== false ||
  inspect.csvPublished !== false ||
  inspect.zeroImageFallbackUsed !== false ||
  inspect.observedCountsAvailable !== false ||
  inspect.attemptConsumed !== false ||
  inspect.networkAttempted !== false ||
  sha(inspect) !== inspect.artifactSha256 ||
  existsSync(resolve(root, paths.envelope)) ||
  existsSync(resolve(root, paths.imageJson)) ||
  existsSync(resolve(root, paths.imageCsv)) ||
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
  throw new Error("v376-boundary");
}

const sourcePaths = [
  "app/lib/expectedElectronScienceImageV376.ts",
  "app/lib/expectedElectronScienceImageV376.test.ts",
  "app/lib/expectedElectronScienceImageInspectV376.ts",
  "app/lib/expectedElectronScienceImageInspectV376.test.ts",
  "app/lib/expectedElectronScienceImageInspectServerV376.ts",
  "app/lib/expectedElectronScienceImageInspectServerV376.test.ts",
  "app/api/atlas/relativity-evidence/v376/expected-electron-image/route.ts",
  "app/api/atlas/relativity-evidence/v376/expected-electron-image/route.test.ts",
  "app/components/ExpectedElectronScienceImageSurfaceV376.tsx",
  "app/components/ExpectedElectronScienceImageSurfaceV376.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV376.ts",
  "app/lib/atlasShadowCapabilityPointerV376.test.ts",
  "scripts/inspect-expected-electron-image-v376.ts",
  "scripts/build-expected-electron-image-v376.ts",
  "scripts/build-shadow-candidate-v376.mjs",
  "scripts/verify-shadow-v376-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v376-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "expected-electron-image-v376-compiler-implemented-envelope-unavailable-dense-incomplete-0-of-49",
  dependency: {
    v375EvidenceSha256: previousEvidence.evidenceSha256,
    v375PointerSha256: previousPointer.pointerSha256,
    inspectArtifactSha256: inspect.artifactSha256,
  },
  image: {
    status: inspect.status,
    expectedInput: inspect.expectedInput,
    presentInputCount: inspect.presentInputCount,
    missingInputs: inspect.missingInputs,
    compilerImplemented: inspect.compilerImplemented,
    buildCommand: inspect.buildCommand,
    buildExecuted: inspect.buildExecuted,
    imageAvailable: inspect.imageAvailable,
    jsonPublished: inspect.jsonPublished,
    csvPublished: inspect.csvPublished,
    zeroImageFallbackUsed: inspect.zeroImageFallbackUsed,
    observedCountsAvailable: inspect.observedCountsAvailable,
    attemptConsumed: inspect.attemptConsumed,
    networkAttempted: inspect.networkAttempted,
    plannedGrid: { rows: 4, columns: 3, cells: 12 },
    plannedLayers: [
      "source-electron-expectation",
      "dark-electron-expectation",
      "background-electron-expectation",
      "read-noise-variance",
      "total-electron-expectation",
      "expected-adu",
      "variance",
      "standard-deviation",
    ],
    conservationLimit: 1e-15,
  },
  displayBoundary: {
    transform: "identity-linear-float64-no-normalization",
    imageArraysExist: false,
    zeroImageFallbackAllowed: false,
    cinematicCopyAllowed: false,
    observedCountsAvailable: false,
    sciencePayloadMutationAllowed: false,
  },
  visual: {
    profile: "science-cinematic-v10-observatory",
    runtimeConsumer: "ExpectedElectronScienceImageSurfaceV376",
    localShadowManualOnly: true,
    defaultApplied: false,
    legacyV9Default: true,
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
    "compiler-implemented-envelope-missing-no-pixels-no-zero-fallback-no-observed-counts-v10-manual-shadow-only",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v376",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v375DualAuthorityEnvelope: "unavailable",
    v376Compiler: "implemented-4x3-float64-eight-layer-conservative",
    v376Input: "blocked-0-of-1",
    v376Build: "not-run-attempt-unconsumed",
    v376ScienceImage: "unavailable-no-pixel-arrays",
    v376JsonCsv: "unavailable",
    v376ZeroImageFallback: "disabled",
    v376ObservedCounts: "unavailable-expectation-is-not-observation",
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
      compiler: pointer.capabilities.v376Compiler,
      input: pointer.capabilities.v376Input,
      image: pointer.capabilities.v376ScienceImage,
      jsonCsv: pointer.capabilities.v376JsonCsv,
      zeroFallback: pointer.capabilities.v376ZeroImageFallback,
      observedCounts: pointer.capabilities.v376ObservedCounts,
      dense: pointer.capabilities.v314CorrectedDense,
    },
    null,
    2,
  ),
);
