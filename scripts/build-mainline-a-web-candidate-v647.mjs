import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeFile, sha256, writeExclusiveJson } from "./mainline-a-release-evidence.mjs";
import longRunExports from "../app/lib/mainlineAR65LongRunV643.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = "mainline-a-web-candidate-package-v647";
const { verifyMainlineAR65LongRunReceiptV643, replayMainlineAR65LongRunReceiptV643 } = longRunExports;
const SOURCES = Object.freeze({
  build: ["docs/release/v607/mainline-a-r66-build-20261007-v647web02.json", "static"],
  webAudit: ["docs/release/v607/mainline-a-r66-web-delivery-audit-20261007-v647web02.json", "static"],
  assetHttp: ["docs/release/v607/mainline-a-r66-web-asset-http-20261007-v647web02-credits-pinned.json", "HTTP"],
  pageHttp: ["docs/release/v607/mainline-a-r66-http-20261007-v647web02.json", "HTTP"],
  browser: ["docs/release/v607/mainline-a-r66-web-browser-20261007-v647web02.json", "browser"],
  visual: ["docs/release/v607/mainline-a-r66-web-visual-20261007-v647web02.json", "visual"],
  shortPerformance: ["docs/release/v607/mainline-a-r66-web-performance-20261007-v647web02.json", "performance"],
  round: ["docs/release/v607/mainline-a-r66-web-v647-round-20261007.json", "static"],
  codeChange: ["docs/release/v607/mainline-a-r66-web-v647-code-change-20261007.json", "static"],
  assetSupplement: ["docs/release/v607/mainline-a-r66-web-asset-http-supplement-20261007-v647web02.json", "static"],
  source: ["docs/release/v607/mainline-a-r66-v646-evidence-supplement-20261007.json", "external-source"],
});

function fail(reason) { throw new Error(`web-candidate-v647:${reason}`); }
function sourcePath(relative) {
  if (typeof relative !== "string" || !/^docs\/release\/v607\/[a-z0-9-]+\.json$/i.test(relative)) {
    fail(`path-invalid:${relative}`);
  }
  return relative;
}

async function pinnedJson(relative, evidenceClass) {
  const file = await safeFile(ROOT, sourcePath(relative));
  if (file.stat.size < 1 || file.stat.size > 256 * 1024 * 1024) fail(`file-size-invalid:${relative}`);
  const raw = await readFile(file.absolute);
  let value;
  try { value = JSON.parse(raw.toString("utf8")); }
  catch { fail(`json-invalid:${relative}`); }
  return Object.freeze({ value, pin: Object.freeze({ path: file.relative, bytes: raw.length,
    sha256: sha256(raw), evidenceClass }) });
}

export async function verifyPreservedBuildArtifactsV647(build, pageHttp) {
  if (!/^\.next-mainline-a-r66-[a-z0-9-]+\/\.next$/i.test(build?.distDir ?? "")) {
    fail("preserved-build-directory-invalid");
  }
  const items = [{ path: `${build.distDir}/BUILD_ID`, expectedBytes: null,
    expectedSha256: null, role: "build-id" }];
  for (const row of pageHttp?.scriptAssets ?? []) {
    const relative = String(row.expectedPath ?? "").replaceAll("\\", "/");
    if (!relative.startsWith(`${build.distDir}/static/chunks/`) || !relative.endsWith(".js")) {
      fail("script-asset-path-invalid");
    }
    items.push({ path: relative, expectedBytes: row.expectedBytes,
      expectedSha256: row.expectedSha256, role: "http-script" });
  }
  if (items.length < 2 || new Set(items.map((row) => row.path)).size !== items.length) {
    fail("preserved-build-file-set-invalid");
  }
  const pins = [];
  for (const item of items) {
    const file = await safeFile(ROOT, item.path);
    const bytes = await readFile(file.absolute);
    const digest = sha256(bytes);
    if (item.role === "build-id") {
      if (bytes.toString("utf8").trim() !== build.buildId) fail("preserved-build-id-mismatch");
    } else if (bytes.length !== item.expectedBytes || digest !== item.expectedSha256) {
      fail(`preserved-script-mismatch:${item.path}`);
    }
    pins.push(Object.freeze({ role: item.role, path: file.relative,
      bytes: bytes.length, sha256: digest }));
  }
  return Object.freeze(pins);
}

export function validateWebCandidateInputsV647(values, currentSourceSha256) {
  const { build, webAudit, assetHttp, pageHttp, browser, visual, shortPerformance,
    round, codeChange, assetSupplement, source, longRun } = values;
  if (build?.status !== "passed" || build.exitCode !== 0 || build.sourceStable !== true
    || build.inputBefore?.sha256 !== currentSourceSha256
    || build.inputAfterSha256 !== currentSourceSha256 || !build.buildId
    || build.runtimeBuildId !== `mainline-a-${currentSourceSha256.slice(0, 16)}`) {
    fail("preserved-build-stale-or-invalid");
  }
  if (webAudit?.schema !== "mainline-a-web-delivery-audit-v647"
    || webAudit.sourceSha256 !== currentSourceSha256
    || webAudit.status !== "candidate-only-web-review-release-blocked"
    || webAudit.decision?.localTechnicalReview !== "verified"
    || webAudit.decision?.publicWebRelease !== "blocked"
    || webAudit.decision?.scientificPayloadWriteback !== false
    || webAudit.rightsCounts?.rightsPending !== 12
    || webAudit.rightsCounts?.rightsApproved !== 0) fail("web-audit-invalid");
  if (assetHttp?.schema !== "mainline-a-web-asset-http-v647"
    || assetHttp.status !== "passed-local-preview-release-blocked"
    || assetHttp.sourceSha256 !== currentSourceSha256
    || assetHttp.buildId !== build.buildId
    || assetHttp.canonicalManifestDigest !== webAudit.canonicalManifestDigest
    || assetHttp.counts?.matched !== 12 || assetHttp.counts?.rightsSigned !== 0
    || assetHttp.credits?.status !== "matched-local-credits"
    || assetHttp.credits?.creditEntries !== 12
    || assetHttp.claims?.publicWebReleaseApproved !== false) fail("asset-http-invalid");
  const previews = webAudit.previewAssets;
  if (!Array.isArray(previews) || previews.length !== 12
    || !Array.isArray(assetHttp.assets) || assetHttp.assets.length !== 12
    || new Set(assetHttp.assets.map((row) => row.id)).size !== 12) fail("asset-http-row-set-invalid");
  for (const expected of previews) {
    const observed = assetHttp.assets.find((row) => row.id === expected.id);
    if (!observed || observed.path !== expected.path
      || observed.status !== "matched-local-preview" || observed.httpStatus !== 200
      || observed.expectedSha256 !== expected.sha256 || observed.observedSha256 !== expected.sha256
      || observed.expectedBytes !== expected.bytes || observed.observedBytes !== expected.bytes
      || observed.canonicalRowHash !== expected.canonicalRowHash
      || observed.sourceHash !== expected.sourceHash
      || observed.finalUrl !== observed.requestedUrl || observed.redirected !== false
      || observed.rightsState !== "pending" || observed.humanRightsSignoff !== "pending"
      || observed.releaseAdmission !== "candidate-only") fail(`asset-http-row-invalid:${expected.id}`);
  }
  if (pageHttp?.status !== "passed" || pageHttp.buildId !== build.buildId
    || pageHttp.runtimeBuildId !== build.runtimeBuildId
    || pageHttp.pageStatus !== 200 || pageHttp.healthStatus !== 200
    || pageHttp.allScriptAssetsOk !== true || pageHttp.scientificPayloadWriteback !== false
    || !Array.isArray(pageHttp.scriptAssets) || !pageHttp.scriptAssets.length
    || pageHttp.scriptAssets.some((row) => row.status !== 200 || row.matchesBuild !== true)
    || pageHttp.url !== assetHttp.origin) fail("page-http-invalid");
  if (browser?.schema !== "mainline-a-web-browser-v647"
    || browser.status !== "observed-local-release-blocked"
    || browser.technicalObservation !== "passed"
    || browser.build?.buildId !== build.buildId
    || browser.build?.runtimeBuildId !== build.runtimeBuildId
    || browser.desktop?.status !== "passed" || browser.mobileViewport?.status !== "passed"
    || browser.physicalMobile !== "not-run"
    || [browser.webRights?.desktop, browser.webRights?.mobileViewport].some((rights) =>
      rights?.webRelease !== "blocked-rights-pending" || rights.signedRights !== 0
      || rights.selectedAdmission !== "candidate-only" || rights.selectedRightsReview !== "pending"
      || rights.clearedClaimVisible !== false)) fail("browser-invalid");
  if (visual?.schema !== "mainline-a-web-visual-review-v647"
    || visual.sourceSha256 !== currentSourceSha256 || visual.buildId !== build.buildId
    || visual.status !== "observed-local" || visual.rightsDisclosure?.signedCount !== 0
    || visual.rightsDisclosure?.pendingCount !== 12) fail("visual-invalid");
  if (shortPerformance?.schema !== "mainline-a-web-performance-v647"
    || shortPerformance.sourceSha256 !== currentSourceSha256
    || shortPerformance.status !== "measured-local"
    || shortPerformance.claims?.productionPerformance !== false) fail("short-performance-invalid");
  if (round?.schema !== "mainline-a-r66-web-round-v647" || round.sourceSha256 !== currentSourceSha256
    || round.buildId !== build.buildId || round.status?.publicWebRelease !== "blocked") fail("round-invalid");
  if (codeChange?.schema !== "mainline-a-r66-web-code-change-v647"
    || codeChange.sourceSha256 !== currentSourceSha256
    || codeChange.effectiveCode?.cumulativeR66LowerBound < 1000) fail("code-change-invalid");
  if (assetSupplement?.schema !== "mainline-a-r66-web-asset-http-supplement-v647"
    || assetSupplement.sourceSha256 !== currentSourceSha256
    || assetSupplement.gates?.publicWebRelease !== "blocked"
    || assetSupplement.evidence?.http?.sha256 !== sha256(Buffer.from(`${JSON.stringify(assetHttp, null, 2)}\n`))) {
    fail("asset-supplement-invalid");
  }
  if (source?.schema !== "mainline-a-r66-evidence-supplement-v646"
    || source.status !== "blocked" || source.sourceSha256 === currentSourceSha256
    || source.gates?.nebulaRightsSignoff !== "pending-0-of-12"
    || source.gates?.stellarComponentIdentity !== "pending-0-of-4"
    || source.claims?.releaseApproved !== false
    || source.claims?.copyrightApproval !== false
    || source.claims?.scientificValidity !== false) fail("external-source-boundary-invalid");
  const verification = verifyMainlineAR65LongRunReceiptV643(longRun);
  const replay = replayMainlineAR65LongRunReceiptV643(longRun);
  if (!verification.ok || verification.completeLongRuns !== 2
    || !verification.devices.includes("desktop") || !verification.devices.includes("mobile")
    || replay.status !== "verified" || longRun.build?.buildId !== build.runtimeBuildId
    || longRun.boundary?.scientificPayloadWriteback !== false
    || longRun.claims?.productionPerformance !== false
    || longRun.claims?.physicalMobile !== false) fail(`longrun-not-qualified:${verification.issues.join("|")}`);
  return Object.freeze({ sourceSha256: currentSourceSha256, buildId: build.buildId,
    runtimeBuildId: build.runtimeBuildId, longRunVerification: verification,
    longRunReplay: replay, rightsPending: 12, rightsSigned: 0,
    stellarComponentConfirmed: 0, physicalMobile: "not-run" });
}

export async function buildWebCandidatePackageV647(longRunPath) {
  const sourceNow = await captureBuildInputs();
  const loaded = {};
  const pins = [];
  for (const [role, [relative, evidenceClass]] of Object.entries(SOURCES)) {
    const item = await pinnedJson(relative, evidenceClass);
    loaded[role] = item.value;
    pins.push(Object.freeze({ role, ...item.pin }));
  }
  const longRun = await pinnedJson(longRunPath, "performance");
  loaded.longRun = longRun.value;
  pins.push(Object.freeze({ role: "longRun", ...longRun.pin }));
  const checked = validateWebCandidateInputsV647(loaded, sourceNow.sha256);
  const buildArtifactPins = await verifyPreservedBuildArtifactsV647(loaded.build, loaded.pageHttp);
  const performanceObservations = loaded.longRun.observations.map((entry) => Object.freeze({
    device: entry.device, durationMs: entry.observedDurationMs,
    frameSamples: entry.frameSummary.sampleCount, frameP95Ms: entry.frameSummary.p95Ms,
    memorySamples: entry.memorySummary.sampleCount, memorySource: entry.memorySummary.source,
    memoryDeltaBytes: entry.memorySummary.deltaBytes,
    baselineResources: entry.resources.baseline.total,
    activeResources: entry.resources.active.total,
    finalResources: entry.resources.final.total,
    visibilityInterruptions: entry.visibility.interruptions,
  }));
  return Object.freeze({
    schema: SCHEMA, generatedAt: new Date().toISOString(), status: "candidate-blocked",
    deliveryTarget: "next-web-only", sourceSha256: checked.sourceSha256,
    buildId: checked.buildId, runtimeBuildId: checked.runtimeBuildId,
    branch: loaded.build.branch, head: loaded.build.head,
    preservedBuildDirectory: loaded.build.distDir,
    buildArtifactPins,
    performanceObservations,
    evidence: Object.freeze(pins),
    checks: { localTechnicalReview: "verified", assetHttp: "12-images-and-credits-matched",
      browser: "desktop-and-mobile-viewport-observed", longRun: "two-independent-30-minute-observations-qualified",
      physicalMobile: "not-run", externalSource: "historical-pending",
      memoryTrend: "observation-only-no-leak-conclusion" },
    gates: { nebulaRightsSignoff: "pending-0-of-12",
      stellarPhysicalComponentIdentity: "pending-0-of-4",
      constellationVisualSignoff: "pending-0-of-12",
      legacyA3RightsTerminology: "pending-migration",
      rootAppParity: "out-of-scope-for-web-only-local-review",
      publicWebRelease: "blocked" },
    rollback: { allowedAction: "stop-owned-preview-and-select-previous-preserved-build",
      previousBuildSelection: "requires independent verification",
      destructiveGitAction: false, recheckHttpAndSourceIdentity: true },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, runtimePromotion: "closed" },
    claims: { releaseApproved: false, copyrightApproval: false,
      scientificValidity: false, productionPerformance: false, realUserValidation: false },
    note: "Evidence packet only. It is not deployable release approval; rights and component review remain open.",
  });
}

export function verifySavedWebCandidateV647(saved, fresh) {
  if (saved?.schema !== SCHEMA || saved.status !== "candidate-blocked"
    || saved.deliveryTarget !== "next-web-only" || saved.sourceSha256 !== fresh.sourceSha256
    || saved.buildId !== fresh.buildId || saved.runtimeBuildId !== fresh.runtimeBuildId
    || saved.branch !== fresh.branch || saved.head !== fresh.head
    || saved.preservedBuildDirectory !== fresh.preservedBuildDirectory
    || JSON.stringify(saved.buildArtifactPins) !== JSON.stringify(fresh.buildArtifactPins)
    || JSON.stringify(saved.performanceObservations) !== JSON.stringify(fresh.performanceObservations)
    || saved.gates?.publicWebRelease !== "blocked"
    || saved.gates?.nebulaRightsSignoff !== "pending-0-of-12"
    || saved.gates?.stellarPhysicalComponentIdentity !== "pending-0-of-4"
    || saved.gates?.constellationVisualSignoff !== "pending-0-of-12"
    || saved.gates?.legacyA3RightsTerminology !== "pending-migration"
    || saved.gates?.rootAppParity !== "out-of-scope-for-web-only-local-review"
    || saved.claims?.releaseApproved !== false || saved.claims?.copyrightApproval !== false
    || saved.claims?.scientificValidity !== false
    || saved.claims?.productionPerformance !== false
    || saved.claims?.realUserValidation !== false
    || saved.boundary?.candidateOnly !== true || saved.boundary?.hold !== true
    || saved.boundary?.notAdmitted !== true
    || saved.boundary?.scientificPayloadWriteback !== false
    || saved.boundary?.runtimePromotion !== "closed"
    || JSON.stringify(saved.checks) !== JSON.stringify(fresh.checks)
    || JSON.stringify(saved.rollback) !== JSON.stringify(fresh.rollback)
    || JSON.stringify(saved.evidence) !== JSON.stringify(fresh.evidence)) fail("saved-package-replay-mismatch");
  return Object.freeze({ schema: `${SCHEMA}-replay`, status: "verified-candidate-blocked",
    sourceSha256: fresh.sourceSha256, buildId: fresh.buildId,
    evidencePins: fresh.evidence.length, releaseApproved: false });
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    if (!["--longrun", "--output", "--check"].includes(key)
      || !argv[index + 1] || Object.hasOwn(options, key)) fail(`argument-invalid:${key}`);
    options[key] = argv[index + 1];
  }
  if (!options["--longrun"] || Boolean(options["--output"]) === Boolean(options["--check"])) {
    fail("required-arguments-invalid");
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const candidate = await buildWebCandidatePackageV647(options["--longrun"]);
  if (options["--output"]) {
    const output = sourcePath(options["--output"]);
    const saved = await writeExclusiveJson(ROOT, output, candidate);
    console.log(JSON.stringify({ schema: SCHEMA, status: candidate.status,
      path: saved.path, sha256: saved.sha256, evidencePins: candidate.evidence.length,
      releaseApproved: false }));
  } else {
    const saved = await pinnedJson(options["--check"], "static");
    console.log(JSON.stringify(verifySavedWebCandidateV647(saved.value, candidate)));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { await main(); } catch (error) { console.error(String(error)); process.exitCode = 1; }
}
