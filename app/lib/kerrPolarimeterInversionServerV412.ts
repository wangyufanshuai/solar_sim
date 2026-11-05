import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { canonicalShaV412, createKerrPolarimeterInversionSummaryV412, parseKerrPolarimeterInversionArtifactV412, type KerrPolarimeterInversionArtifactV412, type KerrPolarimeterInversionSummaryV412 } from "./kerrPolarimeterInversionV412";

const ARTIFACT_PATH = "dist/science/kerr-polarimeter-inversion-v412/generalized-inversion.json";
const MAXIMUM_BYTES = 512 * 1024;
type Loaded = Readonly<{ artifact: KerrPolarimeterInversionArtifactV412; summary: KerrPolarimeterInversionSummaryV412; bytes: Uint8Array; fileSha256: string }>;
let cache: Readonly<{ fingerprint: string; promise: Promise<Loaded> }> | null = null;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");

export async function loadKerrPolarimeterInversionArtifactV412(root = process.cwd()): Promise<Loaded> {
  const path = resolve(root, ARTIFACT_PATH); const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAXIMUM_BYTES) throw new Error("v412-artifact-size");
  const bytes = await readFile(path); const fileSha256 = sha256(bytes); const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => { const artifact = parseKerrPolarimeterInversionArtifactV412(JSON.parse(bytes.toString("utf8"))); if (canonicalShaV412(artifact) !== artifact.artifactSha256) throw new Error("v412-artifact-sha"); return Object.freeze({ artifact, summary: createKerrPolarimeterInversionSummaryV412(artifact), bytes: new Uint8Array(bytes), fileSha256 }); });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrPolarimeterInversionServerV412CacheForTests(): void { cache = null; }
