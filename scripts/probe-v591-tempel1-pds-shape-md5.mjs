import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const metadataPath = resolve(root, "docs/release/v591/metadata-probe-tempel-1-pds-sbn-shape-v2-browser.json");
const outputPath = resolve(root, "docs/release/v591/metadata-probe-tempel-1-pds-sbn-shape-v2-md5.json");
const blockedPath = resolve(root, "docs/release/v591/metadata-probe-tempel-1-pds-sbn-shape-v2-md5-blocked.json");
const rawPath = resolve(root, "source-cache/celestial-convergence-v591/tempel-1/dimodl_0001.MD5SUM");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, bytes) { mkdirSync(dirname(path), { recursive: true }); const part = `${path}.${process.pid}.part`; rmSync(part, { force: true }); writeFileSync(part, bytes, { flag: "wx" }); rmSync(path, { force: true }); renameSync(part, path); }
function writeSealed(path, unsigned) { const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) }; atomicWrite(path, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8")); return receipt; }
function readSealed(path) { const receipt = JSON.parse(readFileSync(path, "utf8")); const unsigned = { ...receipt }; delete unsigned.receiptSha256; assert(receipt.receiptSha256 === canonicalSha(unsigned), `v591-tempel1-md5-seal:${path}`); return receipt; }

const metadata = readSealed(metadataPath);
assert(metadata.status === "metadata-candidate-confirmed-no-payload" && metadata.dataset?.id === "DIF-C-HRIV/ITS/MRI-5-TEMPEL1-SHAPE-V2.0", "v591-tempel1-md5-metadata");
const url = new URL(metadata.candidate.md5Url);
assert(url.protocol === "https:" && url.hostname === "pdssbn.astro.umd.edu" && url.pathname.endsWith("/DOWNLOAD/MD5SUM"), "v591-tempel1-md5-url");
if (existsSync(outputPath)) {
  const receipt = readSealed(outputPath);
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", expectedMd5: receipt.expectedMd5, receiptSha256: receipt.receiptSha256 }, null, 2));
} else {
  assert(!existsSync(blockedPath) && !existsSync(rawPath), "v591-tempel1-md5-terminal-state");
  try {
    const response = await fetch(url, { method: "GET", redirect: "manual", headers: { "user-agent": "Orbit-Atlas-v591-Tempel1-PDS-MD5/1.0" }, signal: AbortSignal.timeout(60_000) });
    const bytes = Buffer.from(await response.arrayBuffer());
    const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
    assert(response.status === 200 && response.url === url.href && !response.headers.get("location"), `v591-tempel1-md5-http:${response.status}:${response.url}`);
    assert(bytes.byteLength > 0 && bytes.byteLength <= 1024, `v591-tempel1-md5-bytes:${bytes.byteLength}`);
    const text = bytes.toString("utf8");
    const expectedMd5 = text.match(/\b([a-f0-9]{32})\b/i)?.[1]?.toLowerCase() ?? null;
    assert(expectedMd5 && /dimodl_0001\.tgz/i.test(text), "v591-tempel1-md5-identity");
    atomicWrite(rawPath, bytes);
    const receipt = writeSealed(outputPath, {
      version: "v591-tempel-1-pds-sbn-shape-v2-md5-probe-v1",
      probedAt: new Date().toISOString(),
      status: "metadata-checksum-confirmed-no-model-payload",
      target: "tempel-1",
      datasetId: metadata.dataset.id,
      metadataReceiptSha256: metadata.receiptSha256,
      requestCount: 1,
      request: { url: url.href, finalUrl: response.url, httpStatus: response.status, mediaType, bytes: bytes.byteLength, sha256: sha256(bytes), rawPath: "source-cache/celestial-convergence-v591/tempel-1/dimodl_0001.MD5SUM" },
      packageName: "dimodl_0001.tgz",
      expectedMd5,
      modelPayloadDownloaded: false,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      license: metadata.license,
    });
    console.log(JSON.stringify({ status: receipt.status, expectedMd5, receiptSha256: receipt.receiptSha256 }, null, 2));
  } catch (error) {
    const blocked = writeSealed(blockedPath, { version: "v591-tempel-1-pds-sbn-shape-v2-md5-probe-blocked-v1", failedAt: new Date().toISOString(), status: "blocked-no-automatic-retry", target: "tempel-1", url: url.href, requestCount: 1, modelPayloadDownloaded: false, automaticRetryPerformed: false, automaticReplacementPerformed: false, error: error instanceof Error ? error.message : String(error) });
    console.error(JSON.stringify({ status: blocked.status, receiptSha256: blocked.receiptSha256 }, null, 2));
    throw error;
  }
}
