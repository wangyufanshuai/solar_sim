import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { request } from "node:https";

const root = process.cwd();
const selections = JSON.parse(readFileSync(resolve(root, "scripts/v592-deep-space-alternative-asset-selections.json"), "utf8"));
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-deep-space-alternative-item-input-seal:${path}`);
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
    assert(url.protocol === "https:" && url.hostname === "images-assets.nasa.gov", `v592-deep-space-alternative-item-url:${id}`);
    assert(!url.username && !url.password && !url.port && !url.hash, `v592-deep-space-alternative-item-url-policy:${id}`);
    const req = request(url, {
      method: "GET",
      headers: { Accept: "application/json", "User-Agent": `Orbit-Atlas-v592-${id}-alternative-item-metadata/1.0` },
    }, (response) => {
      const chunks = [];
      let receivedBytes = 0;
      const status = response.statusCode ?? 0;
      if (status >= 300 && status < 400) {
        response.resume();
        rejectPromise(new Error(`v592-deep-space-alternative-item-redirect:${id}:${status}:${response.headers.location ?? "missing"}`));
        return;
      }
      response.on("data", (chunk) => {
        receivedBytes += chunk.byteLength;
        if (receivedBytes > 2 * 1024 * 1024) {
          req.destroy(new Error(`v592-deep-space-alternative-item-size:${id}`));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => {
        const bytes = Buffer.concat(chunks);
        if (status !== 200) {
          rejectPromise(new Error(`v592-deep-space-alternative-item-http:${id}:${status}`));
          return;
        }
        try {
          JSON.parse(bytes.toString("utf8"));
        } catch {
          rejectPromise(new Error(`v592-deep-space-alternative-item-json:${id}`));
          return;
        }
        resolvePromise({ status, bytes, contentType: response.headers["content-type"] ?? null });
      });
    });
    req.on("error", rejectPromise);
    req.end();
  });
}

assert(selections.version === "v592-deep-space-alternative-asset-selections-v1", "v592-deep-space-alternative-item-selections");
const selection = selections.selections.find((entry) => entry.id === selectionId);
assert(selection, `v592-deep-space-alternative-item-selection:${selectionId}`);
const manifestPath = resolve(root, `docs/release/v592/metadata-probe-deep-space-alternative-assets/${selectionId}.json`);
const manifest = verifySealed(manifestPath);
assert(manifest.selectionId === selectionId && manifest.selection.nasaId === selection.nasaId, `v592-deep-space-alternative-item-manifest:${selectionId}`);
const metadataFile = manifest.files.find((file) => file.filename === "metadata.json");
assert(metadataFile?.httpsCandidate?.startsWith("https://"), `v592-deep-space-alternative-item-candidate:${selectionId}`);
const outputRelativePath = `source-cache/v592/deep-space/alternative-metadata/${selectionId}.json`;
const outputPath = resolve(root, outputRelativePath);
const receiptPath = resolve(root, `docs/release/v592/acquisition-receipt-deep-space-alternative-item-metadata/${selectionId}.json`);
const blockedPath = resolve(root, `docs/release/v592/acquisition-receipt-deep-space-alternative-item-metadata/${selectionId}-blocked.json`);
if (existsSync(receiptPath)) {
  const existing = verifySealed(receiptPath);
  const bytes = readFileSync(outputPath);
  assert(bytes.byteLength === existing.output.bytes && sha256(bytes) === existing.output.sha256, `v592-deep-space-alternative-item-existing-drift:${selectionId}`);
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", selectionId, receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(!existsSync(blockedPath), `v592-deep-space-alternative-item-terminal-block:${selectionId}`);
assert(!existsSync(outputPath) && !existsSync(`${outputPath}.part`), `v592-deep-space-alternative-item-unreceipted-output:${selectionId}`);

try {
  const url = new URL(metadataFile.httpsCandidate);
  const response = await fetchOnce(url, selectionId);
  atomicWrite(outputPath, response.bytes);
  const document = JSON.parse(response.bytes.toString("utf8"));
  const receipt = writeReceipt(receiptPath, {
    version: "v592-deep-space-alternative-item-metadata-acquisition-v1",
    acquiredAt: new Date().toISOString(),
    status: "committed-single-metadata-file-single-request-no-retry",
    selectionId,
    target: selection.target,
    category: selection.category,
    nasaId: selection.nasaId,
    identityTerms: selection.identityTerms,
    assetManifestReceiptSha256: manifest.receiptSha256,
    policy: {
      metadataOnly: true,
      visualPayloadDownloaded: false,
      requestCount: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      redirectFollowed: false,
      itemLevelLicenseReviewStillRequired: true,
      scientificPayloadWriteback: false,
    },
    request: {
      url: url.href,
      finalUrl: url.href,
      host: url.hostname,
      httpStatus: response.status,
      contentType: response.contentType,
    },
    output: {
      path: outputRelativePath,
      bytes: response.bytes.byteLength,
      sha256: sha256(response.bytes),
    },
    identity: {
      nasaId: document["AVAIL:NASAID"] ?? null,
      title: document["AVAIL:Title"] ?? null,
      center: document["AVAIL:Center"] ?? null,
      creator: document["AVAIL:Creator"] ?? null,
      secondaryCreator: document["AVAIL:SecondaryCreator"] ?? null,
      dateCreated: document["AVAIL:DateCreated"] ?? null,
    },
  });
  console.log(JSON.stringify({ status: receipt.status, selectionId, identity: receipt.identity, output: receipt.output, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  const blocked = writeReceipt(blockedPath, {
    version: "v592-deep-space-alternative-item-metadata-blocked-v1",
    failedAt: new Date().toISOString(),
    status: "blocked-no-automatic-retry",
    selectionId,
    target: selection.target,
    nasaId: selection.nasaId,
    metadataUrl: metadataFile.httpsCandidate,
    requestCount: 1,
    visualPayloadDownloaded: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    scientificPayloadWriteback: false,
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(JSON.stringify({ status: blocked.status, selectionId, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
  process.exitCode = 1;
}
