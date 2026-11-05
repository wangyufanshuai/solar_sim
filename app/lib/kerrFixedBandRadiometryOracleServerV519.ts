import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrFixedBandRadiometryOracleSummaryV519,
  parseKerrFixedBandRadiometryOracleArtifactV519,
  type KerrFixedBandRadiometryOracleArtifactV519,
  type KerrFixedBandRadiometryOracleSummaryV519,
} from "./kerrFixedBandRadiometryOracleV519";

const RELATIVE = "dist/science/kerr-fixed-band-radiometry-oracle-v519/oracle.json";
const MAX_BYTES = 128 * 1024;
const digest = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrFixedBandRadiometryOracleLoadedV519>;
}> | null = null;

export type KerrFixedBandRadiometryOracleLoadedV519 = Readonly<{
  artifact: KerrFixedBandRadiometryOracleArtifactV519;
  summary: KerrFixedBandRadiometryOracleSummaryV519;
  export: Readonly<{
    name: "orbit-atlas-kerr-fixed-band-radiometry-oracle-v519.json";
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

export async function loadKerrFixedBandRadiometryOracleV519(
  root = process.cwd(),
): Promise<KerrFixedBandRadiometryOracleLoadedV519> {
  const target = resolve(root, RELATIVE);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAX_BYTES) {
    throw new Error("v519-radiometry-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${digest(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrFixedBandRadiometryOracleArtifactV519(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    return Object.freeze({
      artifact,
      summary: createKerrFixedBandRadiometryOracleSummaryV519(artifact),
      export: Object.freeze({
        name: "orbit-atlas-kerr-fixed-band-radiometry-oracle-v519.json" as const,
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

export function resetKerrFixedBandRadiometryOracleServerCacheForTestsV519() {
  cache = null;
}
