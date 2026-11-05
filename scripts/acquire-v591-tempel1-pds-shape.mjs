import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const root = process.cwd();
const metadataPath = resolve(root, "docs/release/v591/metadata-probe-tempel-1-pds-sbn-shape-v2-browser.json");
const md5Path = resolve(root, "docs/release/v591/metadata-probe-tempel-1-pds-sbn-shape-v2-md5.json");
const outputPath = resolve(root, "source-cache/celestial-convergence-v591/tempel-1/dimodl_0001.tgz");
const partPath = `${outputPath}.part`;
const receiptPath = resolve(root, "docs/release/v591/acquisition-asset-tempel-1-pds-shape-v2.json");
const blockedPath = resolve(root, "docs/release/v591/acquisition-blocked-tempel-1-pds-shape-v2.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, bytes) { mkdirSync(dirname(path), { recursive: true }); const part = `${path}.${process.pid}.part`; rmSync(part, { force: true }); writeFileSync(part, bytes, { flag: "wx" }); rmSync(path, { force: true }); renameSync(part, path); }
function writeSealed(path, unsigned) { const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) }; atomicWrite(path, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8")); return receipt; }
function readSealed(path) { const receipt = JSON.parse(readFileSync(path, "utf8")); const unsigned = { ...receipt }; delete unsigned.receiptSha256; assert(receipt.receiptSha256 === canonicalSha(unsigned), `v591-tempel1-acquisition-seal:${path}`); return receipt; }
async function digestFile(path, algorithm) { const hash = createHash(algorithm); for await (const chunk of createReadStream(path)) hash.update(chunk); return hash.digest("hex"); }

const metadata = readSealed(metadataPath);
const checksum = readSealed(md5Path);
assert(metadata.status === "metadata-candidate-confirmed-no-payload" && checksum.status === "metadata-checksum-confirmed-no-model-payload", "v591-tempel1-acquisition-metadata");
assert(checksum.metadataReceiptSha256 === metadata.receiptSha256 && checksum.packageName === metadata.candidate.packageName, "v591-tempel1-acquisition-chain");
const url = new URL(metadata.candidate.packageUrl);
assert(url.protocol === "https:" && url.hostname === "pdssbn.astro.umd.edu" && url.pathname.endsWith("/DOWNLOAD/dimodl_0001.tgz"), "v591-tempel1-acquisition-url");
assert(!existsSync(outputPath) && !existsSync(partPath) && !existsSync(receiptPath) && !existsSync(blockedPath), "v591-tempel1-acquisition-terminal-state");
try {
  const response = await fetch(url, { method: "GET", redirect: "manual", headers: { "user-agent": "Orbit-Atlas-v591-Tempel1-PDS-Shape-Acquisition/1.0" }, signal: AbortSignal.timeout(600_000) });
  const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
  const announcedBytes = Number(response.headers.get("content-length"));
  assert(response.status === 200 && response.url === url.href && !response.headers.get("location") && response.body, `v591-tempel1-acquisition-http:${response.status}:${response.url}`);
  assert(Number.isSafeInteger(announcedBytes) && announcedBytes >= 2_000_000 && announcedBytes <= 4_000_000, `v591-tempel1-acquisition-announced-bytes:${announcedBytes}`);
  mkdirSync(dirname(outputPath), { recursive: true });
  await pipeline(Readable.fromWeb(response.body), createWriteStream(partPath, { flags: "wx" }));
  const bytes = statSync(partPath).size;
  assert(bytes === announcedBytes, `v591-tempel1-acquisition-bytes:${bytes}:${announcedBytes}`);
  const header = readFileSync(partPath).subarray(0, 2);
  assert(header[0] === 0x1f && header[1] === 0x8b, "v591-tempel1-acquisition-gzip-magic");
  const md5 = await digestFile(partPath, "md5");
  assert(md5 === checksum.expectedMd5, `v591-tempel1-acquisition-md5:${md5}`);
  const digest = await digestFile(partPath, "sha256");
  renameSync(partPath, outputPath);
  const receipt = writeSealed(receiptPath, {
    version: "v591-tempel-1-pds-sbn-shape-v2-acquisition-v1",
    acquiredAt: new Date().toISOString(),
    status: "committed-single-request-no-retry",
    target: "tempel-1",
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    metadataReceiptSha256: metadata.receiptSha256,
    checksumReceiptSha256: checksum.receiptSha256,
    asset: {
      id: "tempel-1-pds-shape-v2-source-v591",
      role: "nasa-pds-archived-plate-shape-model-package",
      datasetId: metadata.dataset.id,
      sourceUrl: url.href,
      finalUrl: response.url,
      host: url.hostname,
      mediaType,
      bytes,
      md5,
      sha256: digest,
      outputPath: "source-cache/celestial-convergence-v591/tempel-1/dimodl_0001.tgz",
      license: metadata.license,
      citation: metadata.dataset.citation,
      presentationOnly: true,
      scientificAuthorityClaim: false,
    },
    authorityState: metadata.authorityState,
  });
  console.log(JSON.stringify({ status: receipt.status, bytes, md5, sha256: digest, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  rmSync(partPath, { force: true });
  const blocked = writeSealed(blockedPath, { version: "v591-tempel-1-pds-sbn-shape-v2-acquisition-blocked-v1", failedAt: new Date().toISOString(), status: "blocked-no-automatic-retry", target: "tempel-1", url: url.href, requestCount: 1, automaticRetryPerformed: false, automaticReplacementPerformed: false, error: error instanceof Error ? error.message : String(error) });
  console.error(JSON.stringify({ status: blocked.status, receiptSha256: blocked.receiptSha256 }, null, 2));
  throw error;
}
