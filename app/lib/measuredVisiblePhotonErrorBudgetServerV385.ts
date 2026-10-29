import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  parseMeasuredVisiblePhotonErrorBudgetArtifactV385,
  type MeasuredVisiblePhotonErrorBudgetArtifactV385,
} from "./measuredVisiblePhotonErrorBudgetV385";

const PATH =
  "dist/science/measured-visible-photon-error-budget-v385/error-budget.json";
let cache: {
  fingerprint: string;
  promise: Promise<MeasuredVisiblePhotonErrorBudgetArtifactV385>;
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

export async function loadMeasuredVisiblePhotonErrorBudgetV385(
  root = process.cwd(),
) {
  const path = resolve(root, PATH);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) {
    throw new Error("v385-error-budget-size");
  }
  const bytes = await readFile(path);
  const fingerprint = `${metadata.size}:${metadata.mtimeMs}:${sha(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve(bytes).then((source) => {
    const artifact = parseMeasuredVisiblePhotonErrorBudgetArtifactV385(
      JSON.parse(source.toString("utf8")),
    );
    if (sha(JSON.stringify(canonicalize(artifact))) !== artifact.artifactSha256) {
      throw new Error("v385-error-budget-sha");
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

export function resetMeasuredVisiblePhotonErrorBudgetServerV385CacheForTests() {
  cache = null;
}
