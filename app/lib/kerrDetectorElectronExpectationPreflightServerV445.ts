import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { createKerrDetectorElectronExpectationSummaryV445, parseKerrDetectorElectronExpectationPreflightV445, type KerrDetectorElectronExpectationPreflightV445, type KerrDetectorElectronExpectationSummaryV445 } from "./kerrDetectorElectronExpectationPreflightV445";

const ROOT = "dist/science/kerr-detector-electron-expectation-v445";
const FILES = Object.freeze({ preflight: Object.freeze({ name: "electron-expectation-preflight.json", maxBytes: 256 * 1024, contentType: "application/json; charset=utf-8" }), contract: Object.freeze({ name: "preflight-contract.json", maxBytes: 128 * 1024, contentType: "application/json; charset=utf-8" }) });
type ExportId = keyof typeof FILES;
export type KerrDetectorElectronExpectationLoadedV445 = Readonly<{ artifact: KerrDetectorElectronExpectationPreflightV445; summary: KerrDetectorElectronExpectationSummaryV445; exports: Readonly<Record<ExportId, Readonly<{ name: string; bytes: Uint8Array; fileSha256: string; contentType: string }>>> }>;
const sha = (value: Uint8Array | string): string => createHash("sha256").update(value).digest("hex");
let cache: Readonly<{ fingerprint: string; promise: Promise<KerrDetectorElectronExpectationLoadedV445> }> | null = null;

export async function loadKerrDetectorElectronExpectationV445(root = process.cwd()): Promise<KerrDetectorElectronExpectationLoadedV445> {
  const preflightPath = resolve(root, ROOT, FILES.preflight.name), metadata = await stat(preflightPath);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILES.preflight.maxBytes) throw new Error("v445-preflight-size");
  const preflightBytes = await readFile(preflightPath), fingerprint = `${metadata.mtimeMs}:${metadata.size}:${sha(preflightBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(async () => {
    const entries = await Promise.all((Object.keys(FILES) as ExportId[]).map(async (id) => { const file = FILES[id], path = resolve(root, ROOT, file.name), info = await stat(path); if (!info.isFile() || info.size <= 0 || info.size > file.maxBytes) throw new Error(`v445-${id}-size`); const bytes = await readFile(path); return [id, Object.freeze({ name: file.name, bytes: new Uint8Array(bytes), fileSha256: sha(bytes), contentType: file.contentType })] as const; }));
    const exports = Object.freeze(Object.fromEntries(entries)) as Readonly<Record<ExportId, Readonly<{ name: string; bytes: Uint8Array; fileSha256: string; contentType: string }>>>;
    const artifact = parseKerrDetectorElectronExpectationPreflightV445(JSON.parse(new TextDecoder().decode(exports.preflight.bytes)));
    return Object.freeze({ artifact, summary: createKerrDetectorElectronExpectationSummaryV445(artifact), exports });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrDetectorElectronExpectationServerCacheForTestsV445(): void { cache = null; }
