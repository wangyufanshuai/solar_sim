import { createHash } from "node:crypto";
import { readFile, realpath, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import canonicalCoverage from "../app/data/mainlineACanonicalCoverageV622.generated.json" with { type: "json" };
import assetExports from "../app/data/mainlineANebulaVisualAssetsV607.all.generated.ts";
import rightsExports from "../app/lib/mainlineAWebRightsTruthV647.ts";
import policyExports from "../app/lib/mainlineAWebDeliveryPolicyV647.ts";
import coverageBuildExports from "./build-mainline-a-canonical-coverage-v622.ts";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { verifyWebRightsObservationV647 } from "./collect-mainline-a-web-browser-v647.mjs";
import { replayWebFrameSampleV647 } from "./verify-mainline-a-web-performance-v647.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL } = assetExports;
const { buildWebNebulaRightsBookV647 } = rightsExports;
const { evaluateWebDeliveryV647 } = policyExports;
const { normalizeCanonicalRow } = coverageBuildExports;
const SCHEMA = "mainline-a-web-delivery-audit-v647";
const SHA256 = /^[a-f0-9]{64}$/;
const MAX_EVIDENCE_BYTES = 8 * 1024 * 1024;
const EVIDENCE_ROLES = Object.freeze(["build", "http", "browser", "visual", "performance", "externalSource"]);

function fail(message) { throw new Error(`web-v647:${message}`); }
function hash(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function stableJson(value) { return `${JSON.stringify(value, null, 2)}\n`; }
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function digest(value) { return hash(Buffer.from(JSON.stringify(canonical(value)))); }

export function verifyCanonicalDigestsV647(pack) {
  if (pack?.schema !== "mainline-a-canonical-coverage-v622" || !Array.isArray(pack.records)
    || pack.records.length !== 36) fail("canonical-pack-invalid");
  for (const row of pack.records) {
    if (!SHA256.test(row.rowHash ?? "") || digest(normalizeCanonicalRow(row)) !== row.rowHash) {
      fail(`canonical-row-digest-mismatch:${row.id}`);
    }
  }
  if (digest(pack.records) !== pack.manifestDigest) fail("canonical-manifest-digest-mismatch");
  return pack.manifestDigest;
}

export function safeWebAuditPath(relative) {
  if (typeof relative !== "string" || !relative || path.isAbsolute(relative)
    || relative.includes("\\") || relative.includes("..") || relative.startsWith("/")
    || /(?:^|\/)(?:fixture|mock|synthetic|placeholder)(?:\/|\.|-)/i.test(relative)) {
    fail(`path-invalid:${relative}`);
  }
  const resolved = path.resolve(ROOT, relative);
  if (!resolved.startsWith(`${ROOT}${path.sep}`)) fail(`path-escape:${relative}`);
  return resolved;
}

async function pinnedFile(relative, expectedHash = null, maxBytes = MAX_EVIDENCE_BYTES) {
  const absolute = safeWebAuditPath(relative);
  const canonical = await realpath(absolute);
  if (canonical !== absolute) fail(`symlink-or-case-alias:${relative}`);
  const metadata = await stat(canonical);
  if (!metadata.isFile() || metadata.size < 1 || metadata.size > maxBytes) fail(`size-invalid:${relative}`);
  const bytes = await readFile(canonical);
  const sha256 = hash(bytes);
  if (expectedHash !== null && (!SHA256.test(expectedHash) || expectedHash !== sha256)) {
    fail(`hash-mismatch:${relative}`);
  }
  return { relative, bytes, sha256, size: bytes.length };
}

export async function verifyWebPreviewAssetsV647(book) {
  const inspected = [];
  for (const row of book.rows) {
    if (!row.localPreviewAvailable || !row.localPreviewPath || !row.localPreviewSha256) {
      fail(`preview-unavailable:${row.id}`);
    }
    const relative = `public${row.localPreviewPath}`;
    if (!/^public\/textures\/mainline-a\/[a-z0-9_-]+\.(?:jpg|jpeg|png|webp|avif)$/i.test(relative)) {
      fail(`preview-path-invalid:${row.id}`);
    }
    const file = await pinnedFile(relative, row.localPreviewSha256, 32 * 1024 * 1024);
    inspected.push(Object.freeze({ id: row.id, path: relative, bytes: file.size, sha256: file.sha256,
      canonicalRowHash: row.canonicalRowHash, sourceHash: row.sourceHash,
      sourceLicenseLabel: row.sourceLicenseLabel, rightsState: row.rightsState,
      humanRightsSignoff: row.humanRightsSignoff, releaseAdmission: row.releaseAdmission }));
  }
  if (inspected.length !== 12 || new Set(inspected.map((item) => item.id)).size !== 12) {
    fail("preview-coverage-invalid");
  }
  return Object.freeze(inspected);
}

function parsedJson(file) {
  try { return JSON.parse(file.bytes.toString("utf8")); }
  catch { fail(`json-invalid:${file.relative}`); }
}

function assertNoPromotion(value, role) {
  if (value?.boundary?.scientificPayloadWriteback === true || value?.claims?.legalClearance === true
    || value?.claims?.scientificValidity === true || value?.releaseApproved === true) {
    fail(`claim-promotion:${role}`);
  }
}

export function classifyWebEvidenceV647(role, record, sourceSha256) {
  if (!EVIDENCE_ROLES.includes(role)) fail(`role-invalid:${role}`);
  assertNoPromotion(record, role);
  if (role === "build") {
    if (record?.status !== "passed" || record.exitCode !== 0 || record.sourceStable !== true
      || record.inputAfterSha256 !== record.inputBefore?.sha256) fail("build-not-stable");
    return record.inputAfterSha256 === sourceSha256 ? "verified-current" : "historical";
  }
  if (role === "http") {
    if (record?.status !== "passed" || record.pageStatus !== 200 || record.healthStatus !== 200
      || record.allScriptAssetsOk !== true || record.scientificPayloadWriteback !== false) fail("http-not-passed");
    return record.runtimeBuildId === `mainline-a-${sourceSha256.slice(0, 16)}` ? "verified-current" : "historical";
  }
  if (role === "browser") {
    const currentSchema = record?.schema === "mainline-a-web-browser-v647";
    const historicSchema = record?.schema === "mainline-a-browser-evidence-v645";
    if ((!currentSchema && !historicSchema)
      || (currentSchema ? record.status !== "observed-local-release-blocked" || record.technicalObservation !== "passed"
        : record.status !== "passed")
      || record.navigationSucceeded !== true
      || record.desktop?.status !== "passed" || record.mobileViewport?.status !== "passed"
      || record.desktop.dom?.markers?.scientificPayloadWriteback !== "false"
      || record.mobileViewport.dom?.markers?.scientificPayloadWriteback !== "false"
      || record.physicalMobile !== "not-run") fail("browser-not-passed");
    if (currentSchema) {
      for (const device of ["desktop", "mobileViewport"]) {
        const rights = record.webRights?.[device];
        if (rights?.webRelease !== "blocked-rights-pending" || rights?.signedRights !== 0
          || rights?.reviewPending !== 30 || rights?.licenseRecorded !== 12
          || rights?.selectedAdmission !== "candidate-only" || rights?.selectedRightsReview !== "pending"
          || rights?.clearedClaimVisible !== false || rights?.closeButtonNoWrap !== true) fail(`browser-rights-invalid:${device}`);
      }
    }
    const current = record.build?.runtimeBuildId === `mainline-a-${sourceSha256.slice(0, 16)}`;
    return current && currentSchema ? "verified-current" : "historical";
  }
  if (role === "visual") {
    if (record?.schema !== "mainline-a-web-visual-review-v647" || record.status !== "observed-local"
      || record.rightsDisclosure?.signedCount !== 0 || record.rightsDisclosure?.pendingCount !== 12
      || record.rightsDisclosure?.falseClearedLabelVisible !== false
      || record.responsive?.mobileCloseButtonWrapped !== false
      || record.responsive?.mobileViewportHorizontalOverflow !== false
      || record.claims?.realUserValidation !== false || record.claims?.copyrightApproval !== false) {
      fail("visual-not-observed");
    }
    return record.sourceSha256 === sourceSha256 ? "verified-current" : "historical";
  }
  if (role === "performance") {
    if (record?.schema !== "mainline-a-web-performance-v647" || record.status !== "measured-local"
      || record.measurements?.desktop?.sampleCount !== 120
      || record.measurements?.mobileViewport?.sampleCount !== 120
      || record.longRunStatus !== "historical-needs-rerun-for-current-source") fail("performance-not-measured");
    if (record?.claims?.productionPerformance === true || record?.productionPerformance === true) fail("performance-claim-promotion");
    return record.sourceSha256 === sourceSha256 ? "verified-current" : "historical";
  }
  if (role === "externalSource") {
    if (record?.schema !== "mainline-a-r66-evidence-supplement-v646"
      || record.status !== "blocked" || record.gates?.nebulaRightsSignoff !== "pending-0-of-12"
      || record.gates?.stellarComponentIdentity !== "pending-0-of-4") fail("external-source-boundary-invalid");
    return record.sourceSha256 === sourceSha256 ? "verified-current" : "historical";
  }
  fail(`role-unhandled:${role}`);
}

function evidenceClass(role) {
  if (role === "build") return "static";
  if (role === "http") return "HTTP";
  if (role === "browser") return "browser";
  if (role === "visual") return "visual";
  if (role === "performance") return "performance";
  return "external-source";
}

function evidenceDetail(role, state, record) {
  if (role === "build") return `preserved production build ${record.buildId}; ${state}`;
  if (role === "http") return `page ${record.pageStatus}; health ${record.healthStatus}; scripts ${record.allScriptAssetsOk}; ${state}`;
  if (role === "browser") return `desktop ${record.desktop.viewport.join("x")}; mobile viewport ${record.mobileViewport.viewport.join("x")}; ${state}`;
  if (role === "visual") return `local visual review; 0/12 rights signed; ${state}`;
  if (role === "performance") return `local performance observation; ${state}`;
  return `pinned external-source index; 0/4 physical components; ${state}`;
}

export async function loadWebEvidenceV647(role, descriptor, sourceSha256) {
  if (!descriptor) return Object.freeze({ evidenceClass: evidenceClass(role), state: "not-run", sourceSha256: null,
    artifact: null, artifactSha256: null, detail: `${role} not-run for current source` });
  if (typeof descriptor !== "object" || !SHA256.test(descriptor.sha256 ?? "")) fail(`descriptor-invalid:${role}`);
  const file = await pinnedFile(descriptor.path, descriptor.sha256);
  const record = parsedJson(file);
  const state = classifyWebEvidenceV647(role, record, sourceSha256);
  if (role === "browser" && record.schema === "mainline-a-web-browser-v647") {
    for (const device of ["desktop", "mobileViewport"]) {
      const entry = record[device];
      const raw = parsedJson(await pinnedFile(entry.rawCapture.path, entry.rawCapture.sha256));
      await pinnedFile(entry.screenshot.path, entry.screenshot.sha256);
      const replay = verifyWebRightsObservationV647(raw, device === "mobileViewport" ? "mobile-viewport" : device);
      if (JSON.stringify(replay) !== JSON.stringify(record.webRights[device])) fail(`browser-rights-replay-mismatch:${device}`);
    }
  }
  if (role === "performance") {
    const build = parsedJson(await pinnedFile(record.build.report.path, record.build.report.sha256));
    for (const device of ["desktop", "mobileViewport"]) {
      const reference = record.raw[device];
      const raw = parsedJson(await pinnedFile(reference.path, reference.sha256));
      const replay = replayWebFrameSampleV647(raw, build, device);
      if (JSON.stringify(replay) !== JSON.stringify(record.measurements[device])) {
        fail(`performance-replay-mismatch:${device}`);
      }
    }
  }
  if (role === "visual") {
    if (!Array.isArray(record.screenshots) || record.screenshots.length !== 2
      || record.screenshots[0]?.device !== "desktop" || record.screenshots[1]?.device !== "mobileViewport") {
      fail("visual-screenshot-set-invalid");
    }
    for (const screenshot of record.screenshots) {
      const pinned = await pinnedFile(screenshot.path, screenshot.sha256);
      if (pinned.size !== screenshot.bytes) fail(`visual-screenshot-size-mismatch:${screenshot.device}`);
    }
  }
  return Object.freeze({ evidenceClass: evidenceClass(role), state,
    sourceSha256: state === "verified-current" ? sourceSha256 : null,
    artifact: file.relative, artifactSha256: file.sha256,
    detail: evidenceDetail(role, state, record) });
}

function roleEvidence(bundle, role) {
  const key = role === "externalSource" ? "externalSource" : role;
  return bundle?.references?.[key] ?? null;
}

export async function auditMainlineAWebDeliveryV647(bundle = null) {
  if (process.cwd().toLowerCase() !== ROOT.toLowerCase()) fail("wrong-workspace");
  if (bundle && bundle.schema !== "mainline-a-web-evidence-input-v647") fail("input-schema-invalid");
  const source = await captureBuildInputs();
  verifyCanonicalDigestsV647(canonicalCoverage);
  const book = buildWebNebulaRightsBookV647(canonicalCoverage, MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL);
  if (!book.valid) fail(`canonical-preview-mismatch:${book.issues.join(",")}`);
  const localAssets = await verifyWebPreviewAssetsV647(book);
  const loaded = Object.fromEntries(await Promise.all(EVIDENCE_ROLES.map(async (role) =>
    [role, await loadWebEvidenceV647(role, roleEvidence(bundle, role), source.sha256)])));
  const decision = evaluateWebDeliveryV647({
    sourceSha256: source.sha256,
    canonicalCounts: canonicalCoverage.counts,
    rightsBook: book,
    heroComponentIdentitiesConfirmed: 0,
    heroComponentIdentitiesTarget: 4,
    productionBuild: loaded.build,
    http: loaded.http,
    desktopBrowser: loaded.browser,
    mobileViewportBrowser: loaded.browser,
    visual: loaded.visual,
    performance: loaded.performance,
    externalSource: loaded.externalSource,
  });
  const references = Object.fromEntries(EVIDENCE_ROLES.map((role) => [role, roleEvidence(bundle, role)]));
  return {
    schema: SCHEMA,
    status: "candidate-only-web-review-release-blocked",
    sourceSha256: source.sha256,
    canonicalManifestDigest: book.canonicalManifestDigest,
    rightsCounts: book.counts,
    previewAssets: localAssets,
    evidenceInput: bundle?.path ?? null,
    references,
    decision,
    claims: { releaseApproved: false, scientificValidity: false, copyrightApproval: false,
      productionPerformance: false, realUserValidation: false },
  };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!["--evidence", "--output", "--check", "--json"].includes(flag) || Object.hasOwn(options, flag)) fail(`option-invalid:${flag}`);
    if (flag === "--json") options[flag] = true;
    else options[flag] = argv[++index];
  }
  if (options["--check"] && options["--output"]) fail("check-and-output-conflict");
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const input = options["--evidence"] ? parsedJson(await pinnedFile(options["--evidence"])) : null;
  if (input) input.path = options["--evidence"];
  const report = await auditMainlineAWebDeliveryV647(input);
  if (options["--check"]) {
    const expected = parsedJson(await pinnedFile(options["--check"]));
    if (stableJson(expected) !== stableJson(report)) fail("receipt-replay-mismatch");
  }
  if (options["--output"]) {
    const destination = safeWebAuditPath(options["--output"]);
    await writeFile(destination, stableJson(report), { flag: "wx" });
  }
  console.log(options["--json"] ? stableJson(report) : `Web V647: ${report.decision.localTechnicalReview}; release ${report.decision.publicWebRelease}; source ${report.sourceSha256}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
