import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalKerrNormalizedFrequencyChartV478,
  createKerrNormalizedFrequencySummaryV478,
  parseKerrNormalizedFrequencyArtifactV478,
  type KerrNormalizedFrequencyArtifactV478,
  type KerrNormalizedFrequencySummaryV478,
} from "./kerrNormalizedFrequencyChartV478";

const ROOT = "dist/science/kerr-normalized-frequency-chart-v478";
const FILE = Object.freeze({ name: "frequency-chart.json", maxBytes: 128 * 1024 });
const digest = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");

export type KerrNormalizedFrequencyLoadedV478 = Readonly<{
  artifact: KerrNormalizedFrequencyArtifactV478;
  summary: KerrNormalizedFrequencySummaryV478;
  export: Readonly<{
    name: string;
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrNormalizedFrequencyLoadedV478>;
}> | null = null;

export async function loadKerrNormalizedFrequencyV478(
  root = process.cwd(),
): Promise<KerrNormalizedFrequencyLoadedV478> {
  const target = resolve(root, ROOT, FILE.name);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) {
    throw new Error("v478-frequency-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = [target, metadata.mtimeMs, metadata.size, fileSha256].join(":");
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrNormalizedFrequencyArtifactV478(
      JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    );
    if (digest(canonicalKerrNormalizedFrequencyChartV478(artifact)) !== artifact.artifactSha256) {
      throw new Error("v478-frequency-canonical-sha");
    }
    if (digest(canonicalKerrNormalizedFrequencyChartV478(artifact.rows)) !== artifact.payloadSha256) {
      throw new Error("v478-frequency-payload-sha");
    }
    for (const row of artifact.rows) {
      if (digest(canonicalKerrNormalizedFrequencyChartV478(row)) !== row.rowSha256) {
        throw new Error("v478-frequency-row-sha");
      }
    }
    return Object.freeze({
      artifact,
      summary: createKerrNormalizedFrequencySummaryV478(artifact),
      export: Object.freeze({
        name: FILE.name,
        bytes,
        fileSha256,
        contentType: "application/json; charset=utf-8" as const,
      }),
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

export function resetKerrNormalizedFrequencyServerCacheForTestsV478(): void {
  cache = null;
}
