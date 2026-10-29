import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  canonicalShaV425,
  createKerrInstrumentSpectralAdmissionSummaryV425,
  parseKerrInstrumentSpectralAdmissionArtifactV425,
  type KerrInstrumentSpectralAdmissionArtifactV425,
  type KerrInstrumentSpectralAdmissionSummaryV425,
} from "./kerrInstrumentSpectralAdmissionV425";

const ROOT = "dist/science/kerr-instrument-spectral-admission-v425";
const FILES = Object.freeze({
  json: Object.freeze({ name: "spectral-admission.json", maxBytes: 2 * 1024 * 1024, contentType: "application/json; charset=utf-8" }),
  csv: Object.freeze({ name: "spectral-admission.csv", maxBytes: 256 * 1024, contentType: "text/csv; charset=utf-8" }),
  fits: Object.freeze({ name: "spectral-admission-table.fits", maxBytes: 2 * 1024 * 1024, contentType: "application/fits" }),
  png: Object.freeze({ name: "spectral-domain-diagnostic.png", maxBytes: 3 * 1024 * 1024, contentType: "image/png" }),
});
type ExportId = keyof typeof FILES;
type Manifest = Readonly<{
  version: "v425-kerr-instrument-spectral-admission-export-manifest-v1";
  artifactSha256: string;
  exports: Readonly<Record<ExportId, Readonly<{ path: string; sha256: string; semantic: string }>>>;
  spectralApplicabilityAudit: "qualified";
  responseEligibleSourceCount: 0;
  responseMatrixApplicationCount: 0;
  extrapolation: "forbidden";
  measurementAuthority: "unavailable";
  detectorAuthority: "unavailable";
  pixelRasterAuthority: "unavailable";
  denseShardExecuted: false;
}>;
export type KerrInstrumentSpectralAdmissionLoadedExportV425 = Readonly<{
  id: ExportId;
  name: string;
  bytes: Uint8Array;
  fileSha256: string;
  contentType: string;
  semantic: string;
}>;
type Loaded = Readonly<{
  artifact: KerrInstrumentSpectralAdmissionArtifactV425;
  summary: KerrInstrumentSpectralAdmissionSummaryV425;
  exports: Readonly<Record<ExportId, KerrInstrumentSpectralAdmissionLoadedExportV425>>;
  manifest: Manifest;
}>;
let cache: Readonly<{ fingerprint: string; promise: Promise<Loaded> }> | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const SHA = /^[a-f0-9]{64}$/;

export async function loadKerrInstrumentSpectralAdmissionV425(root = process.cwd()): Promise<Loaded> {
  const manifestPath = resolve(root, ROOT, "export-manifest.json");
  const metadata = await stat(manifestPath);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) throw new Error("v425-manifest-size");
  const manifestBytes = await readFile(manifestPath);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${sha(manifestBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as Manifest;
    if (
      manifest.version !== "v425-kerr-instrument-spectral-admission-export-manifest-v1" ||
      !SHA.test(manifest.artifactSha256) ||
      manifest.spectralApplicabilityAudit !== "qualified" ||
      manifest.responseEligibleSourceCount !== 0 ||
      manifest.responseMatrixApplicationCount !== 0 ||
      manifest.extrapolation !== "forbidden" ||
      manifest.measurementAuthority !== "unavailable" ||
      manifest.detectorAuthority !== "unavailable" ||
      manifest.pixelRasterAuthority !== "unavailable" ||
      manifest.denseShardExecuted !== false
    ) throw new Error("v425-manifest-identity");
    const entries = await Promise.all((Object.keys(FILES) as ExportId[]).map(async (id) => {
      const contract = FILES[id], entry = manifest.exports[id];
      if (!entry || entry.path !== contract.name || !SHA.test(entry.sha256)) throw new Error(`v425-${id}-manifest`);
      const path = resolve(root, ROOT, contract.name), fileMetadata = await stat(path);
      if (!fileMetadata.isFile() || fileMetadata.size <= 0 || fileMetadata.size > contract.maxBytes) throw new Error(`v425-${id}-size`);
      const bytes = await readFile(path), fileSha256 = sha(bytes);
      if (fileSha256 !== entry.sha256) throw new Error(`v425-${id}-sha`);
      return [id, Object.freeze({ id, name: contract.name, bytes: new Uint8Array(bytes), fileSha256, contentType: contract.contentType, semantic: entry.semantic })] as const;
    }));
    const exports = Object.freeze(Object.fromEntries(entries)) as Readonly<Record<ExportId, KerrInstrumentSpectralAdmissionLoadedExportV425>>;
    const artifact = parseKerrInstrumentSpectralAdmissionArtifactV425(JSON.parse(new TextDecoder().decode(exports.json.bytes)));
    if (artifact.artifactSha256 !== manifest.artifactSha256 || canonicalShaV425(artifact) !== artifact.artifactSha256) throw new Error("v425-artifact-sha");
    return Object.freeze({ artifact, summary: createKerrInstrumentSpectralAdmissionSummaryV425(artifact), exports, manifest });
  });
  cache = Object.freeze({ fingerprint, promise });
  try {
    return await promise;
  } catch (error) {
    if (cache?.promise === promise) cache = null;
    throw error;
  }
}
export function resetKerrInstrumentSpectralAdmissionServerV425CacheForTests(): void { cache = null; }
