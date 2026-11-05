import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import sharp from "sharp";

const root = process.cwd();
const definition = JSON.parse(readFileSync(resolve(root, "scripts/v591-nebula-visual-sources.json"), "utf8"));
const receiptPath = resolve(root, "docs/release/v591/acquisition-receipt-nebulae.json");
const blockedPath = resolve(root, "docs/release/v591/acquisition-blocked-nebulae.json");
const ledgerPath = resolve(root, "docs/release/v591/acquisition-url-ledger-nebulae.json");
const assetReceiptRoot = resolve(root, "docs/release/v591/acquisition-assets-nebulae");
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
function readSealed(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v591-nebula-acquisition-seal:${path}`);
  return document;
}
function writeSealed(path, unsigned) {
  const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, `${JSON.stringify(sealed, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
  return sealed;
}
async function fileSha(path) {
  return new Promise((resolveHash, reject) => {
    const hash = createHash("sha256");
    const stream = Readable.toWeb ? null : null;
    import("node:fs").then(({ createReadStream }) => {
      const input = createReadStream(path);
      input.on("data", (chunk) => hash.update(chunk));
      input.on("end", () => resolveHash(hash.digest("hex")));
      input.on("error", reject);
    }).catch(reject);
    void stream;
  });
}

assert(definition.version === "v591-nebula-visual-sources-v1", "v591-nebula-acquisition-definition");
assert(definition.policy.singleRequestPerUrl === true && definition.policy.automaticRetryAllowed === false && definition.policy.automaticReplacementAllowed === false, "v591-nebula-acquisition-policy");
if (existsSync(receiptPath)) {
  const receipt = readSealed(receiptPath);
  for (const asset of receipt.assets) {
    const path = resolve(root, asset.outputPath);
    assert(existsSync(path) && statSync(path).size === asset.bytes && await fileSha(path) === asset.sha256, `v591-nebula-acquisition-existing:${asset.id}`);
  }
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", assetCount: receipt.assets.length, receiptSha256: receipt.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(!existsSync(blockedPath), "v591-nebula-acquisition-terminal-block-exists");
const ledger = existsSync(ledgerPath)
  ? readSealed(ledgerPath)
  : { version: "v591-nebula-acquisition-url-ledger-v1", entries: [] };
const requested = new Set(ledger.entries.map((entry) => entry.url));
const committed = [];
const failures = [];
function appendLedger(entry) {
  const next = writeSealed(ledgerPath, { version: "v591-nebula-acquisition-url-ledger-v1", entries: [...ledger.entries, entry] });
  ledger.entries = next.entries;
  ledger.receiptSha256 = next.receiptSha256;
}

for (const asset of definition.assets) {
  const url = new URL(asset.sourceUrl);
  const finalPath = resolve(root, asset.outputPath);
  const partPath = `${finalPath}.part`;
  const assetReceiptPath = resolve(assetReceiptRoot, `${asset.id}.json`);
  try {
    assert(url.protocol === "https:" && definition.policy.allowedHosts.includes(url.hostname) && !url.username && !url.password && !url.port, `v591-nebula-acquisition-url:${asset.id}`);
    const metadata = readSealed(resolve(root, asset.metadataReceiptPath));
    const candidate = metadata.candidates.find((entry) => entry.nasaId === asset.nasaId);
    assert(candidate && candidate.requiredTermsMatched === true && metadata.target === asset.target, `v591-nebula-acquisition-metadata:${asset.id}`);
    const identity = `${candidate.title} ${candidate.description} ${(candidate.keywords ?? []).join(" ")}`.toLowerCase();
    assert(identity.includes("nebula") && !identity.includes("artist concept"), `v591-nebula-acquisition-identity:${asset.id}`);
    assert(!requested.has(url.href), `v591-nebula-acquisition-repeat-url:${asset.id}`);
    assert(!existsSync(finalPath) && !existsSync(partPath) && !existsSync(assetReceiptPath), `v591-nebula-acquisition-output-exists:${asset.id}`);
    mkdirSync(dirname(finalPath), { recursive: true });
    requested.add(url.href);
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": `Orbit-Atlas-v591-nebula-${asset.id}/1.0` },
      signal: AbortSignal.timeout(20 * 60_000),
    });
    const announcedBytes = Number(response.headers.get("content-length"));
    appendLedger({ assetId: asset.id, url: url.href, requestedAt: new Date().toISOString(), httpStatus: response.status, finalUrl: response.url, contentLength: Number.isFinite(announcedBytes) ? announcedBytes : null, outcome: "response-received" });
    assert(response.status === 200 && response.url === url.href && !response.headers.get("location") && response.body, `v591-nebula-acquisition-http:${asset.id}:${response.status}:${response.url}`);
    const mediaType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    assert(definition.policy.expectedMediaTypes.includes(mediaType), `v591-nebula-acquisition-media:${asset.id}:${mediaType}`);
    assert(!Number.isFinite(announcedBytes) || (announcedBytes > 0 && announcedBytes <= definition.policy.maximumSourceBytes), `v591-nebula-acquisition-size:${asset.id}:${announcedBytes}`);
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partPath, { flags: "wx" }));
    const bytes = statSync(partPath).size;
    assert(bytes > 0 && bytes <= definition.policy.maximumSourceBytes && (!Number.isFinite(announcedBytes) || bytes === announcedBytes), `v591-nebula-acquisition-bytes:${asset.id}:${bytes}`);
    const metadataRecord = await sharp(partPath).metadata();
    assert(metadataRecord.format === "jpeg" && (metadataRecord.width ?? 0) >= asset.minimumWidth && (metadataRecord.height ?? 0) >= asset.minimumHeight, `v591-nebula-acquisition-dimensions:${asset.id}:${metadataRecord.width ?? 0}x${metadataRecord.height ?? 0}`);
    const sourceSha256 = await fileSha(partPath);
    renameSync(partPath, finalPath);
    const record = {
      id: asset.id,
      target: asset.target,
      nasaId: asset.nasaId,
      instrument: asset.instrument,
      sourceUrl: url.href,
      outputPath: asset.outputPath,
      bytes,
      sha256: sourceSha256,
      width: metadataRecord.width,
      height: metadataRecord.height,
      format: metadataRecord.format,
      colorSpace: metadataRecord.space ?? "srgb-unreported-profile",
      fieldCoverage: asset.fieldCoverage,
      observationColorPolicy: asset.observationColorPolicy,
      license: definition.policy.license,
      presentationOnly: true,
      scientificAuthority: false,
    };
    const assetReceipt = writeSealed(assetReceiptPath, { version: "v591-nebula-asset-acquisition-receipt-v1", status: "committed-single-request-no-retry", asset: record });
    committed.push({ ...record, assetReceiptSha256: assetReceipt.receiptSha256 });
  } catch (error) {
    rmSync(partPath, { force: true });
    failures.push({ id: asset.id, target: asset.target, nasaId: asset.nasaId, url: url.href, error: error instanceof Error ? error.message : String(error) });
  }
}

if (failures.length > 0) {
  const blocked = writeSealed(blockedPath, {
    version: "v591-nebula-acquisition-blocked-v1",
    failedAt: new Date().toISOString(),
    status: "blocked-no-automatic-retry",
    committed,
    failures,
    requestedUrlCount: requested.size,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    admission: "partial-or-zero-assets-not-admitted-as-six-of-six",
  });
  console.error(JSON.stringify({ status: blocked.status, committed: committed.length, failures, receiptSha256: blocked.receiptSha256 }, null, 2));
  process.exitCode = 1;
} else {
  const receipt = writeSealed(receiptPath, {
    version: "v591-nebula-acquisition-receipt-v1",
    acquiredAt: new Date().toISOString(),
    status: "acquired-six-urls-single-request-each-no-retry",
    assets: committed,
    requestedUrlCount: requested.size,
    urlLedgerReceiptSha256: ledger.receiptSha256,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    payloadClass: "public-domain-presentation-visual-assets-not-scientific-measured-payload",
  });
  console.log(JSON.stringify({ status: receipt.status, assets: committed, receiptSha256: receipt.receiptSha256 }, null, 2));
}
