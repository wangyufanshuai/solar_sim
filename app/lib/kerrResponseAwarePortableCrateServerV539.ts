import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import { canonicalKerrResponseAwarePortableCrateV539, createKerrResponseAwarePortableCrateSummaryV539, parseKerrResponseAwarePortableCrateArtifactV539, type KerrResponseAwarePortableCrateArtifactV539, type KerrResponseAwarePortableCrateSummaryV539 } from "./kerrResponseAwarePortableCrateV539";

const ROOT = "dist/science/kerr-response-aware-portable-crate-v539";
const ATLAS = `${ROOT}/atlas.json`;
const CRATE = `${ROOT}/orbit-atlas-kerr-response-aware-v539.zip`;
export const KERR_RESPONSE_AWARE_PORTABLE_CRATE_SUMMARY_MAX_BYTES_V539 = 128 * 1024;
export const KERR_RESPONSE_AWARE_PORTABLE_CRATE_FILE_MAX_BYTES_V539 = 1024 * 1024;
type LoadedV539 = Readonly<{ artifact: KerrResponseAwarePortableCrateArtifactV539; summary: KerrResponseAwarePortableCrateSummaryV539; exports: Readonly<{ atlas: Readonly<{ name: "orbit-atlas-kerr-response-aware-portable-crate-v539.json"; bytes: Uint8Array; fileSha256: string; contentType: "application/json; charset=utf-8" }>; crate: Readonly<{ name: "orbit-atlas-kerr-response-aware-v539.zip"; bytes: Uint8Array; fileSha256: string; contentType: "application/zip" }> }> }>;
let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedV539> }> | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
export async function loadKerrResponseAwarePortableCrateV539(root = process.cwd()): Promise<LoadedV539> {
  const atlasPath = resolve(root, ATLAS), cratePath = resolve(root, CRATE);
  const [atlasMetadata, crateMetadata] = await Promise.all([stat(atlasPath), stat(cratePath)]);
  if (!atlasMetadata.isFile() || atlasMetadata.size <= 0 || atlasMetadata.size > KERR_RESPONSE_AWARE_PORTABLE_CRATE_SUMMARY_MAX_BYTES_V539) throw new Error("v539-atlas-size");
  if (!crateMetadata.isFile() || crateMetadata.size <= 0 || crateMetadata.size > KERR_RESPONSE_AWARE_PORTABLE_CRATE_FILE_MAX_BYTES_V539) throw new Error("v539-crate-size");
  const [atlasBuffer, crateBuffer] = await Promise.all([readFile(atlasPath), readFile(cratePath)]);
  const atlasFileSha256 = sha(atlasBuffer), crateFileSha256 = sha(crateBuffer);
  const fingerprint = `${atlasMetadata.mtimeMs}:${atlasMetadata.size}:${atlasFileSha256}:${crateMetadata.mtimeMs}:${crateMetadata.size}:${crateFileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrResponseAwarePortableCrateArtifactV539(JSON.parse(atlasBuffer.toString("utf8")));
    if (sha(canonicalKerrResponseAwarePortableCrateV539(artifact)) !== artifact.artifactSha256 || artifact.crate.fileSha256 !== crateFileSha256 || artifact.crate.bytes !== crateBuffer.byteLength) throw new Error("v539-artifact-integrity");
    if (crateBuffer.readUInt32LE(0) !== 0x04034b50 || crateBuffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06])) < crateBuffer.byteLength - 65558) throw new Error("v539-zip-envelope");
    return Object.freeze({ artifact, summary: createKerrResponseAwarePortableCrateSummaryV539(artifact), exports: Object.freeze({ atlas: Object.freeze({ name: "orbit-atlas-kerr-response-aware-portable-crate-v539.json" as const, bytes: new Uint8Array(atlasBuffer), fileSha256: atlasFileSha256, contentType: "application/json; charset=utf-8" as const }), crate: Object.freeze({ name: "orbit-atlas-kerr-response-aware-v539.zip" as const, bytes: new Uint8Array(crateBuffer), fileSha256: crateFileSha256, contentType: "application/zip" as const }) }) });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}
export function resetKerrResponseAwarePortableCrateServerCacheForTestsV539(): void { cache = null; }
