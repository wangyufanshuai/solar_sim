import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrAnalyzerIdentifiabilitySummaryV524,
  parseKerrAnalyzerIdentifiabilityArtifactV524,
  type KerrAnalyzerIdentifiabilityArtifactV524,
  type KerrAnalyzerIdentifiabilitySummaryV524,
} from "./kerrAnalyzerIdentifiabilityV524";

const RELATIVE = "dist/science/kerr-analyzer-identifiability-v524/identifiability.json";
export const KERR_ANALYZER_IDENTIFIABILITY_ARTIFACT_MAX_BYTES_V524 = 128 * 1024;
const digest = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrAnalyzerIdentifiabilityLoadedV524>;
}> | null = null;

export type KerrAnalyzerIdentifiabilityLoadedV524 = Readonly<{
  artifact: KerrAnalyzerIdentifiabilityArtifactV524;
  summary: KerrAnalyzerIdentifiabilitySummaryV524;
  export: Readonly<{
    name: "orbit-atlas-kerr-analyzer-identifiability-v524.json";
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

export async function loadKerrAnalyzerIdentifiabilityV524(
  root = process.cwd(),
): Promise<KerrAnalyzerIdentifiabilityLoadedV524> {
  const target = resolve(root, RELATIVE);
  const metadata = await stat(target);
  if (
    !metadata.isFile()
    || metadata.size <= 0
    || metadata.size > KERR_ANALYZER_IDENTIFIABILITY_ARTIFACT_MAX_BYTES_V524
  ) {
    throw new Error("v524-identifiability-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrAnalyzerIdentifiabilityArtifactV524(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    return Object.freeze({
      artifact,
      summary: createKerrAnalyzerIdentifiabilitySummaryV524(artifact),
      export: Object.freeze({
        name: "orbit-atlas-kerr-analyzer-identifiability-v524.json" as const,
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

export function resetKerrAnalyzerIdentifiabilityServerCacheForTestsV524() {
  cache = null;
}
