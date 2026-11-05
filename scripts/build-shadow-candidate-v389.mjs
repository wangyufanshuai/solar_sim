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
  previousEvidence: "dist/science/orbit-atlas-shadow-v388-evidence.json",
  previousPointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v388.json",
  artifact:
    "dist/science/kerr-conditional-temperature-interval-v389/temperature-interval.json",
  csv: "dist/science/kerr-conditional-temperature-interval-v389/temperature-interval.csv",
  oracle:
    "dist/science/kerr-conditional-temperature-interval-v389/python-oracle.json",
  sourceDossier: "dist/staging/measured-authority-v382-visible/manifest.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v389-evidence.json",
  pointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v389.json",
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
const artifact = read(paths.artifact);
const oracle = read(paths.oracle);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256 ||
  previousPointer.capabilities?.v388ConditionalTemperature !==
    "qualified-12-inversions-augmented-rank-2" ||
  artifact.version !==
    "v389-kerr-conditional-temperature-exact-interval-v1" ||
  artifact.status !==
    "conditional-temperature-exact-interval-qualified-physical-systematics-unavailable" ||
  sha(artifact) !== artifact.artifactSha256 ||
  artifact.export?.csvFileSha256 !== fileSha(paths.csv) ||
  artifact.rows?.length !== 12 ||
  artifact.counts?.rayCount !== 4 ||
  artifact.counts?.bandCount !== 3 ||
  artifact.counts?.intervalCount !== 12 ||
  artifact.maxima?.conditionedTemperatureNumericalRelativeRadius >= 3e-6 ||
  artifact.maxima?.sourceModelTemperatureRelativeRadius >= 3e-6 ||
  artifact.maxima?.pythonOracleRelativeDifference >= 2e-7 ||
  artifact.algorithms?.geometryConditioning !==
    "exact-positive-interval-division-gT-over-g" ||
  artifact.algorithms?.pageThorneTemperature !==
    "exact-fourth-root-map-from-positive-flux-interval" ||
  artifact.algorithms?.intervalCombination !==
    "worst-case-endpoints-no-independence-proof-no-rss" ||
  artifact.intervalSemantics?.knownNumericalIntervalQualified !== true ||
  artifact.intervalSemantics?.sourceModelNumericalIntervalQualified !== true ||
  artifact.intervalSemantics?.confidenceInterval !== false ||
  artifact.intervalSemantics?.probabilityContentAssigned !== false ||
  artifact.intervalSemantics?.detectorCalibrationCovarianceAvailable !== false ||
  artifact.intervalSemantics?.geometryPhysicalSystematicAvailable !== false ||
  artifact.intervalSemantics?.nonPlanckSpectralSystematicAvailable !== false ||
  artifact.intervalSemantics?.absoluteScientificIntervalQualified !== false ||
  artifact.intervalSemantics?.numericalPlaceholderUsed !== false ||
  artifact.qualification?.exactNonlinearPropagationQualified !== true ||
  artifact.qualification?.absoluteTemperatureAuthorityGranted !== false ||
  artifact.qualification?.measuredAuthorityGranted !== false ||
  artifact.qualification?.observedCountsAvailable !== false ||
  artifact.qualification?.scienceImageAvailable !== false ||
  oracle.status !== "qualified-independent-exact-endpoint-interval-oracle" ||
  oracle.rows?.length !== 12 ||
  oracle.intervalCombination !==
    "worst-case-endpoints-no-independence-proof-no-rss" ||
  oracle.confidenceInterval !== false ||
  oracle.probabilityContentAssigned !== false ||
  oracle.absoluteScientificIntervalQualified !== false ||
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
  throw new Error("v389-boundary");
}

const sourcePaths = [
  "app/lib/kerrConditionalTemperatureIntervalV389.ts",
  "app/lib/kerrConditionalTemperatureIntervalV389.test.ts",
  "scripts/run-kerr-conditional-temperature-interval-oracle-v389.py",
  "scripts/build-kerr-conditional-temperature-interval-v389.ts",
  "app/lib/kerrConditionalTemperatureIntervalServerV389.ts",
  "app/lib/kerrConditionalTemperatureIntervalServerV389.test.ts",
  "app/api/atlas/relativity-evidence/v389/temperature-interval/route.ts",
  "app/api/atlas/relativity-evidence/v389/temperature-interval/route.test.ts",
  "app/components/KerrConditionalTemperatureIntervalSurfaceV389.tsx",
  "app/components/KerrConditionalTemperatureIntervalSurfaceV389.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV389.ts",
  "app/lib/atlasShadowCapabilityPointerV389.test.ts",
  "scripts/build-shadow-candidate-v389.mjs",
  "scripts/verify-shadow-v389-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({
  path,
  sha256: fileSha(path),
}));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v389-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "exact-conditional-temperature-interval-v389-qualified-absolute-authority-withheld-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v388EvidenceSha256: previousEvidence.evidenceSha256,
    v388PointerSha256: previousPointer.pointerSha256,
    intervalArtifactSha256: artifact.artifactSha256,
    intervalFileSha256: fileSha(paths.artifact),
    intervalCsvFileSha256: artifact.export.csvFileSha256,
    pythonOracleArtifactSha256: oracle.artifactSha256,
    v388ReplayArtifactSha256: artifact.source.v388ReplayArtifactSha256,
    fullShortAuthoritySha256: artifact.source.fullShortAuthoritySha256,
  },
  intervals: {
    rayCount: artifact.counts.rayCount,
    bandCount: artifact.counts.bandCount,
    intervalCount: artifact.counts.intervalCount,
    overlapCount: artifact.counts.overlapCount,
    photonToProductTemperature:
      artifact.algorithms.photonToProductTemperature,
    geometryConditioning: artifact.algorithms.geometryConditioning,
    pageThorneTemperature: artifact.algorithms.pageThorneTemperature,
    maximumPhotonRelativeRadius: artifact.maxima.photonRelativeRadius,
    maximumConditionedTemperatureNumericalRelativeRadius:
      artifact.maxima.conditionedTemperatureNumericalRelativeRadius,
    maximumSourceModelTemperatureRelativeRadius:
      artifact.maxima.sourceModelTemperatureRelativeRadius,
    maximumPythonOracleRelativeDifference:
      artifact.maxima.pythonOracleRelativeDifference,
  },
  intervalBoundary: {
    exactNonlinearPropagationQualified: true,
    conditionalTemperatureReplayQualified: true,
    combinationPolicy:
      "worst-case-endpoints-no-independence-proof-no-rss",
    confidenceInterval: false,
    probabilityContentAssigned: false,
    detectorCalibrationCovarianceAvailable: false,
    geometryPhysicalSystematicAvailable: false,
    nonPlanckSpectralSystematicAvailable: false,
    absoluteScientificIntervalQualified: false,
    numericalPlaceholderUsed: false,
    absoluteTemperatureAuthorityGranted: false,
    measuredAuthorityGranted: false,
    observedCountsAvailable: false,
    scienceImageAvailable: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
  },
  runtime: {
    profile: "science-cinematic-v11-v377",
    consumer: "KerrConditionalTemperatureIntervalSurfaceV389",
    endpoint:
      "/api/atlas/relativity-evidence/v389/temperature-interval",
    responseMaximumBytes: 128 * 1024,
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
    "exact-conditional-intervals-only-never-confidence-probability-absolute-temperature-authority-measured-authority-image-counts-or-product-promotion",
};
const evidence = {
  ...evidenceUnsigned,
  evidenceSha256: sha(evidenceUnsigned),
};
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v389",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v388ConditionalTemperature:
      "qualified-12-inversions-augmented-rank-2",
    v389ExactNonlinearInterval: "qualified-12-exact-endpoint-intervals",
    v389KnownNumericalInterval: "qualified-max-radius-below-3e-6",
    v389SourceModelInterval: "qualified-page-thorne-fourth-root",
    v389IntervalSemantics:
      "deterministic-bounds-no-confidence-no-probability-no-rss",
    v389PhysicalSystematics: "unavailable-detector-geometry-non-planck",
    v389AbsoluteTemperatureInterval: "not-qualified",
    v389MeasuredAuthority: "unavailable",
    v389RuntimeConsumer: "v11-interval-loom-wired",
    v389PromotionBoundary:
      "conditional-interval-only-zero-absolute-authority-zero-image-zero-counts",
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
      intervals: pointer.capabilities.v389ExactNonlinearInterval,
      semantics: pointer.capabilities.v389IntervalSemantics,
      absoluteAuthority:
        pointer.capabilities.v389AbsoluteTemperatureInterval,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: pointer.capabilities.browserQualification,
    },
    null,
    2,
  ),
);
