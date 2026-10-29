import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrDetectorProjectionAdmissionSummaryV442,
  parseKerrDetectorProjectionAdmissionContractV442,
  parseKerrDetectorProjectionAdmissionV442,
  type KerrDetectorProjectionAdmissionArtifactV442,
  type KerrDetectorProjectionAdmissionContractV442,
  type KerrDetectorProjectionAdmissionSummaryV442,
} from "./kerrDetectorProjectionAdmissionV442";

const ROOT = "dist/science/kerr-detector-projection-admission-v442";
const FILES = Object.freeze({
  admission: Object.freeze({ name: "detector-projection-admission.json", maxBytes: 256 * 1024, contentType: "application/json; charset=utf-8" }),
  contract: Object.freeze({ name: "admission-contract.json", maxBytes: 64 * 1024, contentType: "application/json; charset=utf-8" }),
});
type ExportId = keyof typeof FILES;
export type KerrDetectorProjectionAdmissionLoadedV442 = Readonly<{
  artifact: KerrDetectorProjectionAdmissionArtifactV442;
  contract: KerrDetectorProjectionAdmissionContractV442;
  summary: KerrDetectorProjectionAdmissionSummaryV442;
  exports: Readonly<Record<ExportId, Readonly<{ name: string; bytes: Uint8Array; fileSha256: string; contentType: string }>>>;
}>;
const sha = (value: Uint8Array | string): string => createHash("sha256").update(value).digest("hex");
let cache: Readonly<{ fingerprint: string; promise: Promise<KerrDetectorProjectionAdmissionLoadedV442> }> | null = null;

export async function loadKerrDetectorProjectionAdmissionV442(root = process.cwd()): Promise<KerrDetectorProjectionAdmissionLoadedV442> {
  const artifactPath = resolve(root, ROOT, FILES.admission.name);
  const metadata = await stat(artifactPath);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILES.admission.maxBytes) throw new Error("v442-admission-size");
  const artifactBytes = await readFile(artifactPath);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${sha(artifactBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const entries = await Promise.all((Object.keys(FILES) as ExportId[]).map(async (id) => {
      const file = FILES[id];
      const path = resolve(root, ROOT, file.name);
      const info = await stat(path);
      if (!info.isFile() || info.size <= 0 || info.size > file.maxBytes) throw new Error(`v442-${id}-size`);
      const bytes = await readFile(path);
      return [id, Object.freeze({ name: file.name, bytes: new Uint8Array(bytes), fileSha256: sha(bytes), contentType: file.contentType })] as const;
    }));
    const exports = Object.freeze(Object.fromEntries(entries)) as Readonly<Record<ExportId, Readonly<{ name: string; bytes: Uint8Array; fileSha256: string; contentType: string }>>>;
    const artifact = parseKerrDetectorProjectionAdmissionV442(JSON.parse(new TextDecoder().decode(exports.admission.bytes)));
    const contract = parseKerrDetectorProjectionAdmissionContractV442(JSON.parse(new TextDecoder().decode(exports.contract.bytes)));
    return Object.freeze({ artifact, contract, summary: createKerrDetectorProjectionAdmissionSummaryV442(artifact), exports });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrDetectorProjectionAdmissionServerCacheForTestsV442(): void { cache = null; }
