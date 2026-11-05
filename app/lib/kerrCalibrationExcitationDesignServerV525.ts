import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrCalibrationExcitationDesignSummaryV525,
  parseKerrCalibrationExcitationDesignArtifactV525,
  type KerrCalibrationExcitationDesignArtifactV525,
  type KerrCalibrationExcitationDesignSummaryV525,
} from "./kerrCalibrationExcitationDesignV525";

const RELATIVE = "dist/science/kerr-calibration-excitation-design-v525/design.json";
export const KERR_CALIBRATION_EXCITATION_DESIGN_ARTIFACT_MAX_BYTES_V525 = 128 * 1024;
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrCalibrationExcitationDesignLoadedV525>;
}> | null = null;

export type KerrCalibrationExcitationDesignLoadedV525 = Readonly<{
  artifact: KerrCalibrationExcitationDesignArtifactV525;
  summary: KerrCalibrationExcitationDesignSummaryV525;
  export: Readonly<{
    name: "orbit-atlas-kerr-calibration-excitation-design-v525.json";
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

export async function loadKerrCalibrationExcitationDesignV525(
  root = process.cwd(),
): Promise<KerrCalibrationExcitationDesignLoadedV525> {
  const target = resolve(root, RELATIVE);
  const metadata = await stat(target);
  if (
    !metadata.isFile()
    || metadata.size <= 0
    || metadata.size > KERR_CALIBRATION_EXCITATION_DESIGN_ARTIFACT_MAX_BYTES_V525
  ) throw new Error("v525-calibration-design-size");
  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrCalibrationExcitationDesignArtifactV525(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    return Object.freeze({
      artifact,
      summary: createKerrCalibrationExcitationDesignSummaryV525(artifact),
      export: Object.freeze({
        name: "orbit-atlas-kerr-calibration-excitation-design-v525.json" as const,
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

export function resetKerrCalibrationExcitationDesignServerCacheForTestsV525() {
  cache = null;
}
