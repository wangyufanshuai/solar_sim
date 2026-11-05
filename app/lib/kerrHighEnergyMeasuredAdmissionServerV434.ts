import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { canonicalShaV434, createKerrMeasuredAdmissionSummaryV434, parseKerrMeasuredAdmissionArtifactV434, type KerrMeasuredAdmissionArtifactV434, type KerrMeasuredAdmissionSummaryV434 } from "./kerrHighEnergyMeasuredAdmissionV434";

const ROOT = "dist/science/kerr-high-energy-measured-admission-v434";
const FILES = Object.freeze({
  json: Object.freeze({ name: "measured-admission.json", maxBytes: 256 * 1024, contentType: "application/json; charset=utf-8" }),
  oracle: Object.freeze({ name: "measured-admission-oracle.json", maxBytes: 512 * 1024, contentType: "application/json; charset=utf-8" }),
  contract: Object.freeze({ name: "measured-admission-contract.json", maxBytes: 128 * 1024, contentType: "application/json; charset=utf-8" }),
  fixture: Object.freeze({ name: "measured-admission-fixture.json", maxBytes: 128 * 1024, contentType: "application/json; charset=utf-8" }),
  csv: Object.freeze({ name: "measured-admission-gates.csv", maxBytes: 128 * 1024, contentType: "text/csv; charset=utf-8" }),
  fits: Object.freeze({ name: "measured-admission-status.fits", maxBytes: 2 * 1024 * 1024, contentType: "application/fits" }),
  png: Object.freeze({ name: "measured-admission-firewall.png", maxBytes: 4 * 1024 * 1024, contentType: "image/png" }),
});
type ExportId = keyof typeof FILES;
type Manifest = Readonly<{ version: "v434-kerr-high-energy-measured-admission-export-manifest-v1"; artifactSha256: string; exports: Readonly<Record<ExportId, Readonly<{ path: string; sha256: string; semantic: string }>>>; requiredGateCount: 9; passedFixtureGateCount: 8; mutationCount: 12; rejectedMutationCount: 12; measuredPackCount: 0; measuredResponseAuthority: "unavailable"; measuredLikelihoodAuthority: "unavailable"; independentMeasuredHoldout: "unavailable"; independentReview: "not-run"; scienceAdmission: "blocked-no-measured-authority-pack"; scienceResponseApplicationCount: 0; denseShardExecuted: false }>;
export type KerrMeasuredAdmissionLoadedExportV434 = Readonly<{ id: ExportId; name: string; bytes: Uint8Array; fileSha256: string; contentType: string; semantic: string }>;
type Loaded = Readonly<{ artifact: KerrMeasuredAdmissionArtifactV434; summary: KerrMeasuredAdmissionSummaryV434; exports: Readonly<Record<ExportId, KerrMeasuredAdmissionLoadedExportV434>>; manifest: Manifest }>;
const SHA = /^[a-f0-9]{64}$/;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
let cache: Readonly<{ fingerprint: string; promise: Promise<Loaded> }> | null = null;

export async function loadKerrMeasuredAdmissionV434(root = process.cwd()): Promise<Loaded> {
  const manifestPath = resolve(root, ROOT, "export-manifest.json"), metadata = await stat(manifestPath);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) throw new Error("v434-manifest-size");
  const manifestBytes = await readFile(manifestPath), fingerprint = `${metadata.mtimeMs}:${metadata.size}:${sha(manifestBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as Manifest;
    if (manifest.version !== "v434-kerr-high-energy-measured-admission-export-manifest-v1" || !SHA.test(manifest.artifactSha256) || manifest.requiredGateCount !== 9 || manifest.passedFixtureGateCount !== 8 || manifest.mutationCount !== 12 || manifest.rejectedMutationCount !== 12 || manifest.measuredPackCount !== 0 || manifest.measuredResponseAuthority !== "unavailable" || manifest.measuredLikelihoodAuthority !== "unavailable" || manifest.independentMeasuredHoldout !== "unavailable" || manifest.independentReview !== "not-run" || manifest.scienceAdmission !== "blocked-no-measured-authority-pack" || manifest.scienceResponseApplicationCount !== 0 || manifest.denseShardExecuted !== false) throw new Error("v434-manifest-identity");
    const entries = await Promise.all((Object.keys(FILES) as ExportId[]).map(async (id) => { const fileContract = FILES[id], entry = manifest.exports[id]; if (!entry || entry.path !== fileContract.name || !SHA.test(entry.sha256)) throw new Error(`v434-${id}-manifest`); const path = resolve(root, ROOT, fileContract.name), fileMetadata = await stat(path); if (!fileMetadata.isFile() || fileMetadata.size <= 0 || fileMetadata.size > fileContract.maxBytes) throw new Error(`v434-${id}-size`); const fileBytes = await readFile(path), fileSha256 = sha(fileBytes); if (fileSha256 !== entry.sha256) throw new Error(`v434-${id}-sha`); return [id, Object.freeze({ id, name: fileContract.name, bytes: new Uint8Array(fileBytes), fileSha256, contentType: fileContract.contentType, semantic: entry.semantic })] as const; }));
    const exports = Object.freeze(Object.fromEntries(entries)) as Readonly<Record<ExportId, KerrMeasuredAdmissionLoadedExportV434>>;
    const artifact = parseKerrMeasuredAdmissionArtifactV434(JSON.parse(new TextDecoder().decode(exports.json.bytes)));
    if (artifact.artifactSha256 !== manifest.artifactSha256 || canonicalShaV434(artifact) !== artifact.artifactSha256) throw new Error("v434-artifact-sha");
    return Object.freeze({ artifact, summary: createKerrMeasuredAdmissionSummaryV434(artifact), exports, manifest });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}
export function resetKerrMeasuredAdmissionServerCacheForTestsV434(): void { cache = null; }
