import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { canonicalShaV431, createKerrHighEnergyLikelihoodStressSummaryV431, parseKerrHighEnergyLikelihoodStressArtifactV431, type KerrHighEnergyLikelihoodStressArtifactV431, type KerrHighEnergyLikelihoodStressSummaryV431 } from "./kerrHighEnergyLikelihoodStressV431";

const ROOT = "dist/science/kerr-high-energy-likelihood-stress-v431";
const FILES = Object.freeze({
  json: Object.freeze({ name: "likelihood-stress.json", maxBytes: 512 * 1024, contentType: "application/json; charset=utf-8" }),
  oracle: Object.freeze({ name: "likelihood-stress-oracle.json", maxBytes: 2 * 1024 * 1024, contentType: "application/json; charset=utf-8" }),
  contract: Object.freeze({ name: "likelihood-stress-contract.json", maxBytes: 256 * 1024, contentType: "application/json; charset=utf-8" }),
  csv: Object.freeze({ name: "likelihood-stress-scenarios.csv", maxBytes: 256 * 1024, contentType: "text/csv; charset=utf-8" }),
  fits: Object.freeze({ name: "likelihood-stress-summary.fits", maxBytes: 2 * 1024 * 1024, contentType: "application/fits" }),
  png: Object.freeze({ name: "likelihood-stress-map.png", maxBytes: 4 * 1024 * 1024, contentType: "image/png" }),
});
type ExportId = keyof typeof FILES;
type Manifest = Readonly<{ version: "v431-kerr-high-energy-likelihood-stress-export-manifest-v1"; artifactSha256: string; exports: Readonly<Record<ExportId, Readonly<{ path: string; sha256: string; semantic: string }>>>; scenarioCount: 6; syntheticCountCellCount: 73728; measuredObservedCountCount: 0; measuredHoldoutDatasetCount: 0; measuredResidualMetricCount: 0; measuredValidationRunCount: 0; alternativeLikelihoodImplementationQualifiedCount: 0; measuredResponseAuthority: "unavailable"; scienceResponseApplicationCount: 0; pixelRasterAuthority: "unavailable"; denseShardExecuted: false }>;
export type KerrHighEnergyLikelihoodStressLoadedExportV431 = Readonly<{ id: ExportId; name: string; bytes: Uint8Array; fileSha256: string; contentType: string; semantic: string }>;
type Loaded = Readonly<{ artifact: KerrHighEnergyLikelihoodStressArtifactV431; summary: KerrHighEnergyLikelihoodStressSummaryV431; exports: Readonly<Record<ExportId, KerrHighEnergyLikelihoodStressLoadedExportV431>>; manifest: Manifest }>;
const SHA = /^[a-f0-9]{64}$/;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
let cache: Readonly<{ fingerprint: string; promise: Promise<Loaded> }> | null = null;

export async function loadKerrHighEnergyLikelihoodStressV431(root = process.cwd()): Promise<Loaded> {
  const manifestPath = resolve(root, ROOT, "export-manifest.json"), metadata = await stat(manifestPath);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) throw new Error("v431-manifest-size");
  const manifestBytes = await readFile(manifestPath), fingerprint = `${metadata.mtimeMs}:${metadata.size}:${sha(manifestBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as Manifest;
    if (manifest.version !== "v431-kerr-high-energy-likelihood-stress-export-manifest-v1" || !SHA.test(manifest.artifactSha256) || manifest.scenarioCount !== 6 || manifest.syntheticCountCellCount !== 73728 || manifest.measuredObservedCountCount !== 0 || manifest.measuredHoldoutDatasetCount !== 0 || manifest.measuredResidualMetricCount !== 0 || manifest.measuredValidationRunCount !== 0 || manifest.alternativeLikelihoodImplementationQualifiedCount !== 0 || manifest.measuredResponseAuthority !== "unavailable" || manifest.scienceResponseApplicationCount !== 0 || manifest.pixelRasterAuthority !== "unavailable" || manifest.denseShardExecuted !== false) throw new Error("v431-manifest-identity");
    const entries = await Promise.all((Object.keys(FILES) as ExportId[]).map(async (id) => {
      const contract = FILES[id], entry = manifest.exports[id];
      if (!entry || entry.path !== contract.name || !SHA.test(entry.sha256)) throw new Error(`v431-${id}-manifest`);
      const path = resolve(root, ROOT, contract.name), fileMetadata = await stat(path);
      if (!fileMetadata.isFile() || fileMetadata.size <= 0 || fileMetadata.size > contract.maxBytes) throw new Error(`v431-${id}-size`);
      const fileBytes = await readFile(path), fileSha256 = sha(fileBytes);
      if (fileSha256 !== entry.sha256) throw new Error(`v431-${id}-sha`);
      return [id, Object.freeze({ id, name: contract.name, bytes: new Uint8Array(fileBytes), fileSha256, contentType: contract.contentType, semantic: entry.semantic })] as const;
    }));
    const exports = Object.freeze(Object.fromEntries(entries)) as Readonly<Record<ExportId, KerrHighEnergyLikelihoodStressLoadedExportV431>>;
    const artifact = parseKerrHighEnergyLikelihoodStressArtifactV431(JSON.parse(new TextDecoder().decode(exports.json.bytes)));
    if (artifact.artifactSha256 !== manifest.artifactSha256 || canonicalShaV431(artifact) !== artifact.artifactSha256) throw new Error("v431-artifact-sha");
    return Object.freeze({ artifact, summary: createKerrHighEnergyLikelihoodStressSummaryV431(artifact), exports, manifest });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrHighEnergyLikelihoodStressServerCacheForTestsV431(): void { cache = null; }
