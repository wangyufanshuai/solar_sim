import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalShaV416,
  createKerrPolarimeterStokesEnsembleSummaryV416,
  parseKerrPolarimeterStokesEnsembleArtifactV416,
  type KerrPolarimeterStokesEnsembleArtifactV416,
  type KerrPolarimeterStokesEnsembleSummaryV416,
} from "./kerrPolarimeterStokesEnsembleV416";

const ARTIFACT_PATH = "dist/science/kerr-polarimeter-stokes-ensemble-v416/stokes-ensemble.json";
const MAX_ARTIFACT_BYTES = 1024 * 1024;
type LoadedV416 = Readonly<{
  artifact: KerrPolarimeterStokesEnsembleArtifactV416;
  summary: KerrPolarimeterStokesEnsembleSummaryV416;
  bytes: Uint8Array;
  fileSha256: string;
}>;
let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedV416> }> | null = null;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");

export async function loadKerrPolarimeterStokesEnsembleArtifactV416(root = process.cwd()): Promise<LoadedV416> {
  const path = resolve(root, ARTIFACT_PATH);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAX_ARTIFACT_BYTES) {
    throw new Error("v416-artifact-size");
  }
  const bytes = await readFile(path);
  const fileSha256 = sha256(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrPolarimeterStokesEnsembleArtifactV416(JSON.parse(bytes.toString("utf8")));
    if (canonicalShaV416(artifact) !== artifact.artifactSha256) throw new Error("v416-artifact-sha");
    return Object.freeze({
      artifact,
      summary: createKerrPolarimeterStokesEnsembleSummaryV416(artifact),
      bytes: new Uint8Array(bytes),
      fileSha256,
    });
  });
  cache = Object.freeze({ fingerprint, promise });
  try {
    return await promise;
  } catch (error) {
    if (cache?.promise === promise) cache = null;
    throw error;
  }
}

export function resetKerrPolarimeterStokesEnsembleServerV416CacheForTests(): void {
  cache = null;
}
