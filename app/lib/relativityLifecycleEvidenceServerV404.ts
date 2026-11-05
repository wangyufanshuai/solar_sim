import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  parseAtlasObservationLifecycleReplaySummaryV404,
  type AtlasObservationLifecycleReplaySummaryV404,
} from "./atlasObservationLifecycleReplaySummaryV404";

const SUMMARY_PATH = "dist/science/atlas-observation-lifecycle-summary-v404/summary.json";
const MAXIMUM_BYTES = 128 * 1024;
let cache: Readonly<{
  fingerprint: string;
  promise: Promise<Readonly<{ summary: AtlasObservationLifecycleReplaySummaryV404; responseBytes: number; fileSha256: string }>>;
}> | null = null;

const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !["generatedAt", "summarySha256"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));

export async function loadRelativityLifecycleEvidenceSummaryV404(root = process.cwd()) {
  const path = resolve(root, SUMMARY_PATH);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAXIMUM_BYTES) {
    throw new Error("v404-lifecycle-summary-size");
  }
  const bytes = await readFile(path);
  const fileSha256 = sha256(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const summary = parseAtlasObservationLifecycleReplaySummaryV404(JSON.parse(bytes.toString("utf8")));
    if (sha256(JSON.stringify(canonicalize(summary))) !== summary.summarySha256) {
      throw new Error("v404-lifecycle-summary-sha");
    }
    return Object.freeze({ summary, responseBytes: bytes.byteLength, fileSha256 });
  });
  cache = Object.freeze({ fingerprint, promise });
  try {
    return await promise;
  } catch (error) {
    if (cache?.promise === promise) cache = null;
    throw error;
  }
}

export function resetRelativityLifecycleEvidenceServerV404CacheForTests(): void {
  cache = null;
}
