import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import { canonicalKerrResponseAwareOfflineReplayV540, createKerrResponseAwareOfflineReplaySummaryV540, parseKerrResponseAwareOfflineReplayArtifactV540, type KerrResponseAwareOfflineReplayArtifactV540, type KerrResponseAwareOfflineReplaySummaryV540 } from "./kerrResponseAwareOfflineReplayV540";

const ROOT = "dist/science/kerr-response-aware-offline-replay-v540", ATLAS = `${ROOT}/atlas.json`, RECEIPT = `${ROOT}/replay-receipt.json`;
export const KERR_RESPONSE_AWARE_OFFLINE_REPLAY_MAX_BYTES_V540 = 128 * 1024;
type LoadedV540 = Readonly<{ artifact: KerrResponseAwareOfflineReplayArtifactV540; summary: KerrResponseAwareOfflineReplaySummaryV540; exports: Readonly<{ atlas: Readonly<{ name: "orbit-atlas-kerr-response-aware-offline-replay-v540.json"; bytes: Uint8Array; fileSha256: string; contentType: "application/json; charset=utf-8" }>; receipt: Readonly<{ name: "orbit-atlas-kerr-response-aware-replay-receipt-v540.json"; bytes: Uint8Array; fileSha256: string; contentType: "application/json; charset=utf-8" }> }> }>;
let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedV540> }> | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
export async function loadKerrResponseAwareOfflineReplayV540(root = process.cwd()): Promise<LoadedV540> {
  const atlasPath = resolve(root, ATLAS), receiptPath = resolve(root, RECEIPT);
  const [atlasMetadata, receiptMetadata] = await Promise.all([stat(atlasPath), stat(receiptPath)]);
  if (!atlasMetadata.isFile() || atlasMetadata.size <= 0 || atlasMetadata.size > KERR_RESPONSE_AWARE_OFFLINE_REPLAY_MAX_BYTES_V540) throw new Error("v540-atlas-size");
  if (!receiptMetadata.isFile() || receiptMetadata.size <= 0 || receiptMetadata.size > KERR_RESPONSE_AWARE_OFFLINE_REPLAY_MAX_BYTES_V540) throw new Error("v540-receipt-size");
  const [atlasBuffer, receiptBuffer] = await Promise.all([readFile(atlasPath), readFile(receiptPath)]), atlasFileSha256 = sha(atlasBuffer), receiptFileSha256 = sha(receiptBuffer), fingerprint = `${atlasMetadata.mtimeMs}:${atlasMetadata.size}:${atlasFileSha256}:${receiptMetadata.mtimeMs}:${receiptMetadata.size}:${receiptFileSha256}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => { const artifact = parseKerrResponseAwareOfflineReplayArtifactV540(JSON.parse(atlasBuffer.toString("utf8"))); const receipt = JSON.parse(receiptBuffer.toString("utf8")); if (sha(canonicalKerrResponseAwareOfflineReplayV540(artifact)) !== artifact.artifactSha256 || sha(canonicalKerrResponseAwareOfflineReplayV540(receipt)) !== artifact.receipt.receiptSha256 || artifact.receiptExport.fileSha256 !== receiptFileSha256 || JSON.stringify(receipt) !== JSON.stringify(artifact.receipt)) throw new Error("v540-artifact-integrity"); return Object.freeze({ artifact, summary: createKerrResponseAwareOfflineReplaySummaryV540(artifact), exports: Object.freeze({ atlas: Object.freeze({ name: "orbit-atlas-kerr-response-aware-offline-replay-v540.json" as const, bytes: new Uint8Array(atlasBuffer), fileSha256: atlasFileSha256, contentType: "application/json; charset=utf-8" as const }), receipt: Object.freeze({ name: "orbit-atlas-kerr-response-aware-replay-receipt-v540.json" as const, bytes: new Uint8Array(receiptBuffer), fileSha256: receiptFileSha256, contentType: "application/json; charset=utf-8" as const }) }) }); });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}
export function resetKerrResponseAwareOfflineReplayServerCacheForTestsV540(): void { cache = null; }
