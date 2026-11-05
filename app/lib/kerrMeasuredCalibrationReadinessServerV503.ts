import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  canonicalKerrMeasuredCalibrationReadinessV503,
  createKerrMeasuredCalibrationReadinessSummaryV503,
  parseKerrMeasuredCalibrationReadinessArtifactV503,
  type KerrMeasuredCalibrationReadinessArtifactV503,
  type KerrMeasuredCalibrationReadinessSummaryV503,
} from "./kerrMeasuredCalibrationReadinessV503";

const RELATIVE_PATH =
  "dist/science/kerr-measured-calibration-readiness-v503/readiness.json";
const MAX_BYTES = 256 * 1024;
const digest = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

export type KerrMeasuredCalibrationReadinessLoadedV503 = Readonly<{
  artifact: KerrMeasuredCalibrationReadinessArtifactV503;
  summary: KerrMeasuredCalibrationReadinessSummaryV503;
  bytes: Uint8Array;
  fileSha256: string;
}>;

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrMeasuredCalibrationReadinessLoadedV503>;
}> | null = null;

export async function loadKerrMeasuredCalibrationReadinessV503(
  root = process.cwd(),
): Promise<KerrMeasuredCalibrationReadinessLoadedV503> {
  const path = resolve(root, RELATIVE_PATH);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAX_BYTES) {
    throw new Error("v503-readiness-size");
  }
  const bytes = new Uint8Array(await readFile(path));
  const fileSha256 = digest(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrMeasuredCalibrationReadinessArtifactV503(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    if (
      digest(canonicalKerrMeasuredCalibrationReadinessV503(artifact)) !==
      artifact.artifactSha256
    ) {
      throw new Error("v503-readiness-sha");
    }
    return Object.freeze({
      artifact,
      summary: createKerrMeasuredCalibrationReadinessSummaryV503(artifact),
      bytes,
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

export function resetKerrMeasuredCalibrationReadinessServerCacheForTestsV503(): void {
  cache = null;
}
