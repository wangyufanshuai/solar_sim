import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v387-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v387.json",
  artifact: "dist/science/kerr-geometry-conditioned-temperature-v388/temperature-replay.json",
  csv: "dist/science/kerr-geometry-conditioned-temperature-v388/temperature-replay.csv",
  oracle: "dist/science/kerr-geometry-conditioned-temperature-v388/python-oracle.json",
  sourceDossier: "dist/staging/measured-authority-v382-visible/manifest.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v388-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v388.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize)
  : !value || typeof value !== "object" ? value
    : Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const oracle = read(paths.oracle);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence)
  || previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256
  || previousPointer.capabilities?.v387ThreeBandIdentifiability !== "qualified-12-measurements-global-rank-1"
  || artifact.version !== "v388-kerr-geometry-conditioned-temperature-v1"
  || artifact.status !== "geometry-conditioned-temperature-replay-qualified-absolute-authority-withheld"
  || sha(artifact) !== artifact.artifactSha256
  || artifact.export?.csvFileSha256 !== fileSha(paths.csv)
  || artifact.rows?.length !== 12
  || artifact.identifiability?.spectralOnlyRank !== 1
  || artifact.identifiability?.geometryConditionedRank !== 2
  || artifact.maxima?.temperatureReplayRelativeDifference >= 2e-6
  || artifact.maxima?.knownNumericalUpperBoundRelative >= 2e-6
  || artifact.maxima?.pythonOracleRelativeDifference >= 2e-7
  || artifact.uncertainty?.combinationPolicy !== "linear-sum-no-independence-proof-no-rss"
  || artifact.uncertainty?.knownNumericalBudgetQualified !== true
  || artifact.uncertainty?.absoluteTemperatureUncertaintyQualified !== false
  || artifact.uncertainty?.numericalPlaceholderUsed !== false
  || artifact.qualification?.conditionalTemperatureReplayQualified !== true
  || artifact.qualification?.augmentedIdentifiabilityQualified !== true
  || artifact.qualification?.absoluteTemperatureAuthorityGranted !== false
  || artifact.qualification?.measuredAuthorityGranted !== false
  || artifact.qualification?.observedCountsAvailable !== false
  || artifact.qualification?.scienceImageAvailable !== false
  || oracle.status !== "qualified-independent-geometry-conditioned-root-oracle"
  || oracle.spectralOnlyRank !== 1 || oracle.geometryConditionedRank !== 2
  || oracle.absoluteTemperatureAuthorityGranted !== false
  || existsSync(resolve(root, paths.sourceDossier))
  || existsSync(resolve(root, paths.envelope))
  || existsSync(resolve(root, paths.imageJson))
  || existsSync(resolve(root, paths.imageCsv))
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0
  || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied"
  || formalEvidence.contracts?.eihOnePnMutation !== "not-applied"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v388-boundary");

const sourcePaths = [
  "app/lib/kerrGeometryConditionedTemperatureV388.ts",
  "app/lib/kerrGeometryConditionedTemperatureV388.test.ts",
  "scripts/run-kerr-geometry-conditioned-temperature-oracle-v388.py",
  "scripts/build-kerr-geometry-conditioned-temperature-v388.ts",
  "app/lib/kerrGeometryConditionedTemperatureServerV388.ts",
  "app/lib/kerrGeometryConditionedTemperatureServerV388.test.ts",
  "app/api/atlas/relativity-evidence/v388/conditioned-temperature/route.ts",
  "app/api/atlas/relativity-evidence/v388/conditioned-temperature/route.test.ts",
  "app/components/KerrGeometryConditionedTemperatureSurfaceV388.tsx",
  "app/components/KerrGeometryConditionedTemperatureSurfaceV388.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV388.ts",
  "app/lib/atlasShadowCapabilityPointerV388.test.ts",
  "scripts/build-shadow-candidate-v388.mjs",
  "scripts/verify-shadow-v388-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v388-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "geometry-conditioned-temperature-v388-qualified-absolute-authority-withheld-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v387EvidenceSha256: previousEvidence.evidenceSha256,
    v387PointerSha256: previousPointer.pointerSha256,
    replayArtifactSha256: artifact.artifactSha256,
    replayFileSha256: fileSha(paths.artifact),
    replayCsvFileSha256: artifact.export.csvFileSha256,
    pythonOracleArtifactSha256: oracle.artifactSha256,
    v296GeometryEvidenceSha256: artifact.source.v296GeometryEvidenceSha256,
    v387IdentifiabilityArtifactSha256: artifact.source.v387IdentifiabilityArtifactSha256,
  },
  replay: {
    rayCount: artifact.counts.rayCount,
    bandCount: artifact.counts.bandCount,
    inversionCount: artifact.counts.inversionCount,
    geometryPriorCount: artifact.counts.geometryPriorCount,
    spectralOnlyRank: artifact.identifiability.spectralOnlyRank,
    geometryConditionedRank: artifact.identifiability.geometryConditionedRank,
    independentPrior: artifact.identifiability.independentPrior,
    maximumTemperatureReplayRelativeDifference: artifact.maxima.temperatureReplayRelativeDifference,
    maximumFormulationTemperatureRelativeDifference: artifact.maxima.formulationTemperatureRelativeDifference,
    maximumKnownNumericalUpperBoundRelative: artifact.maxima.knownNumericalUpperBoundRelative,
    maximumPythonOracleRelativeDifference: artifact.maxima.pythonOracleRelativeDifference,
  },
  uncertaintyBoundary: {
    knownNumericalBudgetQualified: true,
    combinationPolicy: "linear-sum-no-independence-proof-no-rss",
    knownNumericalIntervalIsConfidenceInterval: false,
    geometryPhysicalModelSystematicAvailable: false,
    diskPhysicalModelSystematicAvailable: false,
    detectorCalibrationCovarianceAvailable: false,
    absoluteTemperatureUncertaintyQualified: false,
    numericalPlaceholderUsed: false,
    absoluteTemperatureAuthorityGranted: false,
    measuredAuthorityGranted: false,
    observedCountsAvailable: false,
    scienceImageAvailable: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
  },
  runtime: { profile: "science-cinematic-v11-v377", consumer: "KerrGeometryConditionedTemperatureSurfaceV388", endpoint: "/api/atlas/relativity-evidence/v388/conditioned-temperature", responseMaximumBytes: 128 * 1024, noStore: true, localShadowOnly: true, defaultApplied: false, legacyV9Default: true },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  networkAttempted: false,
  automaticRetryApplied: false,
  browserQualification: "not-run",
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  releaseBoundary: "geometry-conditioned-replay-only-never-absolute-temperature-authority-measured-authority-image-counts-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v388",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v387SpectralIdentifiability: "qualified-rank-1",
    v388GeometryPrior: "qualified-v296-dual-formulation-redshift",
    v388ConditionalTemperature: "qualified-12-inversions-augmented-rank-2",
    v388KnownNumericalBudget: "qualified-linear-upper-bound-no-rss",
    v388PhysicalSystematics: "unavailable-geometry-disk-detector",
    v388AbsoluteTemperatureAuthority: "not-qualified",
    v388MeasuredAuthority: "unavailable",
    v388RuntimeConsumer: "v11-geodesic-prior-key-wired",
    v388PromotionBoundary: "conditional-replay-only-zero-absolute-authority-zero-image-zero-counts",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({
  status: pointer.status,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  geometryPrior: pointer.capabilities.v388GeometryPrior,
  conditionalTemperature: pointer.capabilities.v388ConditionalTemperature,
  numericalBudget: pointer.capabilities.v388KnownNumericalBudget,
  absoluteAuthority: pointer.capabilities.v388AbsoluteTemperatureAuthority,
  dense: pointer.capabilities.v314CorrectedDense,
  browser: pointer.capabilities.browserQualification,
}, null, 2));
