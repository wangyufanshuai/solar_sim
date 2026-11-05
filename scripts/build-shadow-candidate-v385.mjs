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
  previousEvidence: "dist/science/orbit-atlas-shadow-v384-evidence.json",
  previousPointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v384.json",
  budget:
    "dist/science/measured-visible-photon-error-budget-v385/error-budget.json",
  csv: "dist/science/measured-visible-photon-error-budget-v385/error-budget.csv",
  oracle:
    "dist/science/measured-visible-photon-error-budget-v385/python-oracle.json",
  sourceDossier: "dist/staging/measured-authority-v382-visible/manifest.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v385-evidence.json",
  pointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v385.json",
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
const budget = read(paths.budget);
const oracle = read(paths.oracle);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !==
    previousEvidence.evidenceSha256 ||
  previousPointer.capabilities?.v384PhotonObservable !==
    "qualified-four-authority-disk-rays" ||
  budget.version !== "v385-visible-photon-error-budget-v1" ||
  budget.status !==
    "computational-error-budget-qualified-scientific-systematics-unavailable" ||
  sha(budget) !== budget.artifactSha256 ||
  budget.export?.csvFileSha256 !== fileSha(paths.csv) ||
  budget.rows?.length !== 4 ||
  budget.maxima?.knownComputationalUpperBoundRelative >= 2e-7 ||
  budget.maxima?.pythonOracleRelativeDifference >= 1e-15 ||
  budget.combination?.rule !== "linear-sum-no-independence-proof" ||
  budget.combination?.rssApplied !== false ||
  budget.combination?.unknownSystematicsTreatedAsZero !== false ||
  budget.combination?.knownComputationalIntervalIsConfidenceInterval !== false ||
  budget.qualification?.computationalBudgetQualified !== true ||
  budget.qualification?.absoluteScientificBudgetQualified !== false ||
  budget.qualification?.throughputCalibrationSystematicAvailable !== false ||
  budget.qualification?.sourceModelSystematicAvailable !== false ||
  budget.qualification?.measuredAuthorityGranted !== false ||
  budget.qualification?.observedCountsAvailable !== false ||
  budget.qualification?.scienceImageAvailable !== false ||
  oracle.status !== "qualified-independent-decimal-linear-budget-oracle" ||
  oracle.rssApplied !== false ||
  oracle.unknownSystematicsTreatedAsZero !== false ||
  oracle.absoluteScientificBudgetQualified !== false ||
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
  throw new Error("v385-boundary");
}

const sourcePaths = [
  "app/lib/measuredVisiblePhotonErrorBudgetV385.ts",
  "app/lib/measuredVisiblePhotonErrorBudgetV385.test.ts",
  "scripts/run-measured-visible-photon-error-budget-oracle-v385.py",
  "scripts/build-measured-visible-photon-error-budget-v385.ts",
  "app/lib/measuredVisiblePhotonErrorBudgetServerV385.ts",
  "app/lib/measuredVisiblePhotonErrorBudgetServerV385.test.ts",
  "app/api/atlas/relativity-evidence/v385/visible-photon-error-budget/route.ts",
  "app/api/atlas/relativity-evidence/v385/visible-photon-error-budget/route.test.ts",
  "app/components/MeasuredVisiblePhotonErrorBudgetSurfaceV385.tsx",
  "app/components/MeasuredVisiblePhotonErrorBudgetSurfaceV385.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV385.ts",
  "app/lib/atlasShadowCapabilityPointerV385.test.ts",
  "scripts/build-shadow-candidate-v385.mjs",
  "scripts/verify-shadow-v385-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({
  path,
  sha256: fileSha(path),
}));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v385-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "photon-error-budget-v385-computational-qualified-scientific-systematics-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v384EvidenceSha256: previousEvidence.evidenceSha256,
    v384PointerSha256: previousPointer.pointerSha256,
    budgetArtifactSha256: budget.artifactSha256,
    budgetFileSha256: fileSha(paths.budget),
    budgetCsvFileSha256: budget.export.csvFileSha256,
    pythonOracleArtifactSha256: oracle.artifactSha256,
    v384ObservableArtifactSha256:
      budget.source.v384ObservableArtifactSha256,
  },
  budget: {
    rayCount: budget.rows.length,
    quantifiedComponentCountPerRay: 4,
    unavailableSystematicCountPerRay: 2,
    maximumKnownComputationalUpperBoundRelative:
      budget.maxima.knownComputationalUpperBoundRelative,
    maximumPythonOracleRelativeDifference:
      budget.maxima.pythonOracleRelativeDifference,
    combinationRule: budget.combination.rule,
    rssApplied: budget.combination.rssApplied,
    unknownSystematicsTreatedAsZero:
      budget.combination.unknownSystematicsTreatedAsZero,
    knownComputationalIntervalIsConfidenceInterval:
      budget.combination.knownComputationalIntervalIsConfidenceInterval,
  },
  boundary: {
    computationalBudgetQualified: true,
    absoluteScientificBudgetQualified: false,
    throughputCalibrationSystematicAvailable: false,
    sourceModelSystematicAvailable: false,
    detectorElectronBudgetApplicable: false,
    measuredAuthorityGranted: false,
    v375EnvelopeAvailable: false,
    v376ScienceImageAvailable: false,
    observedCountsAvailable: false,
    scienceImageAvailable: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
  },
  runtime: {
    profile: "science-cinematic-v11-v377",
    consumer: "MeasuredVisiblePhotonErrorBudgetSurfaceV385",
    endpoint:
      "/api/atlas/relativity-evidence/v385/visible-photon-error-budget",
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
    "computational-error-budget-only-never-absolute-scientific-uncertainty-electron-expectation-image-observed-counts-or-product-promotion",
};
const evidence = {
  ...evidenceUnsigned,
  evidenceSha256: sha(evidenceUnsigned),
};
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v385",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v384PhotonObservable: "qualified-four-authority-disk-rays",
    v385ComputationalBudget: "qualified-four-components-linear-upper-bound",
    v385ScientificSystematics: "unavailable-two-of-two",
    v385CombinationRule: "linear-sum-rss-prohibited-unknown-not-zero",
    v385AbsoluteScientificBudget: "not-qualified",
    v385ElectronExpectation: "unavailable",
    v385ObservedCounts: "unavailable",
    v385RuntimeConsumer: "v11-uncertainty-breaker-ladder-wired",
    v385PromotionBoundary:
      "computational-only-zero-authority-zero-image-zero-counts",
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
      computationalBudget: pointer.capabilities.v385ComputationalBudget,
      scientificSystematics: pointer.capabilities.v385ScientificSystematics,
      combination: pointer.capabilities.v385CombinationRule,
      absoluteBudget: pointer.capabilities.v385AbsoluteScientificBudget,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: pointer.capabilities.browserQualification,
    },
    null,
    2,
  ),
);
