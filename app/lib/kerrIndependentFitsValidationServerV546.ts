import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { canonicalKerrIndependentFitsValidationV546, parseKerrIndependentFitsValidationArtifactV546, parseKerrIndependentFitsValidationReceiptV546, type KerrIndependentFitsValidationArtifactV546, type KerrIndependentFitsValidationReceiptV546 } from "./kerrIndependentFitsValidationV546";

const FILES = Object.freeze({ atlas: "dist/science/kerr-supplemental-fits-validation-v546/atlas.json", receipt: "dist/science/kerr-supplemental-fits-validation-v546/synthetic-validation-receipt.json", validator: "dist/science/kerr-supplemental-fits-validation-v546/orbit-atlas-v546-independent-fits-validator.py" });
const LIMITS = Object.freeze({ atlas: 128 * 1024, receipt: 64 * 1024, validator: 64 * 1024 });
export type KerrIndependentFitsExportIdV546 = keyof typeof FILES;
type ExportV546 = Readonly<{ name: string; bytes: Uint8Array; fileSha256: string; contentType: string }>;
type LoadedV546 = Readonly<{ artifact: KerrIndependentFitsValidationArtifactV546; receipt: KerrIndependentFitsValidationReceiptV546; exports: Readonly<Record<KerrIndependentFitsExportIdV546, ExportV546>> }>;
let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedV546> }> | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");

export async function loadKerrIndependentFitsValidationV546(root = process.cwd()): Promise<LoadedV546> {
  const entries = await Promise.all((Object.keys(FILES) as KerrIndependentFitsExportIdV546[]).map(async (id) => { const path = resolve(root, FILES[id]), metadata = await stat(path); if (!metadata.isFile() || metadata.size <= 0 || metadata.size > LIMITS[id]) throw new Error(`v546-file-size:${id}`); const bytes = new Uint8Array(await readFile(path)); return { id, metadata, bytes, fileSha256: sha(bytes) }; }));
  const fingerprint = entries.map(({ id, metadata, fileSha256 }) => `${id}:${metadata.mtimeMs}:${metadata.size}:${fileSha256}`).join("|");
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const atlasBytes = entries.find((entry) => entry.id === "atlas")!.bytes, receiptBytes = entries.find((entry) => entry.id === "receipt")!.bytes, validatorBytes = entries.find((entry) => entry.id === "validator")!.bytes;
    const artifact = parseKerrIndependentFitsValidationArtifactV546(JSON.parse(Buffer.from(atlasBytes).toString("utf8"))), receipt = parseKerrIndependentFitsValidationReceiptV546(JSON.parse(Buffer.from(receiptBytes).toString("utf8")));
    if (sha(canonicalKerrIndependentFitsValidationV546(artifact)) !== artifact.artifactSha256 || sha(canonicalKerrIndependentFitsValidationV546(receipt)) !== receipt.resultSha256 || JSON.stringify(artifact.validation.receipt) !== JSON.stringify(receipt) || sha(receiptBytes) !== artifact.validation.receiptFileSha256 || sha(validatorBytes) !== artifact.source.validatorFileSha256) throw new Error("v546-artifact-integrity");
    const exports = Object.freeze({
      atlas: Object.freeze({ name: "orbit-atlas-kerr-independent-fits-validation-v546.json", bytes: atlasBytes, fileSha256: sha(atlasBytes), contentType: "application/json; charset=utf-8" }),
      receipt: Object.freeze({ name: "orbit-atlas-kerr-independent-fits-receipt-v546.json", bytes: receiptBytes, fileSha256: sha(receiptBytes), contentType: "application/json; charset=utf-8" }),
      validator: Object.freeze({ name: "orbit-atlas-v546-independent-fits-validator.py", bytes: validatorBytes, fileSha256: sha(validatorBytes), contentType: "text/x-python; charset=utf-8" }),
    });
    return Object.freeze({ artifact, receipt, exports });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}
export function resetKerrIndependentFitsValidationServerCacheForTestsV546(): void { cache = null; }
