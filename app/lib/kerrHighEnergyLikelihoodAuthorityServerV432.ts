import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { canonicalShaV432, createKerrHighEnergyLikelihoodAuthoritySummaryV432, parseKerrHighEnergyLikelihoodAuthorityArtifactV432, type KerrHighEnergyLikelihoodAuthorityArtifactV432, type KerrHighEnergyLikelihoodAuthoritySummaryV432 } from "./kerrHighEnergyLikelihoodAuthorityV432";

const ROOT = "dist/science/kerr-high-energy-likelihood-authority-v432";
const FILES = Object.freeze({ json: Object.freeze({ name: "likelihood-authority.json", maxBytes: 512 * 1024, contentType: "application/json; charset=utf-8" }), oracle: Object.freeze({ name: "likelihood-authority-oracle.json", maxBytes: 2 * 1024 * 1024, contentType: "application/json; charset=utf-8" }), contract: Object.freeze({ name: "likelihood-authority-contract.json", maxBytes: 256 * 1024, contentType: "application/json; charset=utf-8" }), csv: Object.freeze({ name: "likelihood-authority-families.csv", maxBytes: 256 * 1024, contentType: "text/csv; charset=utf-8" }), fits: Object.freeze({ name: "likelihood-authority-summary.fits", maxBytes: 2 * 1024 * 1024, contentType: "application/fits" }), png: Object.freeze({ name: "likelihood-authority-map.png", maxBytes: 4 * 1024 * 1024, contentType: "image/png" }) });
type ExportId = keyof typeof FILES;
type Manifest = Readonly<{ version: "v432-kerr-high-energy-likelihood-authority-export-manifest-v1"; artifactSha256: string; exports: Readonly<Record<ExportId, Readonly<{ path: string; sha256: string; semantic: string }>>>; candidateFamilyCount: 2; syntheticCountCellCount: 24576; parameterRecoveryResultCount: 2; holdoutSelectionResultCount: 2; alternativeLikelihoodImplementationQualifiedCount: 2; measuredObservedCountCount: 0; measuredHoldoutDatasetCount: 0; measuredResidualMetricCount: 0; measuredValidationRunCount: 0; measuredResponseAuthority: "unavailable"; scienceResponseApplicationCount: 0; pixelRasterAuthority: "unavailable"; denseShardExecuted: false }>;
export type KerrHighEnergyLikelihoodAuthorityLoadedExportV432 = Readonly<{ id: ExportId; name: string; bytes: Uint8Array; fileSha256: string; contentType: string; semantic: string }>;
type Loaded = Readonly<{ artifact: KerrHighEnergyLikelihoodAuthorityArtifactV432; summary: KerrHighEnergyLikelihoodAuthoritySummaryV432; exports: Readonly<Record<ExportId, KerrHighEnergyLikelihoodAuthorityLoadedExportV432>>; manifest: Manifest }>;
const SHA = /^[a-f0-9]{64}$/;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
let cache: Readonly<{ fingerprint: string; promise: Promise<Loaded> }> | null = null;

export async function loadKerrHighEnergyLikelihoodAuthorityV432(root = process.cwd()): Promise<Loaded> {
  const manifestPath = resolve(root, ROOT, "export-manifest.json"), metadata = await stat(manifestPath);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) throw new Error("v432-manifest-size");
  const manifestBytes = await readFile(manifestPath), fingerprint = `${metadata.mtimeMs}:${metadata.size}:${sha(manifestBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as Manifest;
    if (manifest.version !== "v432-kerr-high-energy-likelihood-authority-export-manifest-v1" || !SHA.test(manifest.artifactSha256) || manifest.candidateFamilyCount !== 2 || manifest.syntheticCountCellCount !== 24576 || manifest.parameterRecoveryResultCount !== 2 || manifest.holdoutSelectionResultCount !== 2 || manifest.alternativeLikelihoodImplementationQualifiedCount !== 2 || manifest.measuredObservedCountCount !== 0 || manifest.measuredHoldoutDatasetCount !== 0 || manifest.measuredResidualMetricCount !== 0 || manifest.measuredValidationRunCount !== 0 || manifest.measuredResponseAuthority !== "unavailable" || manifest.scienceResponseApplicationCount !== 0 || manifest.pixelRasterAuthority !== "unavailable" || manifest.denseShardExecuted !== false) throw new Error("v432-manifest-identity");
    const entries = await Promise.all((Object.keys(FILES) as ExportId[]).map(async (id) => { const contract = FILES[id], entry = manifest.exports[id]; if (!entry || entry.path !== contract.name || !SHA.test(entry.sha256)) throw new Error(`v432-${id}-manifest`); const path = resolve(root, ROOT, contract.name), fileMetadata = await stat(path); if (!fileMetadata.isFile() || fileMetadata.size <= 0 || fileMetadata.size > contract.maxBytes) throw new Error(`v432-${id}-size`); const fileBytes = await readFile(path), fileSha256 = sha(fileBytes); if (fileSha256 !== entry.sha256) throw new Error(`v432-${id}-sha`); return [id, Object.freeze({ id, name: contract.name, bytes: new Uint8Array(fileBytes), fileSha256, contentType: contract.contentType, semantic: entry.semantic })] as const; }));
    const exports = Object.freeze(Object.fromEntries(entries)) as Readonly<Record<ExportId, KerrHighEnergyLikelihoodAuthorityLoadedExportV432>>;
    const artifact = parseKerrHighEnergyLikelihoodAuthorityArtifactV432(JSON.parse(new TextDecoder().decode(exports.json.bytes)));
    if (artifact.artifactSha256 !== manifest.artifactSha256 || canonicalShaV432(artifact) !== artifact.artifactSha256) throw new Error("v432-artifact-sha");
    return Object.freeze({ artifact, summary: createKerrHighEnergyLikelihoodAuthoritySummaryV432(artifact), exports, manifest });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}
export function resetKerrHighEnergyLikelihoodAuthorityServerCacheForTestsV432(): void { cache = null; }
