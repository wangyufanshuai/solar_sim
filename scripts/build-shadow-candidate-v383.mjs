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
  previousEvidence: "dist/science/orbit-atlas-shadow-v382r1-evidence.json",
  previousPointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v382r1.json",
  manifest: "dist/science/measured-visible-throughput-v383/manifest.json",
  profile: "dist/science/measured-visible-throughput-v383/profile.csv",
  oracle: "dist/science/measured-visible-throughput-v383/python-oracle.json",
  sourceDossier: "dist/staging/measured-authority-v382-visible/manifest.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v383-evidence.json",
  pointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v383.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path));
const fileSha = (path) =>
  createHash("sha256").update(bytes(path)).digest("hex");
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
  createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const manifest = read(paths.manifest);
const oracle = read(paths.oracle);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !==
    previousEvidence.evidenceSha256 ||
  previousPointer.capabilities?.v382r1SourceDossier !== "incomplete-1-of-7" ||
  manifest.version !== "v383-visible-throughput-normalization-v1" ||
  manifest.status !==
    "visible-throughput-candidate-qualified-dual-implementation-authority-withheld-source-dossier-incomplete" ||
  sha(manifest) !== manifest.artifactSha256 ||
  manifest.normalizedProfile?.fileSha256 !== fileSha(paths.profile) ||
  manifest.normalizedProfile?.metrics?.rowCount !== 3301 ||
  manifest.normalizedProfile?.metrics?.interpolationApplied !== false ||
  manifest.dualImplementation?.qualified !== true ||
  manifest.dualImplementation?.maximumMetricRelativeDifference >= 1e-12 ||
  manifest.dualImplementation?.sourceRowCanonicalSha256 === "" ||
  manifest.normalizedProfile?.sourceRowCanonicalSha256 !==
    oracle.sourceRowCanonicalSha256 ||
  manifest.authorityBoundary?.normalizedCandidateQualified !== true ||
  manifest.authorityBoundary?.sourceDossierAvailable !== false ||
  manifest.authorityBoundary?.detectorNoiseAuthorityAvailable !== false ||
  manifest.authorityBoundary?.observationGeometryAuthorityAvailable !== false ||
  manifest.authorityBoundary?.visibleMeasuredAuthorityGranted !== false ||
  manifest.authorityBoundary?.observedCountsAvailable !== false ||
  manifest.authorityBoundary?.runtimePackagingAllowed !== false ||
  manifest.networkAttempted !== false ||
  manifest.automaticRetryApplied !== false ||
  oracle.status !== "qualified-independent-xml-decimal-oracle" ||
  oracle.authorityGranted !== false ||
  existsSync(resolve(root, paths.sourceDossier)) ||
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
  throw new Error("v383-boundary");
}

const sourcePaths = [
  "app/lib/measuredVisibleThroughputV383.ts",
  "app/lib/measuredVisibleThroughputV383.test.ts",
  "scripts/run-measured-visible-throughput-oracle-v383.py",
  "scripts/build-measured-visible-throughput-v383.ts",
  "app/lib/measuredVisibleThroughputServerV383.ts",
  "app/lib/measuredVisibleThroughputServerV383.test.ts",
  "app/api/atlas/relativity-evidence/v383/visible-throughput/route.ts",
  "app/api/atlas/relativity-evidence/v383/visible-throughput/route.test.ts",
  "app/components/MeasuredVisibleThroughputSurfaceV383.tsx",
  "app/components/MeasuredVisibleThroughputSurfaceV383.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV383.ts",
  "app/lib/atlasShadowCapabilityPointerV383.test.ts",
  "scripts/build-shadow-candidate-v383.mjs",
  "scripts/verify-shadow-v383-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({
  path,
  sha256: fileSha(path),
}));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v383-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "visible-throughput-v383-dual-implementation-qualified-candidate-only-authority-withheld-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v382r1EvidenceSha256: previousEvidence.evidenceSha256,
    v382r1PointerSha256: previousPointer.pointerSha256,
    throughputArtifactSha256: manifest.artifactSha256,
    throughputManifestFileSha256: fileSha(paths.manifest),
    normalizedProfileFileSha256: manifest.normalizedProfile.fileSha256,
    pythonOracleArtifactSha256: oracle.artifactSha256,
    sourceRowCanonicalSha256:
      manifest.normalizedProfile.sourceRowCanonicalSha256,
  },
  normalization: {
    candidate: "HST/WFC3_UVIS1.F350LP",
    lowerWavelengthM: manifest.candidate.lowerWavelengthM,
    upperWavelengthM: manifest.candidate.upperWavelengthM,
    rowCount: manifest.candidate.rowCount,
    interpolationApplied:
      manifest.normalizedProfile.metrics.interpolationApplied,
    equivalentWidthAngstrom:
      manifest.normalizedProfile.metrics.equivalentWidthAngstrom,
    meanThroughput: manifest.normalizedProfile.metrics.meanThroughput,
    throughputWeightedMeanWavelengthAngstrom:
      manifest.normalizedProfile.metrics
        .throughputWeightedMeanWavelengthAngstrom,
    pivotWavelengthAngstrom:
      manifest.normalizedProfile.metrics.pivotWavelengthAngstrom,
    maximumMetricRelativeDifference:
      manifest.dualImplementation.maximumMetricRelativeDifference,
    relativeDifferenceLimit:
      manifest.dualImplementation.relativeDifferenceLimit,
    parserImplementationIndependent:
      manifest.dualImplementation.parserImplementationIndependent,
    arithmeticImplementationIndependent:
      manifest.dualImplementation.arithmeticImplementationIndependent,
    sourceRowCanonicalShaMatched:
      manifest.dualImplementation.sourceRowCanonicalShaMatched,
  },
  boundary: {
    normalizedCandidateQualified: true,
    sourceDossierAvailable: false,
    detectorNoiseAuthorityAvailable: false,
    observationGeometryAuthorityAvailable: false,
    visibleMeasuredAuthorityGranted: false,
    measuredBandAuthorityCount: 0,
    v375EnvelopeAvailable: false,
    v376ScienceImageAvailable: false,
    observedCountsAvailable: false,
    runtimePackagingAllowed: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
  },
  runtime: {
    profile: "science-cinematic-v11-v377",
    consumer: "MeasuredVisibleThroughputSurfaceV383",
    endpoint: "/api/atlas/relativity-evidence/v383/visible-throughput",
    responseMaximumBytes: 128 * 1024,
    fullProfileInReactState: false,
    noStore: true,
    localShadowOnly: true,
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
  networkAttempted: false,
  automaticRetryApplied: false,
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
  releaseBoundary:
    "dual-implementation-throughput-normalization-candidate-only-never-detector-or-geometry-authority-expectation-image-observed-counts-runtime-package-or-product-promotion",
};
const evidence = {
  ...evidenceUnsigned,
  evidenceSha256: sha(evidenceUnsigned),
};
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v383",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v382r1RecoveredSource: "qualified-svo-f350lp-offline-1-of-7",
    v382r1SourceDossier: "incomplete-1-of-7",
    v383NormalizedProfile:
      "qualified-3301-rows-400-to-700-nm-no-interpolation",
    v383DualImplementation:
      "qualified-typescript-float64-vs-python-decimal50",
    v383SourceRowIdentity: "qualified-canonical-sha-identical",
    v383VisibleMeasuredAuthority:
      "withheld-no-noise-or-geometry-authority",
    v383MeasuredBandAuthorities: "missing-0-of-3-present",
    v383RuntimeConsumer: "v11-dual-path-spectrophotometer-wired",
    v383PromotionBoundary: "candidate-only-zero-image-zero-observed-counts",
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
const pointer = {
  ...pointerUnsigned,
  pointerSha256: sha(pointerUnsigned),
};
atomic(paths.pointer, pointer);
console.log(
  JSON.stringify(
    {
      status: pointer.status,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      normalizedProfile: pointer.capabilities.v383NormalizedProfile,
      dualImplementation: pointer.capabilities.v383DualImplementation,
      measuredAuthority: pointer.capabilities.v383VisibleMeasuredAuthority,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: pointer.capabilities.browserQualification,
    },
    null,
    2,
  ),
);
