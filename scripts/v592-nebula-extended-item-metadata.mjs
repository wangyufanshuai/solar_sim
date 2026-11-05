import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const profile = ["final", "closure", "closure2"].includes(process.argv[2]) ? process.argv[2] : "extended";
const selectionsPath = resolve(root, `scripts/v592-nebula-${profile}-selections.json`);
const outputPath = resolve(root, `docs/release/v592/nebula-${profile}-item-metadata-v592.json`);
const blockedPath = resolve(root, `docs/release/v592/nebula-${profile}-item-metadata-blocked-v592.json`);
const selections = JSON.parse(readFileSync(selectionsPath, "utf8"));
const allowedHost = "images-assets.nasa.gov";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, document) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  writeFileSync(partial, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  rmSync(path, { force: true });
  renameSync(partial, path);
}
function seal(unsigned) { return { ...unsigned, receiptSha256: canonicalSha(unsigned) }; }
function verifyExisting(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-nebula-extended-existing-seal:${path}`);
  return document;
}
function validateUrl(raw, target) {
  const url = new URL(raw);
  assert(url.protocol === "https:" && url.hostname === allowedHost, `v592-nebula-extended-url:${target}`);
  assert(!url.username && !url.password && !url.port && !url.hash, `v592-nebula-extended-url-policy:${target}`);
  return url;
}
function parseField(document, ...keys) {
  for (const key of keys) if (document[key] != null && document[key] !== "") return document[key];
  return null;
}

assert(selections.version === `v592-nebula-${profile}-selections-v1`, "v592-nebula-extended-selection-version");
assert(selections.targets.length === (profile === "final" ? 7 : profile === "closure" ? 3 : profile === "closure2" ? 4 : 12), "v592-nebula-extended-target-count");
if (existsSync(outputPath)) {
  const existing = verifyExisting(outputPath);
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", targetCount: existing.targets.length, receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(!existsSync(blockedPath), "v592-nebula-extended-terminal-block-no-retry");

const targets = [];
const failures = [];
for (const selection of selections.targets) {
  const url = validateUrl(`https://${allowedHost}/image/${selection.nasaId}/metadata.json`, selection.target);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": `Orbit-Atlas-v592-${selection.target}-item-metadata/1.0` },
      signal: AbortSignal.timeout(60_000),
    });
    assert(response.status === 200 && response.url === url.href, `v592-nebula-extended-http:${selection.target}:${response.status}:${response.url}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert(bytes.byteLength <= 2 * 1024 * 1024, `v592-nebula-extended-size:${selection.target}`);
    const document = JSON.parse(bytes.toString("utf8"));
    const width = Number(parseField(document, "File:ImageWidth", "Composite:ImageWidth", "ImageWidth"));
    const height = Number(parseField(document, "File:ImageHeight", "Composite:ImageHeight", "ImageHeight"));
    const mime = String(parseField(document, "File:MIMEType", "MIMEType") ?? "").toLowerCase();
    const nasaId = String(parseField(document, "AVAIL:NASAID", "XMP:Nasa_id", "NASA ID") ?? "");
    const title = String(parseField(document, "AVAIL:Title", "XMP:Title", "Title") ?? "");
    const center = String(parseField(document, "AVAIL:Center", "XMP:Center", "Center") ?? "");
    const credit = String(parseField(document, "AVAIL:SecondaryCreator", "XMP:Credit", "XMP:Source", "Credit") ?? "");
    const description = String(parseField(document, "AVAIL:Description", "XMP:Description", "Description") ?? "").replaceAll(/\s+/g, " ").slice(0, 1600);
    const resolutionPassed = Number.isFinite(width) && Number.isFinite(height) && width >= 2048 && height >= 2048;
    const formatPassed = mime === "image/jpeg" || mime === "image/png";
    const nasaIdentityPassed = nasaId === selection.nasaId;
    const jplOrNasaCreditPassed = /\bNASA\b/i.test(credit) && !/ESA|STScI|AURA|Herschel/i.test(credit);
    targets.push({
      target: selection.target,
      catalogName: selection.catalogName,
      nasaId: selection.nasaId,
      metadataUrl: url.href,
      requestCount: 1,
      httpStatus: response.status,
      finalUrl: response.url,
      responseBytes: bytes.byteLength,
      responseSha256: sha256(bytes),
      identity: { nasaId, title, center, credit, description, width, height, mime },
      checks: { nasaIdentityPassed, resolutionPassed, formatPassed, jplOrNasaCreditPassed },
      status: nasaIdentityPassed && resolutionPassed && formatPassed && jplOrNasaCreditPassed
        ? "metadata-candidate-clean-frame-review-required"
        : "blocked-item-metadata-identity-resolution-or-credit",
      visualPayloadDownloaded: false,
      visualAssetAdmitted: false,
    });
  } catch (error) {
    failures.push({ target: selection.target, nasaId: selection.nasaId, requestCount: 1, error: error instanceof Error ? error.message : String(error) });
  }
}

const unsigned = {
  version: `v592-nebula-${profile}-item-metadata-v1`,
  generatedAt: new Date().toISOString(),
  status: failures.length === 0 && targets.length === selections.targets.length
    ? `${selections.targets.length}-item-metadata-acquired-no-visual-payload`
    : "blocked-no-automatic-retry",
  policy: {
    singleRequestPerUrl: true,
    requestCountPerUrl: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    redirectFollowed: false,
    visualPayloadDownloaded: false,
    itemLevelCleanFrameReviewRequired: true,
    visualAssetAdmissionGranted: false,
  },
  targets,
  failures,
};
const receipt = seal(unsigned);
atomicWrite(failures.length === 0 ? outputPath : blockedPath, receipt);
console.log(JSON.stringify({ status: receipt.status, targetCount: targets.length, failures, receiptSha256: receipt.receiptSha256 }, null, 2));
if (failures.length > 0) process.exitCode = 1;
