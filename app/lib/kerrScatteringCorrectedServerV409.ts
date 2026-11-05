import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { createKerrScatteringCorrectedSummaryV409, parseKerrScatteringCorrectedArtifactV409, type KerrScatteringCorrectedArtifactV409, type KerrScatteringCorrectedSummaryV409 } from "./kerrScatteringCorrectedV409";

const ARTIFACT_PATH = "dist/science/kerr-scattering-corrected-v409/sparse-stokes.json";
const MAXIMUM_BYTES = 256 * 1024;
const transient = new Set(["generatedAt", "artifactSha256"]);
type LoadedV409 = Readonly<{ artifact: KerrScatteringCorrectedArtifactV409; summary: KerrScatteringCorrectedSummaryV409; bytes: Uint8Array; fileSha256: string }>;
let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedV409> }> | null = null;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));

export async function loadKerrScatteringCorrectedArtifactV409(root = process.cwd()): Promise<LoadedV409> {
  const path = resolve(root, ARTIFACT_PATH);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAXIMUM_BYTES) throw new Error("v409-corrected-artifact-size");
  const bytes = await readFile(path);
  const fileSha256 = sha256(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrScatteringCorrectedArtifactV409(JSON.parse(bytes.toString("utf8")));
    if (sha256(JSON.stringify(canonicalize(artifact))) !== artifact.artifactSha256) throw new Error("v409-corrected-artifact-sha");
    return Object.freeze({ artifact, summary: createKerrScatteringCorrectedSummaryV409(artifact), bytes: new Uint8Array(bytes), fileSha256 });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrScatteringCorrectedServerV409CacheForTests(): void { cache = null; }
