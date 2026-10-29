import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  canonicalKerrMeasuredCalibrationPreflightV504,
  createKerrMeasuredCalibrationPreflightSummaryV504,
  parseKerrMeasuredCalibrationPreflightArtifactV504,
  type KerrMeasuredCalibrationPreflightArtifactV504,
  type KerrMeasuredCalibrationPreflightSummaryV504,
} from "./kerrMeasuredCalibrationPreflightV504";

const RELATIVE_PATH =
  "dist/science/kerr-measured-calibration-preflight-v504/preflight.json";
const MAX_BYTES = 256 * 1024;
const digest = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

export type KerrMeasuredCalibrationPreflightLoadedV504 = Readonly<{
  artifact: KerrMeasuredCalibrationPreflightArtifactV504;
  summary: KerrMeasuredCalibrationPreflightSummaryV504;
  bytes: Uint8Array;
  fileSha256: string;
}>;

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrMeasuredCalibrationPreflightLoadedV504>;
}> | null = null;

export async function loadKerrMeasuredCalibrationPreflightV504(
  root = process.cwd(),
): Promise<KerrMeasuredCalibrationPreflightLoadedV504> {
  const path = resolve(root, RELATIVE_PATH);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAX_BYTES) {
    throw new Error("v504-preflight-size");
  }
  const bytes = new Uint8Array(await readFile(path));
  const fileSha256 = digest(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrMeasuredCalibrationPreflightArtifactV504(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    if (
      digest(canonicalKerrMeasuredCalibrationPreflightV504(artifact)) !==
      artifact.artifactSha256
    ) {
      throw new Error("v504-preflight-sha");
    }
    return Object.freeze({
      artifact,
      summary: createKerrMeasuredCalibrationPreflightSummaryV504(artifact),
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

export function resetKerrMeasuredCalibrationPreflightServerCacheForTestsV504(): void {
  cache = null;
}
