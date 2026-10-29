import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  parseKerrTemperatureTrustRegionArtifactV391,
  type KerrTemperatureTrustRegionArtifactV391,
} from "./kerrTemperatureTrustRegionV391";

const PATH =
  "dist/science/kerr-temperature-trust-region-v391/trust-region.json";
let cache: {
  fingerprint: string;
  promise: Promise<KerrTemperatureTrustRegionArtifactV391>;
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

export async function loadKerrTemperatureTrustRegionV391(
  root = process.cwd(),
) {
  const path = resolve(root, PATH);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) {
    throw new Error("v391-trust-region-size");
  }
  const bytes = await readFile(path);
  const fingerprint = `${metadata.size}:${metadata.mtimeMs}:${sha(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve(bytes).then((source) => {
    const artifact = parseKerrTemperatureTrustRegionArtifactV391(
      JSON.parse(source.toString("utf8")),
    );
    if (sha(JSON.stringify(canonicalize(artifact))) !== artifact.artifactSha256) {
      throw new Error("v391-trust-region-sha");
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

export function resetKerrTemperatureTrustRegionServerV391CacheForTests() {
  cache = null;
}
