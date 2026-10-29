import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  canonicalShaV427,
  createKerrHighEnergyResponseAcquisitionSummaryV427,
  parseKerrHighEnergyResponseAcquisitionArtifactV427,
  type KerrHighEnergyResponseAcquisitionPackArtifactV427,
  type KerrHighEnergyResponseAcquisitionSummaryV427,
} from "./kerrHighEnergyResponseAcquisitionPackV427";

const ROOT = "dist/science/kerr-high-energy-response-acquisition-pack-v427";
const FILES = Object.freeze({
  json: Object.freeze({ name: "acquisition-pack.json", maxBytes: 512 * 1024, contentType: "application/json; charset=utf-8" }),
  zip: Object.freeze({ name: "response-acquisition-pack.zip", maxBytes: 2 * 1024 * 1024, contentType: "application/zip" }),
  fits: Object.freeze({ name: "acquisition-plan.fits", maxBytes: 2 * 1024 * 1024, contentType: "application/fits" }),
  png: Object.freeze({ name: "response-acquisition-pack-architecture.png", maxBytes: 4 * 1024 * 1024, contentType: "image/png" }),
});
type ExportId = keyof typeof FILES;
type ExportManifest = Readonly<{
  version: "v427-kerr-high-energy-response-acquisition-export-manifest-v1";
  artifactSha256: string;
  exports: Readonly<Record<ExportId, Readonly<{ path: string; sha256: string; semantic: string }>>>;
  zipEntryCount: 9;
  measurementTemplateCount: 7;
  measurementTemplateDataRowCount: 0;
  validatorFixtureIncludedInZip: false;
  measuredResponseAuthority: "unavailable";
  scienceResponseApplicationCount: 0;
  detectorCountProduct: "unavailable";
  pixelRasterAuthority: "unavailable";
  denseShardExecuted: false;
}>;
export type KerrHighEnergyResponseAcquisitionLoadedExportV427 = Readonly<{
  id: ExportId;
  name: string;
  bytes: Uint8Array;
  fileSha256: string;
  contentType: string;
  semantic: string;
}>;
type Loaded = Readonly<{
  artifact: KerrHighEnergyResponseAcquisitionPackArtifactV427;
  summary: KerrHighEnergyResponseAcquisitionSummaryV427;
  exports: Readonly<Record<ExportId, KerrHighEnergyResponseAcquisitionLoadedExportV427>>;
  manifest: ExportManifest;
}>;
const SHA = /^[a-f0-9]{64}$/;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
let cache: Readonly<{ fingerprint: string; promise: Promise<Loaded> }> | null = null;

export async function loadKerrHighEnergyResponseAcquisitionPackV427(root = process.cwd()): Promise<Loaded> {
  const manifestPath = resolve(root, ROOT, "export-manifest.json");
  const metadata = await stat(manifestPath);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) throw new Error("v427-manifest-size");
  const manifestBytes = await readFile(manifestPath);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${sha(manifestBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as ExportManifest;
    if (
      manifest.version !== "v427-kerr-high-energy-response-acquisition-export-manifest-v1" ||
      !SHA.test(manifest.artifactSha256) ||
      manifest.zipEntryCount !== 9 ||
      manifest.measurementTemplateCount !== 7 ||
      manifest.measurementTemplateDataRowCount !== 0 ||
      manifest.validatorFixtureIncludedInZip !== false ||
      manifest.measuredResponseAuthority !== "unavailable" ||
      manifest.scienceResponseApplicationCount !== 0 ||
      manifest.detectorCountProduct !== "unavailable" ||
      manifest.pixelRasterAuthority !== "unavailable" ||
      manifest.denseShardExecuted !== false
    ) throw new Error("v427-manifest-identity");
    const entries = await Promise.all((Object.keys(FILES) as ExportId[]).map(async (id) => {
      const contract = FILES[id];
      const entry = manifest.exports[id];
      if (!entry || entry.path !== contract.name || !SHA.test(entry.sha256)) throw new Error(`v427-${id}-manifest`);
      const path = resolve(root, ROOT, contract.name);
      const fileMetadata = await stat(path);
      if (!fileMetadata.isFile() || fileMetadata.size <= 0 || fileMetadata.size > contract.maxBytes) throw new Error(`v427-${id}-size`);
      const fileBytes = await readFile(path);
      const fileSha256 = sha(fileBytes);
      if (fileSha256 !== entry.sha256) throw new Error(`v427-${id}-sha`);
      return [id, Object.freeze({ id, name: contract.name, bytes: new Uint8Array(fileBytes), fileSha256, contentType: contract.contentType, semantic: entry.semantic })] as const;
    }));
    const exports = Object.freeze(Object.fromEntries(entries)) as Readonly<Record<ExportId, KerrHighEnergyResponseAcquisitionLoadedExportV427>>;
    const artifact = parseKerrHighEnergyResponseAcquisitionArtifactV427(JSON.parse(new TextDecoder().decode(exports.json.bytes)));
    if (artifact.artifactSha256 !== manifest.artifactSha256 || canonicalShaV427(artifact) !== artifact.artifactSha256) throw new Error("v427-artifact-sha");
    return Object.freeze({ artifact, summary: createKerrHighEnergyResponseAcquisitionSummaryV427(artifact), exports, manifest });
  });
  cache = Object.freeze({ fingerprint, promise });
  try {
    return await promise;
  } catch (error) {
    if (cache?.promise === promise) cache = null;
    throw error;
  }
}

export function resetKerrHighEnergyResponseAcquisitionServerCacheForTestsV427(): void {
  cache = null;
}
