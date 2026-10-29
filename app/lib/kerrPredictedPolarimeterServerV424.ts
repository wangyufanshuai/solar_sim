import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  canonicalShaV424,
  createKerrPredictedPolarimeterSummaryV424,
  parseKerrPredictedPolarimeterArtifactV424,
  type KerrPredictedPolarimeterArtifactV424,
  type KerrPredictedPolarimeterSummaryV424,
} from "./kerrPredictedPolarimeterV424";

const ROOT = "dist/science/kerr-predicted-polarimeter-v424";
const FILES = Object.freeze({
  json: Object.freeze({ name: "predicted-ideal-dual-beam.json", maxBytes: 3 * 1024 * 1024, contentType: "application/json; charset=utf-8" }),
  csv: Object.freeze({ name: "predicted-ideal-dual-beam.csv", maxBytes: 512 * 1024, contentType: "text/csv; charset=utf-8" }),
  fits: Object.freeze({ name: "predicted-ideal-dual-beam-table.fits", maxBytes: 3 * 1024 * 1024, contentType: "application/fits" }),
  png: Object.freeze({ name: "predicted-modulation-diagnostic.png", maxBytes: 3 * 1024 * 1024, contentType: "image/png" }),
});
type ExportId = keyof typeof FILES;
type Manifest = Readonly<{
  version: "v424-kerr-predicted-polarimeter-export-manifest-v1";
  artifactSha256: string;
  exports: Readonly<Record<ExportId, Readonly<{ path: string; sha256: string; semantic: string }>>>;
  modelPrediction: "qualified";
  measurementAuthority: "unavailable";
  detectorAuthority: "unavailable";
  measuredMuellerCalibration: "unavailable";
  throughputGainReadNoiseCovariance: "unavailable";
  photonOrElectronCounts: "unavailable";
  pixelRasterAuthority: "unavailable";
  denseShardExecuted: false;
}>;
export type KerrPredictedPolarimeterLoadedExportV424 = Readonly<{
  id: ExportId;
  name: string;
  bytes: Uint8Array;
  fileSha256: string;
  contentType: string;
  semantic: string;
}>;
type Loaded = Readonly<{
  artifact: KerrPredictedPolarimeterArtifactV424;
  summary: KerrPredictedPolarimeterSummaryV424;
  exports: Readonly<Record<ExportId, KerrPredictedPolarimeterLoadedExportV424>>;
  manifest: Manifest;
}>;

let cache: Readonly<{ fingerprint: string; promise: Promise<Loaded> }> | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const SHA = /^[a-f0-9]{64}$/;

export async function loadKerrPredictedPolarimeterV424(root = process.cwd()): Promise<Loaded> {
  const manifestPath = resolve(root, ROOT, "export-manifest.json");
  const metadata = await stat(manifestPath);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) throw new Error("v424-manifest-size");
  const manifestBytes = await readFile(manifestPath);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${sha(manifestBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as Manifest;
    if (
      manifest.version !== "v424-kerr-predicted-polarimeter-export-manifest-v1" ||
      !SHA.test(manifest.artifactSha256) ||
      manifest.modelPrediction !== "qualified" ||
      manifest.measurementAuthority !== "unavailable" ||
      manifest.detectorAuthority !== "unavailable" ||
      manifest.measuredMuellerCalibration !== "unavailable" ||
      manifest.throughputGainReadNoiseCovariance !== "unavailable" ||
      manifest.photonOrElectronCounts !== "unavailable" ||
      manifest.pixelRasterAuthority !== "unavailable" ||
      manifest.denseShardExecuted !== false
    ) throw new Error("v424-manifest-identity");
    const entries = await Promise.all((Object.keys(FILES) as ExportId[]).map(async (id) => {
      const contract = FILES[id];
      const entry = manifest.exports[id];
      if (!entry || entry.path !== contract.name || !SHA.test(entry.sha256)) throw new Error(`v424-${id}-manifest`);
      const path = resolve(root, ROOT, contract.name);
      const fileMetadata = await stat(path);
      if (!fileMetadata.isFile() || fileMetadata.size <= 0 || fileMetadata.size > contract.maxBytes) throw new Error(`v424-${id}-size`);
      const bytes = await readFile(path);
      const fileSha256 = sha(bytes);
      if (fileSha256 !== entry.sha256) throw new Error(`v424-${id}-sha`);
      return [id, Object.freeze({ id, name: contract.name, bytes: new Uint8Array(bytes), fileSha256, contentType: contract.contentType, semantic: entry.semantic })] as const;
    }));
    const exports = Object.freeze(Object.fromEntries(entries)) as Readonly<Record<ExportId, KerrPredictedPolarimeterLoadedExportV424>>;
    const artifact = parseKerrPredictedPolarimeterArtifactV424(JSON.parse(new TextDecoder().decode(exports.json.bytes)));
    if (artifact.artifactSha256 !== manifest.artifactSha256 || canonicalShaV424(artifact) !== artifact.artifactSha256) {
      throw new Error("v424-artifact-sha");
    }
    return Object.freeze({ artifact, summary: createKerrPredictedPolarimeterSummaryV424(artifact), exports, manifest });
  });
  cache = Object.freeze({ fingerprint, promise });
  try {
    return await promise;
  } catch (error) {
    if (cache?.promise === promise) cache = null;
    throw error;
  }
}

export function resetKerrPredictedPolarimeterServerV424CacheForTests(): void {
  cache = null;
}
