import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v390-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v390.json",
  artifact: "dist/science/kerr-temperature-trust-region-v391/trust-region.json",
  csv: "dist/science/kerr-temperature-trust-region-v391/trust-region.csv",
  oracle: "dist/science/kerr-temperature-trust-region-v391/python-oracle.json",
  sourceDossier: "dist/staging/measured-authority-v382-visible/manifest.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v391-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v391.json",
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
  || previousPointer.capabilities?.v390TransferOperator !== "qualified-12-rank-2-72-coefficients"
  || artifact.version !== "v391-kerr-temperature-curvature-trust-region-v1"
  || artifact.status !== "curvature-trust-region-qualified-stress-grid-nonphysical-covariance-unavailable"
  || sha(artifact) !== artifact.artifactSha256
  || artifact.export?.csvFileSha256 !== fileSha(paths.csv)
  || artifact.rows?.length !== 12
  || artifact.counts?.axisReplayCount !== 216
  || artifact.counts?.mixedCornerReplayCount !== 864
  || artifact.counts?.hessianCoefficientCount !== 216
  || artifact.minima?.linearTrustRadius < 0.003
  || artifact.minima?.quadraticTrustRadius < 0.01
  || artifact.maxima?.quadraticAbsoluteLogResidual >= 2e-8
  || artifact.maxima?.inversionRelativeResidual >= 2e-10
  || artifact.maxima?.pythonOracleRelativeDifference >= 2e-7
  || artifact.method?.stressGridIsPhysicalUncertainty !== false
  || artifact.method?.stressGridProbabilityContent !== false
  || artifact.method?.derivativeFixturePublishableAsMeasurement !== false
  || artifact.qualification?.analyticCurvatureQualified !== true
  || artifact.qualification?.linearTrustRegionQualified !== true
  || artifact.qualification?.quadraticTrustRegionQualified !== true
  || artifact.qualification?.crossTermSeparationQualified !== true
  || artifact.qualification?.physicalSystematicVectorAdmitted !== false
  || artifact.qualification?.covarianceProjectionExecuted !== false
  || artifact.qualification?.absoluteScientificIntervalQualified !== false
  || artifact.qualification?.absoluteTemperatureAuthorityGranted !== false
  || artifact.qualification?.measuredAuthorityGranted !== false
  || oracle.status !== "qualified-independent-curvature-trust-region-oracle"
  || oracle.axisReplayCount !== 216 || oracle.mixedCornerReplayCount !== 864
  || oracle.minimumLinearTrustRadius < 0.003 || oracle.minimumQuadraticTrustRadius < 0.01
  || oracle.stressGridIsPhysicalUncertainty !== false
  || oracle.probabilityContentAssigned !== false
  || oracle.absoluteScientificIntervalQualified !== false
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
) throw new Error("v391-boundary");

const sourcePaths = [
  "app/lib/kerrTemperatureTrustRegionV391.ts",
  "app/lib/kerrTemperatureTrustRegionV391.test.ts",
  "scripts/run-kerr-temperature-trust-region-oracle-v391.py",
  "scripts/build-kerr-temperature-trust-region-v391.ts",
  "app/lib/kerrTemperatureTrustRegionServerV391.ts",
  "app/lib/kerrTemperatureTrustRegionServerV391.test.ts",
  "app/api/atlas/relativity-evidence/v391/trust-region/route.ts",
  "app/api/atlas/relativity-evidence/v391/trust-region/route.test.ts",
  "app/components/KerrTemperatureCurvatureRelayV391.tsx",
  "app/components/KerrTemperatureCurvatureRelayV391.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV391.ts",
  "app/lib/atlasShadowCapabilityPointerV391.test.ts",
  "scripts/build-shadow-candidate-v391.mjs",
  "scripts/verify-shadow-v391-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v391-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "temperature-curvature-trust-region-v391-qualified-stress-grid-nonphysical-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v390EvidenceSha256: previousEvidence.evidenceSha256,
    v390PointerSha256: previousPointer.pointerSha256,
    trustArtifactSha256: artifact.artifactSha256,
    trustFileSha256: fileSha(paths.artifact),
    trustCsvFileSha256: artifact.export.csvFileSha256,
    pythonOracleArtifactSha256: oracle.artifactSha256,
    v390TransferArtifactSha256: artifact.source.v390TransferArtifactSha256,
    v389IntervalArtifactSha256: artifact.source.v389IntervalArtifactSha256,
    fullShortAuthoritySha256: artifact.source.fullShortAuthoritySha256,
  },
  trustRegion: {
    rowCount: artifact.counts.rowCount,
    stressRadiusCount: artifact.counts.stressRadiusCount,
    axisReplayCount: artifact.counts.axisReplayCount,
    mixedCornerReplayCount: artifact.counts.mixedCornerReplayCount,
    hessianCoefficientCount: artifact.counts.hessianCoefficientCount,
    minimumLinearTrustRadius: artifact.minima.linearTrustRadius,
    minimumQuadraticTrustRadius: artifact.minima.quadraticTrustRadius,
    maximumLinearAbsoluteLogResidual: artifact.maxima.linearAbsoluteLogResidual,
    maximumQuadraticAbsoluteLogResidual: artifact.maxima.quadraticAbsoluteLogResidual,
    maximumPythonOracleRelativeDifference: artifact.maxima.pythonOracleRelativeDifference,
  },
  authorityBoundary: {
    analyticCurvatureQualified: true,
    linearTrustRegionQualified: true,
    quadraticTrustRegionQualified: true,
    crossTermSeparationQualified: true,
    stressGridIsPhysicalUncertainty: false,
    stressGridProbabilityContent: false,
    derivativeFixturePublishableAsMeasurement: false,
    physicalSystematicVectorAdmitted: false,
    covarianceProjectionExecuted: false,
    absoluteScientificIntervalQualified: false,
    absoluteTemperatureAuthorityGranted: false,
    measuredAuthorityGranted: false,
    observedCountsAvailable: false,
    scienceImageAvailable: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
  },
  runtime: { profile: "science-cinematic-v11-v377", consumer: "KerrTemperatureCurvatureRelayV391", endpoint: "/api/atlas/relativity-evidence/v391/trust-region", responseMaximumBytes: 128 * 1024, noStore: true, localShadowOnly: true, defaultApplied: false, legacyV9Default: true },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  networkAttempted: false,
  automaticRetryApplied: false,
  browserQualification: "not-run",
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  releaseBoundary: "curvature-trust-region-only-never-physical-uncertainty-probability-covariance-projection-absolute-temperature-authority-measured-authority-image-counts-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v391",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v390TransferOperator: "qualified-12-rank-2-72-coefficients",
    v391AnalyticCurvature: "qualified-12-hessians",
    v391LinearTrustRegion: "qualified-minimum-radius-0.003",
    v391QuadraticTrustRegion: "qualified-minimum-radius-0.01",
    v391CrossTermSeparation: "qualified-864-mixed-corners",
    v391StressGridSemantics: "validation-only-nonphysical-no-probability",
    v391PhysicalCovariance: "unavailable",
    v391AbsoluteScientificInterval: "not-qualified",
    v391RuntimeConsumer: "v11-curvature-relay-wired",
    v391PromotionBoundary: "trust-region-only-zero-physical-vector-zero-absolute-authority-zero-image-zero-counts",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, curvature: pointer.capabilities.v391AnalyticCurvature, linearTrust: pointer.capabilities.v391LinearTrustRegion, quadraticTrust: pointer.capabilities.v391QuadraticTrustRegion, stressGrid: pointer.capabilities.v391StressGridSemantics, dense: pointer.capabilities.v314CorrectedDense, browser: pointer.capabilities.browserQualification }, null, 2));
