import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { canonicalKerrReplayCompatibilityV542, parseKerrReplayCompatibilityArtifactV542, type KerrReplayCompatibilityArtifactV542 } from "./kerrReplayCompatibilityV542";

const ROOT = "dist/science/kerr-replay-compatibility-v542";
const PATHS = Object.freeze({ atlas: `${ROOT}/atlas.json`, preflight: `${ROOT}/preflight-receipt.json`, matrix: `${ROOT}/compatibility-matrix.json`, validator: `${ROOT}/orbit-atlas-v542-stdlib-preflight.py` });
export const KERR_REPLAY_COMPATIBILITY_MAX_SUMMARY_BYTES_V542 = 128 * 1024;
export const KERR_REPLAY_COMPATIBILITY_MAX_EXPORT_BYTES_V542 = 256 * 1024;
type ExportKeyV542 = keyof typeof PATHS;
type LoadedV542 = Readonly<{ artifact: KerrReplayCompatibilityArtifactV542; exports: Readonly<Record<ExportKeyV542, Readonly<{ name: string; bytes: Uint8Array; fileSha256: string; contentType: string }>>> }>;
let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedV542> }> | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const names: Readonly<Record<ExportKeyV542, string>> = Object.freeze({ atlas: "orbit-atlas-kerr-replay-compatibility-v542.json", preflight: "orbit-atlas-v542-stdlib-preflight-receipt.json", matrix: "orbit-atlas-v542-compatibility-matrix.json", validator: "orbit-atlas-v542-stdlib-preflight.py" });

export async function loadKerrReplayCompatibilityV542(root = process.cwd()): Promise<LoadedV542> {
  const keys = Object.keys(PATHS) as ExportKeyV542[];
  const targets = keys.map((key) => resolve(root, PATHS[key]));
  const metadata = await Promise.all(targets.map((path) => stat(path)));
  if (metadata.some((entry) => !entry.isFile() || entry.size <= 0 || entry.size > KERR_REPLAY_COMPATIBILITY_MAX_EXPORT_BYTES_V542)) throw new Error("v542-file-size");
  const buffers = await Promise.all(targets.map((path) => readFile(path))), hashes = buffers.map((buffer) => sha(buffer));
  const fingerprint = metadata.map((entry, index) => `${entry.mtimeMs}:${entry.size}:${hashes[index]}`).join(":");
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrReplayCompatibilityArtifactV542(JSON.parse(buffers[0].toString("utf8")));
    const preflight = JSON.parse(buffers[1].toString("utf8")), matrix = JSON.parse(buffers[2].toString("utf8"));
    if (sha(canonicalKerrReplayCompatibilityV542(artifact)) !== artifact.artifactSha256 || sha(canonicalKerrReplayCompatibilityV542(preflight)) !== artifact.preflight.preflightSha256 || sha(canonicalKerrReplayCompatibilityV542(matrix)) !== artifact.compatibility.matrixSha256 || JSON.stringify(preflight) !== JSON.stringify(artifact.preflight) || JSON.stringify(matrix) !== JSON.stringify(artifact.compatibility) || artifact.exports.preflight.fileSha256 !== hashes[1] || artifact.exports.matrix.fileSha256 !== hashes[2] || artifact.exports.validator.fileSha256 !== hashes[3]) throw new Error("v542-artifact-integrity");
    const exports = Object.fromEntries(keys.map((key, index) => [key, Object.freeze({ name: names[key], bytes: new Uint8Array(buffers[index]), fileSha256: hashes[index], contentType: key === "validator" ? "text/x-python; charset=utf-8" : "application/json; charset=utf-8" })])) as LoadedV542["exports"];
    return Object.freeze({ artifact, exports: Object.freeze(exports) });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrReplayCompatibilityServerCacheForTestsV542(): void { cache = null; }
