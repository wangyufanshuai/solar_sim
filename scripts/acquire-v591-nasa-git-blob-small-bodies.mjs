import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const metadataPath = resolve(root, "docs/release/v591/metadata-probe-nasa-3d-tree.json");
const receiptPath = resolve(root, "docs/release/v591/acquisition-receipt-nasa-git-blobs.json");
const blockedPath = resolve(root, "docs/release/v591/acquisition-blocked-nasa-git-blobs.json");
const ledgerPath = resolve(root, "docs/release/v591/acquisition-url-ledger-nasa-git-blobs.json");
const assetReceiptRoot = resolve(root, "docs/release/v591/acquisition-assets-nasa-git-blobs");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const systemDownloader = resolve(root, "scripts/download-v591-http-once.ps1");

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function readSealed(path) {
  const value = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...value };
  delete unsigned.receiptSha256;
  assert(value.receiptSha256 === canonicalSha(unsigned), `v591-nasa-git-blob-seal:${path}`);
  return value;
}
function writeSealed(path, unsigned) {
  const value = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
  return value;
}
async function fileSha(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}
const metadata = readSealed(metadataPath);
assert(metadata.status === "metadata-probe-complete-no-model-payload", "v591-nasa-git-blob-metadata-status");
const definitions = [
  { body: "eros", path: "3D Printing/Asteroid 433 Eros/Asteroid 433 Eros.stl", outputPath: "source-cache/celestial-convergence-v591/small-bodies/eros/eros-nasa.stl" },
  { body: "kleopatra", path: "3D Printing/Asteroid 216 Kleopatra/Asteroid 216 Kleopatra.stl", outputPath: "source-cache/celestial-convergence-v591/small-bodies/kleopatra/kleopatra-nasa.stl" },
];
const ledger = existsSync(ledgerPath)
  ? readSealed(ledgerPath)
  : { version: "v591-nasa-git-blob-url-ledger-v1", entries: [] };
assert(ledger.version === "v591-nasa-git-blob-url-ledger-v1", "v591-nasa-git-blob-ledger-version");
const requested = new Set(ledger.entries.map((entry) => entry.url));
function appendLedger(entry) {
  const next = writeSealed(ledgerPath, { version: "v591-nasa-git-blob-url-ledger-v1", entries: [...ledger.entries, entry] });
  ledger.entries = next.entries;
  ledger.receiptSha256 = next.receiptSha256;
}
if (existsSync(receiptPath)) {
  const existing = readSealed(receiptPath);
  for (const asset of existing.assets) {
    const path = resolve(root, asset.outputPath);
    assert(existsSync(path) && statSync(path).size === asset.bytes && await fileSha(path) === asset.sha256, `v591-nasa-git-blob-existing:${asset.body}`);
  }
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
const assets = [];
const failures = [];
for (const definition of definitions) {
  const candidate = metadata.candidates?.[definition.body]?.find((entry) => entry.path === definition.path && entry.apiUrl);
  if (!candidate) { failures.push({ body: definition.body, reason: "metadata-candidate-missing" }); continue; }
  const url = new URL(candidate.apiUrl);
  if (url.protocol !== "https:" || url.hostname !== "api.github.com" || !url.pathname.startsWith("/repos/nasa/NASA-3D-Resources/git/blobs/") || url.username || url.password || url.port) {
    failures.push({ body: definition.body, reason: "url-policy" }); continue;
  }
  const outputPath = resolve(root, definition.outputPath);
  const assetReceiptPath = resolve(assetReceiptRoot, `${definition.body}-nasa-shape-source.json`);
  if (existsSync(outputPath) || existsSync(assetReceiptPath)) {
    try {
      assert(existsSync(outputPath) && existsSync(assetReceiptPath), `existing-pair:${definition.body}`);
      const existing = readSealed(assetReceiptPath);
      assert(existing.asset.bytes === statSync(outputPath).size && existing.asset.sha256 === await fileSha(outputPath), `existing-sha:${definition.body}`);
      assets.push(existing.asset);
    } catch (error) { failures.push({ body: definition.body, reason: error instanceof Error ? error.message : String(error) }); }
    continue;
  }
  if (requested.has(url.href)) { failures.push({ body: definition.body, reason: "previous-url-consumed-no-retry" }); continue; }
  const requestedAt = new Date().toISOString();
  let responseMeta;
  let bytes;
  try {
    const stagedPath = `${outputPath}.http.part`;
    rmSync(stagedPath, { force: true });
    mkdirSync(dirname(stagedPath), { recursive: true });
    const result = spawnSync("powershell", [
      "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", systemDownloader,
      "-Url", url.href, "-OutputPath", stagedPath, "-Accept", "application/vnd.github.raw+json",
    ], {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 8 * 1024 * 1024,
    });
    if (result.status !== 0) throw new Error(`system-http:${result.status}:${result.stderr || result.stdout}`);
    responseMeta = JSON.parse(result.stdout);
    bytes = readFileSync(stagedPath);
    rmSync(stagedPath, { force: true });
  } catch (error) {
    appendLedger({ body: definition.body, url: url.href, requestedAt, outcome: "network-error-no-retry", error: error instanceof Error ? error.message : String(error) });
    failures.push({ body: definition.body, reason: error instanceof Error ? error.message : String(error) });
    continue;
  }
  appendLedger({
    body: definition.body,
    url: url.href,
    requestedAt,
    httpStatus: responseMeta.status,
    outcome: responseMeta.status === 200 ? "response-received" : "http-error-no-retry",
    contentType: responseMeta.contentType,
    responseBytes: bytes.byteLength,
    redirectTo: responseMeta.location,
  });
  try {
    assert(responseMeta.status === 200 && responseMeta.finalUrl === url.href && !responseMeta.location, `http:${definition.body}:${responseMeta.status}`);
    assert(bytes.byteLength === candidate.bytes, `bytes:${definition.body}:${bytes.byteLength}`);
    const text = bytes.subarray(0, Math.min(bytes.length, 96)).toString("ascii").toLowerCase();
    assert(bytes.length >= 84 && (text.startsWith("solid") || ((bytes.length - 84) % 50 === 0)), `stl-magic:${definition.body}`);
    mkdirSync(dirname(outputPath), { recursive: true });
    const partial = `${outputPath}.part`;
    rmSync(partial, { force: true });
    writeFileSync(partial, bytes, { flag: "wx" });
    rmSync(outputPath, { force: true });
    renameSync(partial, outputPath);
    const asset = {
      id: `${definition.body}-nasa-shape-source`,
      body: definition.body,
      role: "model-stl",
      sourceUrl: url.href,
      finalUrl: responseMeta.finalUrl,
      repositoryPath: candidate.path,
      gitBlobSha1: candidate.gitBlobSha1,
      outputPath: definition.outputPath,
      bytes: bytes.byteLength,
      sha256: sha256(bytes),
      license: { id: "NASA-public-domain", url: "https://www.nasa.gov/nasa-brand-center/images-and-media/" },
      observationIdentity: `NASA 3D Resources ${definition.path.replace(/^3D Printing\//, "")}`,
      observationLimit: definition.body === "kleopatra" ? "low-resolution radar-derived shape presentation source; source-detail ceiling disclosed; no measured photometry claim" : "shape presentation source; no measured photometry claim",
      presentationOnly: true,
      metadataReceiptSha256: metadata.receiptSha256,
    };
    const assetReceipt = writeSealed(assetReceiptPath, { version: "v591-nasa-git-blob-asset-acquisition-receipt-v1", status: "committed-single-request-no-retry", asset });
    assets.push({ ...asset, assetReceiptSha256: assetReceipt.receiptSha256 });
  } catch (error) {
    failures.push({ body: definition.body, reason: error instanceof Error ? error.message : String(error) });
  }
}
if (failures.length > 0) {
  const blocked = writeSealed(blockedPath, {
    version: "v591-nasa-git-blob-acquisition-blocked-v1",
    failedAt: new Date().toISOString(),
    status: "blocked-no-automatic-retry",
    metadataReceiptSha256: metadata.receiptSha256,
    assetsCommitted: assets.map((asset) => asset.body),
    failures,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
  });
  throw new Error(`v591-nasa-git-blob-acquisition-blocked:${blocked.receiptSha256}`);
}
const receipt = writeSealed(receiptPath, {
  version: "v591-nasa-git-blob-acquisition-receipt-v1",
  acquiredAt: new Date().toISOString(),
  status: "acquired-two-models-single-request-each-no-retry",
  metadataReceiptSha256: metadata.receiptSha256,
  urlLedgerReceiptSha256: readSealed(ledgerPath).receiptSha256,
  automaticRetryPerformed: false,
  automaticReplacementPerformed: false,
  assets,
});
console.log(JSON.stringify({ status: receipt.status, assets: assets.map(({ body, bytes, sha256: digest }) => ({ body, bytes, sha256: digest })), receiptSha256: receipt.receiptSha256 }, null, 2));
