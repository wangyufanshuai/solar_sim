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
  previousEvidence: "dist/science/orbit-atlas-shadow-v383-evidence.json",
  previousPointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v383.json",
  observable:
    "dist/science/measured-visible-photon-observable-v384/observable.json",
  csv: "dist/science/measured-visible-photon-observable-v384/observable.csv",
  oracle:
    "dist/science/measured-visible-photon-observable-v384/python-oracle.json",
  sourceDossier: "dist/staging/measured-authority-v382-visible/manifest.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v384-evidence.json",
  pointer:
    "dist/release/orbit-atlas-current-local-shadow-candidate-v384.json",
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
const observable = read(paths.observable);
const oracle = read(paths.oracle);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !==
    previousEvidence.evidenceSha256 ||
  previousPointer.capabilities?.v383DualImplementation !==
    "qualified-typescript-float64-vs-python-decimal50" ||
  observable.version !==
    "v384-visible-throughput-weighted-photon-observable-v1" ||
  observable.status !==
    "throughput-weighted-visible-photon-observable-qualified-dual-domain-electron-authority-withheld" ||
  sha(observable) !== observable.artifactSha256 ||
  observable.export?.csvFileSha256 !== fileSha(paths.csv) ||
  observable.rows?.length !== 4 ||
  observable.maxima?.unweightedReconstructionRelativeDifference >= 1e-7 ||
  observable.maxima?.pythonOracleRelativeDifference >= 1e-7 ||
  observable.algorithms?.integrationDomainIndependent !== true ||
  observable.algorithms?.parserIndependent !== true ||
  observable.authorityBoundary?.photonObservableQualified !== true ||
  observable.authorityBoundary?.detectorElectronExpectationAvailable !== false ||
  observable.authorityBoundary?.sourceDossierAvailable !== false ||
  observable.authorityBoundary?.observationGeometryAuthorityAvailable !== false ||
  observable.authorityBoundary?.visibleMeasuredAuthorityGranted !== false ||
  observable.authorityBoundary?.observedCountsAvailable !== false ||
  observable.authorityBoundary?.scienceImageAvailable !== false ||
  observable.authorityBoundary?.runtimePackagingAllowed !== false ||
  oracle.status !== "qualified-independent-frequency-domain-simpson-oracle" ||
  oracle.electronExpectationAvailable !== false ||
  oracle.observedCountsAvailable !== false ||
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
  throw new Error("v384-boundary");
}

const sourcePaths = [
  "app/lib/measuredVisiblePhotonObservableV384.ts",
  "app/lib/measuredVisiblePhotonObservableV384.test.ts",
  "scripts/run-measured-visible-photon-oracle-v384.py",
  "scripts/build-measured-visible-photon-observable-v384.ts",
  "app/lib/measuredVisiblePhotonObservableServerV384.ts",
  "app/lib/measuredVisiblePhotonObservableServerV384.test.ts",
  "app/api/atlas/relativity-evidence/v384/visible-photon-observable/route.ts",
  "app/api/atlas/relativity-evidence/v384/visible-photon-observable/route.test.ts",
  "app/components/MeasuredVisiblePhotonObservableSurfaceV384.tsx",
  "app/components/MeasuredVisiblePhotonObservableSurfaceV384.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV384.ts",
  "app/lib/atlasShadowCapabilityPointerV384.test.ts",
  "scripts/build-shadow-candidate-v384.mjs",
  "scripts/verify-shadow-v384-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({
  path,
  sha256: fileSha(path),
}));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v384-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "visible-photon-v384-dual-domain-qualified-electron-authority-withheld-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v383EvidenceSha256: previousEvidence.evidenceSha256,
    v383PointerSha256: previousPointer.pointerSha256,
    observableArtifactSha256: observable.artifactSha256,
    observableFileSha256: fileSha(paths.observable),
    observableCsvFileSha256: observable.export.csvFileSha256,
    pythonOracleArtifactSha256: oracle.artifactSha256,
    v328PhotonArtifactSha256: observable.source.v328PhotonArtifactSha256,
    v383ThroughputArtifactSha256:
      observable.source.v383ThroughputArtifactSha256,
  },
  observable: {
    rowCount: observable.rows.length,
    units: observable.units.photonObservable,
    operator: observable.operator,
    effectiveThroughputMinimum: Math.min(
      ...observable.rows.map((row) => row.effectiveBandThroughput),
    ),
    effectiveThroughputMaximum: Math.max(
      ...observable.rows.map((row) => row.effectiveBandThroughput),
    ),
    maximumUnweightedReconstructionRelativeDifference:
      observable.maxima.unweightedReconstructionRelativeDifference,
    maximumPythonOracleRelativeDifference:
      observable.maxima.pythonOracleRelativeDifference,
    integrationDomainIndependent:
      observable.algorithms.integrationDomainIndependent,
    parserIndependent: observable.algorithms.parserIndependent,
    deterministicReplay: observable.algorithms.deterministicReplay,
  },
  boundary: {
    photonObservableQualified: true,
    detectorElectronExpectationAvailable: false,
    sourceDossierAvailable: false,
    detectorNoiseAuthorityAvailable: false,
    observationGeometryAuthorityAvailable: false,
    visibleMeasuredAuthorityGranted: false,
    measuredBandAuthorityCount: 0,
    v375EnvelopeAvailable: false,
    v376ScienceImageAvailable: false,
    observedCountsAvailable: false,
    scienceImageAvailable: false,
    runtimePackagingAllowed: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
  },
  runtime: {
    profile: "science-cinematic-v11-v377",
    consumer: "MeasuredVisiblePhotonObservableSurfaceV384",
    endpoint:
      "/api/atlas/relativity-evidence/v384/visible-photon-observable",
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
    "throughput-weighted-photon-observable-only-never-electron-expectation-image-observed-counts-runtime-package-or-product-promotion",
};
const evidence = {
  ...evidenceUnsigned,
  evidenceSha256: sha(evidenceUnsigned),
};
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v384",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v383NormalizedProfile:
      "qualified-3301-rows-400-to-700-nm-no-interpolation",
    v384PhotonObservable: "qualified-four-authority-disk-rays",
    v384DualDomainIntegration:
      "qualified-wavelength-trapezoid-vs-frequency-simpson",
    v384ElectronExpectation:
      "unavailable-no-detector-or-geometry-authority",
    v384ObservedCounts: "unavailable-expectation-boundary",
    v384SourceDossier: "incomplete-1-of-7",
    v384MeasuredBandAuthorities: "missing-0-of-3-present",
    v384RuntimeConsumer: "v11-photon-integrating-sphere-wired",
    v384PromotionBoundary:
      "photon-only-zero-electrons-zero-image-zero-observed-counts",
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
      photonObservable: pointer.capabilities.v384PhotonObservable,
      dualDomain: pointer.capabilities.v384DualDomainIntegration,
      electrons: pointer.capabilities.v384ElectronExpectation,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: pointer.capabilities.browserQualification,
    },
    null,
    2,
  ),
);
