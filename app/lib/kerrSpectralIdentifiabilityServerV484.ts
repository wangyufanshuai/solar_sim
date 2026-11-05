import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalKerrSpectralIdentifiabilityV484,
  createKerrSpectralIdentifiabilitySummaryV484,
  parseKerrSpectralIdentifiabilityArtifactV484,
  type KerrSpectralIdentifiabilityArtifactV484,
  type KerrSpectralIdentifiabilitySummaryV484,
} from "./kerrSpectralIdentifiabilityV484";

const ROOT = "dist/science/kerr-spectral-identifiability-v484";
const FILE = Object.freeze({ name: "identifiability.json", maxBytes: 128 * 1024 });
const digest = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");

export type KerrSpectralIdentifiabilityLoadedV484 = Readonly<{
  artifact: KerrSpectralIdentifiabilityArtifactV484;
  summary: KerrSpectralIdentifiabilitySummaryV484;
  export: Readonly<{
    name: string;
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrSpectralIdentifiabilityLoadedV484>;
}> | null = null;

export async function loadKerrSpectralIdentifiabilityV484(
  root = process.cwd(),
): Promise<KerrSpectralIdentifiabilityLoadedV484> {
  const target = resolve(root, ROOT, FILE.name);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) {
    throw new Error("v484-identifiability-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = [target, metadata.mtimeMs, metadata.size, fileSha256].join(":");
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrSpectralIdentifiabilityArtifactV484(
      JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    );
    if (digest(canonicalKerrSpectralIdentifiabilityV484(artifact)) !== artifact.artifactSha256) {
      throw new Error("v484-identifiability-canonical-sha");
    }
    if (digest(canonicalKerrSpectralIdentifiabilityV484(artifact.rows)) !== artifact.payloadSha256) {
      throw new Error("v484-identifiability-payload-sha");
    }
    return Object.freeze({
      artifact,
      summary: createKerrSpectralIdentifiabilitySummaryV484(artifact),
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

export function resetKerrSpectralIdentifiabilityServerCacheForTestsV484(): void {
  cache = null;
}
