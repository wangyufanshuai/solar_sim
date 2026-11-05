import { createHash } from "node:crypto";
import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function seal(relativePath, validate) {
  const path = resolve(root, relativePath);
  const receipt = JSON.parse(readFileSync(path, "utf8"));
  delete receipt.receiptSha256;
  validate(receipt);
  const sealed = { ...receipt, receiptSha256: canonicalSha(receipt) };
  const part = `${path}.part`;
  writeFileSync(part, `${JSON.stringify(sealed, null, 2)}\n`, { flag: "w" });
  rmSync(path, { force: true });
  renameSync(part, path);
  return sealed;
}
const evidence = seal("docs/release/v591/blocked-negative-evidence-mars-source.json", (receipt) => {
  if (receipt.status !== "blocked-redirect-host" || receipt.payloadWritten !== false || receipt.automaticRetryPerformed !== false) {
    throw new Error("v591-mars-redirect-negative-evidence-contract");
  }
});
const ledger = seal("docs/release/v591/acquisition-url-ledger-mars.json", (receipt) => {
  if (receipt.version !== "v591-mars-acquisition-url-ledger-v1" || !Array.isArray(receipt.entries) || receipt.entries.length < 4) {
    throw new Error("v591-mars-acquisition-ledger-contract");
  }
  if (new Set(receipt.entries.map((entry) => entry.url)).size !== receipt.entries.length) {
    throw new Error("v591-mars-acquisition-ledger-duplicate-url");
  }
});
const fullSourceBlock = seal("docs/release/v591/acquisition-blocked-mars-usgs-full.json", (receipt) => {
  if (receipt.status !== "blocked-resource-throughput" || receipt.payloadWritten !== false || receipt.automaticRetryPerformed !== false || receipt.transferAudit?.partFileRemoved !== true) {
    throw new Error("v591-mars-usgs-full-blocked-contract");
  }
});
console.log(JSON.stringify({
  status: evidence.status,
  evidenceReceiptSha256: evidence.receiptSha256,
  ledgerEntries: ledger.entries.length,
  ledgerReceiptSha256: ledger.receiptSha256,
  fullSourceBlockReceiptSha256: fullSourceBlock.receiptSha256,
}, null, 2));
