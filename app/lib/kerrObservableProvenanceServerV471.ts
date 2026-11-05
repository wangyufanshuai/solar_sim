import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalKerrObservableProvenancePayloadV471,
  createKerrObservableProvenanceSummaryV471,
  parseKerrObservableProvenanceArtifactV471,
  type KerrObservableProvenanceArtifactV471,
  type KerrObservableProvenanceSummaryV471,
} from "./kerrObservableProvenanceV471";

const ROOT = "dist/science/kerr-observable-provenance-v471";
const FILE = Object.freeze({ name: "observable-matrix.json", maxBytes: 128 * 1024 });
const digest = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");

export type KerrObservableProvenanceLoadedV471 = Readonly<{
  artifact: KerrObservableProvenanceArtifactV471;
  summary: KerrObservableProvenanceSummaryV471;
  export: Readonly<{
    name: string;
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrObservableProvenanceLoadedV471>;
}> | null = null;

export async function loadKerrObservableProvenanceV471(
  root = process.cwd(),
): Promise<KerrObservableProvenanceLoadedV471> {
  const target = resolve(root, ROOT, FILE.name);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) {
    throw new Error("v471-observable-size");
  }

  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = [target, metadata.mtimeMs, metadata.size, fileSha256].join(":");
  if (cache?.fingerprint === fingerprint) return cache.promise;

  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrObservableProvenanceArtifactV471(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    if (
      digest(canonicalKerrObservableProvenancePayloadV471(artifact)) !== artifact.artifactSha256
    ) {
      throw new Error("v471-observable-canonical-sha");
    }
    return Object.freeze({
      artifact,
      summary: createKerrObservableProvenanceSummaryV471(artifact),
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

export function resetKerrObservableProvenanceServerCacheForTestsV471(): void {
  cache = null;
}
