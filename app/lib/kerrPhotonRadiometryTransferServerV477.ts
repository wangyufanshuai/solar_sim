import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalKerrPhotonRadiometryTransferV477,
  createKerrPhotonRadiometryTransferSummaryV477,
  parseKerrPhotonRadiometryTransferArtifactV477,
  type KerrPhotonRadiometryTransferArtifactV477,
  type KerrPhotonRadiometryTransferSummaryV477,
} from "./kerrPhotonRadiometryTransferV477";

const ROOT = "dist/science/kerr-photon-radiometry-transfer-v477";
const FILE = Object.freeze({ name: "transfer-payload.json", maxBytes: 128 * 1024 });
const digest = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");

export type KerrPhotonRadiometryTransferLoadedV477 = Readonly<{
  artifact: KerrPhotonRadiometryTransferArtifactV477;
  summary: KerrPhotonRadiometryTransferSummaryV477;
  export: Readonly<{
    name: string;
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrPhotonRadiometryTransferLoadedV477>;
}> | null = null;

export async function loadKerrPhotonRadiometryTransferV477(
  root = process.cwd(),
): Promise<KerrPhotonRadiometryTransferLoadedV477> {
  const target = resolve(root, ROOT, FILE.name);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) {
    throw new Error("v477-radiometry-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = [target, metadata.mtimeMs, metadata.size, fileSha256].join(":");
  if (cache?.fingerprint === fingerprint) return cache.promise;

  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrPhotonRadiometryTransferArtifactV477(
      JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    );
    if (
      digest(canonicalKerrPhotonRadiometryTransferV477(artifact)) !== artifact.artifactSha256
    ) {
      throw new Error("v477-radiometry-canonical-sha");
    }
    if (
      digest(canonicalKerrPhotonRadiometryTransferV477(artifact.rows)) !== artifact.payloadSha256
    ) {
      throw new Error("v477-radiometry-payload-sha");
    }
    for (const row of artifact.rows) {
      if (digest(canonicalKerrPhotonRadiometryTransferV477(row)) !== row.rowSha256) {
        throw new Error("v477-radiometry-row-sha");
      }
    }
    return Object.freeze({
      artifact,
      summary: createKerrPhotonRadiometryTransferSummaryV477(artifact),
      export: Object.freeze({
        name: FILE.name,
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

export function resetKerrPhotonRadiometryTransferServerCacheForTestsV477(): void {
  cache = null;
}
