import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalKerrUnifiedWorkbenchPayloadV469,
  createKerrUnifiedWorkbenchSummaryV469,
  parseKerrUnifiedWorkbenchArtifactV469,
  type KerrUnifiedWorkbenchArtifactV469,
  type KerrUnifiedWorkbenchSummaryV469,
} from "./kerrUnifiedWorkbenchV469";

const ROOT = "dist/science/kerr-unified-workbench-v469";
const FILE = Object.freeze({ name: "workbench.json", maxBytes: 128 * 1024 });

export type KerrUnifiedWorkbenchLoadedV469 = Readonly<{
  artifact: KerrUnifiedWorkbenchArtifactV469;
  summary: KerrUnifiedWorkbenchSummaryV469;
  export: Readonly<{
    name: string;
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

const digest = (bytes: Uint8Array | string) =>
  createHash("sha256").update(bytes).digest("hex");

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrUnifiedWorkbenchLoadedV469>;
}> | null = null;

export async function loadKerrUnifiedWorkbenchV469(
  root = process.cwd(),
): Promise<KerrUnifiedWorkbenchLoadedV469> {
  const target = resolve(root, ROOT, FILE.name);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) {
    throw new Error("v469-workbench-size");
  }

  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = `${target}:${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;

  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrUnifiedWorkbenchArtifactV469(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    if (digest(canonicalKerrUnifiedWorkbenchPayloadV469(artifact)) !== artifact.artifactSha256) {
      throw new Error("v469-workbench-canonical-sha");
    }

    return Object.freeze({
      artifact,
      summary: createKerrUnifiedWorkbenchSummaryV469(artifact),
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

export function resetKerrUnifiedWorkbenchServerCacheForTestsV469(): void {
  cache = null;
}
