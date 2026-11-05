import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const admissionPath = "docs/release/v592/major-moon-usgs-redirect-admission-v592.json";
const outputPath = "docs/release/v592/acquisition-receipt-major-moon-usgs-label-final-v592.json";
const exactRedirectHost = "asc-pds-services.s3.us-west-2.amazonaws.com";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, bytes) {
  const absolute = resolve(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  const partial = `${absolute}.part`;
  writeFileSync(partial, bytes, { flag: "wx" });
  rmSync(absolute, { force: true });
  renameSync(partial, absolute);
}
function verifySealed(path) {
  const value = JSON.parse(readFileSync(resolve(root, path), "utf8"));
  const unsigned = { ...value };
  delete unsigned.receiptSha256;
  assert(value.receiptSha256 === canonicalSha(unsigned), `v592-usgs-label-final-seal:${path}`);
  return value;
}

if (existsSync(resolve(root, outputPath))) {
  const existing = verifySealed(outputPath);
  for (const asset of existing.assets ?? []) {
    const bytes = readFileSync(resolve(root, asset.outputPath));
    assert(bytes.byteLength === asset.bytes && sha256(bytes) === asset.sha256, `v592-usgs-label-final-existing:${asset.target}`);
  }
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

const admission = verifySealed(admissionPath);
assert(admission.status === "admitted-exact-usgs-pds-s3-host-for-four-label-metadata-requests", "v592-usgs-label-final-admission");
assert(admission.exactRedirectHost === exactRedirectHost && admission.redirects.length === 4, "v592-usgs-label-final-host");
const requestedUrls = new Set();
const assets = [];
const failures = [];
for (const entry of admission.redirects) {
  try {
    const url = new URL(entry.redirectUrl);
    assert(url.protocol === "https:" && url.hostname === exactRedirectHost && url.pathname.endsWith(".lbl"), `v592-usgs-label-final-url:${entry.target}`);
    assert(!requestedUrls.has(entry.redirectUrl), `v592-usgs-label-final-duplicate:${entry.target}`);
    requestedUrls.add(entry.redirectUrl);
    const response = await fetch(entry.redirectUrl, { method: "GET", redirect: "manual", headers: { Accept: "text/plain,application/octet-stream;q=0.8" } });
    assert(response.status === 200, `v592-usgs-label-final-http:${entry.target}:${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert(bytes.byteLength > 64 && bytes.byteLength < 4 * 1024 * 1024, `v592-usgs-label-final-bytes:${entry.target}:${bytes.byteLength}`);
    const text = bytes.toString("utf8");
    assert(/PDS_VERSION_ID|OBJECT\s*=\s*IMAGE|MAP_PROJECTION_TYPE/i.test(text), `v592-usgs-label-final-identity:${entry.target}`);
    const output = `source-cache/v592/major-moons/usgs-labels/${entry.target}.lbl`;
    atomicWrite(output, bytes);
    assets.push({
      target: entry.target,
      sourceUrl: entry.sourceUrl,
      finalUrl: entry.redirectUrl,
      requestCount: 1,
      outputPath: output,
      bytes: bytes.byteLength,
      sha256: sha256(bytes),
      contentType: response.headers.get("content-type"),
      payloadType: "PDS-label-metadata-only",
    });
  } catch (error) {
    failures.push({
      target: entry.target,
      finalUrl: entry.redirectUrl,
      requestCount: requestedUrls.has(entry.redirectUrl) ? 1 : 0,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const body = {
  version: "v592-major-moon-usgs-final-label-acquisition-v1",
  generatedAt: new Date().toISOString(),
  status: failures.length === 0 ? "committed-four-pds-labels-single-request-per-url-no-retry" : "partial-final-label-metadata-with-terminal-failures-no-retry",
  redirectAdmissionReceiptSha256: admission.receiptSha256,
  policy: {
    exactRedirectHost,
    requestCountPerUrl: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    atomicWrite: ".part-to-final",
    labelMetadataOnly: true,
    visualPayloadDownloaded: false,
    visualAssetAdmissionGranted: false,
    scientificAuthorityGranted: false,
  },
  requestedUrls: [...requestedUrls],
  assets,
  failures,
};
const receipt = { ...body, receiptSha256: canonicalSha(body) };
atomicWrite(outputPath, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8"));
console.log(JSON.stringify({
  status: receipt.status,
  assetCount: receipt.assets.length,
  failureCount: receipt.failures.length,
  assets: receipt.assets.map(({ target, bytes, sha256: digest }) => ({ target, bytes, sha256: digest })),
  failures: receipt.failures,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
if (failures.length > 0) process.exitCode = 1;
