import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalKerrObservableUncertaintyPayloadV473,
  createKerrObservableUncertaintySummaryV473,
  parseKerrObservableUncertaintyArtifactV473,
  type KerrObservableUncertaintyArtifactV473,
  type KerrObservableUncertaintySummaryV473,
} from "./kerrObservableUncertaintyV473";

const ROOT = "dist/science/kerr-observable-uncertainty-v473";
const FILE = Object.freeze({ name: "uncertainty-ledger.json", maxBytes: 128 * 1024 });
const digest = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");

export type KerrObservableUncertaintyLoadedV473 = Readonly<{
  artifact: KerrObservableUncertaintyArtifactV473;
  summary: KerrObservableUncertaintySummaryV473;
  export: Readonly<{
    name: string;
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrObservableUncertaintyLoadedV473>;
}> | null = null;

export async function loadKerrObservableUncertaintyV473(
  root = process.cwd(),
): Promise<KerrObservableUncertaintyLoadedV473> {
  const target = resolve(root, ROOT, FILE.name);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) {
    throw new Error("v473-uncertainty-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = [target, metadata.mtimeMs, metadata.size, fileSha256].join(":");
  if (cache?.fingerprint === fingerprint) return cache.promise;

  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrObservableUncertaintyArtifactV473(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    if (
      digest(canonicalKerrObservableUncertaintyPayloadV473(artifact)) !== artifact.artifactSha256
    ) {
      throw new Error("v473-uncertainty-canonical-sha");
    }
    return Object.freeze({
      artifact,
      summary: createKerrObservableUncertaintySummaryV473(artifact),
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

export function resetKerrObservableUncertaintyServerCacheForTestsV473(): void {
  cache = null;
}
