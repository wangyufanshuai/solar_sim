import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrCalibrationUncertaintyTransferSummaryV526,
  parseKerrCalibrationUncertaintyTransferArtifactV526,
  type KerrCalibrationUncertaintyTransferArtifactV526,
  type KerrCalibrationUncertaintyTransferSummaryV526,
} from "./kerrCalibrationUncertaintyTransferV526";

const RELATIVE = "dist/science/kerr-calibration-uncertainty-transfer-v526/transfer.json";
export const KERR_CALIBRATION_UNCERTAINTY_TRANSFER_ARTIFACT_MAX_BYTES_V526 = 128 * 1024;
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrCalibrationUncertaintyTransferLoadedV526>;
}> | null = null;

export type KerrCalibrationUncertaintyTransferLoadedV526 = Readonly<{
  artifact: KerrCalibrationUncertaintyTransferArtifactV526;
  summary: KerrCalibrationUncertaintyTransferSummaryV526;
  export: Readonly<{
    name: "orbit-atlas-kerr-calibration-uncertainty-transfer-v526.json";
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

export async function loadKerrCalibrationUncertaintyTransferV526(
  root = process.cwd(),
): Promise<KerrCalibrationUncertaintyTransferLoadedV526> {
  const target = resolve(root, RELATIVE);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > KERR_CALIBRATION_UNCERTAINTY_TRANSFER_ARTIFACT_MAX_BYTES_V526) throw new Error("v526-uncertainty-transfer-size");
  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrCalibrationUncertaintyTransferArtifactV526(JSON.parse(new TextDecoder().decode(bytes)));
    return Object.freeze({
      artifact,
      summary: createKerrCalibrationUncertaintyTransferSummaryV526(artifact),
      export: Object.freeze({
        name: "orbit-atlas-kerr-calibration-uncertainty-transfer-v526.json" as const,
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

export function resetKerrCalibrationUncertaintyTransferServerCacheForTestsV526() {
  cache = null;
}
