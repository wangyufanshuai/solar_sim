import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalShaV418,
  createKerrSparsePolarimetricSummaryV418,
  parseKerrSparsePolarimetricArtifactV418,
  type KerrSparsePolarimetricArtifactV418,
  type KerrSparsePolarimetricSummaryV418,
} from "./kerrSparsePolarimetricProductV418";

const ROOT = "dist/science/kerr-sparse-polarimetric-product-v418";
const FILES = Object.freeze({
  json: Object.freeze({ name: "diagnostic-product.json", maxBytes: 1024 * 1024, contentType: "application/json; charset=utf-8" }),
  csv: Object.freeze({ name: "diagnostic-product.csv", maxBytes: 128 * 1024, contentType: "text/csv; charset=utf-8" }),
  fits: Object.freeze({ name: "diagnostic-product-table.fits", maxBytes: 1024 * 1024, contentType: "application/fits" }),
  png: Object.freeze({ name: "diagnostic-strip.png", maxBytes: 1024 * 1024, contentType: "image/png" }),
});
type ExportId = keyof typeof FILES;
type ExportManifest = Readonly<{
  version: "v418-kerr-sparse-polarimetric-export-manifest-v1";
  artifactSha256: string;
  exports: Readonly<Record<ExportId, Readonly<{ path: string; sha256: string; semantic: string }>>>;
  fitsImage: "unavailable-dense-and-screen-coordinate-boundary";
  scienceImageMap: "unavailable-dense-and-screen-coordinate-boundary";
  networkAttempted: false;
  denseShardExecuted: false;
}>;
export type KerrSparsePolarimetricLoadedExportV418 = Readonly<{
  id: ExportId;
  name: string;
  bytes: Uint8Array;
  fileSha256: string;
  contentType: string;
  semantic: string;
}>;
type LoadedV418 = Readonly<{
  artifact: KerrSparsePolarimetricArtifactV418;
  summary: KerrSparsePolarimetricSummaryV418;
  exports: Readonly<Record<ExportId, KerrSparsePolarimetricLoadedExportV418>>;
  manifest: ExportManifest;
}>;
let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedV418> }> | null = null;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const SHA = /^[a-f0-9]{64}$/;

export async function loadKerrSparsePolarimetricProductV418(root = process.cwd()): Promise<LoadedV418> {
  const manifestPath = resolve(root, ROOT, "export-manifest.json");
  const manifestMetadata = await stat(manifestPath);
  if (!manifestMetadata.isFile() || manifestMetadata.size <= 0 || manifestMetadata.size > 128 * 1024) throw new Error("v418-manifest-size");
  const manifestBytes = await readFile(manifestPath);
  const fingerprint = `${manifestMetadata.mtimeMs}:${manifestMetadata.size}:${sha256(manifestBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as ExportManifest;
    if (
      manifest.version !== "v418-kerr-sparse-polarimetric-export-manifest-v1" ||
      !SHA.test(manifest.artifactSha256) ||
      manifest.fitsImage !== "unavailable-dense-and-screen-coordinate-boundary" ||
      manifest.scienceImageMap !== "unavailable-dense-and-screen-coordinate-boundary" ||
      manifest.networkAttempted !== false ||
      manifest.denseShardExecuted !== false
    ) throw new Error("v418-manifest-identity");
    const loadedEntries = await Promise.all((Object.keys(FILES) as ExportId[]).map(async (id) => {
      const contract = FILES[id];
      const entry = manifest.exports[id];
      if (!entry || entry.path !== contract.name || !SHA.test(entry.sha256)) throw new Error(`v418-${id}-manifest-entry`);
      const path = resolve(root, ROOT, contract.name);
      const metadata = await stat(path);
      if (!metadata.isFile() || metadata.size <= 0 || metadata.size > contract.maxBytes) throw new Error(`v418-${id}-size`);
      const bytes = await readFile(path);
      const fileSha256 = sha256(bytes);
      if (fileSha256 !== entry.sha256) throw new Error(`v418-${id}-sha`);
      return [id, Object.freeze({ id, name: contract.name, bytes: new Uint8Array(bytes), fileSha256, contentType: contract.contentType, semantic: entry.semantic })] as const;
    }));
    const exports = Object.freeze(Object.fromEntries(loadedEntries)) as Readonly<Record<ExportId, KerrSparsePolarimetricLoadedExportV418>>;
    const artifact = parseKerrSparsePolarimetricArtifactV418(JSON.parse(new TextDecoder().decode(exports.json.bytes)));
    if (artifact.artifactSha256 !== manifest.artifactSha256 || canonicalShaV418(artifact) !== artifact.artifactSha256) throw new Error("v418-artifact-sha");
    return Object.freeze({ artifact, summary: createKerrSparsePolarimetricSummaryV418(artifact), exports, manifest });
  });
  cache = Object.freeze({ fingerprint, promise });
  try {
    return await promise;
  } catch (error) {
    if (cache?.promise === promise) cache = null;
    throw error;
  }
}

export function resetKerrSparsePolarimetricProductServerV418CacheForTests(): void {
  cache = null;
}
