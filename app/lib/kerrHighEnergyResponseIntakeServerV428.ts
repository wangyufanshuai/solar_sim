import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  canonicalShaV428,
  createKerrHighEnergyResponseIntakeSummaryV428,
  parseKerrHighEnergyResponseIntakeArtifactV428,
  type KerrHighEnergyResponseIntakeArtifactV428,
  type KerrHighEnergyResponseIntakeSummaryV428,
} from "./kerrHighEnergyResponseIntakeV428";

const ROOT = "dist/science/kerr-high-energy-response-intake-v428";
const FILES = Object.freeze({
  json: Object.freeze({ name: "intake-firewall.json", maxBytes: 512 * 1024, contentType: "application/json; charset=utf-8" }),
  schema: Object.freeze({ name: "response-submission-schema.json", maxBytes: 256 * 1024, contentType: "application/schema+json; charset=utf-8" }),
  report: Object.freeze({ name: "fixture-intake-report.json", maxBytes: 512 * 1024, contentType: "application/json; charset=utf-8" }),
  fixture: Object.freeze({ name: "nonpublishable-intake-fixture.zip", maxBytes: 4 * 1024 * 1024, contentType: "application/zip" }),
  png: Object.freeze({ name: "intake-firewall-architecture.png", maxBytes: 4 * 1024 * 1024, contentType: "image/png" }),
});
type ExportId = keyof typeof FILES;
type ExportManifest = Readonly<{
  version: "v428-kerr-high-energy-response-intake-export-manifest-v1";
  artifactSha256: string;
  exports: Readonly<Record<ExportId, Readonly<{ path: string; sha256: string; semantic: string }>>>;
  expectedArchiveFileCount: 7;
  measurementCsvCount: 6;
  fixtureMutationCount: 12;
  fixtureRejectedMutationCount: 12;
  measuredSubmissionCount: 0;
  measuredImportAttemptCount: 0;
  measuredResponseAuthority: "unavailable";
  scienceResponseApplicationCount: 0;
  detectorCountProduct: "unavailable";
  pixelRasterAuthority: "unavailable";
  denseShardExecuted: false;
}>;
export type KerrHighEnergyResponseIntakeLoadedExportV428 = Readonly<{ id: ExportId; name: string; bytes: Uint8Array; fileSha256: string; contentType: string; semantic: string }>;
type Loaded = Readonly<{ artifact: KerrHighEnergyResponseIntakeArtifactV428; summary: KerrHighEnergyResponseIntakeSummaryV428; exports: Readonly<Record<ExportId, KerrHighEnergyResponseIntakeLoadedExportV428>>; manifest: ExportManifest }>;
const SHA = /^[a-f0-9]{64}$/;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
let cache: Readonly<{ fingerprint: string; promise: Promise<Loaded> }> | null = null;

export async function loadKerrHighEnergyResponseIntakeV428(root = process.cwd()): Promise<Loaded> {
  const manifestPath = resolve(root, ROOT, "export-manifest.json");
  const metadata = await stat(manifestPath);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) throw new Error("v428-manifest-size");
  const manifestBytes = await readFile(manifestPath);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${sha(manifestBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as ExportManifest;
    if (manifest.version !== "v428-kerr-high-energy-response-intake-export-manifest-v1" || !SHA.test(manifest.artifactSha256) || manifest.expectedArchiveFileCount !== 7 || manifest.measurementCsvCount !== 6 || manifest.fixtureMutationCount !== 12 || manifest.fixtureRejectedMutationCount !== 12 || manifest.measuredSubmissionCount !== 0 || manifest.measuredImportAttemptCount !== 0 || manifest.measuredResponseAuthority !== "unavailable" || manifest.scienceResponseApplicationCount !== 0 || manifest.detectorCountProduct !== "unavailable" || manifest.pixelRasterAuthority !== "unavailable" || manifest.denseShardExecuted !== false) throw new Error("v428-manifest-identity");
    const entries = await Promise.all((Object.keys(FILES) as ExportId[]).map(async (id) => {
      const contract = FILES[id];
      const entry = manifest.exports[id];
      if (!entry || entry.path !== contract.name || !SHA.test(entry.sha256)) throw new Error(`v428-${id}-manifest`);
      const path = resolve(root, ROOT, contract.name);
      const fileMetadata = await stat(path);
      if (!fileMetadata.isFile() || fileMetadata.size <= 0 || fileMetadata.size > contract.maxBytes) throw new Error(`v428-${id}-size`);
      const fileBytes = await readFile(path);
      const fileSha256 = sha(fileBytes);
      if (fileSha256 !== entry.sha256) throw new Error(`v428-${id}-sha`);
      return [id, Object.freeze({ id, name: contract.name, bytes: new Uint8Array(fileBytes), fileSha256, contentType: contract.contentType, semantic: entry.semantic })] as const;
    }));
    const exports = Object.freeze(Object.fromEntries(entries)) as Readonly<Record<ExportId, KerrHighEnergyResponseIntakeLoadedExportV428>>;
    const artifact = parseKerrHighEnergyResponseIntakeArtifactV428(JSON.parse(new TextDecoder().decode(exports.json.bytes)));
    if (artifact.artifactSha256 !== manifest.artifactSha256 || canonicalShaV428(artifact) !== artifact.artifactSha256) throw new Error("v428-artifact-sha");
    return Object.freeze({ artifact, summary: createKerrHighEnergyResponseIntakeSummaryV428(artifact), exports, manifest });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrHighEnergyResponseIntakeServerCacheForTestsV428(): void { cache = null; }
