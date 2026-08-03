import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { canonicalIxpeMetadataProbeV563, parseIxpeMetadataProbeV563, type IxpeMetadataProbeV563 } from "./ixpeMetadataProbeV563";

const PATH = "dist/science/ixpe-metadata-probe-v563/metadata-probe.json";
const sha = (value: Uint8Array): string => createHash("sha256").update(value).digest("hex");
let cache: Readonly<{ fingerprint: string; promise: Promise<IxpeMetadataProbeV563> }> | null = null;

export async function loadIxpeMetadataProbeV563(root = process.cwd()): Promise<IxpeMetadataProbeV563> {
  const path = resolve(root, PATH);
  const info = await stat(path);
  if (!info.isFile() || info.size <= 0 || info.size > 256 * 1024) throw new Error("v563-metadata-size");
  const bytes = new Uint8Array(await readFile(path));
  const fingerprint = `${info.mtimeMs}:${info.size}:${sha(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseIxpeMetadataProbeV563(JSON.parse(Buffer.from(bytes).toString("utf8")));
    if (sha(Buffer.from(canonicalIxpeMetadataProbeV563(artifact), "utf8")) !== artifact.artifactSha256) throw new Error("v563-metadata-sha");
    return artifact;
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetIxpeMetadataProbeServerCacheForTestsV563(): void { cache = null; }
