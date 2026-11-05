import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  parseAtlasLifecycleProvenanceDossierV405,
  type AtlasLifecycleProvenanceDossierV405,
} from "./atlasLifecycleProvenanceDossierV405";

const DOSSIER_PATH = "dist/science/atlas-evidence-observatory-v405/portable-dossier.json";
const MAXIMUM_BYTES = 128 * 1024;
let cache: Readonly<{
  fingerprint: string;
  promise: Promise<Readonly<{ dossier: AtlasLifecycleProvenanceDossierV405; responseBytes: number; fileSha256: string }>>;
}> | null = null;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !["generatedAt", "dossierSha256"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));

export async function loadAtlasLifecycleProvenanceDossierV405(root = process.cwd()) {
  const path = resolve(root, DOSSIER_PATH);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAXIMUM_BYTES) throw new Error("v405-dossier-size");
  const bytes = await readFile(path);
  const fileSha256 = sha256(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const dossier = parseAtlasLifecycleProvenanceDossierV405(JSON.parse(bytes.toString("utf8")));
    if (sha256(JSON.stringify(canonicalize(dossier))) !== dossier.dossierSha256) throw new Error("v405-dossier-sha");
    return Object.freeze({ dossier, responseBytes: bytes.byteLength, fileSha256 });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetAtlasLifecycleProvenanceDossierServerV405CacheForTests(): void { cache = null; }
