import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalKerrSpectralLandmarkTransportV481,
  createKerrSpectralLandmarkSummaryV481,
  parseKerrSpectralLandmarkArtifactV481,
  type KerrSpectralLandmarkArtifactV481,
  type KerrSpectralLandmarkSummaryV481,
} from "./kerrSpectralLandmarkTransportV481";

const ROOT = "dist/science/kerr-spectral-landmark-transport-v481";
const FILE = Object.freeze({ name: "landmarks.json", maxBytes: 128 * 1024 });
const digest = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");

export type KerrSpectralLandmarkLoadedV481 = Readonly<{
  artifact: KerrSpectralLandmarkArtifactV481;
  summary: KerrSpectralLandmarkSummaryV481;
  export: Readonly<{
    name: string;
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrSpectralLandmarkLoadedV481>;
}> | null = null;

export async function loadKerrSpectralLandmarksV481(
  root = process.cwd(),
): Promise<KerrSpectralLandmarkLoadedV481> {
  const target = resolve(root, ROOT, FILE.name);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) {
    throw new Error("v481-landmark-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = [target, metadata.mtimeMs, metadata.size, fileSha256].join(":");
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrSpectralLandmarkArtifactV481(
      JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    );
    if (digest(canonicalKerrSpectralLandmarkTransportV481(artifact)) !== artifact.artifactSha256) {
      throw new Error("v481-landmark-canonical-sha");
    }
    if (digest(canonicalKerrSpectralLandmarkTransportV481(artifact.rows)) !== artifact.payloadSha256) {
      throw new Error("v481-landmark-payload-sha");
    }
    return Object.freeze({
      artifact,
      summary: createKerrSpectralLandmarkSummaryV481(artifact),
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

export function resetKerrSpectralLandmarkServerCacheForTestsV481(): void {
  cache = null;
}
