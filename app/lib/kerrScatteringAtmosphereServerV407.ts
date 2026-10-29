import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrScatteringAtmosphereSummaryV407,
  parseKerrScatteringAtmosphereArtifactV407,
  type KerrScatteringAtmosphereArtifactV407,
  type KerrScatteringAtmosphereSummaryV407,
} from "./kerrScatteringAtmosphereV407";

const ARTIFACT_PATH = "dist/science/kerr-scattering-atmosphere-v407/short-gate.json";
const MAXIMUM_BYTES = 256 * 1024;
type LoadedV407 = Readonly<{ artifact: KerrScatteringAtmosphereArtifactV407; summary: KerrScatteringAtmosphereSummaryV407; bytes: Uint8Array; fileSha256: string }>;
let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedV407> }> | null = null;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([first], [second]) => first.localeCompare(second)).map(([key, entry]) => [key, canonicalize(entry)]));

export async function loadKerrScatteringAtmosphereArtifactV407(root = process.cwd()): Promise<LoadedV407> {
  const path = resolve(root, ARTIFACT_PATH);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAXIMUM_BYTES) throw new Error("v407-scattering-artifact-size");
  const bytes = await readFile(path);
  const fileSha256 = sha256(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrScatteringAtmosphereArtifactV407(JSON.parse(bytes.toString("utf8")));
    if (sha256(JSON.stringify(canonicalize(artifact))) !== artifact.artifactSha256) throw new Error("v407-scattering-artifact-sha");
    return Object.freeze({ artifact, summary: createKerrScatteringAtmosphereSummaryV407(artifact), bytes: new Uint8Array(bytes), fileSha256 });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrScatteringAtmosphereServerV407CacheForTests(): void { cache = null; }
