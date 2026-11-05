import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const python = spawnSync("python", ["-m", "pytest", "scripts/test-kerr-response-aware-sparse-fits-v537.py", "-q", "-o", "asyncio_default_fixture_loop_scope=function"], { cwd: process.cwd(), encoding: "utf8", stdio: "inherit" });
if (python.status !== 0) throw new Error(`v537-python-tests-exit-${python.status}`);

const root = process.cwd();
const paths = { artifact: "dist/science/kerr-response-aware-sparse-fits-v537/atlas.json", fits: "dist/science/kerr-response-aware-sparse-fits-v537/response-aware-sparse-table.fits", runtime: "dist/science/kerr-response-aware-sparse-fits-v537/runtime-audit.json", evidence: "dist/science/orbit-atlas-shadow-v537-evidence.json", pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v537.json", formal: "dist/release/orbit-atlas-current-product-evidence-v263.json", dense: "dist/science/kerr-campaign-v314/campaign-state.json" };
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const compare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => compare(left, right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const artifact = read(paths.artifact);
const runtime = read(paths.runtime);
const evidence = read(paths.evidence);
const pointer = read(paths.pointer);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const dense = read(paths.dense);
const fitsHeader = bytes(paths.fits).subarray(0, 11520).toString("ascii");
if (sha(artifact) !== artifact.artifactSha256 || sha(runtime) !== runtime.artifactSha256 || sha(evidence) !== evidence.evidenceSha256 || sha(pointer) !== pointer.pointerSha256
  || pointer.evidence.fileSha256 !== fileSha(paths.evidence) || artifact.fits.fileSha256 !== fileSha(paths.fits) || artifact.fits.bytes !== bytes(paths.fits).byteLength
  || artifact.fits.hduCount !== 2 || artifact.fits.primaryNaxis !== 0 || artifact.fits.binaryTableHduCount !== 1 || artifact.fits.imageHduCount !== 0
  || artifact.fits.rowCount !== 4 || artifact.fits.columnCount !== 17 || artifact.fits.checksumCardCount !== 4 || artifact.fits.checksumValidationPassed !== true || artifact.fits.abByteIdentical !== true
  || artifact.counts.rasterPixelCount !== 0 || artifact.counts.pixelSampleCount !== 0 || artifact.counts.pngImageCount !== 0
  || !fitsHeader.startsWith("SIMPLE  =") || !fitsHeader.includes("XTENSION= 'BINTABLE'") || fitsHeader.includes("XTENSION= 'IMAGE   '") || !fitsHeader.includes("EXTNAME = 'SPARSE_SCIENCE'")
  || runtime.runtime.automaticRequestCount !== 0 || runtime.runtime.explicitRequestCount !== 1 || runtime.runtime.finalResourceStatus !== "baseline" || runtime.detailCatalog.detailCount !== 39
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false || pointer.capabilities.v314DenseCampaign !== "incomplete-0-of-49"
  || dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false || dense.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v537-boundary");
for (const [label, source] of [["artifact", artifact], ["runtime", runtime], ["evidence", evidence]]) {
  for (const entry of source.sourceManifest) if (fileSha(entry.path) !== entry.sha256) throw new Error(`v537-${label}-manifest:${entry.path}`);
  if (sha(source.sourceManifest) !== source.sourceSha256) throw new Error(`v537-${label}-manifest-sha`);
}
console.log(JSON.stringify({ status: "passed-v537-low-memory-deterministic-fits-binary-table-and-v8r6-runtime", artifactSha256: artifact.artifactSha256, fitsFileSha256: artifact.fits.fileSha256, runtimeArtifactSha256: runtime.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, rows: 4, columns: 17, fitsBinaryTables: 1, fitsImageHdus: 0, rasterPixels: 0, pngImages: 0, detailCatalog: "39/39", denseCampaign: "0/49", browserQualification: "not-run", formalProductPointer: "v263" }, null, 2));
