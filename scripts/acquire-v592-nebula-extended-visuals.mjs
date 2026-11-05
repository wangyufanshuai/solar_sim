import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const profile = ["final", "closure", "closure2"].includes(process.argv[2]) ? process.argv[2] : "extended";
const metadataPath = resolve(root, `docs/release/v592/nebula-${profile}-item-metadata-v592.json`);
const receiptPath = resolve(root, `docs/release/v592/nebula-${profile}-visual-acquisition-v592.json`);
const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  writeFileSync(partial, bytes);
  rmSync(path, { force: true });
  renameSync(partial, path);
}
function verifyExisting() {
  if (!existsSync(receiptPath)) return null;
  const document = JSON.parse(readFileSync(receiptPath, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), "v592-nebula-extended-visual-existing-seal");
  for (const asset of document.assets ?? []) {
    const bytes = readFileSync(resolve(root, asset.outputPath));
    assert(bytes.byteLength === asset.bytes && sha256(bytes) === asset.sha256, `v592-nebula-extended-visual-existing-drift:${asset.target}`);
  }
  return document;
}
function fetchOnce(url, target) {
  return fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": `Orbit-Atlas-v592-${target}-presentation-source/1.0`, accept: "image/jpeg,image/png" },
    signal: AbortSignal.timeout(120_000),
  });
}

assert(metadata.status === `${profile === "extended" ? "twelve" : profile === "final" ? "7" : profile === "closure" ? "3" : "4"}-item-metadata-acquired-no-visual-payload`, "v592-nebula-extended-visual-metadata-status");
const eligibleCandidates = metadata.targets.filter((target) => target.status === "metadata-candidate-clean-frame-review-required");
const candidates = profile === "closure2"
  ? eligibleCandidates.filter((target) => target.target === "tadpole-nebula")
  : eligibleCandidates;
assert(candidates.length === (profile === "extended" || profile === "final" ? 5 : 1), "v592-nebula-extended-visual-candidate-count");
const existing = verifyExisting();
if (existing) {
  console.log(JSON.stringify({ status: "verified-existing-no-request", assetCount: existing.assets.length, receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

const assets = [];
const failures = [];
for (const candidate of candidates) {
  const url = new URL(`https://images-assets.nasa.gov/image/${candidate.nasaId}/${candidate.nasaId}~orig.jpg`);
  assert(url.protocol === "https:" && url.hostname === "images-assets.nasa.gov" && !url.port && !url.hash, `v592-nebula-extended-visual-url:${candidate.target}`);
  const outputPath = `source-cache/v592/nebulae/visual-extended/${candidate.target}-${candidate.nasaId}-orig.jpg`;
  const output = resolve(root, outputPath);
  const partial = `${output}.part`;
  assert(!existsSync(output) && !existsSync(partial), `v592-nebula-extended-visual-unreceipted-output:${candidate.target}`);
  try {
    const response = await fetchOnce(url, candidate.target);
    assert(response.status === 200 && response.url === url.href, `v592-nebula-extended-visual-http:${candidate.target}:${response.status}:${response.url}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert(bytes.byteLength <= 128 * 1024 * 1024, `v592-nebula-extended-visual-size:${candidate.target}`);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(partial, bytes);
    const image = await sharp(partial, { limitInputPixels: false }).metadata();
    assert(["jpeg", "png"].includes(image.format), `v592-nebula-extended-visual-format:${candidate.target}:${image.format}`);
    assert(image.width === candidate.identity.width && image.height === candidate.identity.height, `v592-nebula-extended-visual-dimensions:${candidate.target}`);
    const analysis = await sharp(partial, { limitInputPixels: false }).resize({ width: 512, height: 512, fit: "inside" }).stats();
    const mean = analysis.channels.reduce((sum, channel) => sum + channel.mean, 0) / analysis.channels.length;
    const dark = analysis.channels[0]?.mean ?? 0;
    assert(Number.isFinite(mean) && mean > 2 && dark > 1, `v592-nebula-extended-visual-empty-frame:${candidate.target}`);
    rmSync(output, { force: true });
    renameSync(partial, output);
    assets.push({
      target: candidate.target,
      catalogName: candidate.catalogName,
      nasaId: candidate.nasaId,
      sourceUrl: url.href,
      finalUrl: url.href,
      host: url.hostname,
      requestCount: 1,
      automaticRetryPerformed: false,
      httpStatus: response.status,
      contentType: response.headers.get("content-type") ?? "unreported",
      bytes: bytes.byteLength,
      sha256: sha256(bytes),
      outputPath,
      width: image.width,
      height: image.height,
      format: image.format,
      colorSpace: image.space ?? "unreported",
      presentationOnly: true,
      scienceLoadsImagePayload: false,
      cleanFrameStatus: "single-frame-passed-basic-nonempty-check-requires-visual-signoff",
      visualAssetAdmitted: false,
    });
  } catch (error) {
    rmSync(partial, { force: true });
    failures.push({ target: candidate.target, nasaId: candidate.nasaId, requestCount: 1, error: error instanceof Error ? error.message : String(error) });
  }
}

const unsigned = {
  version: `v592-nebula-${profile}-visual-acquisition-v1`,
  generatedAt: new Date().toISOString(),
  status: failures.length === 0 && assets.length === candidates.length
    ? `${assets.length}-presentation-images-acquired-single-request-each`
    : "blocked-no-automatic-retry",
  policy: {
    presentationSourceCacheOnly: true,
    scientificPayloadDownloaded: false,
    scienceImagePayloadAllowed: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    redirectFollowed: false,
    visualAssetAdmissionGranted: false,
    derivedImpostorGenerationRequiresCleanFrameReview: true,
  },
  sourceMetadataReceiptSha256: metadata.receiptSha256,
  requestCount: candidates.length,
  requestCountPerUrl: 1,
  assets,
  failures,
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(receiptPath, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8"));
console.log(JSON.stringify({ status: receipt.status, assets: assets.map((asset) => ({ target: asset.target, bytes: asset.bytes, dimensions: `${asset.width}x${asset.height}`, sha256: asset.sha256 })), failures, receiptSha256: receipt.receiptSha256 }, null, 2));
if (failures.length > 0) process.exitCode = 1;
