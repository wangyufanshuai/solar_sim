import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrPolarizationFrequencySensitivitySummaryV522,
  parseKerrPolarizationFrequencySensitivityArtifactV522,
  type KerrPolarizationFrequencySensitivityArtifactV522,
  type KerrPolarizationFrequencySensitivitySummaryV522,
} from "./kerrPolarizationFrequencySensitivityV522";

const RELATIVE = "dist/science/kerr-polarization-frequency-sensitivity-v522/envelope.json";
const MAX_BYTES = 512 * 1024;
const digest = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrPolarizationFrequencySensitivityLoadedV522>;
}> | null = null;

export type KerrPolarizationFrequencySensitivityLoadedV522 = Readonly<{
  artifact: KerrPolarizationFrequencySensitivityArtifactV522;
  summary: KerrPolarizationFrequencySensitivitySummaryV522;
  export: Readonly<{
    name: "orbit-atlas-kerr-polarization-frequency-sensitivity-v522.json";
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

export async function loadKerrPolarizationFrequencySensitivityV522(
  root = process.cwd(),
): Promise<KerrPolarizationFrequencySensitivityLoadedV522> {
  const target = resolve(root, RELATIVE);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAX_BYTES) {
    throw new Error("v522-sensitivity-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${digest(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrPolarizationFrequencySensitivityArtifactV522(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    return Object.freeze({
      artifact,
      summary: createKerrPolarizationFrequencySensitivitySummaryV522(artifact),
      export: Object.freeze({
        name: "orbit-atlas-kerr-polarization-frequency-sensitivity-v522.json" as const,
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

export function resetKerrPolarizationFrequencySensitivityServerCacheForTestsV522() {
  cache = null;
}
