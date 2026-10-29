import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalShaV419,
  createKerrScreenCoordinateSummaryV419,
  parseKerrScreenCoordinateArtifactV419,
  type KerrScreenCoordinateArtifactV419,
  type KerrScreenCoordinateSummaryV419,
} from "./kerrScreenCoordinateProvenanceV419";

const ROOT = "dist/science/kerr-screen-coordinate-provenance-v419";
const FILES = Object.freeze({
  json: Object.freeze({ name: "screen-coordinate-provenance.json", maxBytes: 1024 * 1024, contentType: "application/json; charset=utf-8" }),
  csv: Object.freeze({ name: "screen-coordinate-provenance.csv", maxBytes: 128 * 1024, contentType: "text/csv; charset=utf-8" }),
  fits: Object.freeze({ name: "screen-coordinate-table.fits", maxBytes: 1024 * 1024, contentType: "application/fits" }),
  png: Object.freeze({ name: "sparse-screen-quiver.png", maxBytes: 2 * 1024 * 1024, contentType: "image/png" }),
});
type ExportId = keyof typeof FILES;
type ExportManifest = Readonly<{ version: "v419-kerr-screen-coordinate-export-manifest-v1"; artifactSha256: string; exports: Readonly<Record<ExportId, Readonly<{ path: string; sha256: string; semantic: string }>>>; fitsImage: "unavailable-sparse-four-ray-and-no-approved-pixel-WCS"; densePolarimetricImage: "unavailable-campaign-incomplete-0-of-49"; networkAttempted: false; denseShardExecuted: false }>;
export type KerrScreenCoordinateLoadedExportV419 = Readonly<{ id: ExportId; name: string; bytes: Uint8Array; fileSha256: string; contentType: string; semantic: string }>;
type LoadedV419 = Readonly<{ artifact: KerrScreenCoordinateArtifactV419; summary: KerrScreenCoordinateSummaryV419; exports: Readonly<Record<ExportId, KerrScreenCoordinateLoadedExportV419>>; manifest: ExportManifest }>;
let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedV419> }> | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const SHA = /^[a-f0-9]{64}$/;

export async function loadKerrScreenCoordinateProvenanceV419(root = process.cwd()): Promise<LoadedV419> {
  const manifestPath = resolve(root, ROOT, "export-manifest.json");
  const metadata = await stat(manifestPath);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) throw new Error("v419-manifest-size");
  const manifestBytes = await readFile(manifestPath);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${sha(manifestBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as ExportManifest;
    if (manifest.version !== "v419-kerr-screen-coordinate-export-manifest-v1" || !SHA.test(manifest.artifactSha256) || manifest.fitsImage !== "unavailable-sparse-four-ray-and-no-approved-pixel-WCS" || manifest.densePolarimetricImage !== "unavailable-campaign-incomplete-0-of-49" || manifest.networkAttempted !== false || manifest.denseShardExecuted !== false) throw new Error("v419-manifest-identity");
    const entries = await Promise.all((Object.keys(FILES) as ExportId[]).map(async (id) => {
      const contract = FILES[id];
      const entry = manifest.exports[id];
      if (!entry || entry.path !== contract.name || !SHA.test(entry.sha256)) throw new Error(`v419-${id}-manifest`);
      const path = resolve(root, ROOT, contract.name);
      const fileMetadata = await stat(path);
      if (!fileMetadata.isFile() || fileMetadata.size <= 0 || fileMetadata.size > contract.maxBytes) throw new Error(`v419-${id}-size`);
      const bytes = await readFile(path);
      const fileSha256 = sha(bytes);
      if (fileSha256 !== entry.sha256) throw new Error(`v419-${id}-sha`);
      return [id, Object.freeze({ id, name: contract.name, bytes: new Uint8Array(bytes), fileSha256, contentType: contract.contentType, semantic: entry.semantic })] as const;
    }));
    const exports = Object.freeze(Object.fromEntries(entries)) as Readonly<Record<ExportId, KerrScreenCoordinateLoadedExportV419>>;
    const artifact = parseKerrScreenCoordinateArtifactV419(JSON.parse(new TextDecoder().decode(exports.json.bytes)));
    if (artifact.artifactSha256 !== manifest.artifactSha256 || canonicalShaV419(artifact) !== artifact.artifactSha256) throw new Error("v419-artifact-sha");
    return Object.freeze({ artifact, summary: createKerrScreenCoordinateSummaryV419(artifact), exports, manifest });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}
export function resetKerrScreenCoordinateServerV419CacheForTests(): void { cache = null; }
