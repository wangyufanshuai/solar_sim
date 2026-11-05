import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v520-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v520.json",
  artifact: "dist/science/kerr-fixed-band-stokes-oracle-v521/oracle.json",
  runtime: "dist/science/kerr-fixed-band-stokes-oracle-v521/runtime-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v521-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v521.json",
};
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "evidenceSha256",
  "pointerSha256",
  "stageChainSha256",
]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};
const below = (value, limit) => Number(value) < Number(limit);

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const runtime = read(paths.runtime);
const detector = read(paths.detector);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const directMaxima = [
  artifact.maxima.directVsV520EnergyIRelative,
  artifact.maxima.directVsV520EnergyQRelative,
  artifact.maxima.directVsV520EnergyURelative,
  artifact.maxima.directVsV520PhotonIRelative,
  artifact.maxima.directVsV520PhotonQRelative,
  artifact.maxima.directVsV520PhotonURelative,
];
if (
  previousEvidence.version !== "orbit-atlas-shadow-v520-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v520" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  artifact.version !== "v521-kerr-fixed-band-stokes-direct-integration-oracle-v1" ||
  sha(artifact) !== artifact.artifactSha256 ||
  runtime.version !== "v521-kerr-fixed-band-stokes-oracle-runtime-audit-v1" ||
  sha(runtime) !== runtime.artifactSha256 ||
  runtime.source.oracleArtifactSha256 !== artifact.artifactSha256 ||
  artifact.oracle.backend !== "mpmath-1.3.0" ||
  artifact.oracle.decimalDigits !== 80 ||
  artifact.oracle.v520IntegratedValuesConsumedAsInputs !== false ||
  artifact.oracle.v520ValuesUsedForComparisonOnly !== true ||
  artifact.oracle.independentTransportPathsPreserved !== true ||
  artifact.oracle.methodValuesAveraged !== false ||
  artifact.counts.rowCount !== 24 ||
  artifact.rows.length !== 24 ||
  artifact.counts.directAdaptiveIntegralCount !== 144 ||
  artifact.counts.energyStokesComponentCount !== 72 ||
  artifact.counts.photonStokesComponentCount !== 72 ||
  artifact.counts.componentwiseUncertaintyEnvelopeCount !== 24 ||
  artifact.counts.measuredStokesRowCount !== 0 ||
  artifact.counts.circularStokesRowCount !== 0 ||
  artifact.counts.detectorProjectedRowCount !== 0 ||
  artifact.counts.sciencePixelRowCount !== 0 ||
  directMaxima.some(
    (value) => !below(value, artifact.limits.directVsV520ComponentRelative),
  ) ||
  !below(artifact.maxima.linearFractionResidual, artifact.limits.linearFractionResidual) ||
  !below(artifact.maxima.evpaReconstructionDeg, artifact.limits.evpaReconstructionDeg) ||
  Number(artifact.maxima.physicalConeViolation) !== 0 ||
  artifact.qualification.directFrequencyDomainIntegrationQualified !== true ||
  artifact.qualification.componentwiseUncertaintyEnvelopeQualified !== true ||
  artifact.qualification.crossLanguageCanonicalShaQualified !== true ||
  artifact.qualification.measuredPolarimetryQualified !== false ||
  artifact.uncertaintyPolicy.componentwiseOnly !== true ||
  artifact.uncertaintyPolicy.crossChannelIndependenceProven !== false ||
  artifact.uncertaintyPolicy.rssApplied !== false ||
  artifact.uncertaintyPolicy.scalarTotalAvailable !== false ||
  artifact.boundary.measuredPolarimeterAvailable !== false ||
  artifact.boundary.scienceRasterAuthorityAvailable !== false ||
  runtime.runtime.serverFingerprintCacheHit !== true ||
  runtime.runtime.automaticRequestCount !== 0 ||
  runtime.runtime.explicitRequestCount !== 1 ||
  runtime.runtime.singleFlightConsumerCount !== 2 ||
  runtime.runtime.finalResourceStatus !== "baseline" ||
  detector.counts.measuredCalibrationFiles !== 0 ||
  detector.counts.requiredMeasuredCalibrationFiles !== 6 ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v521-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.artifact,
  paths.runtime,
  paths.detector,
  paths.dense,
  paths.formal,
  "app/lib/kerrFixedBandStokesOracleV521.ts",
  "app/lib/kerrFixedBandStokesOracleV521.test.ts",
  "app/lib/kerrFixedBandStokesOracleServerV521.ts",
  "app/lib/kerrFixedBandStokesOracleServerV521.test.ts",
  "app/lib/kerrFixedBandStokesOracleClientV521.ts",
  "app/lib/kerrFixedBandStokesOracleClientV521.test.ts",
  "app/api/atlas/relativity-evidence/v521/stokes-oracle/route.ts",
  "app/api/atlas/relativity-evidence/v521/stokes-oracle/route.test.ts",
  "app/components/KerrFixedBandStokesOracleV521.tsx",
  "app/components/KerrFixedBandStokesOracleV521.test.tsx",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV521.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV521.test.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV521.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV521.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/run-kerr-fixed-band-stokes-oracle-v521.py",
  "scripts/test-kerr-fixed-band-stokes-oracle-v521.py",
  "scripts/build-kerr-fixed-band-stokes-oracle-runtime-v521.ts",
  "scripts/build-shadow-candidate-v521.mjs",
  "scripts/build-shadow-v521.mjs",
  "scripts/verify-shadow-v521-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths
  .map((path) => ({ path, sha256: fileSha(path) }))
  .sort((a, b) => a.path.localeCompare(b.path));
const status =
  "v521-direct-fixed-band-stokes-oracle-qualified-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v521-evidence-v1",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  dependency: {
    v520EvidenceSha256: previousEvidence.evidenceSha256,
    v520PointerSha256: previousPointer.pointerSha256,
    v521OracleArtifactSha256: artifact.artifactSha256,
    v521RuntimeArtifactSha256: runtime.artifactSha256,
    v511InstrumentMatrixSha256: detector.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  model: artifact.model,
  oracle: artifact.oracle,
  counts: artifact.counts,
  maxima: artifact.maxima,
  limits: artifact.limits,
  qualification: artifact.qualification,
  uncertaintyPolicy: artifact.uncertaintyPolicy,
  runtime: runtime.runtime,
  detectorBoundary: {
    measuredCalibrationFiles: detector.counts.measuredCalibrationFiles,
    requiredMeasuredCalibrationFiles: detector.counts.requiredMeasuredCalibrationFiles,
    detectorAuthorityAvailable: detector.boundary.detectorResponseAvailable,
    scienceRasterAvailable: detector.boundary.scienceRasterAvailable,
  },
  scienceBoundary: artifact.boundary,
  denseCampaign: {
    namespace: "v314",
    status: dense.status,
    completedShardCount: dense.completedShardCount,
    plannedShardCount: dense.plannedShardCount,
    attemptConsumed: dense.attemptConsumed,
    aggregateAvailable: dense.aggregateAvailable,
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  qualificationStatement:
    "v521-twenty-four-rows-six-independent-adaptive-frequency-integrals-per-row-one-hundred-forty-four-total-energy-and-photon-IQU-componentwise-envelope-cross-language-canonical-runtime-baseline-qualified",
  boundaryStatement:
    "The oracle validates model-predicted linear Stokes by direct frequency integration. It does not establish cross-channel independence, an RSS or scalar total uncertainty, measured polarimetry, detector counts, dense images, science raster authority, or product promotion.",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v521",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v520FixedBandStokes: "qualified-24-model-rows",
    v521DirectAdaptiveIntegrals: "qualified-144-of-144",
    v521EnergyIquComponents: "qualified-72-of-72",
    v521PhotonIquComponents: "qualified-72-of-72",
    v521ComponentwiseEnvelopes: "qualified-24-of-24",
    v521V520InputIndependence: "qualified-v520-comparison-only",
    v521CrossLanguageCanonicalSha: "qualified",
    v521CrossChannelIndependence: "not-proven",
    v521RssUncertainty: "forbidden-not-applied",
    v521ScalarUncertaintyTotal: "unavailable",
    v521MeasuredStokes: "unavailable-0-rows",
    v521CircularStokes: "unavailable-0-rows",
    v521DetectorProjection: "unavailable-0-rows",
    v521RuntimeRequestPolicy: "qualified-auto-0-explicit-1-single-flight-2-consumers",
    v521Lifecycle: "qualified-baseline",
    v521DetectorCalibration: "incomplete-0-of-6",
    v521ScienceRaster: "unavailable",
    v521BrowserQualification: "not-run",
    v521VisualMatrixQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    scienceRasterPayloadAllowed: false,
    fitsWriteAllowed: false,
    pngWriteAllowed: false,
    localShadowDefaultApplied: false,
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
      status,
      oracleArtifactSha256: artifact.artifactSha256,
      runtimeArtifactSha256: runtime.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rows: artifact.counts.rowCount,
      directAdaptiveIntegrals: artifact.counts.directAdaptiveIntegralCount,
      maximumDirectComponentRelative: directMaxima.reduce(
        (maximum, value) => Math.max(maximum, Number(value)),
        0,
      ),
      measuredStokesRows: 0,
      detectorCalibration: "0/6",
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
