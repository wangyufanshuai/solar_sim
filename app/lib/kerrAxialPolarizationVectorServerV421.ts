import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalShaV421,
  createKerrAxialPolarizationVectorSummaryV421,
  parseKerrAxialPolarizationVectorArtifactV421,
  type KerrAxialPolarizationVectorArtifactV421,
  type KerrAxialPolarizationVectorSummaryV421,
} from "./kerrAxialPolarizationVectorCatalogV421";

const ROOT = "dist/science/kerr-axial-polarization-vectors-v421";
const FILES = Object.freeze({
  json: Object.freeze({ name: "axial-vector-catalog.json", maxBytes: 1024 * 1024, contentType: "application/json; charset=utf-8" }),
  csv: Object.freeze({ name: "axial-vector-catalog.csv", maxBytes: 128 * 1024, contentType: "text/csv; charset=utf-8" }),
  fits: Object.freeze({ name: "axial-vector-endpoints-WCS.fits", maxBytes: 1024 * 1024, contentType: "application/fits" }),
  png: Object.freeze({ name: "corrected-sparse-axial-quiver.png", maxBytes: 2 * 1024 * 1024, contentType: "image/png" }),
});
type ExportId = keyof typeof FILES;
type Manifest = Readonly<{
  version: "v421-kerr-axial-polarization-export-manifest-v1";
  artifactSha256: string;
  exports: Readonly<Record<ExportId, Readonly<{ path: string; sha256: string; semantic: string }>>>;
  evpaZeroDirection: "plus-beta";
  evpaPositiveDirection: "toward-plus-alpha";
  priorV419V420PngOrientation: "withdrawn-display-only-90-degree-convention-mismatch";
  fitsImage: "unavailable-no-raster-science-values";
  intensity: "unavailable";
  stokesAmplitude: "unavailable";
  interpolationAllowed: false;
  historicalFilesOverwritten: false;
  denseShardExecuted: false;
}>;
export type KerrAxialPolarizationLoadedExportV421 = Readonly<{ id: ExportId; name: string; bytes: Uint8Array; fileSha256: string; contentType: string; semantic: string }>;
type Loaded = Readonly<{ artifact: KerrAxialPolarizationVectorArtifactV421; summary: KerrAxialPolarizationVectorSummaryV421; exports: Readonly<Record<ExportId, KerrAxialPolarizationLoadedExportV421>>; manifest: Manifest }>;
let cache: Readonly<{ fingerprint: string; promise: Promise<Loaded> }> | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const SHA = /^[a-f0-9]{64}$/;

export async function loadKerrAxialPolarizationVectorsV421(root = process.cwd()): Promise<Loaded> {
  const manifestPath = resolve(root, ROOT, "export-manifest.json");
  const metadata = await stat(manifestPath);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) throw new Error("v421-manifest-size");
  const manifestBytes = await readFile(manifestPath);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${sha(manifestBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as Manifest;
    if (
      manifest.version !== "v421-kerr-axial-polarization-export-manifest-v1"
      || !SHA.test(manifest.artifactSha256)
      || manifest.evpaZeroDirection !== "plus-beta"
      || manifest.evpaPositiveDirection !== "toward-plus-alpha"
      || manifest.priorV419V420PngOrientation !== "withdrawn-display-only-90-degree-convention-mismatch"
      || manifest.fitsImage !== "unavailable-no-raster-science-values"
      || manifest.intensity !== "unavailable"
      || manifest.stokesAmplitude !== "unavailable"
      || manifest.interpolationAllowed !== false
      || manifest.historicalFilesOverwritten !== false
      || manifest.denseShardExecuted !== false
    ) throw new Error("v421-manifest-identity");
    const entries = await Promise.all((Object.keys(FILES) as ExportId[]).map(async (id) => {
      const contract = FILES[id];
      const entry = manifest.exports[id];
      if (!entry || entry.path !== contract.name || !SHA.test(entry.sha256)) throw new Error(`v421-${id}-manifest`);
      const path = resolve(root, ROOT, contract.name);
      const fileMetadata = await stat(path);
      if (!fileMetadata.isFile() || fileMetadata.size <= 0 || fileMetadata.size > contract.maxBytes) throw new Error(`v421-${id}-size`);
      const bytes = await readFile(path);
      const fileSha256 = sha(bytes);
      if (fileSha256 !== entry.sha256) throw new Error(`v421-${id}-sha`);
      return [id, Object.freeze({ id, name: contract.name, bytes: new Uint8Array(bytes), fileSha256, contentType: contract.contentType, semantic: entry.semantic })] as const;
    }));
    const exports = Object.freeze(Object.fromEntries(entries)) as Readonly<Record<ExportId, KerrAxialPolarizationLoadedExportV421>>;
    const artifact = parseKerrAxialPolarizationVectorArtifactV421(JSON.parse(new TextDecoder().decode(exports.json.bytes)));
    if (artifact.artifactSha256 !== manifest.artifactSha256 || canonicalShaV421(artifact) !== artifact.artifactSha256) throw new Error("v421-artifact-sha");
    return Object.freeze({ artifact, summary: createKerrAxialPolarizationVectorSummaryV421(artifact), exports, manifest });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrAxialPolarizationVectorServerV421CacheForTests(): void { cache = null; }
