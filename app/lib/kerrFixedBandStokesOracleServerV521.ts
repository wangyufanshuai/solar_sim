import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrFixedBandStokesOracleSummaryV521,
  parseKerrFixedBandStokesOracleArtifactV521,
  type KerrFixedBandStokesOracleArtifactV521,
  type KerrFixedBandStokesOracleSummaryV521,
} from "./kerrFixedBandStokesOracleV521";

const RELATIVE = "dist/science/kerr-fixed-band-stokes-oracle-v521/oracle.json";
const MAX_BYTES = 192 * 1024;
const digest = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrFixedBandStokesOracleLoadedV521>;
}> | null = null;

export type KerrFixedBandStokesOracleLoadedV521 = Readonly<{
  artifact: KerrFixedBandStokesOracleArtifactV521;
  summary: KerrFixedBandStokesOracleSummaryV521;
  export: Readonly<{
    name: "orbit-atlas-kerr-fixed-band-stokes-oracle-v521.json";
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

export async function loadKerrFixedBandStokesOracleV521(
  root = process.cwd(),
): Promise<KerrFixedBandStokesOracleLoadedV521> {
  const target = resolve(root, RELATIVE);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAX_BYTES) {
    throw new Error("v521-oracle-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${digest(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrFixedBandStokesOracleArtifactV521(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    return Object.freeze({
      artifact,
      summary: createKerrFixedBandStokesOracleSummaryV521(artifact),
      export: Object.freeze({
        name: "orbit-atlas-kerr-fixed-band-stokes-oracle-v521.json" as const,
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

export function resetKerrFixedBandStokesOracleServerCacheForTestsV521() {
  cache = null;
}
