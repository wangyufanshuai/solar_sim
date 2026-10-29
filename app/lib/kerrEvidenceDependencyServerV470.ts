import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalKerrEvidenceDependencyPayloadV470,
  createKerrEvidenceDependencySummaryV470,
  parseKerrEvidenceDependencyArtifactV470,
  type KerrEvidenceDependencyArtifactV470,
  type KerrEvidenceDependencySummaryV470,
} from "./kerrEvidenceDependencyV470";

const ROOT = "dist/science/kerr-evidence-dependency-v470";
const FILE = Object.freeze({ name: "dependency-graph.json", maxBytes: 128 * 1024 });

export type KerrEvidenceDependencyLoadedV470 = Readonly<{
  artifact: KerrEvidenceDependencyArtifactV470;
  summary: KerrEvidenceDependencySummaryV470;
  export: Readonly<{
    name: string;
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

const digest = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrEvidenceDependencyLoadedV470>;
}> | null = null;

export async function loadKerrEvidenceDependencyV470(
  root = process.cwd(),
): Promise<KerrEvidenceDependencyLoadedV470> {
  const target = resolve(root, ROOT, FILE.name);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) {
    throw new Error("v470-dependency-size");
  }

  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = [target, metadata.mtimeMs, metadata.size, fileSha256].join(":");
  if (cache?.fingerprint === fingerprint) return cache.promise;

  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrEvidenceDependencyArtifactV470(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    if (digest(canonicalKerrEvidenceDependencyPayloadV470(artifact)) !== artifact.artifactSha256) {
      throw new Error("v470-dependency-canonical-sha");
    }
    return Object.freeze({
      artifact,
      summary: createKerrEvidenceDependencySummaryV470(artifact),
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

export function resetKerrEvidenceDependencyServerCacheForTestsV470(): void {
  cache = null;
}
