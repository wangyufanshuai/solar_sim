import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrBandpassRedshiftCommutatorSummaryV534,
  parseKerrBandpassRedshiftCommutatorArtifactV534,
  type KerrBandpassRedshiftCommutatorArtifactV534,
  type KerrBandpassRedshiftCommutatorSummaryV534,
} from "./kerrBandpassRedshiftCommutatorV534";

const RELATIVE = "dist/science/kerr-bandpass-redshift-commutator-v534/atlas.json";
export const KERR_BANDPASS_REDSHIFT_ARTIFACT_MAX_BYTES_V534 = 64 * 1024;

type Loaded = Readonly<{
  artifact: KerrBandpassRedshiftCommutatorArtifactV534;
  summary: KerrBandpassRedshiftCommutatorSummaryV534;
  export: Readonly<{
    name: "orbit-atlas-kerr-bandpass-redshift-commutator-v534.json";
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

let cache: Readonly<{ fingerprint: string; promise: Promise<Loaded> }> | null = null;
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

export async function loadKerrBandpassRedshiftCommutatorV534(root = process.cwd()): Promise<Loaded> {
  const target = resolve(root, RELATIVE);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > KERR_BANDPASS_REDSHIFT_ARTIFACT_MAX_BYTES_V534) {
    throw new Error("v534-bandpass-redshift-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrBandpassRedshiftCommutatorArtifactV534(JSON.parse(new TextDecoder().decode(bytes)));
    return Object.freeze({
      artifact,
      summary: createKerrBandpassRedshiftCommutatorSummaryV534(artifact),
      export: Object.freeze({
        name: "orbit-atlas-kerr-bandpass-redshift-commutator-v534.json" as const,
        bytes,
        fileSha256,
        contentType: "application/json; charset=utf-8" as const,
      }),
    });
  });
  cache = Object.freeze({ fingerprint, promise });
  return promise;
}

export function resetKerrBandpassRedshiftCommutatorServerCacheForTestsV534(): void {
  cache = null;
}
