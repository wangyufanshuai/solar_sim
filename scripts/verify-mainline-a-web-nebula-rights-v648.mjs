import { createHash } from "node:crypto";
import { readFile, realpath, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import canonicalCoverage from "../app/data/mainlineACanonicalCoverageV622.generated.json" with { type: "json" };
import * as assetsModule from "../app/data/mainlineANebulaVisualAssetsV607.all.generated.ts";
import * as metadataModule from "../app/data/mainlineAMetadataV607.ts";
import * as coverageModule from "../app/data/mainlineAAssetCoverageV607.ts";
import * as previewsModule from "../app/lib/mainlineAWebNebulaPreviewV648.ts";

const { MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL } = assetsModule.default ?? assetsModule;
const { MAINLINE_A3_NEBULAE } = metadataModule.default ?? metadataModule;
const { MAINLINE_A3_ASSET_COVERAGE_SUMMARY } = coverageModule.default ?? coverageModule;
const { MAINLINE_A_WEB_NEBULA_PREVIEWS_V648 } = previewsModule.default ?? previewsModule;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CREDITS = "public/textures/mainline-a/CREDITS.md";
const SCHEMA = "mainline-a-web-nebula-rights-verification-v648";
const SHA256 = /^[a-f0-9]{64}$/;
const LOCAL_JPEG = /^public\/textures\/mainline-a\/[a-z0-9-]+\.jpg$/;
const signedText = "individual human rights signoff is pending for all twelve";
const sha = (input) => createHash("sha256").update(input).digest("hex");
const canonical = (value) => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]))
    : value;
export const canonicalSha256V648 = (value) => sha(JSON.stringify(canonical(value)));

function canonicalRowPayload(row) {
  return {
    id: String(row.id), kind: String(row.kind), displayName: String(row.displayName),
    route: { assetId: row.route?.assetId ?? null, assetPath: row.route?.assetPath ?? null,
      assetHash: row.route?.assetHash ?? null, route: String(row.route?.route ?? "") },
    source: { sourceId: String(row.source?.sourceId ?? ""),
      sourceUrl: String(row.source?.sourceUrl ?? ""), license: String(row.source?.license ?? ""),
      credit: row.source?.credit ?? null },
    lifecycle: String(row.lifecycle), status: String(row.status), signoff: String(row.signoff),
    pendingReasons: [...(row.pendingReasons ?? [])].sort(),
    candidateOnly: row.candidateOnly === true, runtimeAdmission: row.runtimeAdmission,
    measurementAdmission: row.measurementAdmission,
    scientificPayloadWriteback: row.scientificPayloadWriteback === false,
  };
}

function oneSourceHash(asset) {
  return canonicalSha256V648({
    sourceId: asset.imageId, sourceUrl: asset.sourcePage,
    retrievedAt: asset.retrievedAt.slice(0, 10), license: asset.license, credit: asset.credit,
  });
}

function validSourceUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.hash;
  } catch { return false; }
}

function uniqueCount(rows, key) {
  return new Set(rows.map((row) => row?.[key])).size === rows.length;
}

export function inspectWebNebulaRightsInputsV648({
  pack, assets, previews, metadata, coverage, creditsText,
}) {
  const issues = [];
  const add = (issue) => issues.push(issue);
  if (pack?.schema !== "mainline-a-canonical-coverage-v622"
    || !Array.isArray(pack.records) || pack.records.length !== 36
    || pack.counts?.stars !== 12 || pack.counts?.nebulae !== 12
    || pack.counts?.constellations !== 12 || pack.counts?.total !== 36) add("canonical-coverage-invalid");
  if (!SHA256.test(pack?.manifestDigest ?? "")
    || (Array.isArray(pack?.records) && canonicalSha256V648(pack.records) !== pack.manifestDigest)) {
    add("canonical-manifest-digest-invalid");
  }
  if (pack?.boundary?.candidateOnly !== true || pack?.boundary?.hold !== true
    || pack?.boundary?.notAdmitted !== true || pack?.boundary?.scientificPayloadWriteback !== false
    || pack?.boundary?.runtimeWrites !== false || pack?.boundary?.measurementWrites !== false) {
    add("canonical-boundary-invalid");
  }
  if (!Array.isArray(assets) || assets.length !== 12 || !uniqueCount(assets, "objectId")) add("asset-set-invalid");
  if (!Array.isArray(metadata) || metadata.length !== 12 || !uniqueCount(metadata, "id")) add("runtime-set-invalid");
  if (!Array.isArray(previews?.rows) || previews.rows.length !== 12
    || previews.valid !== true || previews.canonicalManifestDigest !== pack?.manifestDigest
    || !uniqueCount(previews.rows, "id")) add("preview-book-invalid");
  if (coverage?.total !== 12 || coverage.licensed !== 0
    || coverage.manifestCandidates !== 12 || coverage.catalogMarkers !== 0
    || coverage.localPreviewAvailable !== 12 || coverage.humanRightsSigned !== 0) {
    add("runtime-coverage-invalid");
  }
  if (typeof creditsText !== "string" || !creditsText.includes(signedText)
    || creditsText.includes("are reused unchanged under")) add("credits-signoff-disclosure-invalid");
  const creditLines = typeof creditsText === "string"
    ? creditsText.split(/\r?\n/).filter((line) => line.startsWith("- [")) : [];
  if (creditLines.length !== 12 || new Set(creditLines).size !== 12) add("credits-inventory-invalid");
  const canonicalRows = Array.isArray(pack?.records) ? pack.records.filter((row) => row.kind === "nebula") : [];
  if (canonicalRows.length !== 12 || !uniqueCount(canonicalRows, "id")) add("canonical-nebula-set-invalid");

  const rows = canonicalRows.map((row) => {
    const rowIssues = [];
    const asset = Array.isArray(assets) ? assets.find((item) => item.objectId === row.id) : null;
    const preview = Array.isArray(previews?.rows) ? previews.rows.find((item) => item.id === row.id) : null;
    const runtime = Array.isArray(metadata) ? metadata.find((item) => item.id === row.id) : null;
    if (!SHA256.test(row.rowHash ?? "") || canonicalSha256V648(canonicalRowPayload(row)) !== row.rowHash) {
      rowIssues.push("canonical-row-hash-invalid");
    }
    if (!asset) rowIssues.push("asset-missing");
    if (!preview) rowIssues.push("preview-missing");
    if (!runtime) rowIssues.push("runtime-row-missing");
    if (row.status !== "rights-pending" || !row.pendingReasons?.includes("rights-pending")
      || row.candidateOnly !== true || row.runtimeAdmission !== "candidate-only"
      || row.measurementAdmission !== "not-admitted" || row.scientificPayloadWriteback !== false) {
      rowIssues.push("canonical-admission-invalid");
    }
    if (!validSourceUrl(row.source?.sourceUrl) || !row.source?.credit
      || row.signoff !== "not-applicable" || !SHA256.test(row.sourceHash ?? "")) {
      rowIssues.push("canonical-source-invalid");
    }
    if (asset) {
      if (!LOCAL_JPEG.test(asset.localPath) || asset.src !== `/${asset.localPath.slice(7)}`
        || !SHA256.test(asset.sha256 ?? "") || !Number.isSafeInteger(asset.byteSize)
        || asset.byteSize < 1 || asset.byteSize > 8 * 1024 * 1024
        || !Number.isSafeInteger(asset.dimensions?.width) || !Number.isSafeInteger(asset.dimensions?.height)
        || asset.dimensions.width < 1 || asset.dimensions.height < 1
        || asset.dimensions.width > 2048 || asset.dimensions.height > 2048) {
        rowIssues.push("local-asset-record-invalid");
      }
      if (row.route?.assetId !== asset.objectId || row.route?.assetPath !== asset.localPath
        || row.route?.assetHash !== asset.sha256 || row.route?.route !== "mainline-a3-nebula-visual") {
        rowIssues.push("canonical-route-mismatch");
      }
      if (row.source?.sourceId !== asset.imageId || row.source?.sourceUrl !== asset.sourcePage
        || row.source?.license !== asset.license || row.source?.credit !== asset.credit
        || row.sourceHash !== oneSourceHash(asset)) rowIssues.push("canonical-source-mismatch");
      if (!creditLines.includes(`- [${asset.imageId}](${asset.sourcePage}) — ${asset.credit}`)) {
        rowIssues.push("credit-entry-missing");
      }
    }
    if (preview && (preview.available !== true || preview.displayAdmission !== "candidate-preview"
      || preview.humanRightsSignoff !== "pending" || preview.releaseAdmission !== "candidate-only"
      || preview.scientificPayloadWriteback !== false || preview.issues?.length !== 0
      || preview.localPath !== asset?.src || preview.localSha256 !== asset?.sha256
      || preview.imageId !== asset?.imageId || preview.sourcePage !== asset?.sourcePage
      || preview.sourceLicenseLabel !== asset?.license || preview.sourceCredit !== asset?.credit
      || preview.canonicalRowHash !== row.rowHash)) rowIssues.push("preview-admission-invalid");
    if (runtime && (runtime.presentation?.assetStatus !== "manifest-candidate"
      || runtime.presentation?.rightsStatus !== "pending-human-signoff"
      || runtime.presentation?.visualMode !== "texture"
      || runtime.presentation?.assetId !== asset?.imageId
      || runtime.provenance?.[0]?.sourceId !== asset?.imageId
      || runtime.provenance?.[0]?.sourceUrl !== asset?.sourcePage
      || runtime.provenance?.[0]?.license !== asset?.license
      || runtime.provenance?.[0]?.credit !== asset?.credit)) {
      rowIssues.push("runtime-rights-state-invalid");
    }
    for (const issue of rowIssues) add(`${row.id}:${issue}`);
    return Object.freeze({
      id: row.id, imageId: asset?.imageId ?? null, localPath: asset?.localPath ?? null,
      expectedBytes: asset?.byteSize ?? null, expectedSha256: asset?.sha256 ?? null,
      canonicalRowHash: row.rowHash, sourceHash: row.sourceHash,
      legacySourceRightsLabel: asset?.rightsStatus ?? null,
      localByteMatch: null, humanRightsSignoff: "pending", releaseAdmission: "candidate-only",
      scientificPayloadWriteback: false, issues: Object.freeze(rowIssues),
    });
  });
  const counts = Object.freeze({
    canonicalTotal: pack?.records?.length ?? 0,
    nebulae: rows.length,
    previewAvailable: rows.filter((row) => row.issues.length === 0).length,
    currentRuntimeLicensed: Array.isArray(metadata)
      ? metadata.filter((row) => row.presentation?.assetStatus === "licensed").length : 0,
    humanRightsSigned: 0, releaseAdmitted: 0,
    legacySourceClearedLabels: rows.filter((row) => row.legacySourceRightsLabel === "cleared").length,
  });
  return Object.freeze({ schema: SCHEMA, status: issues.length ? "failed" : "static-passed-local-candidate-rights-pending",
    canonicalManifestDigest: pack?.manifestDigest ?? null, rows: Object.freeze(rows),
    counts, creditsEntries: creditLines.length, issues: Object.freeze(issues) });
}

async function verifiedLocalBytes(row, root, readLocal = readFile) {
  const relative = row.localPath;
  if (!LOCAL_JPEG.test(relative ?? "")) return { status: "path-invalid", bytes: 0, sha256: null };
  const resolvedRoot = path.resolve(root);
  const absolute = path.resolve(resolvedRoot, relative);
  if (!absolute.startsWith(`${resolvedRoot}${path.sep}`)) return { status: "path-escape", bytes: 0, sha256: null };
  if (readLocal === readFile && await realpath(absolute) !== absolute) {
    return { status: "path-alias-or-symlink", bytes: 0, sha256: null };
  }
  if (readLocal === readFile && !(await stat(absolute)).isFile()) {
    return { status: "not-regular-file", bytes: 0, sha256: null };
  }
  const bytes = await readLocal(absolute);
  const actualSha256 = sha(bytes);
  const isJpeg = bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8
    && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
  return Object.freeze({
    status: bytes.length === row.expectedBytes && actualSha256 === row.expectedSha256 && isJpeg
      ? "matched" : "byte-or-hash-mismatch",
    bytes: bytes.length, sha256: actualSha256, jpegEnvelope: isJpeg,
  });
}

export async function auditWebNebulaRightsV648(options = {}) {
  const root = options.root ?? ROOT;
  const creditsText = options.creditsText ?? await readFile(path.join(root, CREDITS), "utf8");
  const staticAudit = inspectWebNebulaRightsInputsV648({
    pack: options.pack ?? canonicalCoverage,
    assets: options.assets ?? MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL,
    previews: options.previews ?? MAINLINE_A_WEB_NEBULA_PREVIEWS_V648,
    metadata: options.metadata ?? MAINLINE_A3_NEBULAE,
    coverage: options.coverage ?? MAINLINE_A3_ASSET_COVERAGE_SUMMARY,
    creditsText,
  });
  const rows = [];
  for (const row of staticAudit.rows) {
    let local;
    try { local = await verifiedLocalBytes(row, root, options.readLocal ?? readFile); }
    catch (error) { local = { status: "local-read-error", bytes: 0, sha256: null, error: String(error?.code ?? error?.message ?? error) }; }
    rows.push(Object.freeze({ ...row, localByteMatch: local.status === "matched", local }));
  }
  const source = options.source ?? await captureBuildInputs();
  const issues = [...staticAudit.issues];
  if (!SHA256.test(source?.sha256 ?? "")) issues.push("current-source-sha256-invalid");
  for (const row of rows) if (!row.localByteMatch) issues.push(`${row.id}:local-${row.local.status}`);
  const report = Object.freeze({
    ...staticAudit, generatedAt: new Date().toISOString(),
    status: issues.length ? "failed" : "passed-local-candidate-rights-pending",
    sourceSha256: source?.sha256 ?? null,
    evidenceClass: options.readLocal || options.source || options.pack || options.assets
      || options.previews || options.metadata || options.coverage || options.creditsText
      ? "injected-test-input" : "local-static-byte-verification",
    rows: Object.freeze(rows), issues: Object.freeze(issues),
    boundary: Object.freeze({ candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, publicWebRelease: "blocked" }),
    claims: Object.freeze({ copyrightApproval: false, scientificValidity: false,
      productionPerformance: false, realUserValidation: false, releaseApproved: false }),
  });
  return report;
}

export async function replayWebNebulaRightsV648(saved, options = {}) {
  if (saved?.schema !== SCHEMA || saved?.status !== "passed-local-candidate-rights-pending"
    || saved.evidenceClass !== "local-static-byte-verification") {
    throw new Error("web-nebula-v648:saved-report-not-current-local-evidence");
  }
  const current = await auditWebNebulaRightsV648(options);
  if (current.status !== "passed-local-candidate-rights-pending"
    || current.evidenceClass !== "local-static-byte-verification"
    || saved.sourceSha256 !== current.sourceSha256
    || saved.canonicalManifestDigest !== current.canonicalManifestDigest
    || JSON.stringify(saved.rows) !== JSON.stringify(current.rows)
    || JSON.stringify(saved.counts) !== JSON.stringify(current.counts)
    || JSON.stringify(saved.boundary) !== JSON.stringify(current.boundary)
    || JSON.stringify(saved.claims) !== JSON.stringify(current.claims)) {
    throw new Error("web-nebula-v648:replay-mismatch");
  }
  return Object.freeze({ schema: "mainline-a-web-nebula-rights-replay-v648",
    status: "verified-local-candidate-rights-pending", sourceSha256: current.sourceSha256,
    canonicalManifestDigest: current.canonicalManifestDigest,
    matchedImages: current.rows.filter((row) => row.localByteMatch).length,
    humanRightsSigned: 0, publicWebRelease: "blocked", scientificPayloadWriteback: false });
}

function cliValue(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? null : process.argv[index + 1] ?? null;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const replayPath = cliValue("--replay");
  if (replayPath) {
    const saved = JSON.parse(await readFile(path.resolve(ROOT, replayPath), "utf8"));
    console.log(JSON.stringify(await replayWebNebulaRightsV648(saved), null, 2));
  } else {
    const report = await auditWebNebulaRightsV648();
    const output = cliValue("--output");
    if (output) {
      const absolute = path.resolve(ROOT, output);
      const allowed = path.resolve(ROOT, "docs/release/v607");
      if (!absolute.startsWith(`${allowed}${path.sep}`)) throw new Error("web-nebula-v648:output-outside-release-directory");
      await writeFile(absolute, `${JSON.stringify(report, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    }
    console.log(JSON.stringify({ status: report.status, counts: report.counts,
      issues: report.issues, sourceSha256: report.sourceSha256, output }, null, 2));
    if (report.status !== "passed-local-candidate-rights-pending") process.exitCode = 1;
  }
}
