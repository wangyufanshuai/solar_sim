import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-polarization-frequency-sensitivity-v522/envelope.json",
  runtime: "dist/science/kerr-polarization-frequency-sensitivity-v522/runtime-audit.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v521-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v521.json",
  evidence: "dist/science/orbit-atlas-shadow-v522-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v522.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
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
const text = (path) => bytes(path).toString("utf8");
const read = (path) => JSON.parse(text(path));
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
const below = (value, limit) => Number(value) < Number(limit);
const atMost = (value, limit) => Number(value) <= Number(limit);

const artifact = read(paths.artifact);
const runtime = read(paths.runtime);
const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const evidence = read(paths.evidence);
const pointer = read(paths.pointer);
const detector = read(paths.detector);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  artifact.version !== "v522-kerr-polarization-frequency-sensitivity-envelope-v1" ||
  runtime.version !== "v522-kerr-polarization-frequency-sensitivity-runtime-audit-v1" ||
  previousEvidence.version !== "orbit-atlas-shadow-v521-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v521" ||
  evidence.version !== "orbit-atlas-shadow-v522-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v522" ||
  sha(artifact) !== artifact.artifactSha256 ||
  sha(runtime) !== runtime.artifactSha256 ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  sha(artifact.scenarioPlan) !== artifact.scenarioPlanSha256 ||
  runtime.source.sensitivityArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v522SensitivityArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v522RuntimeArtifactSha256 !== runtime.artifactSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence.fileSha256 !== fileSha(paths.evidence)
) {
  throw new Error("v522-canonical-chain");
}

const scenarioIds = new Set(artifact.scenarioPlan.map((entry) => entry.scenarioId));
const expectedRows = new Set(
  [12, 13, 14, 15].flatMap((rayIndex) =>
    ["visible", "euv", "soft-x-ray"].flatMap((bandId) =>
      ["walker-penrose", "independent-ks-parallel-transport"].flatMap((method) =>
        [...scenarioIds].map((scenarioId) => `${rayIndex}:${bandId}:${method}:${scenarioId}`),
      ),
    ),
  ),
);
for (const row of artifact.scenarioRows) {
  const identity = `${row.rayIndex}:${row.bandId}:${row.transportMethod}:${row.scenarioId}`;
  if (
    !expectedRows.delete(identity) ||
    row.directEnergyStokes.v !== "unavailable-not-modeled" ||
    row.directPhotonStokes.v !== "unavailable-not-modeled" ||
    Number(row.directEnergyStokes.iWM2Sr) <= 0 ||
    Number(row.directPhotonStokes.iPerSM2Sr) <= 0 ||
    Number(row.physicalConeViolation) !== 0 ||
    row.applicability !== "deterministic-model-sensitivity-stress-test-only"
  ) {
    throw new Error(`v522-row:${identity}`);
  }
}
const baselineMaxima = [
  artifact.maxima.baselineVsV521EnergyIRelative,
  artifact.maxima.baselineVsV521EnergyQRelative,
  artifact.maxima.baselineVsV521EnergyURelative,
  artifact.maxima.baselineVsV521PhotonIRelative,
  artifact.maxima.baselineVsV521PhotonQRelative,
  artifact.maxima.baselineVsV521PhotonURelative,
];
if (
  scenarioIds.size !== 9 ||
  expectedRows.size !== 0 ||
  artifact.scenarioRows.length !== 216 ||
  artifact.envelopes.length !== 24 ||
  artifact.counts.directAdaptiveIntegralCount !== 888 ||
  artifact.counts.measuredStokesRowCount !== 0 ||
  artifact.counts.circularStokesRowCount !== 0 ||
  artifact.model.perturbationCalibration !== "unavailable" ||
  artifact.model.physicalPrior !== "unavailable" ||
  artifact.model.stressTestOnly !== true ||
  baselineMaxima.some(
    (value) => !below(value, artifact.limits.baselineVsV521ComponentRelative),
  ) ||
  !atMost(artifact.maxima.energyLinearFraction, artifact.limits.linearFraction) ||
  !atMost(artifact.maxima.photonLinearFraction, artifact.limits.linearFraction) ||
  !atMost(artifact.maxima.energyEvpaShiftDeg, artifact.limits.evpaShiftDeg) ||
  !atMost(artifact.maxima.photonEvpaShiftDeg, artifact.limits.evpaShiftDeg) ||
  Number(artifact.maxima.physicalConeViolation) !== 0 ||
  artifact.qualification.frequencySensitivityEnvelopeQualified !== true ||
  artifact.qualification.physicalPriorQualified !== false ||
  artifact.qualification.scienceAuthorityPromotionAllowed !== false ||
  artifact.uncertaintyPolicy.probabilityDistributionAvailable !== false ||
  artifact.uncertaintyPolicy.crossScenarioIndependenceProven !== false ||
  artifact.uncertaintyPolicy.rssApplied !== false ||
  artifact.uncertaintyPolicy.scalarTotalAvailable !== false ||
  artifact.uncertaintyPolicy.combinationWithNumericalUncertaintyAllowed !== false ||
  artifact.boundary.measuredPolarimeterAvailable !== false ||
  artifact.boundary.scienceRasterAuthorityAvailable !== false ||
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
  formalEvidence.contracts?.evidenceLedgerClaims !== 84 ||
  pointer.formalProductPointer !== "v263" ||
  pointer.localShadowDefaultApplied !== false ||
  pointer.capabilities.v522DirectAdaptiveIntegrals !== "qualified-888-of-888" ||
  pointer.capabilities.v522PhysicalPrior !== "unavailable-not-qualified" ||
  pointer.capabilities.v522ScienceAuthorityPromotion !== "blocked-stress-test-only" ||
  pointer.capabilities.v522MeasuredStokes !== "unavailable-0-rows" ||
  pointer.capabilities.v522DetectorCalibration !== "incomplete-0-of-6" ||
  pointer.capabilities.v522BrowserQualification !== "not-run" ||
  pointer.capabilities.v314DenseCampaign !== "incomplete-0-of-49"
) {
  throw new Error("v522-science-boundary");
}

const component = text("app/components/KerrPolarizationFrequencySensitivityV522.tsx");
const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV522.tsx");
const route = text(
  "app/api/atlas/relativity-evidence/v522/polarization-sensitivity/route.ts",
);
const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
if (
  !component.includes('data-atlas-v522-direct-integral-count="888"') ||
  !component.includes('data-atlas-v522-physical-prior-qualified="false"') ||
  component.includes("Math.random") ||
  component.includes("<canvas") ||
  component.includes("�") ||
  !wrapper.includes('import("./KerrPolarizationFrequencySensitivityV522")') ||
  wrapper.includes("fetch(") ||
  wrapper.includes("�") ||
  !route.includes('delivery !== "local-shadow"') ||
  !route.includes('download !== "envelope"') ||
  !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV522"') ||
  !workbench.includes("<KerrPhotonMetrologyObservatoryIntentV522")
) {
  throw new Error("v522-source-boundary");
}

for (const [label, source] of [
  ["artifact", artifact],
  ["runtime", runtime],
  ["evidence", evidence],
]) {
  if (!Array.isArray(source.sourceManifest) || source.sourceManifest.length === 0) {
    throw new Error(`v522-${label}-manifest-empty`);
  }
  for (const entry of source.sourceManifest) {
    if (fileSha(entry.path) !== entry.sha256) {
      throw new Error(`v522-${label}-manifest:${entry.path}`);
    }
  }
  if (sha(source.sourceManifest) !== source.sourceSha256) {
    throw new Error(`v522-${label}-manifest-canonical`);
  }
}
for (const path of Object.values(paths)) {
  if (statSync(resolve(root, path)).size <= 0) throw new Error(`v522-empty:${path}`);
}

console.log(
  JSON.stringify(
    {
      status: "passed-v522-low-memory-polarization-frequency-sensitivity-envelope",
      artifactSha256: artifact.artifactSha256,
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
      detectorCalibration: "0/6",
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
