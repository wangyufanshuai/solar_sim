import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { createKerrMeasuredDetectorProvenanceSummaryV464, parseKerrMeasuredDetectorProvenanceArtifactV464, type KerrMeasuredDetectorProvenanceArtifactV464, type KerrMeasuredDetectorProvenanceSummaryV464 } from "./kerrMeasuredDetectorProvenanceV464";

const ROOT = "dist/science/kerr-measured-detector-provenance-v464";
const FILE = Object.freeze({ name: "provenance-observatory.json", maxBytes: 128 * 1024 });
export type KerrMeasuredDetectorProvenanceLoadedV464 = Readonly<{ artifact: KerrMeasuredDetectorProvenanceArtifactV464; summary: KerrMeasuredDetectorProvenanceSummaryV464; export: Readonly<{ name: string; bytes: Uint8Array; fileSha256: string; contentType: "application/json; charset=utf-8" }> }>;
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
let cache: Readonly<{ fingerprint: string; promise: Promise<KerrMeasuredDetectorProvenanceLoadedV464> }> | null = null;
export async function loadKerrMeasuredDetectorProvenanceV464(root = process.cwd()): Promise<KerrMeasuredDetectorProvenanceLoadedV464> { const target = resolve(root, ROOT, FILE.name); const metadata = await stat(target); if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) throw new Error("v464-provenance-size"); const bytes = new Uint8Array(await readFile(target)); const fingerprint = `${target}:${metadata.mtimeMs}:${metadata.size}:${digest(bytes)}`; if (cache?.fingerprint === fingerprint) return cache.promise; const promise = Promise.resolve().then(() => { const artifact = parseKerrMeasuredDetectorProvenanceArtifactV464(JSON.parse(new TextDecoder().decode(bytes))); return Object.freeze({ artifact, summary: createKerrMeasuredDetectorProvenanceSummaryV464(artifact), export: Object.freeze({ name: FILE.name, bytes, fileSha256: digest(bytes), contentType: "application/json; charset=utf-8" as const }) }); }); cache = Object.freeze({ fingerprint, promise }); try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; } }
export function resetKerrMeasuredDetectorProvenanceServerCacheForTestsV464(): void { cache = null; }
