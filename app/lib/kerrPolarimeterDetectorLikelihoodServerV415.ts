import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalShaV415,
  createKerrPolarimeterDetectorLikelihoodSummaryV415,
  parseKerrPolarimeterDetectorLikelihoodArtifactV415,
  type KerrPolarimeterDetectorLikelihoodArtifactV415,
  type KerrPolarimeterDetectorLikelihoodSummaryV415,
} from "./kerrPolarimeterDetectorLikelihoodV415";

const ARTIFACT_PATH = "dist/science/kerr-polarimeter-detector-likelihood-v415/noise-likelihood.json";
const MAX_ARTIFACT_BYTES = 1024 * 1024;

type LoadedV415 = Readonly<{
  artifact: KerrPolarimeterDetectorLikelihoodArtifactV415;
  summary: KerrPolarimeterDetectorLikelihoodSummaryV415;
  bytes: Uint8Array;
  fileSha256: string;
}>;

let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedV415> }> | null = null;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");

export async function loadKerrPolarimeterDetectorLikelihoodArtifactV415(
  root = process.cwd(),
): Promise<LoadedV415> {
  const path = resolve(root, ARTIFACT_PATH);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAX_ARTIFACT_BYTES) {
    throw new Error("v415-artifact-size");
  }
  const bytes = await readFile(path);
  const fileSha256 = sha256(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrPolarimeterDetectorLikelihoodArtifactV415(JSON.parse(bytes.toString("utf8")));
    if (canonicalShaV415(artifact) !== artifact.artifactSha256) throw new Error("v415-artifact-sha");
    return Object.freeze({
      artifact,
      summary: createKerrPolarimeterDetectorLikelihoodSummaryV415(artifact),
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

export function resetKerrPolarimeterDetectorLikelihoodServerV415CacheForTests(): void {
  cache = null;
}
