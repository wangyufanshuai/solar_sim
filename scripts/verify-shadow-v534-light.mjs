import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-bandpass-redshift-commutator-v534/atlas.json",
  runtime: "dist/science/kerr-bandpass-redshift-commutator-v534/runtime-audit.json",
  evidence: "dist/science/orbit-atlas-shadow-v534-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v534.json",
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
  || evidence.dependency.v534BandpassRedshiftArtifactSha256 !== artifact.artifactSha256
  || evidence.dependency.v534RuntimeArtifactSha256 !== runtime.artifactSha256
  || pointer.evidence.fileSha256 !== fileSha(paths.evidence)) {
  throw new Error("v534-canonical-chain");
}
if (artifact.counts.commutatorRowCount !== 4
  || artifact.counts.electronExpectationRowCount !== 0
  || artifact.counts.observedCountRowCount !== 0
  || artifact.counts.sciencePixelRowCount !== 0
  || artifact.rows.some((row) => !(row.redshiftBandpassCommutatorRelative > 0))
  || artifact.maxima.v384ObserverBandpassRelativeDifference >= 1e-7
  || artifact.maxima.pythonFrequencyDomainRelativeDifference >= 1e-7
  || artifact.maxima.pythonCommutatorAbsoluteDifference >= 1e-7
  || artifact.maxima.unitRedshiftIdentityResidual >= 1e-12
  || artifact.qualification.nonCommutativityDetected !== true
  || artifact.qualification.measuredDetectorAuthorityGranted !== false
  || artifact.boundary.sourceDossierStatus !== "incomplete-1-of-7"
  || artifact.boundary.measuredCalibrationFiles !== 0
  || runtime.runtime.automaticRequestCount !== 0
  || runtime.runtime.explicitRequestCount !== 1
  || runtime.runtime.singleFlightConsumerCount !== 2
  || runtime.runtime.finalResourceStatus !== "baseline"
  || runtime.detailCatalog.detailCount !== 36
  || runtime.detailCatalog.inheritedDetailCount !== 35
  || runtime.detailCatalog.newLazyImportCount !== 1
  || runtime.visualProfile.scientificGeometryInputCount !== 4
  || runtime.visualProfile.numericScientificStyleInputCount !== 0
  || pointer.formalProductPointer !== "v263"
  || pointer.localShadowDefaultApplied !== false
  || pointer.capabilities.v534MeasuredFileContract !== "incomplete-0-of-6"
  || pointer.capabilities.v534ElectronExpectation !== "unavailable-0-rows"
  || pointer.capabilities.v534BrowserQualification !== "not-run"
  || pointer.capabilities.v314DenseCampaign !== "incomplete-0-of-49"
  || dense.status !== "incomplete-0-of-49"
  || dense.completedShardCount !== 0
  || dense.attemptConsumed !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84) {
  throw new Error("v534-science-boundary");
}
for (const [label, source] of [["artifact", artifact], ["runtime", runtime], ["evidence", evidence]]) {
  if (!Array.isArray(source.sourceManifest) || source.sourceManifest.length === 0) throw new Error(`v534-${label}-manifest-empty`);
  for (const entry of source.sourceManifest) {
    if (fileSha(entry.path) !== entry.sha256) throw new Error(`v534-${label}-manifest:${entry.path}`);
  }
  if (sha(source.sourceManifest) !== source.sourceSha256) throw new Error(`v534-${label}-manifest-sha`);
}
for (const path of Object.values(paths)) {
  if (statSync(resolve(root, path)).size <= 0) throw new Error(`v534-empty:${path}`);
}

console.log(JSON.stringify({
  status: "passed-v534-low-memory-bandpass-redshift-commutator-and-v8r3-runtime",
  artifactSha256: artifact.artifactSha256,
  runtimeArtifactSha256: runtime.artifactSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  commutatorRows: 4,
  commutatorRange: [artifact.minima.redshiftBandpassCommutatorRelative, artifact.maxima.redshiftBandpassCommutatorRelative],
  detailCatalog: "36/36",
  sourceDossier: "1/7",
  measuredCalibration: "0/6",
  electronExpectationRows: 0,
  denseCampaign: "0/49",
  browserQualification: "not-run",
  formalProductPointer: "v263",
}, null, 2));
