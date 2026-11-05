import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const python = spawnSync("python", ["-m", "pytest", "scripts/test-kerr-response-aware-fits-column-schema-v538.py", "-q", "-o", "asyncio_default_fixture_loop_scope=function"], { cwd: process.cwd(), encoding: "utf8", stdio: "inherit" });
if (python.status !== 0) throw new Error(`v538-python-tests-exit-${python.status}`);
const root = process.cwd();
const paths = { artifact: "dist/science/kerr-response-aware-fits-column-schema-v538/atlas.json", csv: "dist/science/kerr-response-aware-fits-column-schema-v538/column-schema.csv", runtime: "dist/science/kerr-response-aware-fits-column-schema-v538/runtime-audit.json", evidence: "dist/science/orbit-atlas-shadow-v538-evidence.json", pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v538.json", formal: "dist/release/orbit-atlas-current-product-evidence-v263.json", dense: "dist/science/kerr-campaign-v314/campaign-state.json" };
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256", "columnSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const compare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => compare(left, right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const artifact = read(paths.artifact), runtime = read(paths.runtime), evidence = read(paths.evidence), pointer = read(paths.pointer), formal = read(paths.formal), formalEvidence = read(formal.source), dense = read(paths.dense);
if (sha(artifact) !== artifact.artifactSha256 || artifact.columns.some((column) => sha(column) !== column.columnSha256) || sha(runtime) !== runtime.artifactSha256 || sha(evidence) !== evidence.evidenceSha256 || sha(pointer) !== pointer.pointerSha256
  || pointer.evidence.fileSha256 !== fileSha(paths.evidence) || artifact.export.csvFileSha256 !== fileSha(paths.csv) || artifact.columns.length !== 17 || artifact.counts.qualifiedColumnCount !== 17
  || artifact.counts.physicalUncertaintyValueCount !== 0 || artifact.counts.pixelSampleCount !== 0 || artifact.counts.rasterPixelCount !== 0 || artifact.counts.fitsImageHduCount !== 0 || artifact.counts.pngImageCount !== 0
  || artifact.invariants.physicalUncertaintyFalseMeansZeroUncertainty !== false || artifact.invariants.pixelFalseMeansZeroValuedPixel !== false || artifact.invariants.continuousCoordinatesArePixelSamples !== false
  || runtime.runtime.automaticRequestCount !== 0 || runtime.runtime.explicitRequestCount !== 1 || runtime.runtime.finalResourceStatus !== "baseline" || runtime.detailCatalog.detailCount !== 40 || runtime.independentReplay.columnShaReplayCount !== 17
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false || pointer.capabilities.v314DenseCampaign !== "incomplete-0-of-49"
  || dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false || dense.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v538-boundary");
for (const [label, source] of [["artifact", artifact], ["runtime", runtime], ["evidence", evidence]]) { for (const entry of source.sourceManifest) if (fileSha(entry.path) !== entry.sha256) throw new Error(`v538-${label}-manifest:${entry.path}`); if (sha(source.sourceManifest) !== source.sourceSha256) throw new Error(`v538-${label}-manifest-sha`); }
console.log(JSON.stringify({ status: "passed-v538-low-memory-fits-column-semantics-and-v8r7-runtime", artifactSha256: artifact.artifactSha256, runtimeArtifactSha256: runtime.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, qualifiedColumns: "17/17", physicalUncertaintyValues: 0, pixelSamples: 0, rasterPixels: 0, imageHdus: 0, pngImages: 0, detailCatalog: "40/40", denseCampaign: "0/49", browserQualification: "not-run", formalProductPointer: "v263" }, null, 2));
