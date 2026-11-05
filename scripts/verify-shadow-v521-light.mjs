import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-fixed-band-stokes-oracle-v521/oracle.json",
  runtime: "dist/science/kerr-fixed-band-stokes-oracle-v521/runtime-audit.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v520-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v520.json",
  evidence: "dist/science/orbit-atlas-shadow-v521-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v521.json",
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
  artifact.version !== "v521-kerr-fixed-band-stokes-direct-integration-oracle-v1" ||
  runtime.version !== "v521-kerr-fixed-band-stokes-oracle-runtime-audit-v1" ||
  previousEvidence.version !== "orbit-atlas-shadow-v520-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v520" ||
  evidence.version !== "orbit-atlas-shadow-v521-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v521" ||
  sha(artifact) !== artifact.artifactSha256 ||
  sha(runtime) !== runtime.artifactSha256 ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  runtime.source.oracleArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v521OracleArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v521RuntimeArtifactSha256 !== runtime.artifactSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence.fileSha256 !== fileSha(paths.evidence)
) {
  throw new Error("v521-canonical-chain");
}

const expected = new Set(
  [12, 13, 14, 15].flatMap((rayIndex) =>
    ["visible", "euv", "soft-x-ray"].flatMap((bandId) =>
      ["walker-penrose", "independent-ks-parallel-transport"].map(
        (method) => `${rayIndex}:${bandId}:${method}`,
      ),
    ),
  ),
);
for (const row of artifact.rows) {
  const identity = `${row.rayIndex}:${row.bandId}:${row.transportMethod}`;
  if (
    !expected.delete(identity) ||
    row.linearPolarizationFraction !== "0.12" ||
    row.directEnergyStokes.v !== "unavailable-not-modeled" ||
    row.directPhotonStokes.v !== "unavailable-not-modeled" ||
    Number(row.directEnergyStokes.iWM2Sr) <= 0 ||
    Number(row.directPhotonStokes.iPerSM2Sr) <= 0 ||
    row.uncertaintyEnvelope.crossChannelIndependenceProven !== false ||
    row.uncertaintyEnvelope.rssApplied !== false ||
    row.uncertaintyEnvelope.scalarTotalAvailable !== false
  ) {
    throw new Error(`v521-row:${identity}`);
  }
}
const directMaxima = [
  artifact.maxima.directVsV520EnergyIRelative,
  artifact.maxima.directVsV520EnergyQRelative,
  artifact.maxima.directVsV520EnergyURelative,
  artifact.maxima.directVsV520PhotonIRelative,
  artifact.maxima.directVsV520PhotonQRelative,
  artifact.maxima.directVsV520PhotonURelative,
];
if (
  expected.size !== 0 ||
  artifact.rows.length !== 24 ||
  artifact.counts.directAdaptiveIntegralCount !== 144 ||
  artifact.counts.energyStokesComponentCount !== 72 ||
  artifact.counts.photonStokesComponentCount !== 72 ||
  artifact.counts.componentwiseUncertaintyEnvelopeCount !== 24 ||
  artifact.counts.measuredStokesRowCount !== 0 ||
  artifact.counts.circularStokesRowCount !== 0 ||
  artifact.oracle.v520IntegratedValuesConsumedAsInputs !== false ||
  artifact.oracle.v520ValuesUsedForComparisonOnly !== true ||
  artifact.oracle.methodValuesAveraged !== false ||
  directMaxima.some(
    (value) => !below(value, artifact.limits.directVsV520ComponentRelative),
  ) ||
  Number(artifact.maxima.physicalConeViolation) !== 0 ||
  artifact.qualification.directFrequencyDomainIntegrationQualified !== true ||
  artifact.qualification.crossLanguageCanonicalShaQualified !== true ||
  artifact.uncertaintyPolicy.crossChannelIndependenceProven !== false ||
  artifact.uncertaintyPolicy.rssApplied !== false ||
  artifact.uncertaintyPolicy.scalarTotalAvailable !== false ||
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
  pointer.capabilities.v521DirectAdaptiveIntegrals !== "qualified-144-of-144" ||
  pointer.capabilities.v521CrossChannelIndependence !== "not-proven" ||
  pointer.capabilities.v521RssUncertainty !== "forbidden-not-applied" ||
  pointer.capabilities.v521MeasuredStokes !== "unavailable-0-rows" ||
  pointer.capabilities.v521DetectorCalibration !== "incomplete-0-of-6" ||
  pointer.capabilities.v521BrowserQualification !== "not-run" ||
  pointer.capabilities.v314DenseCampaign !== "incomplete-0-of-49"
) {
  throw new Error("v521-science-boundary");
}

const component = text("app/components/KerrFixedBandStokesOracleV521.tsx");
const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV521.tsx");
const route = text("app/api/atlas/relativity-evidence/v521/stokes-oracle/route.ts");
const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
if (
  !component.includes('data-atlas-v521-direct-integral-count="144"') ||
  !component.includes('data-atlas-v521-measured-stokes-row-count="0"') ||
  component.includes("Math.random") ||
  component.includes("<canvas") ||
  component.includes("�") ||
  !wrapper.includes('import("./KerrFixedBandStokesOracleV521")') ||
  wrapper.includes("fetch(") ||
  wrapper.includes("�") ||
  !route.includes('delivery !== "local-shadow"') ||
  !route.includes('download !== "oracle"') ||
  !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV521"') ||
  !workbench.includes("<KerrPhotonMetrologyObservatoryIntentV521")
) {
  throw new Error("v521-source-boundary");
}

for (const [label, source] of [
  ["artifact", artifact],
  ["runtime", runtime],
  ["evidence", evidence],
]) {
  if (!Array.isArray(source.sourceManifest) || source.sourceManifest.length === 0) {
    throw new Error(`v521-${label}-manifest-empty`);
  }
  for (const entry of source.sourceManifest) {
    if (fileSha(entry.path) !== entry.sha256) {
      throw new Error(`v521-${label}-manifest:${entry.path}`);
    }
  }
  if (sha(source.sourceManifest) !== source.sourceSha256) {
    throw new Error(`v521-${label}-manifest-canonical`);
  }
}
for (const path of Object.values(paths)) {
  if (statSync(resolve(root, path)).size <= 0) throw new Error(`v521-empty:${path}`);
}

console.log(
  JSON.stringify(
    {
      status: "passed-v521-low-memory-direct-fixed-band-stokes-oracle",
      artifactSha256: artifact.artifactSha256,
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
