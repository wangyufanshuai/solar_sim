import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { canonicalShaV429, createKerrHighEnergyResponseUncertaintySummaryV429, parseKerrHighEnergyResponseUncertaintyArtifactV429, type KerrHighEnergyResponseUncertaintyArtifactV429, type KerrHighEnergyResponseUncertaintySummaryV429 } from "./kerrHighEnergyResponseUncertaintyV429";

const ROOT = "dist/science/kerr-high-energy-response-uncertainty-v429";
const FILES = Object.freeze({
  json: Object.freeze({ name: "response-uncertainty.json", maxBytes: 512 * 1024, contentType: "application/json; charset=utf-8" }),
  oracle: Object.freeze({ name: "uncertainty-oracle.json", maxBytes: 8 * 1024 * 1024, contentType: "application/json; charset=utf-8" }),
  protocol: Object.freeze({ name: "independent-validation-protocol.json", maxBytes: 256 * 1024, contentType: "application/json; charset=utf-8" }),
  csv: Object.freeze({ name: "prediction-uncertainty-diagonal.csv", maxBytes: 256 * 1024, contentType: "text/csv; charset=utf-8" }),
  fits: Object.freeze({ name: "response-uncertainty-budget.fits", maxBytes: 4 * 1024 * 1024, contentType: "application/fits" }),
  png: Object.freeze({ name: "response-uncertainty-architecture.png", maxBytes: 4 * 1024 * 1024, contentType: "image/png" }),
});
type ExportId = keyof typeof FILES;
type ExportManifest = Readonly<{ version: "v429-kerr-high-energy-response-uncertainty-export-manifest-v1"; artifactSha256: string; exports: Readonly<Record<ExportId, Readonly<{ path: string; sha256: string; semantic: string }>>>; predictedCountCount: 24; observedCountCount: 0; measuredHoldoutDatasetCount: 0; measuredValidationRunCount: 0; residualMetricCount: 0; measuredResponseAuthority: "unavailable"; scienceResponseApplicationCount: 0; detectorCountProduct: "fixture-prediction-only-not-measured"; pixelRasterAuthority: "unavailable"; denseShardExecuted: false }>;
export type KerrHighEnergyResponseUncertaintyLoadedExportV429 = Readonly<{ id: ExportId; name: string; bytes: Uint8Array; fileSha256: string; contentType: string; semantic: string }>;
type Loaded = Readonly<{ artifact: KerrHighEnergyResponseUncertaintyArtifactV429; summary: KerrHighEnergyResponseUncertaintySummaryV429; exports: Readonly<Record<ExportId, KerrHighEnergyResponseUncertaintyLoadedExportV429>>; manifest: ExportManifest }>;
const SHA = /^[a-f0-9]{64}$/;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
let cache: Readonly<{ fingerprint: string; promise: Promise<Loaded> }> | null = null;
export async function loadKerrHighEnergyResponseUncertaintyV429(root = process.cwd()): Promise<Loaded> {
  const manifestPath = resolve(root, ROOT, "export-manifest.json"), metadata = await stat(manifestPath);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) throw new Error("v429-manifest-size");
  const manifestBytes = await readFile(manifestPath), fingerprint = `${metadata.mtimeMs}:${metadata.size}:${sha(manifestBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as ExportManifest;
    if (manifest.version !== "v429-kerr-high-energy-response-uncertainty-export-manifest-v1" || !SHA.test(manifest.artifactSha256) || manifest.predictedCountCount !== 24 || manifest.observedCountCount !== 0 || manifest.measuredHoldoutDatasetCount !== 0 || manifest.measuredValidationRunCount !== 0 || manifest.residualMetricCount !== 0 || manifest.measuredResponseAuthority !== "unavailable" || manifest.scienceResponseApplicationCount !== 0 || manifest.detectorCountProduct !== "fixture-prediction-only-not-measured" || manifest.pixelRasterAuthority !== "unavailable" || manifest.denseShardExecuted !== false) throw new Error("v429-manifest-identity");
    const entries = await Promise.all((Object.keys(FILES) as ExportId[]).map(async (id) => { const contract = FILES[id], entry = manifest.exports[id]; if (!entry || entry.path !== contract.name || !SHA.test(entry.sha256)) throw new Error(`v429-${id}-manifest`); const path = resolve(root, ROOT, contract.name), fileMetadata = await stat(path); if (!fileMetadata.isFile() || fileMetadata.size <= 0 || fileMetadata.size > contract.maxBytes) throw new Error(`v429-${id}-size`); const fileBytes = await readFile(path), fileSha256 = sha(fileBytes); if (fileSha256 !== entry.sha256) throw new Error(`v429-${id}-sha`); return [id, Object.freeze({ id, name: contract.name, bytes: new Uint8Array(fileBytes), fileSha256, contentType: contract.contentType, semantic: entry.semantic })] as const; }));
    const exports = Object.freeze(Object.fromEntries(entries)) as Readonly<Record<ExportId, KerrHighEnergyResponseUncertaintyLoadedExportV429>>;
    const artifact = parseKerrHighEnergyResponseUncertaintyArtifactV429(JSON.parse(new TextDecoder().decode(exports.json.bytes)));
    if (artifact.artifactSha256 !== manifest.artifactSha256 || canonicalShaV429(artifact) !== artifact.artifactSha256) throw new Error("v429-artifact-sha");
    return Object.freeze({ artifact, summary: createKerrHighEnergyResponseUncertaintySummaryV429(artifact), exports, manifest });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}
export function resetKerrHighEnergyResponseUncertaintyServerCacheForTestsV429(): void { cache = null; }
