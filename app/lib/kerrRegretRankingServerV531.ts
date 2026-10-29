import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrRegretRankingSummaryV531,
  parseKerrRegretRankingArtifactV531,
  type KerrRegretRankingArtifactV531,
  type KerrRegretRankingSummaryV531,
} from "./kerrRegretRankingV531";

const RELATIVE = "dist/science/kerr-regret-ranking-v531/atlas.json";
export const KERR_REGRET_RANKING_ARTIFACT_MAX_BYTES_V531 = 512 * 1024;
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrRegretRankingLoadedV531>;
}> | null = null;
export type KerrRegretRankingLoadedV531 = Readonly<{
  artifact: KerrRegretRankingArtifactV531;
  summary: KerrRegretRankingSummaryV531;
  export: Readonly<{
    name: "orbit-atlas-kerr-regret-ranking-v531.json";
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;
export async function loadKerrRegretRankingV531(
  root = process.cwd(),
): Promise<KerrRegretRankingLoadedV531> {
  const target = resolve(root, RELATIVE);
  const metadata = await stat(target);
  if (
    !metadata.isFile() ||
    metadata.size <= 0 ||
    metadata.size > KERR_REGRET_RANKING_ARTIFACT_MAX_BYTES_V531
  ) {
    throw new Error("v531-ranking-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrRegretRankingArtifactV531(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    return Object.freeze({
      artifact,
      summary: createKerrRegretRankingSummaryV531(artifact),
      export: Object.freeze({
        name: "orbit-atlas-kerr-regret-ranking-v531.json" as const,
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
export function resetKerrRegretRankingServerCacheForTestsV531() {
  cache = null;
}
