import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-fixed-band-stokes-v520/stokes-payload.json",
  runtime: "dist/science/kerr-fixed-band-stokes-v520/runtime-audit.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v519-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v519.json",
  evidence: "dist/science/orbit-atlas-shadow-v520-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v520.json",
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
  artifact.version !== "v520-kerr-fixed-band-stokes-payload-v1" ||
  runtime.version !== "v520-kerr-fixed-band-stokes-runtime-audit-v1" ||
  previousEvidence.version !== "orbit-atlas-shadow-v519-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v519" ||
  evidence.version !== "orbit-atlas-shadow-v520-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v520" ||
  sha(artifact) !== artifact.artifactSha256 ||
  sha(runtime) !== runtime.artifactSha256 ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  runtime.source.stokesArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v520StokesArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v520RuntimeArtifactSha256 !== runtime.artifactSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence.fileSha256 !== fileSha(paths.evidence)
) {
  throw new Error("v520-canonical-chain");
}

const expectedIdentities = new Set(
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
    !expectedIdentities.delete(identity) ||
    row.linearPolarizationFraction !== "0.12" ||
    row.energyStokes.v !== "unavailable-not-modeled" ||
    row.photonStokes.v !== "unavailable-not-modeled" ||
    row.uncertainty.crossChannelIndependenceProven !== false ||
    row.uncertainty.rssApplied !== false ||
    !Number.isFinite(Number(row.normalizedQ)) ||
    !Number.isFinite(Number(row.normalizedU)) ||
    Number(row.energyStokes.iWM2Sr) <= 0 ||
    Number(row.photonStokes.iPerSM2Sr) <= 0
  ) {
    throw new Error(`v520-row-boundary:${identity}`);
  }
}
if (
  expectedIdentities.size !== 0 ||
  artifact.rows.length !== 24 ||
  artifact.counts.rayCount !== 4 ||
  artifact.counts.bandCount !== 3 ||
  artifact.counts.transportMethodCount !== 2 ||
  artifact.counts.rowCount !== 24 ||
  artifact.counts.energyStokesTripletCount !== 24 ||
  artifact.counts.photonStokesTripletCount !== 24 ||
  artifact.counts.measuredStokesRowCount !== 0 ||
  artifact.counts.circularStokesRowCount !== 0 ||
  artifact.counts.detectorProjectedRowCount !== 0 ||
  artifact.counts.sciencePixelRowCount !== 0 ||
  artifact.oracle.backend !== "mpmath-1.3.0" ||
  artifact.oracle.decimalDigits !== 80 ||
  artifact.oracle.independentTransportPathsPreserved !== true ||
  artifact.oracle.methodValuesAveraged !== false ||
  !below(artifact.maxima.linearFractionResidual, artifact.limits.linearFractionResidual) ||
  !below(artifact.maxima.evpaReconstructionDeg, artifact.limits.evpaReconstructionDeg) ||
  !below(artifact.maxima.wpKsEvpaDifferenceDeg, artifact.limits.wpKsEvpaDifferenceDeg) ||
  !below(
    artifact.maxima.wpKsNormalizedQDifference,
    artifact.limits.wpKsNormalizedStokesDifference,
  ) ||
  !below(
    artifact.maxima.wpKsNormalizedUDifference,
    artifact.limits.wpKsNormalizedStokesDifference,
  ) ||
  Number(artifact.maxima.physicalConeViolation) !== 0
) {
  throw new Error("v520-stokes-boundary");
}

if (
  artifact.qualification.fixedBandEnergyStokesQualified !== true ||
  artifact.qualification.fixedBandPhotonStokesQualified !== true ||
  artifact.qualification.walkerPenrosePathQualified !== true ||
  artifact.qualification.independentKsParallelTransportPathQualified !== true ||
  artifact.qualification.measuredPolarimetryQualified !== false ||
  artifact.boundary.modelPredictionOnly !== true ||
  artifact.boundary.measuredPolarimeterAvailable !== false ||
  artifact.boundary.measuredMuellerCalibrationAvailable !== false ||
  artifact.boundary.circularPolarizationAvailable !== false ||
  artifact.boundary.faradayRotationAvailable !== false ||
  artifact.boundary.scienceRasterAuthorityAvailable !== false ||
  artifact.boundary.cinematicScienceWritebackAllowed !== false ||
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
  pointer.formalProductPointerAdvanced !== false ||
  pointer.localShadowDefaultApplied !== false ||
  pointer.capabilities.v520MeasuredStokes !== "unavailable-0-rows" ||
  pointer.capabilities.v520CircularStokes !== "unavailable-0-rows" ||
  pointer.capabilities.v520DetectorCalibration !== "incomplete-0-of-6" ||
  pointer.capabilities.v520BrowserQualification !== "not-run" ||
  pointer.capabilities.v314DenseCampaign !== "incomplete-0-of-49"
) {
  throw new Error("v520-continuity-boundary");
}

const component = text("app/components/KerrFixedBandStokesV520.tsx");
const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV520.tsx");
const route = text("app/api/atlas/relativity-evidence/v520/fixed-band-stokes/route.ts");
const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
if (
  !component.includes('data-atlas-v520-row-count="24"') ||
  !component.includes('data-atlas-v520-measured-stokes-row-count="0"') ||
  !component.includes('data-atlas-v520-circular-stokes-row-count="0"') ||
  component.includes("Math.random") ||
  component.includes("<canvas") ||
  component.includes("�") ||
  !wrapper.includes('import("./KerrFixedBandStokesV520")') ||
  wrapper.includes("fetch(") ||
  wrapper.includes("�") ||
  !route.includes('delivery !== "local-shadow"') ||
  !route.includes('download !== "stokes"') ||
  !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV520"') ||
  !workbench.includes("<KerrPhotonMetrologyObservatoryIntentV520")
) {
  throw new Error("v520-source-boundary");
}

for (const [label, source] of [
  ["artifact", artifact],
  ["runtime", runtime],
  ["evidence", evidence],
]) {
  if (!Array.isArray(source.sourceManifest) || source.sourceManifest.length === 0) {
    throw new Error(`v520-${label}-source-manifest-empty`);
  }
  for (const entry of source.sourceManifest) {
    if (fileSha(entry.path) !== entry.sha256) {
      throw new Error(`v520-${label}-source-manifest:${entry.path}`);
    }
  }
  if (sha(source.sourceManifest) !== source.sourceSha256) {
    throw new Error(`v520-${label}-source-manifest-canonical`);
  }
}

for (const path of Object.values(paths)) {
  if (statSync(resolve(root, path)).size <= 0) throw new Error(`v520-empty:${path}`);
}

console.log(
  JSON.stringify(
    {
      status: "passed-v520-low-memory-fixed-band-dual-transport-stokes",
      artifactSha256: artifact.artifactSha256,
      runtimeArtifactSha256: runtime.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rows: artifact.counts.rowCount,
      maximumWpKsEvpaDifferenceDeg: artifact.maxima.wpKsEvpaDifferenceDeg,
      measuredStokesRows: 0,
      circularStokesRows: 0,
      detectorCalibration: "0/6",
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
