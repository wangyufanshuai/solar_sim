import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  canonicalKerrLicenseConfirmationPacketV552,
  parseKerrLicenseConfirmationPacketV552,
  type KerrLicenseConfirmationPacketArtifactV552,
} from "./kerrLicenseConfirmationPacketV552";

const FILES = Object.freeze({
  atlas: "dist/science/kerr-license-confirmation-packet-v552/atlas.json",
  receipt: "dist/science/kerr-license-confirmation-packet-v552/empty-packet-receipt.json",
});
const LIMITS = Object.freeze({ atlas: 128 * 1024, receipt: 64 * 1024 });
export type KerrLicenseConfirmationPacketExportIdV552 = keyof typeof FILES;
type ExportV552 = Readonly<{ name: string; bytes: Uint8Array; fileSha256: string; contentType: string }>;
export type LoadedKerrLicenseConfirmationPacketV552 = Readonly<{
  artifact: KerrLicenseConfirmationPacketArtifactV552;
  exports: Readonly<Record<KerrLicenseConfirmationPacketExportIdV552, ExportV552>>;
}>;

let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedKerrLicenseConfirmationPacketV552> }> | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalSha = (value: unknown) => createHash("sha256").update(canonicalKerrLicenseConfirmationPacketV552(value)).digest("hex");

export async function loadKerrLicenseConfirmationPacketV552(root = process.cwd()): Promise<LoadedKerrLicenseConfirmationPacketV552> {
  const entries = await Promise.all((Object.keys(FILES) as KerrLicenseConfirmationPacketExportIdV552[]).map(async (id) => {
    const path = resolve(root, FILES[id]);
    const metadata = await stat(path);
    if (!metadata.isFile() || metadata.size <= 0 || metadata.size > LIMITS[id]) throw new Error(`v552-file-size:${id}`);
    const bytes = new Uint8Array(await readFile(path));
    return { id, metadata, bytes, fileSha256: sha(bytes) };
  }));
  const fingerprint = entries.map(({ id, metadata, fileSha256 }) => `${id}:${metadata.mtimeMs}:${metadata.size}:${fileSha256}`).join("|");
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const atlasBytes = entries.find((entry) => entry.id === "atlas")!.bytes;
    const receiptBytes = entries.find((entry) => entry.id === "receipt")!.bytes;
    const artifact = parseKerrLicenseConfirmationPacketV552(JSON.parse(Buffer.from(atlasBytes).toString("utf8")));
    const receipt = JSON.parse(Buffer.from(receiptBytes).toString("utf8")) as Record<string, unknown>;
    if (canonicalSha(artifact) !== artifact.artifactSha256 || canonicalSha(receipt) !== receipt.receiptSha256
      || receipt.packetPresent !== false || receipt.packetEntryCount !== 0 || receipt.missingEntryCount !== 7
      || receipt.networkAttemptCount !== 0 || receipt.measuredAuthorityGranted !== false || receipt.sciencePixelCount !== 0) {
      throw new Error("v552-artifact-integrity");
    }
    const exports = Object.freeze({
      atlas: Object.freeze({ name: "orbit-atlas-kerr-license-confirmation-packet-v552.json", bytes: atlasBytes, fileSha256: sha(atlasBytes), contentType: "application/json; charset=utf-8" }),
      receipt: Object.freeze({ name: "orbit-atlas-v552-empty-license-confirmation-packet-receipt.json", bytes: receiptBytes, fileSha256: sha(receiptBytes), contentType: "application/json; charset=utf-8" }),
    });
    return Object.freeze({ artifact, exports });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrLicenseConfirmationPacketServerCacheForTestsV552(): void { cache = null; }
