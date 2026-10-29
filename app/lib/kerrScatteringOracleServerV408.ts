import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrScatteringOracleSummaryV408,
  parseKerrScatteringOracleArtifactV408,
  type KerrScatteringOracleArtifactV408,
  type KerrScatteringOracleSummaryV408,
} from "./kerrScatteringOracleV408";

const ARTIFACT_PATH = "dist/science/kerr-scattering-oracle-v408/portable-envelope.json";
const MAXIMUM_BYTES = 256 * 1024;
const transient = new Set(["generatedAt", "artifactSha256", "observedPeakRssGiB"]);
type LoadedV408 = Readonly<{ artifact: KerrScatteringOracleArtifactV408; summary: KerrScatteringOracleSummaryV408; bytes: Uint8Array; fileSha256: string }>;
let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedV408> }> | null = null;

const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));

export async function loadKerrScatteringOracleArtifactV408(root = process.cwd()): Promise<LoadedV408> {
  const path = resolve(root, ARTIFACT_PATH);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAXIMUM_BYTES) throw new Error("v408-oracle-artifact-size");
  const bytes = await readFile(path);
  const fileSha256 = sha256(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrScatteringOracleArtifactV408(JSON.parse(bytes.toString("utf8")));
    if (sha256(JSON.stringify(canonicalize(artifact))) !== artifact.artifactSha256) throw new Error("v408-oracle-artifact-sha");
    return Object.freeze({ artifact, summary: createKerrScatteringOracleSummaryV408(artifact), bytes: new Uint8Array(bytes), fileSha256 });
  });
  cache = Object.freeze({ fingerprint, promise });
  try {
    return await promise;
  } catch (error) {
    if (cache?.promise === promise) cache = null;
    throw error;
  }
}

export function resetKerrScatteringOracleServerV408CacheForTests(): void {
  cache = null;
}
