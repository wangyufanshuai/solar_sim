import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  canonicalShaV433,
  createKerrHighEnergyJointNuisanceSummaryV433,
  parseKerrHighEnergyJointNuisanceArtifactV433,
  type KerrHighEnergyJointNuisanceArtifactV433,
  type KerrHighEnergyJointNuisanceSummaryV433,
} from "./kerrHighEnergyJointNuisanceV433";

const ROOT = "dist/science/kerr-high-energy-joint-nuisance-v433";
const FILES = Object.freeze({
  json: Object.freeze({ name: "joint-nuisance.json", maxBytes: 512 * 1024, contentType: "application/json; charset=utf-8" }),
  oracle: Object.freeze({ name: "joint-nuisance-oracle.json", maxBytes: 2 * 1024 * 1024, contentType: "application/json; charset=utf-8" }),
  contract: Object.freeze({ name: "joint-nuisance-contract.json", maxBytes: 256 * 1024, contentType: "application/json; charset=utf-8" }),
  boundary: Object.freeze({ name: "science-boundary.json", maxBytes: 512 * 1024, contentType: "application/json; charset=utf-8" }),
  csv: Object.freeze({ name: "joint-nuisance-diagonal.csv", maxBytes: 256 * 1024, contentType: "text/csv; charset=utf-8" }),
  fits: Object.freeze({ name: "joint-nuisance-covariance.fits", maxBytes: 2 * 1024 * 1024, contentType: "application/fits" }),
  png: Object.freeze({ name: "joint-nuisance-budget.png", maxBytes: 4 * 1024 * 1024, contentType: "image/png" }),
});
type ExportId = keyof typeof FILES;
type Manifest = Readonly<{
  version: "v433-kerr-high-energy-joint-nuisance-export-manifest-v1";
  artifactSha256: string;
  exports: Readonly<Record<ExportId, Readonly<{ path: string; sha256: string; semantic: string }>>>;
  familyCount: 2;
  covarianceDimension: 24;
  covarianceElementCount: 11520;
  groupUncertaintyCount: 20;
  monteCarloDrawCount: 16384;
  scienceBoundaryStatus: "implemented-not-admitted";
  measuredObservedCountCount: 0;
  measuredResponseAuthority: "unavailable";
  measuredLikelihoodAuthority: "unavailable";
  scienceResponseApplicationCount: 0;
  denseShardExecuted: false;
}>;
export type KerrHighEnergyJointNuisanceLoadedExportV433 = Readonly<{ id: ExportId; name: string; bytes: Uint8Array; fileSha256: string; contentType: string; semantic: string }>;
type Loaded = Readonly<{ artifact: KerrHighEnergyJointNuisanceArtifactV433; summary: KerrHighEnergyJointNuisanceSummaryV433; exports: Readonly<Record<ExportId, KerrHighEnergyJointNuisanceLoadedExportV433>>; manifest: Manifest }>;
const SHA = /^[a-f0-9]{64}$/;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
let cache: Readonly<{ fingerprint: string; promise: Promise<Loaded> }> | null = null;

export async function loadKerrHighEnergyJointNuisanceV433(root = process.cwd()): Promise<Loaded> {
  const manifestPath = resolve(root, ROOT, "export-manifest.json");
  const metadata = await stat(manifestPath);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) throw new Error("v433-manifest-size");
  const manifestBytes = await readFile(manifestPath);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${sha(manifestBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as Manifest;
    if (manifest.version !== "v433-kerr-high-energy-joint-nuisance-export-manifest-v1" || !SHA.test(manifest.artifactSha256) || manifest.familyCount !== 2 || manifest.covarianceDimension !== 24 || manifest.covarianceElementCount !== 11520 || manifest.groupUncertaintyCount !== 20 || manifest.monteCarloDrawCount !== 16384 || manifest.scienceBoundaryStatus !== "implemented-not-admitted" || manifest.measuredObservedCountCount !== 0 || manifest.measuredResponseAuthority !== "unavailable" || manifest.measuredLikelihoodAuthority !== "unavailable" || manifest.scienceResponseApplicationCount !== 0 || manifest.denseShardExecuted !== false) throw new Error("v433-manifest-identity");
    const entries = await Promise.all((Object.keys(FILES) as ExportId[]).map(async (id) => {
      const contract = FILES[id];
      const entry = manifest.exports[id];
      if (!entry || entry.path !== contract.name || !SHA.test(entry.sha256)) throw new Error(`v433-${id}-manifest`);
      const path = resolve(root, ROOT, contract.name);
      const fileMetadata = await stat(path);
      if (!fileMetadata.isFile() || fileMetadata.size <= 0 || fileMetadata.size > contract.maxBytes) throw new Error(`v433-${id}-size`);
      const fileBytes = await readFile(path);
      const fileSha256 = sha(fileBytes);
      if (fileSha256 !== entry.sha256) throw new Error(`v433-${id}-sha`);
      return [id, Object.freeze({ id, name: contract.name, bytes: new Uint8Array(fileBytes), fileSha256, contentType: contract.contentType, semantic: entry.semantic })] as const;
    }));
    const exports = Object.freeze(Object.fromEntries(entries)) as Readonly<Record<ExportId, KerrHighEnergyJointNuisanceLoadedExportV433>>;
    const artifact = parseKerrHighEnergyJointNuisanceArtifactV433(JSON.parse(new TextDecoder().decode(exports.json.bytes)));
    if (artifact.artifactSha256 !== manifest.artifactSha256 || canonicalShaV433(artifact) !== artifact.artifactSha256) throw new Error("v433-artifact-sha");
    return Object.freeze({ artifact, summary: createKerrHighEnergyJointNuisanceSummaryV433(artifact), exports, manifest });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrHighEnergyJointNuisanceServerCacheForTestsV433(): void { cache = null; }
