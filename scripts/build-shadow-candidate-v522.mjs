import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v521-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v521.json",
  artifact: "dist/science/kerr-polarization-frequency-sensitivity-v522/envelope.json",
  runtime: "dist/science/kerr-polarization-frequency-sensitivity-v522/runtime-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v522-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v522.json",
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
const atMost = (value, limit) => Number(value) <= Number(limit);

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const runtime = read(paths.runtime);
const detector = read(paths.detector);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const baselineMaxima = [
  artifact.maxima.baselineVsV521EnergyIRelative,
  artifact.maxima.baselineVsV521EnergyQRelative,
  artifact.maxima.baselineVsV521EnergyURelative,
  artifact.maxima.baselineVsV521PhotonIRelative,
  artifact.maxima.baselineVsV521PhotonQRelative,
  artifact.maxima.baselineVsV521PhotonURelative,
];
if (
  previousEvidence.version !== "orbit-atlas-shadow-v521-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v521" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  artifact.version !== "v522-kerr-polarization-frequency-sensitivity-envelope-v1" ||
  sha(artifact) !== artifact.artifactSha256 ||
  runtime.version !== "v522-kerr-polarization-frequency-sensitivity-runtime-audit-v1" ||
  sha(runtime) !== runtime.artifactSha256 ||
  runtime.source.sensitivityArtifactSha256 !== artifact.artifactSha256 ||
  artifact.model.perturbationCalibration !== "unavailable" ||
  artifact.model.physicalPrior !== "unavailable" ||
  artifact.model.stressTestOnly !== true ||
  sha(artifact.scenarioPlan) !== artifact.scenarioPlanSha256 ||
  artifact.counts.scenarioCount !== 9 ||
  artifact.counts.scenarioRowCount !== 216 ||
  artifact.counts.envelopeRowCount !== 24 ||
  artifact.counts.directAdaptiveIntegralCount !== 888 ||
  artifact.counts.measuredStokesRowCount !== 0 ||
  artifact.counts.circularStokesRowCount !== 0 ||
  baselineMaxima.some(
    (value) => !below(value, artifact.limits.baselineVsV521ComponentRelative),
  ) ||
  !atMost(artifact.maxima.energyLinearFraction, artifact.limits.linearFraction) ||
  !atMost(artifact.maxima.photonLinearFraction, artifact.limits.linearFraction) ||
  !atMost(artifact.maxima.energyEvpaShiftDeg, artifact.limits.evpaShiftDeg) ||
  !atMost(artifact.maxima.photonEvpaShiftDeg, artifact.limits.evpaShiftDeg) ||
  Number(artifact.maxima.physicalConeViolation) !== 0 ||
  artifact.qualification.deterministicScenarioGridQualified !== true ||
  artifact.qualification.baselineReconstructionQualified !== true ||
  artifact.qualification.frequencySensitivityEnvelopeQualified !== true ||
  artifact.qualification.physicalPriorQualified !== false ||
  artifact.qualification.scienceAuthorityPromotionAllowed !== false ||
  artifact.uncertaintyPolicy.probabilityDistributionAvailable !== false ||
  artifact.uncertaintyPolicy.rssApplied !== false ||
  artifact.uncertaintyPolicy.scalarTotalAvailable !== false ||
  artifact.uncertaintyPolicy.combinationWithNumericalUncertaintyAllowed !== false ||
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
  throw new Error("v522-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.artifact,
  paths.runtime,
  paths.detector,
  paths.dense,
  paths.formal,
  "app/lib/kerrPolarizationFrequencySensitivityV522.ts",
  "app/lib/kerrPolarizationFrequencySensitivityV522.test.ts",
  "app/lib/kerrPolarizationFrequencySensitivityServerV522.ts",
  "app/lib/kerrPolarizationFrequencySensitivityServerV522.test.ts",
  "app/lib/kerrPolarizationFrequencySensitivityClientV522.ts",
  "app/lib/kerrPolarizationFrequencySensitivityClientV522.test.ts",
  "app/api/atlas/relativity-evidence/v522/polarization-sensitivity/route.ts",
  "app/api/atlas/relativity-evidence/v522/polarization-sensitivity/route.test.ts",
  "app/components/KerrPolarizationFrequencySensitivityV522.tsx",
  "app/components/KerrPolarizationFrequencySensitivityV522.test.tsx",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV522.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV522.test.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV522.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV522.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/run-kerr-polarization-frequency-sensitivity-v522.py",
  "scripts/test-kerr-polarization-frequency-sensitivity-v522.py",
  "scripts/build-kerr-polarization-frequency-sensitivity-runtime-v522.ts",
  "scripts/build-shadow-candidate-v522.mjs",
  "scripts/build-shadow-v522.mjs",
  "scripts/verify-shadow-v522-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths
  .map((path) => ({ path, sha256: fileSha(path) }))
  .sort((a, b) => a.path.localeCompare(b.path));
const status =
  "v522-polarization-frequency-sensitivity-envelope-qualified-not-physical-prior-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v522-evidence-v1",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  dependency: {
    v521EvidenceSha256: previousEvidence.evidenceSha256,
    v521PointerSha256: previousPointer.pointerSha256,
    v522SensitivityArtifactSha256: artifact.artifactSha256,
    v522RuntimeArtifactSha256: runtime.artifactSha256,
    v511InstrumentMatrixSha256: detector.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  model: artifact.model,
  scenarioPlanSha256: artifact.scenarioPlanSha256,
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
    "v522-nine-deterministic-frequency-dependent-polarization-scenarios-two-hundred-sixteen-rows-eight-hundred-eighty-eight-integrals-and-twenty-four-componentwise-envelopes-qualified-as-model-sensitivity-only",
  boundaryStatement:
    "The envelope is an uncalibrated deterministic stress test, not a physical prior, probability distribution, confidence interval, measured uncertainty, science authority promotion, or product promotion.",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v522",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v521DirectStokesOracle: "qualified-144-integrals",
    v522DeterministicScenarioGrid: "qualified-9-of-9",
    v522ScenarioRows: "qualified-216-of-216",
    v522DirectAdaptiveIntegrals: "qualified-888-of-888",
    v522SensitivityEnvelopes: "qualified-24-of-24",
    v522BaselineReconstruction: "qualified-below-1e-20",
    v522PhysicalPrior: "unavailable-not-qualified",
    v522PerturbationCalibration: "unavailable",
    v522ProbabilityDistribution: "unavailable",
    v522RssUncertainty: "forbidden-not-applied",
    v522ScalarUncertaintyTotal: "unavailable",
    v522ScienceAuthorityPromotion: "blocked-stress-test-only",
    v522MeasuredStokes: "unavailable-0-rows",
    v522RuntimeRequestPolicy: "qualified-auto-0-explicit-1-single-flight-2-consumers",
    v522Lifecycle: "qualified-baseline",
    v522DetectorCalibration: "incomplete-0-of-6",
    v522ScienceRaster: "unavailable",
    v522BrowserQualification: "not-run",
    v522VisualMatrixQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    scienceAuthorityPromotionAllowed: false,
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
      sensitivityArtifactSha256: artifact.artifactSha256,
      runtimeArtifactSha256: runtime.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      scenarioRows: artifact.counts.scenarioRowCount,
      directAdaptiveIntegrals: artifact.counts.directAdaptiveIntegralCount,
      maximumBaselineRelative: Math.max(...baselineMaxima.map(Number)),
      maximumEnergyEvpaShiftDeg: Number(artifact.maxima.energyEvpaShiftDeg),
      maximumPhotonEvpaShiftDeg: Number(artifact.maxima.photonEvpaShiftDeg),
      physicalPrior: "unavailable",
      measuredStokesRows: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
