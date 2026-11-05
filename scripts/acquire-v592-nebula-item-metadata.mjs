import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { request } from "node:https";

const root = process.cwd();
const admissionPath = resolve(root, "docs/release/v592/nebula-asset-metadata-admission-v592.json");
const receiptPath = resolve(root, "docs/release/v592/acquisition-receipt-nebula-item-metadata-v592.json");
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
function verifySealed(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-nebula-item-metadata-input-seal:${path}`);
  return document;
}
function writeReceipt(unsigned) {
  const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  atomicWrite(receiptPath, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8"));
  return receipt;
}
function fetchOnce(url, target) {
  return new Promise((resolvePromise, rejectPromise) => {
    assert(url.protocol === "https:" && url.hostname === "images-assets.nasa.gov", `v592-nebula-item-metadata-url:${target}`);
    assert(!url.username && !url.password && !url.port && !url.hash, `v592-nebula-item-metadata-url-policy:${target}`);
    const req = request(url, {
      method: "GET",
      headers: { Accept: "application/json", "User-Agent": `Orbit-Atlas-v592-${target}-item-metadata/1.0` },
    }, (response) => {
      const chunks = [];
      let receivedBytes = 0;
      const status = response.statusCode ?? 0;
      if (status >= 300 && status < 400) {
        response.resume();
        rejectPromise(new Error(`v592-nebula-item-metadata-redirect:${target}:${status}:${response.headers.location ?? "missing"}`));
        return;
      }
      response.on("data", (chunk) => {
        receivedBytes += chunk.byteLength;
        if (receivedBytes > 2 * 1024 * 1024) {
          req.destroy(new Error(`v592-nebula-item-metadata-size:${target}`));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => {
        const bytes = Buffer.concat(chunks);
        if (status !== 200) {
          rejectPromise(new Error(`v592-nebula-item-metadata-http:${target}:${status}`));
          return;
        }
        try {
          JSON.parse(bytes.toString("utf8"));
        } catch {
          rejectPromise(new Error(`v592-nebula-item-metadata-json:${target}`));
          return;
        }
        resolvePromise({ status, bytes, contentType: response.headers["content-type"] ?? null });
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
    assert(bytes.byteLength === asset.bytes && sha256(bytes) === asset.sha256, `v592-nebula-item-metadata-existing-drift:${asset.target}`);
  }
  return receipt;
}

const admission = verifySealed(admissionPath);
assert(admission.status === "metadata-candidates-assembled-payload-not-acquired", "v592-nebula-item-metadata-admission-status");
const candidates = admission.targets.filter((target) => target.state === "candidate-explicit-https-acquisition-required");
assert(candidates.length === 12, "v592-nebula-item-metadata-candidate-count");
const existing = verifyExisting();
if (existing) {
  console.log(JSON.stringify({ status: "verified-existing-no-request", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

const assets = [];
const failures = [];
for (const candidate of candidates) {
  const manifestPath = resolve(root, `docs/release/v592/metadata-probe-nebula-assets/${candidate.target}.json`);
  const manifest = verifySealed(manifestPath);
  const metadataFile = manifest.files.find((file) => file.filename === "metadata.json");
  assert(metadataFile?.httpsCandidate?.startsWith("https://"), `v592-nebula-item-metadata-candidate:${candidate.target}`);
  const outputPath = `source-cache/v592/nebulae/metadata/${candidate.target}-${candidate.nasaId}.json`;
  const output = resolve(root, outputPath);
  if (existsSync(output) || existsSync(`${output}.part`)) {
    failures.push({ target: candidate.target, error: "unreceipted-existing-output" });
    continue;
  }
  try {
    const url = new URL(metadataFile.httpsCandidate);
    const response = await fetchOnce(url, candidate.target);
    atomicWrite(output, response.bytes);
    const document = JSON.parse(response.bytes.toString("utf8"));
    assets.push({
      target: candidate.target,
      nasaId: candidate.nasaId,
      url: url.href,
      finalUrl: url.href,
      host: url.hostname,
      requestCount: 1,
      httpStatus: response.status,
      contentType: response.contentType,
      outputPath,
      bytes: response.bytes.byteLength,
      sha256: sha256(response.bytes),
      identity: {
        nasaId: document["AVAIL:NASAID"] ?? document["NASA ID"] ?? document.nasa_id ?? null,
        title: document["AVAIL:Title"] ?? document.Title ?? document.title ?? null,
        center: document["AVAIL:Center"] ?? document.Center ?? document.center ?? null,
        creator: document["AVAIL:Creator"] ?? document.Creator ?? document.creator ?? null,
        secondaryCreator: document["AVAIL:SecondaryCreator"] ?? null,
        dateCreated: document["AVAIL:DateCreated"] ?? document["Date Created"] ?? document.date_created ?? null,
      },
    });
  } catch (error) {
    failures.push({ target: candidate.target, error: error instanceof Error ? error.message : String(error) });
  }
}

const receipt = writeReceipt({
  version: "v592-nebula-item-metadata-acquisition-v1",
  generatedAt: "2026-08-15T00:00:00Z",
  status: failures.length === 0 && assets.length === 12
    ? "committed-twelve-metadata-files-single-request-each-no-retry"
    : "blocked-no-automatic-retry",
  policy: {
    metadataOnly: true,
    visualPayloadDownloaded: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    redirectFollowed: false,
    itemLevelLicenseReviewStillRequired: true,
    visualAssetAdmissionGranted: false,
  },
  sourceAdmissionReceiptSha256: admission.receiptSha256,
  requestCount: candidates.length,
  requestCountPerUrl: 1,
  assets,
  failures,
});
console.log(JSON.stringify({ status: receipt.status, assetCount: assets.length, failures, receiptSha256: receipt.receiptSha256 }, null, 2));
if (failures.length > 0) process.exitCode = 1;
