import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { request } from "node:https";

const root = process.cwd();
const selectionManifestPath = resolve(root, "scripts/v592-deep-space-alternative-visual-source-selections.json");
const selections = JSON.parse(readFileSync(selectionManifestPath, "utf8"));
const selectionId = process.argv[2];
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
function verifySealed(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-deep-space-alternative-visual-input-seal:${path}`);
  return document;
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
function fetchOnce(url, id) {
  return new Promise((resolvePromise, rejectPromise) => {
    assert(url.protocol === "https:" && url.hostname === "images-assets.nasa.gov", `v592-deep-space-alternative-visual-url:${id}`);
    assert(!url.username && !url.password && !url.port && !url.hash, `v592-deep-space-alternative-visual-url-policy:${id}`);
    const req = request(url, {
      method: "GET",
      headers: { Accept: "image/jpeg", "User-Agent": `Orbit-Atlas-v592-${id}-alternative-visual-source/1.0` },
    }, (response) => {
      const chunks = [];
      let receivedBytes = 0;
      const status = response.statusCode ?? 0;
      if (status >= 300 && status < 400) {
        response.resume();
        rejectPromise(new Error(`v592-deep-space-alternative-visual-redirect:${id}:${status}:${response.headers.location ?? "missing"}`));
        return;
      }
      response.on("data", (chunk) => {
        receivedBytes += chunk.byteLength;
        if (receivedBytes > 128 * 1024 * 1024) {
          req.destroy(new Error(`v592-deep-space-alternative-visual-size:${id}`));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => {
        const bytes = Buffer.concat(chunks);
        if (status !== 200) {
          rejectPromise(new Error(`v592-deep-space-alternative-visual-http:${id}:${status}`));
          return;
        }
        const contentType = response.headers["content-type"] ?? "";
        if (!String(contentType).toLowerCase().includes("image/jpeg") || bytes.byteLength < 32 * 1024) {
          rejectPromise(new Error(`v592-deep-space-alternative-visual-content:${id}:${contentType}:${bytes.byteLength}`));
          return;
        }
        resolvePromise({ status, bytes, contentType, lastModified: response.headers["last-modified"] ?? null, etag: response.headers.etag ?? null });
      });
    });
    req.on("error", rejectPromise);
    req.end();
  });
}

assert(selections.version === "v592-deep-space-alternative-visual-source-selections-v1", "v592-deep-space-alternative-visual-selections");
assert(selections.policy?.singleRequestPerUrl === true && selections.policy?.automaticRetryAllowed === false && selections.policy?.automaticReplacementAllowed === false, "v592-deep-space-alternative-visual-policy");
assert(selections.selections.includes(selectionId), `v592-deep-space-alternative-visual-selection:${selectionId}`);
const licenseReviewPath = resolve(root, selections.sourceLicenseReviewPath);
const licenseReviewBytes = readFileSync(licenseReviewPath);
assert(sha256(licenseReviewBytes) === selections.sourceLicenseReviewSha256, "v592-deep-space-alternative-visual-license-file-sha");
const licenseReview = verifySealed(licenseReviewPath);
const review = licenseReview.reviews.find((entry) => entry.selectionId === selectionId);
assert(review?.status === "eligible-for-explicit-single-request-visual-source-acquisition", `v592-deep-space-alternative-visual-review:${selectionId}`);
assert(licenseReview.eligibleSelectionIds.includes(selectionId), `v592-deep-space-alternative-visual-eligible:${selectionId}`);
const outputRelativePath = `source-cache/v592/deep-space/alternative-visual/${selectionId}.jpg`;
const outputPath = resolve(root, outputRelativePath);
const receiptPath = resolve(root, `docs/release/v592/acquisition-receipt-deep-space-alternative-visual-sources/${selectionId}.json`);
const blockedPath = resolve(root, `docs/release/v592/acquisition-receipt-deep-space-alternative-visual-sources/${selectionId}-blocked.json`);
if (existsSync(receiptPath)) {
  const existing = verifySealed(receiptPath);
  const bytes = readFileSync(outputPath);
  assert(bytes.byteLength === existing.output.bytes && sha256(bytes) === existing.output.sha256, `v592-deep-space-alternative-visual-existing-drift:${selectionId}`);
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", selectionId, receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(!existsSync(blockedPath), `v592-deep-space-alternative-visual-terminal-block:${selectionId}`);
assert(!existsSync(outputPath) && !existsSync(`${outputPath}.part`), `v592-deep-space-alternative-visual-unreceipted-output:${selectionId}`);

try {
  const url = new URL(review.sourceImage.url);
  const response = await fetchOnce(url, selectionId);
  atomicWrite(outputPath, response.bytes);
  const receipt = writeReceipt(receiptPath, {
    version: "v592-deep-space-alternative-visual-source-acquisition-v1",
    acquiredAt: new Date().toISOString(),
    status: "committed-single-visual-source-single-request-no-retry",
    selectionId,
    target: review.target,
    category: review.category,
    nasaId: review.nasaId,
    licenseReviewReceiptSha256: licenseReview.receiptSha256,
    metadataAcquisitionReceiptSha256: review.metadataAcquisitionReceiptSha256,
    assetManifestReceiptSha256: review.assetManifestReceiptSha256,
    policy: {
      sourceCacheOnly: true,
      runtimeAssetGenerated: false,
      visualAssetAdmissionGranted: false,
      requestCount: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      redirectFollowed: false,
      mappedColorMustRemainLabeled: true,
      nakedEyeRepresentationClaimed: false,
      scienceImagePayload: false,
      scientificPayloadWriteback: false,
    },
    source: {
      url: url.href,
      finalUrl: url.href,
      host: url.hostname,
      httpStatus: response.status,
      contentType: response.contentType,
      lastModified: response.lastModified,
      etag: response.etag,
      title: review.title,
      credit: review.secondaryCreator,
      width: review.sourceImage.metadataWidth,
      height: review.sourceImage.metadataHeight,
      format: review.sourceImage.expectedFormat,
      observationEncoding: review.observationEncoding,
    },
    output: {
      path: outputRelativePath,
      bytes: response.bytes.byteLength,
      sha256: sha256(response.bytes),
    },
  });
  console.log(JSON.stringify({ status: receipt.status, selectionId, target: receipt.target, output: receipt.output, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  const blocked = writeReceipt(blockedPath, {
    version: "v592-deep-space-alternative-visual-source-blocked-v1",
    failedAt: new Date().toISOString(),
    status: "blocked-no-automatic-retry",
    selectionId,
    target: review.target,
    nasaId: review.nasaId,
    sourceUrl: review.sourceImage.url,
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    runtimeAssetGenerated: false,
    scientificPayloadWriteback: false,
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(JSON.stringify({ status: blocked.status, selectionId, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
  process.exitCode = 1;
}
