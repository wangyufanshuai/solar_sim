import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-grid-axis-influence-v533/atlas.json",
  runtime: "dist/science/kerr-grid-axis-influence-v533/runtime-audit.json",
  evidence: "dist/science/orbit-atlas-shadow-v533-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v533.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
};
const transient = new Set([
  "generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256",
]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !transient.has(key))
    .sort(([a], [b]) => compare(a, b))
    .map(([key, entry]) => [key, canonicalize(entry)]));
};
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const artifact = read(paths.artifact);
const runtime = read(paths.runtime);
const evidence = read(paths.evidence);
const pointer = read(paths.pointer);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const dense = read(paths.dense);

if (sha(artifact) !== artifact.artifactSha256
  || sha(runtime) !== runtime.artifactSha256
  || sha(evidence) !== evidence.evidenceSha256
  || sha(pointer) !== pointer.pointerSha256
  || evidence.dependency.v533AxisInfluenceArtifactSha256 !== artifact.artifactSha256
  || evidence.dependency.v533RuntimeArtifactSha256 !== runtime.artifactSha256
  || pointer.evidence.fileSha256 !== fileSha(paths.evidence)) {
  throw new Error("v533-canonical-chain");
}
if (artifact.counts.axisSummaryRowCount !== 8
  || artifact.counts.directedAxisComparisonCount !== 24
  || artifact.counts.scientificGeometryInputCount !== 46
  || artifact.stochasticInfluence.singleDominantAxis !== "cost-ratio"
  || artifact.deterministicInfluence.singleDominantAxis !== "cost-ratio"
  || artifact.influenceDefinition.singleScoreComputed !== false
  || artifact.influenceDefinition.aggregationIsProbability !== false
  || artifact.selectionBoundary.axisPriorAvailable !== false
  || artifact.selectionBoundary.recommendedAxisAvailable !== false
  || artifact.acquisitionBoundary.readyMeasuredFileCount !== 0
  || runtime.runtime.automaticRequestCount !== 0
  || runtime.runtime.explicitRequestCount !== 1
  || runtime.runtime.singleFlightConsumerCount !== 2
  || runtime.runtime.finalResourceStatus !== "baseline"
  || runtime.detailCatalog.detailCount !== 35
  || runtime.detailCatalog.inheritedDetailCount !== 34
  || runtime.detailCatalog.newLazyImportCount !== 1
  || runtime.visualProfile.scientificGeometryInputCount !== 46
  || runtime.visualProfile.numericScientificStyleInputCount !== 0
  || pointer.formalProductPointer !== "v263"
  || pointer.localShadowDefaultApplied !== false
  || pointer.capabilities.v533RecommendedAxis !== "unavailable"
  || pointer.capabilities.v533MeasuredFileContract !== "incomplete-0-of-6"
  || pointer.capabilities.v533BrowserQualification !== "not-run"
  || pointer.capabilities.v314DenseCampaign !== "incomplete-0-of-49"
  || dense.status !== "incomplete-0-of-49"
  || dense.completedShardCount !== 0
  || dense.attemptConsumed !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84) {
  throw new Error("v533-science-boundary");
}
for (const [label, source] of [["artifact", artifact], ["runtime", runtime], ["evidence", evidence]]) {
  if (!Array.isArray(source.sourceManifest) || source.sourceManifest.length === 0) {
    throw new Error(`v533-${label}-manifest-empty`);
  }
  for (const entry of source.sourceManifest) {
    if (fileSha(entry.path) !== entry.sha256) throw new Error(`v533-${label}-manifest:${entry.path}`);
  }
  if (sha(source.sourceManifest) !== source.sourceSha256) throw new Error(`v533-${label}-manifest-sha`);
}
for (const path of Object.values(paths)) {
  if (statSync(resolve(root, path)).size <= 0) throw new Error(`v533-empty:${path}`);
}

console.log(JSON.stringify({
  status: "passed-v533-low-memory-grid-axis-influence-and-v8r2-runtime",
  artifactSha256: artifact.artifactSha256,
  runtimeArtifactSha256: runtime.artifactSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  axisSummaries: 8,
  directedComparisons: 24,
  scientificGeometryInputs: 46,
  detailCatalog: "35/35",
  recommendedAxis: "unavailable",
  measuredCalibration: "0/6",
  denseCampaign: "0/49",
  browserQualification: "not-run",
  formalProductPointer: "v263",
}, null, 2));
