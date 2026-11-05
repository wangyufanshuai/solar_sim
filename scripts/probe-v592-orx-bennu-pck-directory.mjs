import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const probeUrl = new URL("https://naif.jpl.nasa.gov/pub/naif/ORX/kernels/pck/");
const cacheRelativePath = "source-cache/v592/rotation/orx-pck-directory.html";
const receiptRelativePath = "docs/release/v592/metadata-probe-orx-bennu-pck-directory-v592.json";
const blockedRelativePath = "docs/release/v592/metadata-probe-orx-bennu-pck-directory-blocked-v592.json";
const cachePath = resolve(root, cacheRelativePath);
const receiptPath = resolve(root, receiptRelativePath);
const blockedPath = resolve(root, blockedRelativePath);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

function canonicalSha(value) {
  return sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
}

function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  writeFileSync(partial, bytes);
  rmSync(path, { force: true });
  renameSync(partial, path);
}

function writeReceipt(path, unsigned) {
  const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  atomicWrite(path, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8"));
  return receipt;
}

function verifyExisting() {
  if (!existsSync(receiptPath)) return false;
  const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
  const unsigned = { ...receipt };
  delete unsigned.receiptSha256;
  if (canonicalSha(unsigned) !== receipt.receiptSha256) throw new Error("v592-orx-pck-existing-receipt-seal");
  const bytes = readFileSync(cachePath);
  if (bytes.byteLength !== receipt.output.bytes || sha256(bytes) !== receipt.output.sha256) {
    throw new Error("v592-orx-pck-existing-cache-drift");
  }
  console.log(JSON.stringify({
    status: "existing-receipt-verified-no-network",
    candidateCount: receipt.summary.candidateCount,
    candidates: receipt.summary.candidates,
    receiptSha256: receipt.receiptSha256,
  }, null, 2));
  return true;
}

if (verifyExisting()) process.exit(0);
if (existsSync(blockedPath)) throw new Error("v592-orx-pck-terminal-block-no-retry");
if (existsSync(cachePath) || existsSync(`${cachePath}.part`)) throw new Error("v592-orx-pck-unreceipted-cache");
if (probeUrl.protocol !== "https:" || probeUrl.hostname !== "naif.jpl.nasa.gov") throw new Error("v592-orx-pck-url-policy");

try {
  const response = await fetch(probeUrl, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": "Orbit-Atlas-v592-ORX-Bennu-PCK-metadata-probe/1.0" },
    signal: AbortSignal.timeout(60_000),
  });
  if (response.status !== 200 || response.url !== probeUrl.href) {
    throw new Error(`v592-orx-pck-http:${response.status}:${response.url}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > 4 * 1024 * 1024) {
    throw new Error(`v592-orx-pck-size:${bytes.byteLength}`);
  }
  const text = bytes.toString("utf8");
  const candidates = [...text.matchAll(/href="([^"]+\.(?:tpc|bpc))"/gi)]
    .map((match) => match[1])
    .filter((value) => !value.includes("/"))
    .filter((value, index, values) => values.indexOf(value) === index)
    .sort();
  atomicWrite(cachePath, bytes);
  const receipt = writeReceipt(receiptPath, {
    version: "v592-orx-bennu-pck-directory-metadata-probe-v1",
    probedAt: new Date().toISOString(),
    status: candidates.length > 0 ? "metadata-probe-complete-candidates-present-no-payload" : "blocked-no-pck-candidate-in-directory",
    target: "bennu",
    policy: {
      requestCount: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      redirectFollowed: false,
      payloadDownloaded: false,
      candidateFileRequested: false,
      scientificPayloadWriteback: false,
    },
    request: {
      url: probeUrl.href,
      finalUrl: response.url,
      host: probeUrl.hostname,
      httpStatus: response.status,
      contentType: response.headers.get("content-type"),
    },
    output: {
      path: cacheRelativePath,
      bytes: bytes.byteLength,
      sha256: sha256(bytes),
    },
    summary: {
      candidateCount: candidates.length,
      candidates,
      absolutePrimeMeridianGranted: false,
    },
  });
  console.log(JSON.stringify({
    status: receipt.status,
    candidateCount: candidates.length,
    candidates,
    receiptSha256: receipt.receiptSha256,
  }, null, 2));
} catch (error) {
  const blocked = writeReceipt(blockedPath, {
    version: "v592-orx-bennu-pck-directory-metadata-probe-blocked-v1",
    failedAt: new Date().toISOString(),
    status: "blocked-no-automatic-retry",
    target: "bennu",
    url: probeUrl.href,
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    payloadDownloaded: false,
    scientificPayloadWriteback: false,
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(JSON.stringify({ status: blocked.status, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
  process.exitCode = 1;
}
