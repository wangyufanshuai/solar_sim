import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import { canonicalShaV422, createKerrPolarizationOrientationBasisSummaryV422, parseKerrPolarizationOrientationBasisArtifactV422, type KerrPolarizationOrientationBasisArtifactV422, type KerrPolarizationOrientationBasisSummaryV422 } from "./kerrPolarizationOrientationBasisV422";

const ROOT = "dist/science/kerr-polarization-orientation-basis-v422";
const FILES = Object.freeze({ json: Object.freeze({ name: "orientation-basis-catalog.json", maxBytes: 1024 * 1024, contentType: "application/json; charset=utf-8" }), csv: Object.freeze({ name: "orientation-basis-catalog.csv", maxBytes: 128 * 1024, contentType: "text/csv; charset=utf-8" }), fits: Object.freeze({ name: "orientation-basis-WCS-table.fits", maxBytes: 1024 * 1024, contentType: "application/fits" }), png: Object.freeze({ name: "orientation-basis-compass.png", maxBytes: 2 * 1024 * 1024, contentType: "image/png" }) });
type ExportId = keyof typeof FILES;
type Manifest = Readonly<{ version: "v422-kerr-polarization-orientation-basis-export-manifest-v1"; artifactSha256: string; exports: Readonly<Record<ExportId, Readonly<{ path: string; sha256: string; semantic: string }>>>; orientationBasis: "available-unit-double-angle-not-normalized-Stokes"; stokesMeasurement: "unavailable-no-I-Q-U-V"; polarizationAmplitude: "unavailable"; rasterMaskGenerated: false; fitsImage: "unavailable-no-raster-science-values"; nearestPixelAssignmentAllowed: false; interpolationAllowed: false; denseShardExecuted: false }>;
export type KerrPolarizationOrientationBasisLoadedExportV422 = Readonly<{ id: ExportId; name: string; bytes: Uint8Array; fileSha256: string; contentType: string; semantic: string }>;
type Loaded = Readonly<{ artifact: KerrPolarizationOrientationBasisArtifactV422; summary: KerrPolarizationOrientationBasisSummaryV422; exports: Readonly<Record<ExportId, KerrPolarizationOrientationBasisLoadedExportV422>>; manifest: Manifest }>;
let cache: Readonly<{ fingerprint: string; promise: Promise<Loaded> }> | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const SHA = /^[a-f0-9]{64}$/;
export async function loadKerrPolarizationOrientationBasisV422(root = process.cwd()): Promise<Loaded> {
  const manifestPath = resolve(root, ROOT, "export-manifest.json"), metadata = await stat(manifestPath);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) throw new Error("v422-manifest-size");
  const manifestBytes = await readFile(manifestPath), fingerprint = `${metadata.mtimeMs}:${metadata.size}:${sha(manifestBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as Manifest;
    if (manifest.version !== "v422-kerr-polarization-orientation-basis-export-manifest-v1" || !SHA.test(manifest.artifactSha256) || manifest.orientationBasis !== "available-unit-double-angle-not-normalized-Stokes" || manifest.stokesMeasurement !== "unavailable-no-I-Q-U-V" || manifest.polarizationAmplitude !== "unavailable" || manifest.rasterMaskGenerated !== false || manifest.fitsImage !== "unavailable-no-raster-science-values" || manifest.nearestPixelAssignmentAllowed !== false || manifest.interpolationAllowed !== false || manifest.denseShardExecuted !== false) throw new Error("v422-manifest-identity");
    const entries = await Promise.all((Object.keys(FILES) as ExportId[]).map(async (id) => { const contract = FILES[id], entry = manifest.exports[id]; if (!entry || entry.path !== contract.name || !SHA.test(entry.sha256)) throw new Error(`v422-${id}-manifest`); const path = resolve(root, ROOT, contract.name), fileMetadata = await stat(path); if (!fileMetadata.isFile() || fileMetadata.size <= 0 || fileMetadata.size > contract.maxBytes) throw new Error(`v422-${id}-size`); const bytes = await readFile(path), fileSha256 = sha(bytes); if (fileSha256 !== entry.sha256) throw new Error(`v422-${id}-sha`); return [id, Object.freeze({ id, name: contract.name, bytes: new Uint8Array(bytes), fileSha256, contentType: contract.contentType, semantic: entry.semantic })] as const; }));
    const exports = Object.freeze(Object.fromEntries(entries)) as Readonly<Record<ExportId, KerrPolarizationOrientationBasisLoadedExportV422>>;
    const artifact = parseKerrPolarizationOrientationBasisArtifactV422(JSON.parse(new TextDecoder().decode(exports.json.bytes)));
    if (artifact.artifactSha256 !== manifest.artifactSha256 || canonicalShaV422(artifact) !== artifact.artifactSha256) throw new Error("v422-artifact-sha");
    return Object.freeze({ artifact, summary: createKerrPolarizationOrientationBasisSummaryV422(artifact), exports, manifest });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}
export function resetKerrPolarizationOrientationBasisServerV422CacheForTests(): void { cache = null; }
