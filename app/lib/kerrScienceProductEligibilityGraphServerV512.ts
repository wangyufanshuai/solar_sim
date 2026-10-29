import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrScienceProductEligibilityGraphSummaryV512,
  parseKerrScienceProductEligibilityGraphArtifactV512,
  type KerrScienceProductEligibilityGraphArtifactV512,
  type KerrScienceProductEligibilityGraphSummaryV512,
} from "./kerrScienceProductEligibilityGraphV512";

const RELATIVE_PATH =
  "dist/science/kerr-science-product-eligibility-v512/eligibility-graph.json";
const MAX_BYTES = 128 * 1024;

export type KerrScienceProductEligibilityGraphLoadedV512 = Readonly<{
  artifact: KerrScienceProductEligibilityGraphArtifactV512;
  summary: KerrScienceProductEligibilityGraphSummaryV512;
  export: Readonly<{
    name: "orbit-atlas-kerr-science-product-eligibility-v512.json";
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrScienceProductEligibilityGraphLoadedV512>;
}> | null = null;
const digest = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

export async function loadKerrScienceProductEligibilityGraphV512(
  root = process.cwd(),
): Promise<KerrScienceProductEligibilityGraphLoadedV512> {
  const target = resolve(root, RELATIVE_PATH);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAX_BYTES) {
    throw new Error("v512-product-graph-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${digest(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrScienceProductEligibilityGraphArtifactV512(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    return Object.freeze({
      artifact,
      summary: createKerrScienceProductEligibilityGraphSummaryV512(artifact),
      export: Object.freeze({
        name: "orbit-atlas-kerr-science-product-eligibility-v512.json" as const,
        bytes,
        fileSha256: digest(bytes),
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

export function resetKerrScienceProductEligibilityGraphServerCacheForTestsV512(): void {
  cache = null;
}
