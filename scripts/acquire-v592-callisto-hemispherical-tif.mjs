import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const root = process.cwd();
const sourceUrl = "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia03/pia03876/PIA03876.tif";
const outputPath = "source-cache/v592/major-moons/jpl-photojournal/PIA03876.tif";
const receiptPath = "docs/release/v592/acquisition-receipt-callisto-hemispherical-tif-v592.json";
const maxBytes = 512 * 1024 * 1024;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function seal(relative, body) {
  const absolute = resolve(root, relative);
  const document = { ...body, receiptSha256: canonicalSha(body) };
  mkdirSync(dirname(absolute), { recursive: true });
  const partial = `${absolute}.part`;
  writeFileSync(partial, `${JSON.stringify(document, null, 2)}\n`, { flag: "wx" });
  rmSync(absolute, { force: true });
  renameSync(partial, absolute);
  return document;
}
const output = resolve(root, outputPath);
const partial = `${output}.part`;
const existingReceipt = resolve(root, receiptPath);
if (existsSync(existingReceipt)) {
  const receipt = JSON.parse(readFileSync(existingReceipt, "utf8"));
  const unsigned = { ...receipt };
  delete unsigned.receiptSha256;
  if (canonicalSha(unsigned) !== receipt.receiptSha256) throw new Error("callisto-hemispherical-tif-receipt-drift");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: receipt.receiptSha256 }, null, 2));
  process.exit(0);
}
if (existsSync(output) || existsSync(partial)) throw new Error("callisto-hemispherical-tif-output-already-exists");
const url = new URL(sourceUrl);
if (url.protocol !== "https:" || url.hostname !== "assets.science.nasa.gov" || url.username || url.password || url.port || url.hash) throw new Error("callisto-hemispherical-tif-url-policy");
mkdirSync(dirname(output), { recursive: true });
let bytes = 0;
try {
  const response = await fetch(sourceUrl, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": "Orbit-Atlas-v592-callisto-hemispherical-single-request/1.0" },
    signal: AbortSignal.timeout(300_000),
  });
  if (response.status !== 200 || response.url !== sourceUrl || response.headers.get("location")) throw new Error(`http:${response.status}:${response.url}:redirect=${response.headers.get("location") ?? "none"}`);
  if (!response.body) throw new Error("missing-response-body");
  const declaredLengthRaw = response.headers.get("content-length");
  const declaredLength = declaredLengthRaw === null ? null : Number(declaredLengthRaw);
  if (declaredLength !== null && declaredLength > maxBytes) throw new Error(`content-length:${declaredLength}`);
  const hash = createHash("sha256");
  const meter = new Transform({
    transform(chunk, _encoding, callback) {
      bytes += chunk.byteLength;
      if (bytes > maxBytes) return callback(new Error(`size-limit:${bytes}`));
      hash.update(chunk);
      callback(null, chunk);
    },
  });
  await pipeline(response.body, meter, createWriteStream(partial, { flags: "wx" }));
  if (bytes <= 8 || (declaredLength !== null && declaredLength > 0 && bytes !== declaredLength)) throw new Error(`byte-count:${bytes}:${declaredLengthRaw ?? "unreported"}`);
  const head = readFileSync(partial).subarray(0, 4).toString("hex");
  if (head !== "49492a00" && head !== "4d4d002a") throw new Error(`not-tiff:${head}`);
  const digest = hash.digest("hex");
  renameSync(partial, output);
  const receipt = seal(receiptPath, {
    version: "v592-callisto-hemispherical-tif-acquisition-v1",
    generatedAt: new Date().toISOString(),
    status: "acquired-single-request-pending-projection-review",
    target: "callisto",
    nasaId: "PIA03876",
    sourceUrl,
    finalUrl: response.url,
    host: url.hostname,
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    redirectFollowed: false,
    outputPath,
    bytes,
    sha256: digest,
    contentType: response.headers.get("content-type") ?? "unreported",
    contentLengthHeader: declaredLength,
    licenseBasis: "NASA Photojournal item-level review required; acquisition does not grant runtime admission",
    visualAssetAdmissionGranted: false,
    scientificAuthorityGranted: false,
    presentationOnly: true,
  });
  console.log(JSON.stringify({ status: receipt.status, bytes, sha256: digest, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  rmSync(partial, { force: true });
  const receipt = seal(receiptPath, {
    version: "v592-callisto-hemispherical-tif-acquisition-v1",
    generatedAt: new Date().toISOString(),
    status: "blocked-single-request-no-retry",
    target: "callisto",
    nasaId: "PIA03876",
    sourceUrl,
    host: url.hostname,
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    redirectFollowed: false,
    outputPath,
    bytes,
    sha256: null,
    error: error instanceof Error ? error.message : String(error),
    licenseBasis: "NASA Photojournal item-level review required; acquisition does not grant runtime admission",
    visualAssetAdmissionGranted: false,
    scientificAuthorityGranted: false,
    presentationOnly: true,
  });
  console.error(JSON.stringify({ status: receipt.status, error: receipt.error, receiptSha256: receipt.receiptSha256 }, null, 2));
}
