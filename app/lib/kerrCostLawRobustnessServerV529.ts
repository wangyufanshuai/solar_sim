import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrCostLawRobustnessSummaryV529,
  parseKerrCostLawRobustnessArtifactV529,
  type KerrCostLawRobustnessArtifactV529,
  type KerrCostLawRobustnessSummaryV529,
} from "./kerrCostLawRobustnessV529";

const RELATIVE = "dist/science/kerr-cost-law-robustness-v529/envelope.json";
export const KERR_COST_LAW_ROBUSTNESS_ARTIFACT_MAX_BYTES_V529 = 2 * 1024 * 1024;
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrCostLawRobustnessLoadedV529>;
}> | null = null;
export type KerrCostLawRobustnessLoadedV529 = Readonly<{
  artifact: KerrCostLawRobustnessArtifactV529;
  summary: KerrCostLawRobustnessSummaryV529;
  export: Readonly<{
    name: "orbit-atlas-kerr-cost-law-robustness-v529.json";
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;
export async function loadKerrCostLawRobustnessV529(
  root = process.cwd(),
): Promise<KerrCostLawRobustnessLoadedV529> {
  const target = resolve(root, RELATIVE);
  const metadata = await stat(target);
  if (
    !metadata.isFile() ||
    metadata.size <= 0 ||
    metadata.size > KERR_COST_LAW_ROBUSTNESS_ARTIFACT_MAX_BYTES_V529
  ) {
    throw new Error("v529-cost-law-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrCostLawRobustnessArtifactV529(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    return Object.freeze({
      artifact,
      summary: createKerrCostLawRobustnessSummaryV529(artifact),
      export: Object.freeze({
        name: "orbit-atlas-kerr-cost-law-robustness-v529.json" as const,
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
export function resetKerrCostLawRobustnessServerCacheForTestsV529() {
  cache = null;
}
