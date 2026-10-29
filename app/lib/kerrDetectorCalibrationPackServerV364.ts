import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { parseKerrDetectorCalibrationPackV364, type KerrDetectorCalibrationPackArtifactV364 } from "./kerrDetectorCalibrationPackV364";

const PATH = "dist/science/kerr-detector-calibration-pack-v364/pack.json";
let cache: { fingerprint: string; promise: Promise<KerrDetectorCalibrationPackArtifactV364> } | null = null;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));

export async function loadKerrDetectorCalibrationPackV364(root = process.cwd()): Promise<KerrDetectorCalibrationPackArtifactV364> {
  const path = resolve(root, PATH); const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 64 * 1024) throw new Error("v364-pack-size");
  const bytes = await readFile(path); const fingerprint = `${metadata.size}:${metadata.mtimeMs}:${sha256(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve(bytes).then((source) => { const artifact = parseKerrDetectorCalibrationPackV364(JSON.parse(source.toString("utf8"))); if (sha256(JSON.stringify(canonicalize(artifact))) !== artifact.artifactSha256) throw new Error("v364-pack-sha"); return artifact; });
  cache = { fingerprint, promise };
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrDetectorCalibrationPackServerV364CacheForTests(): void { cache = null; }
