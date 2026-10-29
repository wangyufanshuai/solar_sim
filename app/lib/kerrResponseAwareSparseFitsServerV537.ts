import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import {
  canonicalKerrResponseAwareSparseFitsV537,
  createKerrResponseAwareSparseFitsSummaryV537,
  parseKerrResponseAwareSparseFitsArtifactV537,
  type KerrResponseAwareSparseFitsArtifactV537,
  type KerrResponseAwareSparseFitsSummaryV537,
} from "./kerrResponseAwareSparseFitsV537";

const ROOT = "dist/science/kerr-response-aware-sparse-fits-v537";
const ATLAS = `${ROOT}/atlas.json`;
const FITS = `${ROOT}/response-aware-sparse-table.fits`;
export const KERR_RESPONSE_AWARE_SPARSE_FITS_SUMMARY_MAX_BYTES_V537 = 128 * 1024;
export const KERR_RESPONSE_AWARE_SPARSE_FITS_FILE_MAX_BYTES_V537 = 1024 * 1024;

type LoadedV537 = Readonly<{
  artifact: KerrResponseAwareSparseFitsArtifactV537;
  summary: KerrResponseAwareSparseFitsSummaryV537;
  exports: Readonly<{
    atlas: Readonly<{ name: "orbit-atlas-kerr-response-aware-sparse-fits-v537.json"; bytes: Uint8Array; fileSha256: string; contentType: "application/json; charset=utf-8" }>;
    fits: Readonly<{ name: "orbit-atlas-response-aware-sparse-table-v537.fits"; bytes: Uint8Array; fileSha256: string; contentType: "application/fits" }>;
  }>;
}>;

let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedV537> }> | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");

export async function loadKerrResponseAwareSparseFitsV537(root = process.cwd()): Promise<LoadedV537> {
  const atlasPath = resolve(root, ATLAS);
  const fitsPath = resolve(root, FITS);
  const [atlasMetadata, fitsMetadata] = await Promise.all([stat(atlasPath), stat(fitsPath)]);
  if (!atlasMetadata.isFile() || atlasMetadata.size <= 0 || atlasMetadata.size > KERR_RESPONSE_AWARE_SPARSE_FITS_SUMMARY_MAX_BYTES_V537) throw new Error("v537-atlas-size");
  if (!fitsMetadata.isFile() || fitsMetadata.size <= 0 || fitsMetadata.size > KERR_RESPONSE_AWARE_SPARSE_FITS_FILE_MAX_BYTES_V537) throw new Error("v537-fits-size");
  const [atlasBuffer, fitsBuffer] = await Promise.all([readFile(atlasPath), readFile(fitsPath)]);
  const atlasFileSha256 = sha(atlasBuffer);
  const fitsFileSha256 = sha(fitsBuffer);
  const fingerprint = `${atlasMetadata.mtimeMs}:${atlasMetadata.size}:${atlasFileSha256}:${fitsMetadata.mtimeMs}:${fitsMetadata.size}:${fitsFileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrResponseAwareSparseFitsArtifactV537(JSON.parse(atlasBuffer.toString("utf8")));
    if (sha(canonicalKerrResponseAwareSparseFitsV537(artifact)) !== artifact.artifactSha256 || artifact.fits.fileSha256 !== fitsFileSha256 || artifact.fits.bytes !== fitsBuffer.byteLength) throw new Error("v537-artifact-integrity");
    const headerProbe = fitsBuffer.subarray(0, Math.min(fitsBuffer.byteLength, 11520)).toString("ascii");
    if (!headerProbe.startsWith("SIMPLE  =") || !headerProbe.includes("XTENSION= 'BINTABLE'") || headerProbe.includes("XTENSION= 'IMAGE   '") || !headerProbe.includes("EXTNAME = 'SPARSE_SCIENCE'")) throw new Error("v537-fits-structure");
    return Object.freeze({
      artifact,
      summary: createKerrResponseAwareSparseFitsSummaryV537(artifact),
      exports: Object.freeze({
        atlas: Object.freeze({ name: "orbit-atlas-kerr-response-aware-sparse-fits-v537.json" as const, bytes: new Uint8Array(atlasBuffer), fileSha256: atlasFileSha256, contentType: "application/json; charset=utf-8" as const }),
        fits: Object.freeze({ name: "orbit-atlas-response-aware-sparse-table-v537.fits" as const, bytes: new Uint8Array(fitsBuffer), fileSha256: fitsFileSha256, contentType: "application/fits" as const }),
      }),
    });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrResponseAwareSparseFitsServerCacheForTestsV537(): void { cache = null; }
