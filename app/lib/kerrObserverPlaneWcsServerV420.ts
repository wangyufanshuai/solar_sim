import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import { canonicalShaV420, createKerrObserverPlaneWcsSummaryV420, parseKerrObserverPlaneWcsArtifactV420, type KerrObserverPlaneWcsArtifactV420, type KerrObserverPlaneWcsSummaryV420 } from "./kerrObserverPlaneWcsV420";

const ROOT = "dist/science/kerr-observer-plane-WCS-v420";
const FILES = Object.freeze({ json: Object.freeze({ name: "observer-plane-WCS.json", maxBytes: 1024 * 1024, contentType: "application/json; charset=utf-8" }), csv: Object.freeze({ name: "sparse-source-catalog.csv", maxBytes: 128 * 1024, contentType: "text/csv; charset=utf-8" }), fits: Object.freeze({ name: "sparse-source-catalog-WCS.fits", maxBytes: 1024 * 1024, contentType: "application/fits" }), png: Object.freeze({ name: "observer-plane-WCS-grid.png", maxBytes: 2 * 1024 * 1024, contentType: "image/png" }) });
type ExportId = keyof typeof FILES;
type Manifest = Readonly<{ version: "v420-kerr-observer-plane-WCS-export-manifest-v1"; artifactSha256: string; exports: Readonly<Record<ExportId, Readonly<{ path: string; sha256: string; semantic: string }>>>; fitsImage: "unavailable-no-raster-science-values"; polarimetricRaster: "unavailable-dense-campaign-incomplete-0-of-49"; interpolationAllowed: false; denseShardExecuted: false }>;
export type KerrObserverPlaneWcsLoadedExportV420 = Readonly<{ id: ExportId; name: string; bytes: Uint8Array; fileSha256: string; contentType: string; semantic: string }>;
type Loaded = Readonly<{ artifact: KerrObserverPlaneWcsArtifactV420; summary: KerrObserverPlaneWcsSummaryV420; exports: Readonly<Record<ExportId, KerrObserverPlaneWcsLoadedExportV420>>; manifest: Manifest }>;
let cache: Readonly<{ fingerprint: string; promise: Promise<Loaded> }> | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const SHA = /^[a-f0-9]{64}$/;
export async function loadKerrObserverPlaneWcsV420(root = process.cwd()): Promise<Loaded> {
  const manifestPath = resolve(root, ROOT, "export-manifest.json");
  const metadata = await stat(manifestPath);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) throw new Error("v420-manifest-size");
  const manifestBytes = await readFile(manifestPath);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${sha(manifestBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as Manifest;
    if (manifest.version !== "v420-kerr-observer-plane-WCS-export-manifest-v1" || !SHA.test(manifest.artifactSha256) || manifest.fitsImage !== "unavailable-no-raster-science-values" || manifest.polarimetricRaster !== "unavailable-dense-campaign-incomplete-0-of-49" || manifest.interpolationAllowed !== false || manifest.denseShardExecuted !== false) throw new Error("v420-manifest-identity");
    const entries = await Promise.all((Object.keys(FILES) as ExportId[]).map(async (id) => {
      const contract = FILES[id], entry = manifest.exports[id];
      if (!entry || entry.path !== contract.name || !SHA.test(entry.sha256)) throw new Error(`v420-${id}-manifest`);
      const path = resolve(root, ROOT, contract.name), fileMetadata = await stat(path);
      if (!fileMetadata.isFile() || fileMetadata.size <= 0 || fileMetadata.size > contract.maxBytes) throw new Error(`v420-${id}-size`);
      const bytes = await readFile(path), fileSha256 = sha(bytes);
      if (fileSha256 !== entry.sha256) throw new Error(`v420-${id}-sha`);
      return [id, Object.freeze({ id, name: contract.name, bytes: new Uint8Array(bytes), fileSha256, contentType: contract.contentType, semantic: entry.semantic })] as const;
    }));
    const exports = Object.freeze(Object.fromEntries(entries)) as Readonly<Record<ExportId, KerrObserverPlaneWcsLoadedExportV420>>;
    const artifact = parseKerrObserverPlaneWcsArtifactV420(JSON.parse(new TextDecoder().decode(exports.json.bytes)));
    if (artifact.artifactSha256 !== manifest.artifactSha256 || canonicalShaV420(artifact) !== artifact.artifactSha256) throw new Error("v420-artifact-sha");
    return Object.freeze({ artifact, summary: createKerrObserverPlaneWcsSummaryV420(artifact), exports, manifest });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}
export function resetKerrObserverPlaneWcsServerV420CacheForTests(): void { cache = null; }
