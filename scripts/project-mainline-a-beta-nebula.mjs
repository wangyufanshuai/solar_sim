import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MANIFEST_PATHS = [
  "public/data/living-universe-v592/nebula-visual-assets.json",
  "public/data/living-universe-v592/nebula-extended-visual-assets.json",
  "public/data/living-universe-v592/nebula-closure-visual-assets.json",
];
export const OUTPUT_PATH = "app/data/mainlineABetaNebulaProjectionV609.generated.ts";
export const CC_BY_4_LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const fail = (message) => { throw new Error(`mainline-a-beta-nebula:${message}`); };
const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;
const HEX_SHA256 = /^[a-f0-9]{64}$/i;

/** Keep manifest paths inside the checkout before any local bytes are read. */
export function resolveNebulaLocalPath(root, localPath) {
  if (!nonEmpty(localPath)) fail("local-path-empty");
  if (path.isAbsolute(localPath) || /^[a-zA-Z]:[\\/]/.test(localPath)) fail(`local-path-absolute:${localPath}`);
  const normalized = path.normalize(localPath);
  const comparable = localPath.replace(/[\\/]+/g, path.sep);
  if (normalized !== comparable || normalized.split(/[\\/]+/).includes("..")) fail(`local-path-unsafe:${localPath}`);
  const absoluteRoot = path.resolve(root);
  const absolute = path.resolve(absoluteRoot, normalized);
  const relative = path.relative(absoluteRoot, absolute);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) fail(`local-path-outside-root:${localPath}`);
  return absolute;
}

function jpegDimensions(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) return null;
    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) return null;
    const isFrame = (marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7)
      || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf);
    if (isFrame && segmentLength >= 7) return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3), format: "jpeg" };
    offset += segmentLength;
  }
  return null;
}

function pngDimensions(bytes) {
  if (bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" || bytes.toString("ascii", 12, 16) !== "IHDR") return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), format: "png" };
}

export function readNebulaImageDimensions(bytes) { return jpegDimensions(bytes) ?? pngDimensions(bytes); }

/** Compare declared projection metadata with the actual local evidence file. */
export function inspectNebulaLocalEvidence(root, row) {
  const expected = row?.source ?? {};
  let absolutePath;
  try { absolutePath = resolveNebulaLocalPath(root, expected.localPath); }
  catch (error) { return { status: "invalid-path", path: expected.localPath ?? null, error: error instanceof Error ? error.message : String(error) }; }
  if (!existsSync(absolutePath)) return { status: "missing", path: expected.localPath, absolutePath };
  const bytes = readFileSync(absolutePath);
  const actualSha256 = sha256(bytes);
  const dimensions = readNebulaImageDimensions(bytes);
  const sizeMatch = bytes.length === expected.bytes;
  const digestMatch = HEX_SHA256.test(expected.sha256 ?? "") && actualSha256 === expected.sha256.toLowerCase();
  const dimensionsMatch = Boolean(dimensions && dimensions.width === expected.width && dimensions.height === expected.height);
  const status = sizeMatch && digestMatch && dimensionsMatch ? "verified" : "mismatch";
  return { status, path: expected.localPath, absolutePath, actualBytes: bytes.length, expectedBytes: expected.bytes, actualSha256, expectedSha256: expected.sha256, dimensions, expectedDimensions: { width: expected.width, height: expected.height }, checks: { sizeMatch, digestMatch, dimensionsMatch }, fileSize: statSync(absolutePath).size };
}

export function verifyNebulaLocalEvidence(root, rows) {
  const results = rows.map((row) => ({ id: row.id, ...inspectNebulaLocalEvidence(root, row) }));
  const failures = results.filter((result) => result.status !== "verified");
  return Object.freeze({ checked: results.length, verified: results.length - failures.length, failed: failures.length, results: Object.freeze(results), failures: Object.freeze(failures) });
}

export function assertNebulaLocalEvidence(root, rows) {
  const report = verifyNebulaLocalEvidence(root, rows);
  if (report.failed) fail(`local-evidence-failed:${report.failures.map((entry) => `${entry.id}:${entry.status}`).join(",")}`);
  return report;
}

function readManifest(root, relativePath) {
  const absolute = path.join(root, relativePath);
  if (!existsSync(absolute)) fail(`manifest-missing:${relativePath}`);
  const bytes = readFileSync(absolute);
  const value = JSON.parse(bytes.toString("utf8"));
  if (!Array.isArray(value.assets)) fail(`assets-array-required:${relativePath}`);
  return { relativePath, sha256: sha256(bytes), value };
}

function sourceOf(asset, manifestPath) {
  const source = asset.source ?? {};
  const url = source.url ?? asset.sourceUrl ?? asset.finalUrl;
  const localPath = source.path ?? asset.outputPath;
  const bytes = source.bytes ?? asset.bytes;
  const digest = source.sha256 ?? asset.sha256;
  const width = source.width ?? asset.width;
  const height = source.height ?? asset.height;
  const license = source.license ?? asset.license;
  const licenseUrl = source.licenseUrl ?? asset.licenseUrl;
  const credit = source.credit ?? asset.credit;
  const receiptRefs = Object.fromEntries(Object.entries(source)
    .filter(([key, value]) => key.endsWith("ReceiptSha256") && typeof value === "string" && HEX_SHA256.test(value)));
  if (!nonEmpty(asset.target)) fail(`target-required:${manifestPath}`);
  if (!nonEmpty(asset.nasaId)) fail(`nasa-id-required:${asset.target}`);
  if (!/^https:\/\//.test(url ?? "")) fail(`https-source-required:${asset.target}`);
  if (!nonEmpty(localPath)) fail(`local-path-required:${asset.target}`);
  if (!Number.isInteger(bytes) || bytes <= 0) fail(`positive-bytes-required:${asset.target}`);
  if (!/^[a-f0-9]{64}$/.test(digest ?? "")) fail(`sha256-required:${asset.target}`);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 256 || height < 256) fail(`dimensions-required:${asset.target}`);
  if (!nonEmpty(license) || !nonEmpty(licenseUrl) || !nonEmpty(credit)) fail(`license-credit-required:${asset.target}`);
  return { url, localPath, bytes, sha256: digest, width, height, license, licenseUrl, credit, receiptRefs };
}

export function projectNebulaManifests(root, { requireLocal = false } = {}) {
  const manifests = MANIFEST_PATHS.map((relativePath) => readManifest(root, relativePath));
  const seen = new Set();
  const rows = manifests.flatMap(({ relativePath, sha256: manifestSha256, value }) => value.assets.map((asset) => {
    const id = String(asset.target);
    if (seen.has(id)) fail(`duplicate-target:${id}`);
    seen.add(id);
    const source = sourceOf(asset, relativePath);
    const absoluteSourcePath = resolveNebulaLocalPath(root, source.localPath);
    if (requireLocal && !existsSync(absoluteSourcePath)) fail(`local-payload-missing:${id}`);
    const policy = value.policy ?? {};
    const admission = value.admission ?? {};
    const licenseUrl = asset.source?.licenseUrl ?? asset.licenseUrl ?? "";
    const rightsStatus = asset.rightsStatus ?? asset.source?.rightsStatus;
    const itemLevelCcBy = rightsStatus === "cleared"
      && source.license === "CC BY 4.0"
      && licenseUrl.replace(/\/$/, "") === CC_BY_4_LICENSE_URL.replace(/\/$/, "");
    return {
      id, target: id, catalogName: asset.catalogName, nasaId: asset.nasaId, source,
      manifestPath: relativePath, manifestSha256,
      // A label containing “CC BY” is not a grant.  Require an explicit
      // item-level decision plus the canonical license URL before clearing.
      rightsStatus: itemLevelCcBy ? "cleared" : "review",
      visualAssetAdmitted: admission.admittedTargets?.includes(id) === true && policy.visualSignoffGranted === true,
      presentationOnly: policy.presentationOnly !== false,
      scienceImagePayloadAllowed: policy.scienceImagePayloadAllowed === true,
    };
  }));
  if (rows.length !== 18) fail(`expected-eighteen-assets:${rows.length}`);
  const projected = Object.freeze(rows);
  if (requireLocal) assertNebulaLocalEvidence(root, projected);
  return projected;
}

export function renderNebulaProjection(rows) {
  if (!Array.isArray(rows) || rows.length !== 18) fail("projection-count");
  const ids = new Set();
  for (const row of rows) {
    if (!row || !nonEmpty(row.id) || ids.has(row.id)) fail(`projection-id:${row?.id}`);
    ids.add(row.id);
    if (row.source?.localPath) resolveNebulaLocalPath(process.cwd(), row.source.localPath);
    if (row.visualAssetAdmitted || row.scienceImagePayloadAllowed) fail(`unsafe-admission:${row.id}`);
  }
  return `// Generated by scripts/project-mainline-a-beta-nebula.mjs. Do not edit.\nexport const MAINLINE_A_BETA_NEBULA_PROJECTION_V609 = Object.freeze(${json(rows)});\n`;
}

export function run({ root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), check = false, requireLocal = false } = {}) {
  const rows = projectNebulaManifests(root, { requireLocal });
  const output = path.join(root, OUTPUT_PATH);
  const rendered = renderNebulaProjection(rows);
  if (check) {
    if (!existsSync(output) || readFileSync(output, "utf8") !== rendered) fail("projection-stale");
  } else {
    mkdirSync(path.dirname(output), { recursive: true });
    writeFileSync(output, rendered);
  }
  return { status: "verified", assetCount: rows.length, candidateCount: rows.filter((row) => row.rightsStatus === "review").length, output: OUTPUT_PATH, manifestSha256: rows.map((row) => row.manifestSha256) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(run({ check: process.argv.includes("--check"), requireLocal: process.argv.includes("--require-local") }), null, 2)); }
  catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
}
