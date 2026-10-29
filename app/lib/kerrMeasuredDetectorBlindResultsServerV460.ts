import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrMeasuredDetectorBlindResultsSummaryV460,
  parseKerrMeasuredDetectorBlindResultsArtifactV460,
  type KerrMeasuredDetectorBlindResultsArtifactV460,
  type KerrMeasuredDetectorBlindResultsSummaryV460,
} from "./kerrMeasuredDetectorBlindResultsV460";

const ROOT = "dist/science/kerr-measured-detector-blind-results-v460";
const FILE = Object.freeze({ name: "blind-results.json", maxBytes: 128 * 1024 });
export type KerrMeasuredDetectorBlindResultsLoadedV460 = Readonly<{
  artifact: KerrMeasuredDetectorBlindResultsArtifactV460;
  summary: KerrMeasuredDetectorBlindResultsSummaryV460;
  export: Readonly<{ name: string; bytes: Uint8Array; fileSha256: string; contentType: "application/json; charset=utf-8" }>;
}>;
const digest = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
let cache: Readonly<{ fingerprint: string; promise: Promise<KerrMeasuredDetectorBlindResultsLoadedV460> }> | null = null;
export async function loadKerrMeasuredDetectorBlindResultsV460(root = process.cwd()): Promise<KerrMeasuredDetectorBlindResultsLoadedV460> {
  const target = resolve(root, ROOT, FILE.name); const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) throw new Error("v460-blind-results-size");
  const bytes = new Uint8Array(await readFile(target)); const fingerprint = `${target}:${metadata.mtimeMs}:${metadata.size}:${digest(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => { const artifact = parseKerrMeasuredDetectorBlindResultsArtifactV460(JSON.parse(new TextDecoder().decode(bytes))); return Object.freeze({ artifact, summary: createKerrMeasuredDetectorBlindResultsSummaryV460(artifact), export: Object.freeze({ name: FILE.name, bytes, fileSha256: digest(bytes), contentType: "application/json; charset=utf-8" as const }) }); });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}
export function resetKerrMeasuredDetectorBlindResultsServerCacheForTestsV460(): void { cache = null; }
