import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  parseMeasuredVisiblePhotonObservableArtifactV384,
  type MeasuredVisiblePhotonObservableArtifactV384,
} from "./measuredVisiblePhotonObservableV384";

const PATH =
  "dist/science/measured-visible-photon-observable-v384/observable.json";
let cache: {
  fingerprint: string;
  promise: Promise<MeasuredVisiblePhotonObservableArtifactV384>;
} | null = null;
const sha = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );

export async function loadMeasuredVisiblePhotonObservableV384(
  root = process.cwd(),
) {
  const path = resolve(root, PATH);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) {
    throw new Error("v384-observable-size");
  }
  const bytes = await readFile(path);
  const fingerprint = `${metadata.size}:${metadata.mtimeMs}:${sha(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve(bytes).then((source) => {
    const artifact = parseMeasuredVisiblePhotonObservableArtifactV384(
      JSON.parse(source.toString("utf8")),
    );
    if (sha(JSON.stringify(canonicalize(artifact))) !== artifact.artifactSha256) {
      throw new Error("v384-observable-sha");
    }
    return artifact;
  });
  cache = { fingerprint, promise };
  try {
    return await promise;
  } catch (error) {
    if (cache?.promise === promise) cache = null;
    throw error;
  }
}

export function resetMeasuredVisiblePhotonObservableServerV384CacheForTests() {
  cache = null;
}
