import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrGridAxisInfluenceSummaryV533,
  parseKerrGridAxisInfluenceArtifactV533,
  type KerrGridAxisInfluenceArtifactV533,
  type KerrGridAxisInfluenceSummaryV533,
} from "./kerrGridAxisInfluenceV533";

const RELATIVE_ARTIFACT_PATH = "dist/science/kerr-grid-axis-influence-v533/atlas.json";
export const KERR_GRID_AXIS_INFLUENCE_ARTIFACT_MAX_BYTES_V533 = 192 * 1024;

type LoadedArtifact = Readonly<{
  artifact: KerrGridAxisInfluenceArtifactV533;
  summary: KerrGridAxisInfluenceSummaryV533;
  export: Readonly<{
    name: "orbit-atlas-kerr-grid-axis-influence-v533.json";
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedArtifact> }> | null = null;
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

export async function loadKerrGridAxisInfluenceV533(root = process.cwd()): Promise<LoadedArtifact> {
  const target = resolve(root, RELATIVE_ARTIFACT_PATH);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > KERR_GRID_AXIS_INFLUENCE_ARTIFACT_MAX_BYTES_V533) {
    throw new Error("v533-grid-axis-influence-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fileSha256 = digest(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrGridAxisInfluenceArtifactV533(JSON.parse(new TextDecoder().decode(bytes)));
    return Object.freeze({
      artifact,
      summary: createKerrGridAxisInfluenceSummaryV533(artifact),
      export: Object.freeze({
        name: "orbit-atlas-kerr-grid-axis-influence-v533.json" as const,
        bytes,
        fileSha256,
        contentType: "application/json; charset=utf-8" as const,
      }),
    });
  });
  cache = Object.freeze({ fingerprint, promise });
  return promise;
}

export function resetKerrGridAxisInfluenceServerCacheForTestsV533(): void {
  cache = null;
}
