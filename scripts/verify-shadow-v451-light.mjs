import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const fileSha = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const artifact = read("dist/science/kerr-detector-input-admission-v451/input-admission-qualification.json");
const evidence = read("dist/science/orbit-atlas-shadow-v451-evidence.json");
const pointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v451.json");
const v443 = read("dist/science/kerr-detector-geometry-staging-v443/staging-inspect.json");
const state = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
if (
  sha(artifact) !== artifact.artifactSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  artifact.status !== "blocked-v443-detector-inputs-missing" ||
  artifact.detector.requiredFileCount !== 6 ||
  artifact.detector.readyFileCount !== 0 ||
  artifact.detector.missingFileIds.length !== 6 ||
  artifact.detector.invalidFileIds.length !== 0 ||
  artifact.detector.files.length !== 6 ||
  artifact.detector.files.some((file) => file.status !== "missing" || file.bytes !== 0 || file.sha256 !== null) ||
  artifact.semanticContract.collectingAreaMeansGeometricAreaWithoutThroughput !== true ||
  artifact.semanticContract.throughputNotMultipliedTwice !== true ||
  artifact.semanticContract.photonToElectronSemanticsExplicit !== true ||
  artifact.semanticContract.observedCountsAvailable !== false ||
  artifact.semanticContract.scienceRasterAllowed !== false ||
  artifact.qualification.inputInventoryQualified !== false ||
  artifact.qualification.provenanceShaLinkageQualified !== false ||
  artifact.qualification.measuredDetectorAuthorityGranted !== false ||
  artifact.qualification.runtimeProjectionAllowed !== false ||
  artifact.qualification.scienceRasterAuthority !== false ||
  artifact.boundary.currentInputRowsAreMeasured !== false ||
  artifact.boundary.detectorProjectionMayRun !== false ||
  artifact.boundary.scienceImageMayBeMaterialized !== false ||
  v443.status !== "blocked-staging-directory-missing" ||
  v443.readyFileCount !== 0 ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  pointer.capabilities.v451DetectorInputInventory !== "blocked-six-required-files-missing" ||
  pointer.capabilities.v451MeasuredDetectorAuthority !== "not-granted" ||
  pointer.capabilities.v451RuntimeProjection !== "blocked" ||
  pointer.capabilities.v451ScienceRaster !== "blocked" ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v451-fail-closed-validation");
}
for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) throw new Error(`v451-source-manifest-mismatch:${entry.path}`);
}
if (/[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(JSON.stringify({ artifact, evidence, pointer }))) {
  throw new Error("v451-transient-evidence-leak");
}
console.log(JSON.stringify({
  status: "passed-v451-low-memory-fail-closed",
  artifactSha256: artifact.artifactSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  requiredFileCount: 6,
  readyFileCount: 0,
  missingFileIds: artifact.detector.missingFileIds,
  measuredDetectorAuthority: "not-granted",
  runtimeProjection: "blocked",
  scienceRaster: "blocked",
  denseCampaign: state.status,
  browserQualification: "not-run",
}, null, 2));
