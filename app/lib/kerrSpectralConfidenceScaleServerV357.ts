import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { parseKerrSpectralConfidenceScaleArtifactV357, type KerrSpectralConfidenceScaleArtifactV357 } from "./kerrSpectralConfidenceScaleV357";

const PATH = "dist/science/kerr-spectral-confidence-scale-v357/audit.json";
let cache: { fingerprint: string; promise: Promise<KerrSpectralConfidenceScaleArtifactV357> } | null = null;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));

export async function loadKerrSpectralConfidenceScaleV357(root = process.cwd()): Promise<KerrSpectralConfidenceScaleArtifactV357> {
  const path = resolve(root, PATH); const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) throw new Error("v357-scale-size");
  const bytes = await readFile(path); const fingerprint = `${metadata.size}:${metadata.mtimeMs}:${sha256(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve(bytes).then((source) => { const artifact = parseKerrSpectralConfidenceScaleArtifactV357(JSON.parse(source.toString("utf8"))); if (sha256(JSON.stringify(canonicalize(artifact))) !== artifact.artifactSha256) throw new Error("v357-scale-sha"); return artifact; });
  cache = { fingerprint, promise };
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrSpectralConfidenceScaleServerV357CacheForTests(): void { cache = null; }
