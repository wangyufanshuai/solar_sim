import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const sourceRoot = resolve(root, "../../orbit-relativity-engine/dist/reference");
const transportRoot = resolve(root, "../../orbit-relativity-engine/dist/transport-v562");
const outputRoot = resolve(root, "dist/science/orbit-relativity-engine-v561");
const sourceFiles = ["engine-manifest.json", "summary.json", "observables.fits", "image.png"];
const transportFiles = ["transport.json", "transport-summary.json", "transport.h5", "polarization-observables.fits", "transport-verification-receipt.json"];
const transient = new Set(["generatedAt", "manifestSha256", "artifactSha256", "resultSha256"]);
const bytes = (path) => readFileSync(path);
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
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
const atomicJson = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  const part = `${path}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, path);
};

const sourceManifestPath = resolve(sourceRoot, "engine-manifest.json");
const sourceManifest = JSON.parse(bytes(sourceManifestPath).toString("utf8"));
if (sourceManifest.version !== "v1-orbit-relativity-engine-manifest" || sourceManifest.canonicalSerialization !== "orbit-canonical-json-v1-number-e16" || !/^[0-9a-f]{64}$/.test(sourceManifest.manifestSha256) || sha(sourceManifest.config) !== sourceManifest.configCanonicalSha256) throw new Error("v561-engine-source-manifest");
if (!Array.isArray(sourceManifest.sourceManifest) || sha(sourceManifest.sourceManifest) !== sourceManifest.sourceSha256) throw new Error("v561-engine-source-provenance");
const engineProjectRoot = resolve(sourceRoot, "..", "..");
for (const entry of sourceManifest.sourceManifest) {
  const path = resolve(engineProjectRoot, entry.path);
  if (!statSync(path).isFile() || statSync(path).size !== entry.bytes || fileSha(path) !== entry.sha256) throw new Error(`v561-engine-source-provenance-file:${entry.path}`);
}
for (const entry of sourceManifest.files ?? []) {
  const path = resolve(sourceRoot, entry.path);
  if (!statSync(path).isFile() || statSync(path).size !== entry.bytes || fileSha(path) !== entry.sha256) throw new Error(`v561-engine-source-file:${entry.path}`);
}
const transportReceiptPath = resolve(transportRoot, "transport-verification-receipt.json");
const transportReceipt = JSON.parse(bytes(transportReceiptPath).toString("utf8"));
if (transportReceipt.status !== "passed-walker-penrose-independent-parallel-transport" || transportReceipt.measuredAuthority !== false || transportReceipt.sciencePayloadMutation !== false || !/^[0-9a-f]{64}$/.test(transportReceipt.receiptSha256)) throw new Error("v561-engine-transport-boundary");
for (const name of transportFiles) {
  const path = resolve(transportRoot, name);
  if (!statSync(path).isFile()) throw new Error(`v561-engine-transport-file:${name}`);
}

mkdirSync(outputRoot, { recursive: true });
for (const name of sourceFiles) copyFileSync(resolve(sourceRoot, name), resolve(outputRoot, name));
for (const name of transportFiles) copyFileSync(resolve(transportRoot, name), resolve(outputRoot, name));
const summary = JSON.parse(bytes(resolve(outputRoot, "summary.json")).toString("utf8"));
if (summary.qualification?.cpuAuthority !== true || summary.qualification?.measuredAuthority !== false || summary.qualification?.grmhd !== false) throw new Error("v561-engine-science-boundary");

const sourceFilesAudit = sourceFiles.map((name) => ({
  path: name,
  bytes: statSync(resolve(outputRoot, name)).size,
  sha256: fileSha(resolve(outputRoot, name)),
}));
const transportFilesAudit = transportFiles.map((name) => ({
  path: name,
  bytes: statSync(resolve(outputRoot, name)).size,
  sha256: fileSha(resolve(outputRoot, name)),
}));
const importedFiles = [...sourceFilesAudit, ...transportFilesAudit];
const unsigned = {
  version: "v1-orbit-atlas-engine-import-v561",
  generatedAt: "2026-08-02T00:00:00Z",
  status: "qualified-cpu-reference-engine-kerr-transport-measured-unavailable-grmhd-unavailable",
  sourceProject: "../../orbit-relativity-engine",
  sourceEngineVersion: sourceManifest.engineVersion,
  canonicalSerialization: sourceManifest.canonicalSerialization,
  sourceManifestSha256: sourceManifest.manifestSha256,
  sourceManifestFileSha256: fileSha(sourceManifestPath),
  sourceConfigCanonicalSha256: sourceManifest.configCanonicalSha256,
  sourceEngineSourceSha256: sourceManifest.sourceSha256,
  sourceEngineSourceManifest: sourceManifest.sourceManifest,
  importedFiles,
  summary: {
    metric: summary.metric,
    spin: summary.spin,
    observer: summary.observer,
    counts: summary.counts,
    benchmarks: summary.benchmarks,
    rayCount: summary.rays.length,
    transport: {
      status: transportReceipt.status,
      receiptSha256: transportReceipt.receiptSha256,
      maxWalkerPenroseRelativeDrift: transportReceipt.maxWalkerPenroseRelativeDrift,
      maxIndependentEvpaDifferenceRad: transportReceipt.maxIndependentEvpaDifferenceRad,
      extendedBenchmarkSuiteQualified: transportReceipt.benchmarks?.extendedBenchmarkSuiteQualified === true,
    },
  },
  qualification: {
    cpuAuthority: true,
    gpuShadow: false,
    measuredAuthority: false,
    denseImage: false,
    grmhd: false,
    webConsumerAllowed: true,
  },
  boundary: {
    formalProductPointer: "v263",
    defaultKernel: "legacy-eih-1pn",
    sciencePayloadImmutable: true,
    cinematicWritebackForbidden: true,
    transportStatus: "qualified-cpu-kerr-walker-penrose-independent-parallel-transport",
    radiativeTransferStatus: "blocked-no-plasma-model",
  },
  sourceManifest: importedFiles,
  sourceSha256: sha(importedFiles),
};
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
atomicJson(resolve(outputRoot, "import-manifest.json"), artifact);
console.log(JSON.stringify({
  status: artifact.status,
  output: "dist/science/orbit-relativity-engine-v561/import-manifest.json",
  artifactSha256: artifact.artifactSha256,
  sourceEngineVersion: artifact.sourceEngineVersion,
  rayCount: artifact.summary.rayCount,
  measuredAuthority: false,
  grmhd: false,
}, null, 2));
