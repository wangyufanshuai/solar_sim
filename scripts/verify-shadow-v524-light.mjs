import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-analyzer-identifiability-v524/identifiability.json",
  runtime: "dist/science/kerr-analyzer-identifiability-v524/runtime-audit.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v523-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v523.json",
  evidence: "dist/science/orbit-atlas-shadow-v524-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v524.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
};
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const text = (path) => bytes(path).toString("utf8");
const read = (path) => JSON.parse(text(path));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !transient.has(key))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

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
  artifact.version !== "v524-kerr-analyzer-identifiability-and-nullspace-v1"
  || runtime.version !== "v524-kerr-analyzer-identifiability-runtime-audit-v1"
  || previousEvidence.version !== "orbit-atlas-shadow-v523-evidence-v1"
  || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v523"
  || evidence.version !== "orbit-atlas-shadow-v524-evidence-v1"
  || pointer.version !== "orbit-atlas-current-local-shadow-candidate-v524"
  || sha(artifact) !== artifact.artifactSha256
  || sha(runtime) !== runtime.artifactSha256
  || sha(previousEvidence) !== previousEvidence.evidenceSha256
  || sha(previousPointer) !== previousPointer.pointerSha256
  || sha(evidence) !== evidence.evidenceSha256
  || sha(pointer) !== pointer.pointerSha256
  || runtime.source.identifiabilityArtifactSha256 !== artifact.artifactSha256
  || evidence.dependency.v524IdentifiabilityArtifactSha256 !== artifact.artifactSha256
  || evidence.dependency.v524RuntimeArtifactSha256 !== runtime.artifactSha256
  || pointer.evidence.canonicalSha256 !== evidence.evidenceSha256
  || pointer.evidence.fileSha256 !== fileSha(paths.evidence)
) throw new Error("v524-canonical-chain");

const maxima = Object.values(artifact.maxima).map(Number);
if (
  artifact.counts.matrixCount !== 3
  || artifact.counts.svdCount !== 3
  || artifact.counts.singularValueCount !== 9
  || artifact.counts.nullspaceDimension !== 2
  || artifact.nullspace.basis.length !== 6
  || artifact.nullspace.basis.some((row) => row.length !== 2)
  || maxima.some((value) => value >= Number(artifact.limits.multiprecisionResidual))
  || artifact.diagnostics.idealDualBeam8x3.rank !== 3
  || artifact.diagnostics.idealDualBeam8x3.nullity !== 0
  || artifact.diagnostics.normalizedDifference4x2.rank !== 2
  || artifact.diagnostics.normalizedDifference4x2.nullity !== 0
  || artifact.diagnostics.uncalibratedBiasAugmented4x6.rank !== 4
  || artifact.diagnostics.uncalibratedBiasAugmented4x6.nullity !== 2
  || artifact.qualification.calibrationNullspaceExposed !== true
  || artifact.qualification.jointScienceCalibrationIdentifiabilityQualified !== false
  || artifact.qualification.measuredInstrumentQualified !== false
  || artifact.qualification.scienceAuthorityPromotionAllowed !== false
  || artifact.boundary.measuredCalibrationAvailable !== false
  || artifact.boundary.expectedElectronCountsAvailable !== false
  || artifact.boundary.scienceRasterAuthorityAvailable !== false
  || runtime.runtime.serverFileBytes > 128 * 1024
  || runtime.runtime.summaryResponseBytes > 128 * 1024
  || runtime.runtime.automaticRequestCount !== 0
  || runtime.runtime.explicitRequestCount !== 1
  || runtime.runtime.singleFlightConsumerCount !== 2
  || runtime.runtime.finalResourceStatus !== "baseline"
  || runtime.visualProfile.scientificPayloadStable !== true
  || runtime.visualProfile.scientificRowsStable !== true
  || runtime.visualProfile.numericScientificStyleInputCount !== 0
  || runtime.visualProfile.rankDrivesStyle !== false
  || runtime.visualProfile.conditionNumberDrivesStyle !== false
  || runtime.visualProfile.nullityDrivesStyle !== false
  || detector.counts.measuredCalibrationFiles !== 0
  || detector.counts.requiredMeasuredCalibrationFiles !== 6
  || dense.status !== "incomplete-0-of-49"
  || dense.completedShardCount !== 0
  || dense.attemptConsumed !== false
  || dense.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84
  || pointer.formalProductPointer !== "v263"
  || pointer.localShadowDefaultApplied !== false
  || pointer.capabilities.v524MatrixOperators !== "qualified-3-of-3"
  || pointer.capabilities.v524CalibrationNullspace !== "exposed-rank-4-nullity-2"
  || pointer.capabilities.v524MeasuredCalibration !== "incomplete-0-of-6"
  || pointer.capabilities.v524BrowserQualification !== "not-run"
  || pointer.capabilities.v314DenseCampaign !== "incomplete-0-of-49"
) throw new Error("v524-science-boundary");

const component = text("app/components/KerrAnalyzerIdentifiabilityV524.tsx");
const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV524.tsx");
const route = text("app/api/atlas/relativity-evidence/v524/analyzer-identifiability/route.ts");
const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
if (
  !component.includes("compareKerrInstrumentHudEncodingsV524")
  || !component.includes("data-atlas-v524-numeric-scientific-style-input-count")
  || !component.includes("measured calibration 0/6")
  || component.includes("Math.random")
  || component.includes("<canvas")
  || component.includes("锟")
  || !wrapper.includes('import("./KerrAnalyzerIdentifiabilityV524")')
  || wrapper.includes("fetch(")
  || wrapper.includes("锟")
  || !route.includes('delivery !== "local-shadow"')
  || !route.includes('download !== "identifiability"')
  || !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV524"')
  || !workbench.includes("<KerrPhotonMetrologyObservatoryIntentV524")
) throw new Error("v524-source-boundary");

for (const [label, source] of [["artifact", artifact], ["runtime", runtime], ["evidence", evidence]]) {
  if (!Array.isArray(source.sourceManifest) || source.sourceManifest.length === 0) {
    throw new Error(`v524-${label}-manifest-empty`);
  }
  for (const entry of source.sourceManifest) {
    if (fileSha(entry.path) !== entry.sha256) throw new Error(`v524-${label}-manifest:${entry.path}`);
  }
  if (sha(source.sourceManifest) !== source.sourceSha256) {
    throw new Error(`v524-${label}-manifest-canonical`);
  }
}
for (const path of Object.values(paths)) {
  if (statSync(resolve(root, path)).size <= 0) throw new Error(`v524-empty:${path}`);
}
console.log(JSON.stringify({
  status: "passed-v524-low-memory-analyzer-identifiability-nullspace-and-v7r3-runtime",
  artifactSha256: artifact.artifactSha256,
  runtimeArtifactSha256: runtime.artifactSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  matrixCount: artifact.counts.matrixCount,
  singularValueCount: artifact.counts.singularValueCount,
  nullspaceDimension: artifact.counts.nullspaceDimension,
  maximumMultiprecisionResidual: Math.max(...maxima),
  measuredCalibration: "0/6",
  denseCampaign: "0/49",
  browserQualification: "not-run",
  formalProductPointer: "v263",
}, null, 2));
