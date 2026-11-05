import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { createKerrStokesTransferSummaryV406, parseKerrStokesTransferArtifactV406, type KerrStokesTransferArtifactV406, type KerrStokesTransferSummaryV406 } from "./kerrStokesTransferV406";

const ARTIFACT_PATH = "dist/science/kerr-stokes-transfer-v406/short-gate.json";
const MAXIMUM_BYTES = 256 * 1024;
let cache: Readonly<{ fingerprint: string; promise: Promise<Readonly<{ artifact: KerrStokesTransferArtifactV406; summary: KerrStokesTransferSummaryV406; bytes: Uint8Array; fileSha256: string }>> }> | null = null;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
export async function loadKerrStokesTransferArtifactV406(root = process.cwd()) {
  const path = resolve(root, ARTIFACT_PATH); const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAXIMUM_BYTES) throw new Error("v406-stokes-artifact-size");
  const bytes = await readFile(path); const fileSha256 = sha256(bytes); const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => { const artifact = parseKerrStokesTransferArtifactV406(JSON.parse(bytes.toString("utf8"))); if (sha256(JSON.stringify(canonicalize(artifact))) !== artifact.artifactSha256) throw new Error("v406-stokes-artifact-sha"); return Object.freeze({ artifact, summary: createKerrStokesTransferSummaryV406(artifact), bytes: new Uint8Array(bytes), fileSha256 }); });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}
export function resetKerrStokesTransferServerV406CacheForTests(): void { cache = null; }
