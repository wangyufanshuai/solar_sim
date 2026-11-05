import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createPolarimeterCalibrationSummaryV411,
  parsePolarimeterCalibrationInspectV411,
  type PolarimeterCalibrationInspectV411,
  type PolarimeterCalibrationSummaryV411,
} from "./kerrPolarimeterCalibrationV411";

const INSPECT_PATH = "dist/science/kerr-polarimeter-calibration-v411/inspect.json";
const MAXIMUM_BYTES = 128 * 1024;
const transient = new Set(["generatedAt", "artifactSha256"]);
type Loaded = Readonly<{ inspect: PolarimeterCalibrationInspectV411; summary: PolarimeterCalibrationSummaryV411; bytes: Uint8Array; fileSha256: string }>;
let cache: Readonly<{ fingerprint: string; promise: Promise<Loaded> }> | null = null;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));

export async function loadPolarimeterCalibrationInspectV411(root = process.cwd()): Promise<Loaded> {
  const path = resolve(root, INSPECT_PATH);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAXIMUM_BYTES) throw new Error("v411-inspect-size");
  const bytes = await readFile(path);
  const fileSha256 = sha256(bytes);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const inspect = parsePolarimeterCalibrationInspectV411(JSON.parse(bytes.toString("utf8")));
    if (sha256(JSON.stringify(canonicalize(inspect))) !== inspect.artifactSha256) throw new Error("v411-inspect-sha");
    return Object.freeze({ inspect, summary: createPolarimeterCalibrationSummaryV411(inspect), bytes: new Uint8Array(bytes), fileSha256 });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetPolarimeterCalibrationServerV411CacheForTests(): void { cache = null; }
