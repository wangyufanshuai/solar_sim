import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalKerrSpectralLandmarkCovarianceV482,
  createKerrSpectralLandmarkCovarianceSummaryV482,
  parseKerrSpectralLandmarkCovarianceArtifactV482,
  type KerrSpectralLandmarkCovarianceArtifactV482,
  type KerrSpectralLandmarkCovarianceSummaryV482,
} from "./kerrSpectralLandmarkCovarianceV482";

const ROOT = "dist/science/kerr-spectral-landmark-covariance-v482";
const FILE = Object.freeze({ name: "covariance.json", maxBytes: 128 * 1024 });
const digest = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");

export type KerrSpectralLandmarkCovarianceLoadedV482 = Readonly<{
  artifact: KerrSpectralLandmarkCovarianceArtifactV482;
  summary: KerrSpectralLandmarkCovarianceSummaryV482;
  export: Readonly<{
    name: string;
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrSpectralLandmarkCovarianceLoadedV482>;
}> | null = null;

export async function loadKerrSpectralLandmarkCovarianceV482(
  root = process.cwd(),
): Promise<KerrSpectralLandmarkCovarianceLoadedV482> {
  const target = resolve(root, ROOT, FILE.name);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) {
    throw new Error("v482-covariance-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = [target, metadata.mtimeMs, metadata.size, fileSha256].join(":");
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrSpectralLandmarkCovarianceArtifactV482(
      JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    );
    if (digest(canonicalKerrSpectralLandmarkCovarianceV482(artifact)) !== artifact.artifactSha256) {
      throw new Error("v482-covariance-canonical-sha");
    }
    if (digest(canonicalKerrSpectralLandmarkCovarianceV482(artifact.rows)) !== artifact.payloadSha256) {
      throw new Error("v482-covariance-payload-sha");
    }
    return Object.freeze({
      artifact,
      summary: createKerrSpectralLandmarkCovarianceSummaryV482(artifact),
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

export function resetKerrSpectralLandmarkCovarianceServerCacheForTestsV482(): void {
  cache = null;
}
