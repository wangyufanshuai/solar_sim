import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { request } from "node:https";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V592_GENERATED_AT ?? "2026-08-15T00:00:00Z";
const source = Object.freeze({
  id: "naif-generic-pck00011",
  url: "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc",
  host: "naif.jpl.nasa.gov",
  license: "NASA-JPL-public-domain",
  outputPath: "source-cache/v592/rotation/pck00011.tpc",
});
const receiptPath = resolve(root, "docs/release/v592/acquisition-receipt-rotation-sources-v592.json");

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));

function atomicWrite(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.part`;
  writeFileSync(temporary, text);
  rmSync(path, { force: true });
  renameSync(temporary, path);
}

function sealReceipt(unsigned) {
  const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  atomicWrite(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

function verifyExistingReceipt() {
  if (!existsSync(receiptPath)) return null;
  const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
  const unsigned = { ...receipt };
  delete unsigned.receiptSha256;
  if (canonicalSha(unsigned) !== receipt.receiptSha256) {
    throw new Error("v592-rotation-existing-receipt-seal");
  }
  const output = resolve(root, receipt.asset?.outputPath ?? "");
  if (!existsSync(output)) throw new Error("v592-rotation-existing-source-missing");
  const bytes = readFileSync(output);
  if (bytes.byteLength !== receipt.asset.bytes || sha256(bytes) !== receipt.asset.sha256) {
    throw new Error("v592-rotation-existing-source-drift");
  }
  return receipt;
}

function downloadOnce() {
  return new Promise((resolvePromise, rejectPromise) => {
    const output = resolve(root, source.outputPath);
    const temporary = `${output}.part`;
    mkdirSync(dirname(output), { recursive: true });
    if (existsSync(output) || existsSync(temporary)) {
      rejectPromise(new Error("v592-rotation-unreceipted-existing-output"));
      return;
    }
    const url = new URL(source.url);
    if (url.protocol !== "https:" || url.hostname !== source.host) {
      rejectPromise(new Error("v592-rotation-source-allowlist"));
      return;
    }
    const hash = createHash("sha256");
    let bytes = 0;
    const file = createWriteStream(temporary, { flags: "wx" });
    const req = request(url, {
      method: "GET",
      headers: {
        "Accept": "text/plain,application/octet-stream;q=0.9",
        "User-Agent": "Orbit-Atlas-v592-reference-acquisition/1.0",
      },
    }, (response) => {
      const status = response.statusCode ?? 0;
      if (status >= 300 && status < 400) {
        response.resume();
        file.destroy();
        rmSync(temporary, { force: true });
        rejectPromise(new Error(`v592-rotation-redirect-rejected:${status}:${response.headers.location ?? "missing-location"}`));
        return;
      }
      if (status !== 200) {
        response.resume();
        file.destroy();
        rmSync(temporary, { force: true });
        rejectPromise(new Error(`v592-rotation-http:${status}`));
        return;
      }
      response.on("data", (chunk) => {
        bytes += chunk.length;
        hash.update(chunk);
      });
      response.pipe(file);
      file.on("finish", () => {
        file.close(() => {
          renameSync(temporary, output);
          resolvePromise({
            status,
            contentType: response.headers["content-type"] ?? null,
            lastModified: response.headers["last-modified"] ?? null,
            etag: response.headers.etag ?? null,
            bytes,
            sha256: hash.digest("hex"),
          });
        });
      });
    });
    req.on("error", (error) => {
      file.destroy();
      rmSync(temporary, { force: true });
      rejectPromise(error);
    });
    req.end();
  });
}

const existing = verifyExistingReceipt();
if (existing) {
  console.log(JSON.stringify({ status: "verified-existing-no-request", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

try {
  const result = await downloadOnce();
  const receipt = sealReceipt({
    version: "v592-rotation-source-acquisition-v1",
    generatedAt,
    status: "committed-single-request-no-retry",
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    redirectFollowed: false,
    asset: {
      ...source,
      finalUrl: source.url,
      httpStatus: result.status,
      contentType: result.contentType,
      lastModified: result.lastModified,
      etag: result.etag,
      bytes: result.bytes,
      sha256: result.sha256,
    },
    authority: {
      purpose: "IAU-body-orientation-reference-only",
      scientificPayload: false,
      measuredAuthorityGranted: false,
      scientificPayloadWriteback: false,
    },
  });
  console.log(JSON.stringify({ status: receipt.status, bytes: result.bytes, sha256: result.sha256, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const receipt = sealReceipt({
    version: "v592-rotation-source-acquisition-v1",
    generatedAt,
    status: "blocked-single-request-no-retry",
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    redirectFollowed: false,
    source,
    error: message,
    authority: {
      purpose: "IAU-body-orientation-reference-only",
      scientificPayload: false,
      measuredAuthorityGranted: false,
      scientificPayloadWriteback: false,
    },
  });
  console.error(JSON.stringify({ status: receipt.status, error: message, receiptSha256: receipt.receiptSha256 }, null, 2));
  process.exitCode = 1;
}
