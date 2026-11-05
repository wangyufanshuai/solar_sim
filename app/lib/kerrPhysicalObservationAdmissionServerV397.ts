import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  parseKerrPhysicalObservationAdmissionArtifactV397,
  type KerrPhysicalObservationAdmissionArtifactV397,
} from "./kerrPhysicalObservationAdmissionV397";

const PATH = "dist/science/kerr-physical-observation-admission-v397/observation-admission.json";
let cache: { fingerprint: string; promise: Promise<KerrPhysicalObservationAdmissionArtifactV397> } | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));

export async function loadKerrPhysicalObservationAdmissionV397(root = process.cwd()) {
  const path = resolve(root, PATH);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) throw new Error("v397-observation-admission-size");
  const bytes = await readFile(path);
  const fingerprint = `${metadata.size}:${metadata.mtimeMs}:${sha(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve(bytes).then((source) => {
    const artifact = parseKerrPhysicalObservationAdmissionArtifactV397(JSON.parse(source.toString("utf8")));
    if (sha(JSON.stringify(canonicalize(artifact))) !== artifact.artifactSha256) throw new Error("v397-observation-admission-sha");
    return artifact;
  });
  cache = { fingerprint, promise };
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrPhysicalObservationAdmissionServerV397CacheForTests() {
  cache = null;
}
