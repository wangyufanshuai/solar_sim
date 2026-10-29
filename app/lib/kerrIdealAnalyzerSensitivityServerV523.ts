import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrIdealAnalyzerSensitivitySummaryV523,
  parseKerrIdealAnalyzerSensitivityArtifactV523,
  type KerrIdealAnalyzerSensitivityArtifactV523,
  type KerrIdealAnalyzerSensitivitySummaryV523,
} from "./kerrIdealAnalyzerSensitivityV523";

const RELATIVE = "dist/science/kerr-ideal-analyzer-sensitivity-v523/projection.json";
const MAX_BYTES = 2 * 1024 * 1024;
const digest = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrIdealAnalyzerSensitivityLoadedV523>;
}> | null = null;

export type KerrIdealAnalyzerSensitivityLoadedV523 = Readonly<{
  artifact: KerrIdealAnalyzerSensitivityArtifactV523;
  summary: KerrIdealAnalyzerSensitivitySummaryV523;
  export: Readonly<{
    name: "orbit-atlas-kerr-ideal-analyzer-sensitivity-v523.json";
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

export async function loadKerrIdealAnalyzerSensitivityV523(
  root = process.cwd(),
): Promise<KerrIdealAnalyzerSensitivityLoadedV523> {
  const target = resolve(root, RELATIVE);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAX_BYTES) {
    throw new Error("v523-analyzer-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${digest(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrIdealAnalyzerSensitivityArtifactV523(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    return Object.freeze({
      artifact,
      summary: createKerrIdealAnalyzerSensitivitySummaryV523(artifact),
      export: Object.freeze({
        name: "orbit-atlas-kerr-ideal-analyzer-sensitivity-v523.json" as const,
        bytes,
        fileSha256: digest(bytes),
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

export function resetKerrIdealAnalyzerSensitivityServerCacheForTestsV523() {
  cache = null;
}
