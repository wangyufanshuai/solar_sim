import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalShaV417,
  createKerrPolarimeterNonlinearObservablesSummaryV417,
  parseKerrPolarimeterNonlinearObservablesArtifactV417,
  type KerrPolarimeterNonlinearObservablesArtifactV417,
  type KerrPolarimeterNonlinearObservablesSummaryV417,
} from "./kerrPolarimeterNonlinearObservablesV417";

const ARTIFACT_PATH = "dist/science/kerr-polarimeter-nonlinear-observables-v417/nonlinear-observables.json";
const MAX_ARTIFACT_BYTES = 1024 * 1024;
type LoadedV417 = Readonly<{
  artifact: KerrPolarimeterNonlinearObservablesArtifactV417;
  summary: KerrPolarimeterNonlinearObservablesSummaryV417;
  bytes: Uint8Array;
  fileSha256: string;
}>;
let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedV417> }> | null = null;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");

export async function loadKerrPolarimeterNonlinearObservablesArtifactV417(root = process.cwd()): Promise<LoadedV417> {
  const path = resolve(root, ARTIFACT_PATH);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAX_ARTIFACT_BYTES) {
    throw new Error("v417-artifact-size");
  }
  const bytes = await readFile(path);
  const fileSha256 = sha256(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrPolarimeterNonlinearObservablesArtifactV417(JSON.parse(bytes.toString("utf8")));
    if (canonicalShaV417(artifact) !== artifact.artifactSha256) throw new Error("v417-artifact-sha");
    return Object.freeze({
      artifact,
      summary: createKerrPolarimeterNonlinearObservablesSummaryV417(artifact),
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

export function resetKerrPolarimeterNonlinearObservablesServerV417CacheForTests(): void {
  cache = null;
}
