import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { request } from "node:https";
import sharp from "sharp";

const root = process.cwd();
const reviewPath = resolve(root, "docs/release/v592/deep-space-item-license-review-v592.json");
const receiptPath = resolve(root, "docs/release/v592/acquisition-receipt-deep-space-visual-sources-v592.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  writeFileSync(partial, bytes);
  rmSync(path, { force: true });
  renameSync(partial, path);
}
function writeReceipt(unsigned) {
  const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  atomicWrite(receiptPath, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8"));
  return receipt;
}
function verifySealed(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-deep-space-source-input-seal:${path}`);
  return document;
}
function fetchOnce(url, target) {
  return new Promise((resolvePromise, rejectPromise) => {
    assert(url.protocol === "https:" && url.hostname === "images-assets.nasa.gov", `v592-deep-space-source-url:${target}`);
    assert(!url.username && !url.password && !url.port && !url.hash, `v592-deep-space-source-url-policy:${target}`);
    const req = request(url, {
      method: "GET",
      headers: { Accept: "image/jpeg", "User-Agent": `Orbit-Atlas-v592-${target}-visual-source-acquisition/1.0` },
    }, (response) => {
      const chunks = [];
      let total = 0;
      const status = response.statusCode ?? 0;
      if (status >= 300 && status < 400) {
        response.resume();
        rejectPromise(new Error(`v592-deep-space-source-redirect:${target}:${status}:${response.headers.location ?? "missing"}`));
        return;
      }
      response.on("data", (chunk) => {
        total += chunk.byteLength;
        if (total > 128 * 1024 * 1024) {
          req.destroy(new Error(`v592-deep-space-source-size-limit:${target}`));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => {
        if (status !== 200) {
          rejectPromise(new Error(`v592-deep-space-source-http:${target}:${status}`));
          return;
        }
        resolvePromise({
          status,
          contentType: response.headers["content-type"] ?? null,
          lastModified: response.headers["last-modified"] ?? null,
          etag: response.headers.etag ?? null,
          bytes: Buffer.concat(chunks),
        });
      });
    });
    req.on("error", rejectPromise);
    req.end();
  });
}
function verifyExisting() {
  if (!existsSync(receiptPath)) return null;
  const receipt = verifySealed(receiptPath);
  for (const asset of receipt.assets ?? []) {
    const bytes = readFileSync(resolve(root, asset.outputPath));
    assert(bytes.byteLength === asset.bytes && sha256(bytes) === asset.sha256, `v592-deep-space-source-existing-drift:${asset.target}`);
  }
  return receipt;
}

const review = verifySealed(reviewPath);
assert(review.status === "5-visual-source-acquisitions-eligible-13-license-identity-or-suitability-blocked", "v592-deep-space-source-review-status");
assert(review.summary.eligibleForAcquisitionCount === 5 && review.summary.sourceImageDownloadedCount === 0, "v592-deep-space-source-review-count");
const existing = verifyExisting();
if (existing) {
  console.log(JSON.stringify({ status: "verified-existing-no-request", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

const assets = [];
const failures = [];
for (const item of review.reviews.filter((entry) => entry.status.startsWith("eligible"))) {
  const url = new URL(item.sourceImage.url);
  const outputPath = `source-cache/v592/deep-space/visual/${item.target}-${item.nasaId}-orig.jpg`;
  const output = resolve(root, outputPath);
  const partial = `${output}.part`;
  if (existsSync(output) || existsSync(partial)) {
    failures.push({ target: item.target, error: "unreceipted-existing-output" });
    continue;
  }
  try {
    const response = await fetchOnce(url, item.target);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(partial, response.bytes);
    const image = await sharp(partial, { limitInputPixels: false }).metadata();
    assert(image.format === "jpeg", `v592-deep-space-source-format:${item.target}:${image.format}`);
    assert(image.width === item.sourceImage.metadataWidth && image.height === item.sourceImage.metadataHeight, `v592-deep-space-source-dimensions:${item.target}:${image.width}x${image.height}`);
    rmSync(output, { force: true });
    renameSync(partial, output);
    assets.push({
      target: item.target,
      category: item.category,
      nasaId: item.nasaId,
      sourceUrl: url.href,
      finalUrl: url.href,
      host: url.hostname,
      requestCount: 1,
      automaticRetryPerformed: false,
      httpStatus: response.status,
      contentType: response.contentType,
      lastModified: response.lastModified,
      etag: response.etag,
      outputPath,
      bytes: response.bytes.byteLength,
      sha256: sha256(response.bytes),
      width: image.width,
      height: image.height,
      format: image.format,
      colorSpace: image.space ?? "unreported",
      license: "NASA-media-guidelines-public-use-candidate-with-item-credit-and-no-restricted-partner-flag",
      licenseUrl: review.policy.licenseUrl,
      credit: [item.creator, item.secondaryCreator].filter(Boolean).join("; "),
      observationEncoding: item.observationEncoding,
      visualAssetAdmissionGranted: false,
      scientificPayloadWriteback: false,
    });
  } catch (error) {
    rmSync(partial, { force: true });
    failures.push({ target: item.target, error: error instanceof Error ? error.message : String(error) });
  }
}

const receipt = writeReceipt({
  version: "v592-deep-space-visual-source-acquisition-v1",
  generatedAt: "2026-08-19T00:00:00Z",
  status: failures.length === 0 && assets.length === 5
    ? "committed-five-visual-sources-single-request-each-no-retry"
    : "blocked-no-automatic-retry",
  policy: {
    sourceCacheOnly: true,
    runtimeAssetGenerated: false,
    visualAssetAdmissionGranted: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    redirectFollowed: false,
    mappedColorMustRemainLabeled: true,
    nakedEyeRepresentationClaimed: false,
    scientificPayload: false,
    scientificPayloadWriteback: false,
  },
  sourceReviewReceiptSha256: review.receiptSha256,
  requestCount: review.summary.eligibleForAcquisitionCount,
  requestCountPerUrl: 1,
  assets,
  failures,
});
console.log(JSON.stringify({
  status: receipt.status,
  assets: receipt.assets.map((asset) => ({ target: asset.target, bytes: asset.bytes, dimensions: `${asset.width}x${asset.height}`, sha256: asset.sha256 })),
  failures,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
if (failures.length > 0) process.exitCode = 1;
