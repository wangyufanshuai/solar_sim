import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalKerrSparseSciencePayloadV474,
  createKerrSparseSciencePayloadSummaryV474,
  parseKerrSparseSciencePayloadArtifactV474,
  type KerrSparseSciencePayloadArtifactV474,
  type KerrSparseSciencePayloadSummaryV474,
} from "./kerrSparseSciencePayloadV474";

const ROOT = "dist/science/kerr-sparse-science-payload-v474";
const FILE = Object.freeze({ name: "sparse-payload.json", maxBytes: 128 * 1024 });
const digest = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");

export type KerrSparseSciencePayloadLoadedV474 = Readonly<{
  artifact: KerrSparseSciencePayloadArtifactV474;
  summary: KerrSparseSciencePayloadSummaryV474;
  export: Readonly<{
    name: string;
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrSparseSciencePayloadLoadedV474>;
}> | null = null;

export async function loadKerrSparseSciencePayloadV474(
  root = process.cwd(),
): Promise<KerrSparseSciencePayloadLoadedV474> {
  const target = resolve(root, ROOT, FILE.name);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) {
    throw new Error("v474-sparse-payload-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = [target, metadata.mtimeMs, metadata.size, fileSha256].join(":");
  if (cache?.fingerprint === fingerprint) return cache.promise;

  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrSparseSciencePayloadArtifactV474(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    if (digest(canonicalKerrSparseSciencePayloadV474(artifact)) !== artifact.artifactSha256) {
      throw new Error("v474-sparse-payload-canonical-sha");
    }
    for (const row of artifact.rows) {
      if (digest(canonicalKerrSparseSciencePayloadV474(row)) !== row.rowSha256) {
        throw new Error("v474-sparse-payload-row-sha");
      }
    }
    if (digest(canonicalKerrSparseSciencePayloadV474(artifact.rows)) !== artifact.payloadSha256) {
      throw new Error("v474-sparse-payload-envelope-sha");
    }
    return Object.freeze({
      artifact,
      summary: createKerrSparseSciencePayloadSummaryV474(artifact),
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

export function resetKerrSparseSciencePayloadServerCacheForTestsV474(): void {
  cache = null;
}
