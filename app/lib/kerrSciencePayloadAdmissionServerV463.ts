import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { createKerrSciencePayloadAdmissionSummaryV463, parseKerrSciencePayloadAdmissionArtifactV463, type KerrSciencePayloadAdmissionArtifactV463, type KerrSciencePayloadAdmissionSummaryV463 } from "./kerrSciencePayloadAdmissionV463";

const ROOT = "dist/science/kerr-science-payload-admission-v463";
const FILE = Object.freeze({ name: "payload-admission.json", maxBytes: 128 * 1024 });
export type KerrSciencePayloadAdmissionLoadedV463 = Readonly<{
  artifact: KerrSciencePayloadAdmissionArtifactV463;
  summary: KerrSciencePayloadAdmissionSummaryV463;
  export: Readonly<{ name: string; bytes: Uint8Array; fileSha256: string; contentType: "application/json; charset=utf-8" }>;
}>;
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
let cache: Readonly<{ fingerprint: string; promise: Promise<KerrSciencePayloadAdmissionLoadedV463> }> | null = null;

export async function loadKerrSciencePayloadAdmissionV463(root = process.cwd()): Promise<KerrSciencePayloadAdmissionLoadedV463> {
  const target = resolve(root, ROOT, FILE.name);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) throw new Error("v463-payload-admission-size");
  const bytes = new Uint8Array(await readFile(target));
  const fingerprint = `${target}:${metadata.mtimeMs}:${metadata.size}:${digest(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrSciencePayloadAdmissionArtifactV463(JSON.parse(new TextDecoder().decode(bytes)));
    return Object.freeze({ artifact, summary: createKerrSciencePayloadAdmissionSummaryV463(artifact), export: Object.freeze({ name: FILE.name, bytes, fileSha256: digest(bytes), contentType: "application/json; charset=utf-8" as const }) });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}
export function resetKerrSciencePayloadAdmissionServerCacheForTestsV463(): void { cache = null; }
