import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const folder = "dist/science/orbit-relativity-engine-v561";
const path = resolve(root, folder, "import-manifest.json");
const transient = new Set(["generatedAt", "manifestSha256", "artifactSha256", "resultSha256"]);
const bytes = (file) => readFileSync(resolve(root, file));
const fileSha = (file) => createHash("sha256").update(bytes(file)).digest("hex");
const read = (file) => JSON.parse(bytes(file).toString("utf8"));
const canonicalNumber = (value) => {
  if (!Number.isFinite(value)) throw new Error("v561-engine-canonical-number");
  if (value === 0) return "0.0000000000000000e+0";
  return value.toExponential(16).replace(/e([+-])0+(\d+)/, "e$1$2");
};
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : typeof value === "number"
    ? canonicalNumber(value)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const artifact = read(path);
if (sha(artifact) !== artifact.artifactSha256) throw new Error("v561-engine-import-sha");
if (artifact.version !== "v1-orbit-atlas-engine-import-v561" || artifact.canonicalSerialization !== "orbit-canonical-json-v1-number-e16" || artifact.qualification.cpuAuthority !== true || artifact.qualification.measuredAuthority !== false || artifact.qualification.grmhd !== false || artifact.boundary.formalProductPointer !== "v263" || artifact.boundary.defaultKernel !== "legacy-eih-1pn") throw new Error("v561-engine-import-boundary");
if (artifact.status === "qualified-cpu-reference-engine-kerr-transport-measured-unavailable-grmhd-unavailable" && artifact.boundary.transportStatus !== "qualified-cpu-kerr-walker-penrose-independent-parallel-transport") throw new Error("v561-engine-transport-boundary");
if (!Array.isArray(artifact.sourceEngineSourceManifest) || sha(artifact.sourceEngineSourceManifest) !== artifact.sourceEngineSourceSha256) throw new Error("v561-engine-source-provenance");
for (const entry of artifact.sourceEngineSourceManifest) {
  const path = resolve(root, "../../orbit-relativity-engine", entry.path);
  if (!statSync(path).isFile() || statSync(path).size !== entry.bytes || fileSha(`../../orbit-relativity-engine/${entry.path}`) !== entry.sha256) throw new Error(`v561-engine-source-provenance-file:${entry.path}`);
}
for (const entry of artifact.importedFiles) {
  const relative = `${folder}/${entry.path}`;
  if (!statSync(resolve(root, relative)).isFile() || statSync(resolve(root, relative)).size !== entry.bytes || fileSha(relative) !== entry.sha256) throw new Error(`v561-engine-import-file:${entry.path}`);
}
console.log(JSON.stringify({
  status: "passed-v561-orbit-relativity-engine-import",
  artifactSha256: artifact.artifactSha256,
  sourceEngineVersion: artifact.sourceEngineVersion,
  rayCount: artifact.summary.rayCount,
  importedFiles: artifact.importedFiles.length,
  measuredAuthority: false,
  grmhd: false,
}, null, 2));
