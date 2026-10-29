import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrUncertaintyReplayWitnessSummaryV516,
  parseKerrUncertaintyReplayWitnessArtifactV516,
  type KerrUncertaintyReplayWitnessArtifactV516,
  type KerrUncertaintyReplayWitnessSummaryV516,
} from "./kerrUncertaintyReplayWitnessV516";

const RELATIVE = "dist/science/kerr-uncertainty-replay-witness-v516/witness-chain.json";
const MAX_BYTES = 128 * 1024;
const digest = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrUncertaintyReplayWitnessLoadedV516>;
}> | null = null;

export type KerrUncertaintyReplayWitnessLoadedV516 = Readonly<{
  artifact: KerrUncertaintyReplayWitnessArtifactV516;
  summary: KerrUncertaintyReplayWitnessSummaryV516;
  export: Readonly<{
    name: "orbit-atlas-kerr-uncertainty-replay-witness-v516.json";
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

export async function loadKerrUncertaintyReplayWitnessV516(
  root = process.cwd(),
): Promise<KerrUncertaintyReplayWitnessLoadedV516> {
  const target = resolve(root, RELATIVE);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAX_BYTES) {
    throw new Error("v516-witness-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${digest(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrUncertaintyReplayWitnessArtifactV516(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    return Object.freeze({
      artifact,
      summary: createKerrUncertaintyReplayWitnessSummaryV516(artifact),
      export: Object.freeze({
        name: "orbit-atlas-kerr-uncertainty-replay-witness-v516.json" as const,
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

export function resetKerrUncertaintyReplayWitnessServerCacheForTestsV516() {
  cache = null;
}
