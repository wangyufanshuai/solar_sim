import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { parseKerrScienceImagePixelProbeArtifactV346, type KerrScienceImagePixelProbeArtifactV346 } from "./kerrScienceImagePixelProbeV346";
import { loadKerrScienceImageProductManifestV343 } from "./kerrScienceImageProductServerV343";

const PATH = "dist/science/kerr-image-probe-v346/probe.json";
const LIMIT = 64 * 1024;
let cache: { fingerprint: string; promise: Promise<KerrScienceImagePixelProbeArtifactV346> } | null = null;
function canonicalize(value: unknown): unknown { if (Array.isArray(value)) return value.map(canonicalize); if (!value || typeof value !== "object") return value; return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)])); }
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
export async function loadKerrScienceImageProbeV346(root = process.cwd()): Promise<KerrScienceImagePixelProbeArtifactV346> {
  const path = resolve(root, PATH); const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > LIMIT) throw new Error("v346-probe-size");
  const bytes = await readFile(path); if (bytes.byteLength !== metadata.size) throw new Error("v346-probe-race");
  const fingerprint = `${metadata.size}:${metadata.mtimeMs}:${sha(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.all([Promise.resolve(bytes), loadKerrScienceImageProductManifestV343(root)]).then(([source, manifest]) => {
    const artifact = parseKerrScienceImagePixelProbeArtifactV346(JSON.parse(source.toString("utf8")));
    const png = manifest.products.find((entry) => entry.id === "png");
    if (sha(JSON.stringify(canonicalize(artifact))) !== artifact.artifactSha256
      || artifact.source.imageManifestSha256 !== manifest.manifestSha256
      || artifact.source.pngSha256 !== png?.sha256
      || artifact.source.fullShortAuthoritySha256 !== manifest.source.fullShortAuthoritySha256) throw new Error("v346-probe-source-sha");
    return artifact;
  });
  cache = { fingerprint, promise };
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}
export function resetKerrScienceImageProbeServerV346CacheForTests(): void { cache = null; }
