import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { createKerrObservationSummaryV436, parseKerrObservationContractV436, parseKerrObservationOracleV436, type KerrObservationContractV436, type KerrObservationOracleV436, type KerrObservationSummaryV436 } from "./kerrObservationProvenanceV436";

const ROOT = "dist/science/kerr-observation-provenance-v436";
const FILES = Object.freeze({
  oracle: Object.freeze({ name: "observation-provenance-oracle.json", maxBytes: 512 * 1024, contentType: "application/json; charset=utf-8" }),
  contract: Object.freeze({ name: "observation-provenance-contract.json", maxBytes: 128 * 1024, contentType: "application/json; charset=utf-8" }),
} as const);
type ExportId = keyof typeof FILES;
export type KerrObservationLoadedV436 = Readonly<{ oracle: KerrObservationOracleV436; contract: KerrObservationContractV436; summary: KerrObservationSummaryV436; exports: Readonly<Record<ExportId, Readonly<{ name: string; bytes: Uint8Array; fileSha256: string; contentType: string }>>> }>;
const sha = (value: Uint8Array | string): string => createHash("sha256").update(value).digest("hex");
let cache: Readonly<{ fingerprint: string; promise: Promise<KerrObservationLoadedV436> }> | null = null;

export async function loadKerrObservationProvenanceV436(root = process.cwd()): Promise<KerrObservationLoadedV436> {
  const oraclePath = resolve(root, ROOT, FILES.oracle.name);
  const metadata = await stat(oraclePath);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILES.oracle.maxBytes) throw new Error("v436-oracle-size");
  const oracleBytes = await readFile(oraclePath);
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${sha(oracleBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const entries = await Promise.all((Object.keys(FILES) as ExportId[]).map(async (id) => {
      const contract = FILES[id];
      const path = resolve(root, ROOT, contract.name);
      const fileMetadata = await stat(path);
      if (!fileMetadata.isFile() || fileMetadata.size <= 0 || fileMetadata.size > contract.maxBytes) throw new Error(`v436-${id}-size`);
      const bytes = await readFile(path);
      return [id, Object.freeze({ name: contract.name, bytes: new Uint8Array(bytes), fileSha256: sha(bytes), contentType: contract.contentType })] as const;
    }));
    const exports = Object.freeze(Object.fromEntries(entries)) as Readonly<Record<ExportId, Readonly<{ name: string; bytes: Uint8Array; fileSha256: string; contentType: string }>>>;
    const oracle = parseKerrObservationOracleV436(JSON.parse(new TextDecoder().decode(exports.oracle.bytes)));
    const parsedContract = parseKerrObservationContractV436(JSON.parse(new TextDecoder().decode(exports.contract.bytes)));
    return Object.freeze({ oracle, contract: parsedContract, summary: createKerrObservationSummaryV436(oracle), exports });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrObservationProvenanceServerCacheForTestsV436(): void { cache = null; }
