import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrAllocationRegretSummaryV530,
  parseKerrAllocationRegretArtifactV530,
  type KerrAllocationRegretArtifactV530,
  type KerrAllocationRegretSummaryV530,
} from "./kerrAllocationRegretV530";

const RELATIVE = "dist/science/kerr-allocation-regret-v530/atlas.json";
export const KERR_ALLOCATION_REGRET_ARTIFACT_MAX_BYTES_V530 = 512 * 1024;
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrAllocationRegretLoadedV530>;
}> | null = null;
export type KerrAllocationRegretLoadedV530 = Readonly<{
  artifact: KerrAllocationRegretArtifactV530;
  summary: KerrAllocationRegretSummaryV530;
  export: Readonly<{
    name: "orbit-atlas-kerr-allocation-regret-v530.json";
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;
export async function loadKerrAllocationRegretV530(
  root = process.cwd(),
): Promise<KerrAllocationRegretLoadedV530> {
  const target = resolve(root, RELATIVE);
  const metadata = await stat(target);
  if (
    !metadata.isFile() ||
    metadata.size <= 0 ||
    metadata.size > KERR_ALLOCATION_REGRET_ARTIFACT_MAX_BYTES_V530
  ) {
    throw new Error("v530-regret-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrAllocationRegretArtifactV530(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    return Object.freeze({
      artifact,
      summary: createKerrAllocationRegretSummaryV530(artifact),
      export: Object.freeze({
        name: "orbit-atlas-kerr-allocation-regret-v530.json" as const,
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
export function resetKerrAllocationRegretServerCacheForTestsV530() {
  cache = null;
}
