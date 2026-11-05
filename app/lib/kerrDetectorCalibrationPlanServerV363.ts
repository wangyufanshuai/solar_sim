import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { parseKerrDetectorCalibrationPlanV363, type KerrDetectorCalibrationPlanArtifactV363 } from "./kerrDetectorCalibrationPlanV363";

const PATH = "dist/science/kerr-detector-calibration-plan-v363/plan.json";
let cache: { fingerprint: string; promise: Promise<KerrDetectorCalibrationPlanArtifactV363> } | null = null;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));

export async function loadKerrDetectorCalibrationPlanV363(root = process.cwd()): Promise<KerrDetectorCalibrationPlanArtifactV363> {
  const path = resolve(root, PATH);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) throw new Error("v363-plan-size");
  const bytes = await readFile(path);
  const fingerprint = `${metadata.size}:${metadata.mtimeMs}:${sha256(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve(bytes).then((source) => {
    const artifact = parseKerrDetectorCalibrationPlanV363(JSON.parse(source.toString("utf8")));
    if (sha256(JSON.stringify(canonicalize(artifact))) !== artifact.artifactSha256) throw new Error("v363-plan-sha");
    return artifact;
  });
  cache = { fingerprint, promise };
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrDetectorCalibrationPlanServerV363CacheForTests(): void { cache = null; }
