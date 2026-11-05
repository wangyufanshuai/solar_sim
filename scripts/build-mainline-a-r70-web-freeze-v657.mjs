import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeFile, sha256 } from "./mainline-a-release-evidence.mjs";
import freezeModule from "../app/lib/mainlineAWebStageFreezeV657.ts";
import longRunModule from "../app/lib/mainlineAR65LongRunV643.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = "docs/release/v607/mainline-a-r70-web-freeze-candidate-20261012v657web02.json";
const BUILD = "docs/release/v607/mainline-a-r70-build-20261012v657web02.json";
const HTTP = "docs/release/v607/mainline-a-r70-v657-http-20261012v657web02.json";
const POINTER_DESKTOP = "docs/release/v607/mainline-a-r70-v657-pointer-desktop-raw-20261012-v657pointer03.json";
const POINTER_MOBILE = "docs/release/v607/mainline-a-r70-v657-pointer-mobile-raw-20261012-v657pointer03.json";
const REVIEW_MATRIX = "docs/release/v607/mainline-a-r70-v657-review-browser-matrix-20261012v657web02.json";
const SKY_BROWSER = "docs/release/v607/mainline-a-r70-v657-sky-browser-20261012v657web02.json";
const STAGE_BROWSER = "docs/release/v607/mainline-a-r70-v657-stage-browser-20261012v657web02.json";
const LONGRUN_DESKTOP = "docs/release/v607/mainline-a-r70-v657-browser-desktop-raw-20261012-v657long04.json";
const LONGRUN_FINAL = "docs/release/v607/mainline-a-r70-v657-browser-final-raw-20261012-v657long04.json";
const REVIEW = "app/data/mainlineANebulaCandidateReviewV655.generated.json";
const SKY = "app/data/mainlineAWebSkyAtlasV656.generated.json";
const CANONICAL = "app/data/mainlineACanonicalCoverageV622.generated.json";
const V616 = "app/data/mainlineABetaStellarSourceClosureV616.generated.json";
const SHA = /^[a-f0-9]{64}$/;
const { verifyMainlineAR65LongRunReceiptV643,
  replayMainlineAR65LongRunReceiptV643 } =
  longRunModule.default ?? longRunModule;
const { buildWebStageFreezeDataV657,
  evaluateWebStageRuntimeEvidenceV657 } =
  freezeModule.default ?? freezeModule;

function fail(code, detail) {
  throw new Error(`r70-freeze-v657:${code}${detail
    ? `:${JSON.stringify(detail)}` : ""}`);
}
function check(condition, code, detail) {
  if (!condition) fail(code, detail);
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export async function pinR70FileV657(relative, evidenceClass,
  expectedSha256 = null) {
  const file = await safeFile(ROOT, relative);
  check(file.stat.size > 0 && file.stat.size <= 256 * 1024 * 1024,
  "pin-size-invalid", relative);
  const bytes = await readFile(file.absolute);
  const digest = sha256(bytes);
  check(expectedSha256 === null || digest === expectedSha256,
  "pin-hash-mismatch", relative);
  return Object.freeze({ path: file.relative, bytes: bytes.length,
    sha256: digest, evidenceClass });
}

async function readJson(relative, evidenceClass) {
  const pin = await pinR70FileV657(relative, evidenceClass);
  const limitMiB = evidenceClass === "performance" ? 96 : 24;
  check(pin.bytes <= limitMiB * 1024 * 1024,
    "json-receipt-too-large", { relative, limitMiB });
  const value = JSON.parse(await readFile(path.join(ROOT, relative), "utf8"));
  return Object.freeze({ pin, value });
}

export function validatePointerMatrixV657(matrix, canonical,
  expectedDevice, build) {
  const issues = [];
  const rows = Array.isArray(matrix?.items) ? matrix.items : [];
  const expected = canonical.records.map((row) => `${row.kind}:${row.id}`);
  const actual = rows.map((row) => row.key);
  if (matrix?.schema !== "mainline-a-r70-web-pointer-matrix-v657"
    || matrix.evidenceClass !== "browser"
    || matrix.device !== expectedDevice
    || matrix.build?.buildId !== build.buildId
    || matrix.build?.runtimeBuildId !== build.runtimeBuildId
    || matrix.build?.sourceSha256 !== build.inputAfterSha256
    || matrix.boundary?.scientificPayloadWriteback !== false
    || matrix.claims?.realUserValidation !== false
    || matrix.claims?.productionPerformance !== false
    || matrix.claims?.publicWebReleaseApproved !== false)
    issues.push("matrix-identity-or-boundary-invalid");
  if (rows.length !== 36 || new Set(actual).size !== 36
    || expected.some((key) => !actual.includes(key)))
    issues.push("canonical-selection-incomplete");
  for (const row of rows) {
    if (row.observed?.runtimeBuildId !== build.runtimeBuildId
      || row.observed?.releaseBoundary !== "candidate-only-hold-not-admitted"
      || row.observed?.scientificPayloadWriteback !== "false"
      || row.observed?.visibility !== "visible"
      || !SHA.test(row.screenshot?.sha256 ?? "")
      || !row.screenshot?.path) {
      issues.push(`row-observation-invalid:${row.key}`);
    }
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), observed: rows.length });
}

export function validateReviewMatrixV657(matrix, review, build) {
  const issues = [];
  const expected = review.rows.map((row) => row.id);
  if (matrix?.schema !== "mainline-a-r70-nebula-review-matrix-v657"
    || matrix.status !== "passed-twelve-details-per-viewport"
    || matrix.buildId !== build.buildId
    || matrix.sourceSha256 !== build.inputAfterSha256
    || matrix.totals?.selections !== 24
    || matrix.totals?.pageErrors !== 0
    || matrix.totals?.leakedReviewBlobUrls !== 0
    || matrix.claims?.copyrightApproval !== false)
    issues.push("review-matrix-boundary-invalid");
  for (const key of ["desktop", "mobileViewport"]) {
    const device = matrix?.[key];
    const ids = device?.selections?.map((row) => row.id) ?? [];
    if (ids.length !== 12 || new Set(ids).size !== 12
      || expected.some((id) => !ids.includes(id))
      || device.released?.active !== 0
      || device.released?.created !== device.released?.revoked
      || device.pageErrors?.length !== 0) {
      issues.push(`${key}-details-or-release-incomplete`);
    }
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues) });
}

export function validateSkyBrowserV657(browser, build) {
  const issues = [];
  if (browser?.schema !== "mainline-a-r70-web-sky-browser-v657"
    || browser.status !== "passed-local-desktop-and-mobile-viewport"
    || browser.buildId !== build.buildId
    || browser.runtimeBuildId !== build.runtimeBuildId
    || browser.appSourceSha256 !== build.inputAfterSha256
    || browser.totals?.starCardSelections !== 48
    || browser.totals?.constellationChartSelections !== 24
    || browser.totals?.holdFocusAttemptsAllowed !== 0
    || browser.totals?.pageErrors !== 0
    || browser.claims?.scientificValidity !== false
    || browser.claims?.publicWebReleaseApproved !== false)
    issues.push("sky-browser-identity-or-coverage-invalid");
  for (const key of ["desktop", "mobileViewport"]) {
    const row = browser?.[key];
    if (row?.starSelections?.length !== 24
      || row?.constellationSelections?.length !== 12
      || row.requests?.active !== 0
      || row.requests?.started !== row.requests?.completed
      || row.pageErrors?.length !== 0)
      issues.push(`${key}-sky-browser-incomplete`);
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues) });
}

export function validateStageBrowserV657(browser, build) {
  const issues = [];
  if (browser?.schema !== "mainline-a-r70-web-stage-browser-v657"
    || browser.status !== "passed-local-desktop-and-mobile-viewport"
    || browser.buildId !== build.buildId
    || browser.runtimeBuildId !== build.runtimeBuildId
    || browser.sourceSha256 !== build.inputAfterSha256
    || browser.totals?.stageCandidateSelections !== 2
    || browser.totals?.sourceLinksMatched !== 2
    || browser.totals?.pageErrors !== 0
    || browser.claims?.copyrightApproval !== false
    || browser.claims?.publicWebReleaseApproved !== false)
    issues.push("stage-browser-identity-invalid");
  for (const key of ["desktop", "mobileViewport"]) {
    const row = browser?.[key];
    if (row?.candidateRows !== 12 || row.b1Filtered !== 6
      || row.b2Filtered !== 6 || row.byteVariantsFiltered !== 11
      || row.sourceLinkMatched !== true
      || row.emptySearchState !== true
      || row.selectedCatalogUnchanged !== true
      || row.closed !== true || row.pageErrors?.length !== 0
      || row.layout?.searchWidth < 200
      || row.layout?.searchWidth == null
      || !row.screenshots?.overview?.path
      || !row.screenshots?.detail?.path)
      issues.push(`${key}-stage-browser-incomplete`);
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues) });
}

export function validateLongRunsV657(raw, desktopRaw, build) {
  const issues = [];
  const observations = Array.isArray(raw?.observations)
    ? raw.observations : [];
  const verified = verifyMainlineAR65LongRunReceiptV643(raw);
  const replay = replayMainlineAR65LongRunReceiptV643(raw);
  if (!verified.ok || verified.completeLongRuns !== 2
    || replay.status !== "verified" || replay.failures.length !== 0
    || raw.status !== "qualified"
    || raw.build?.buildId !== build.runtimeBuildId
    || raw.boundary?.scientificPayloadWriteback !== false
    || raw.claims?.productionPerformance !== false
    || observations.length !== 2)
    issues.push("longrun-raw-or-offline-replay-invalid");
  if (desktopRaw?.observations?.length !== 1
    || desktopRaw.observations[0]?.digest !== observations[0]?.digest)
    issues.push("desktop-checkpoint-drift");
  const devices = observations.map((row) => row.device);
  if (!same(devices, ["desktop", "mobile"])
    || observations.some((row) => row.observedDurationMs < 30 * 60 * 1000
      || Date.parse(row.endedAt) - Date.parse(row.startedAt) < 30 * 60 * 1000
      || row.visibility?.interruptions !== 0
      || row.consoleErrors !== 0 || row.pageErrors !== 0
      || row.physicalDevice !== false
      || row.build?.buildId !== build.runtimeBuildId
      || row.resources?.baseline?.total !== row.resources?.final?.total
      || row.resources?.baseline?.identityDigest
        !== row.resources?.final?.identityDigest
      || row.resources?.active?.total <= row.resources?.baseline?.total))
    issues.push("independent-longrun-duration-or-resource-invalid");
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), replay,
    observations: Object.freeze(observations.map((row) => ({
      device: row.device === "mobile" ? "mobile-viewport" : "desktop",
      durationMs: row.observedDurationMs,
      visibilityInterruptions: row.visibility?.interruptions ?? -1,
      resourceRestored: row.resources?.baseline?.total
        === row.resources?.final?.total
        && row.resources?.baseline?.identityDigest
          === row.resources?.final?.identityDigest,
      sourceSha256: build.inputAfterSha256,
      frameP95Ms: row.frameSummary?.p95Ms ?? null,
      memoryDeltaBytes: row.memorySummary?.deltaBytes ?? null,
      sessionId: row.sessionId, digest: row.digest,
    }))) });
}

async function pageArtifactPin(row) {
  const directory = row.batchId === "B1" ? "v654" : "v651";
  const base = `docs/release/v607/nebula-source-pages/${directory}`;
  const names = await readdir(path.join(ROOT, base));
  const matches = names.filter((name) => name.endsWith(
    `-${row.sourcePageSha256}.html`));
  check(matches.length === 1, "source-page-artifact-not-unique", row.id);
  return pinR70FileV657(`${base}/${matches[0]}`,
    "external-source", row.sourcePageSha256);
}

export async function pinCandidateArtifactsV657(review) {
  const pins = [];
  for (const row of review.rows) {
    pins.push(await pageArtifactPin(row));
    for (const item of [row.officialRaw, row.candidateRaw,
      row.preview.thumb, row.preview.detail]) {
      pins.push(await pinR70FileV657(item.path,
        item === row.preview.thumb || item === row.preview.detail
          ? "visual" : "external-source", item.sha256));
    }
  }
  check(pins.length === 60
    && new Set(pins.map((pin) => pin.path)).size === 60,
  "candidate-artifact-closure-invalid");
  return Object.freeze(pins);
}

export async function buildR70FreezeCandidateV657() {
  const descriptors = {
    build: [BUILD, "static"], http: [HTTP, "http"],
    pointerDesktop: [POINTER_DESKTOP, "browser"],
    pointerMobile: [POINTER_MOBILE, "browser"],
    reviewMatrix: [REVIEW_MATRIX, "browser"],
    skyBrowser: [SKY_BROWSER, "browser"],
    stageBrowser: [STAGE_BROWSER, "browser"],
    longRunDesktop: [LONGRUN_DESKTOP, "performance"],
    longRunFinal: [LONGRUN_FINAL, "performance"],
    reviewManifest: [REVIEW, "static"],
    skyManifest: [SKY, "static"],
    canonicalManifest: [CANONICAL, "static"],
    v616Closure: [V616, "external-source"],
  };
  const loaded = Object.fromEntries(await Promise.all(
    Object.entries(descriptors).map(async ([role, [relative, kind]]) =>
      [role, await readJson(relative, kind)])));
  const value = Object.fromEntries(Object.entries(loaded).map(
    ([role, record]) => [role, record.value]));
  const source = await captureBuildInputs();
  const build = value.build;
  check(build.status === "passed" && build.sourceStable === true
    && build.round === 70 && build.inputBefore?.sha256 === source.sha256
    && build.inputAfterSha256 === source.sha256
    && build.runtimeBuildId === `mainline-a-${source.sha256.slice(0, 16)}`,
  "current-build-source-invalid");
  const stage = buildWebStageFreezeDataV657(value.reviewManifest,
    value.skyManifest, value.canonicalManifest);
  check(stage.status === "candidate-data-valid", "stage-data-invalid",
    stage.issues);
  const pointers = [
    validatePointerMatrixV657(value.pointerDesktop,
      value.canonicalManifest, "desktop", build),
    validatePointerMatrixV657(value.pointerMobile,
      value.canonicalManifest, "mobile", build),
  ];
  check(pointers.every((item) => item.ok), "pointer-evidence-invalid",
    pointers.flatMap((item) => item.issues));
  const review = validateReviewMatrixV657(value.reviewMatrix,
    value.reviewManifest, build);
  check(review.ok, "candidate-review-browser-invalid", review.issues);
  const sky = validateSkyBrowserV657(value.skyBrowser, build);
  check(sky.ok, "sky-browser-invalid", sky.issues);
  const stageBrowser = validateStageBrowserV657(value.stageBrowser, build);
  check(stageBrowser.ok, "stage-browser-invalid", stageBrowser.issues);
  const longRuns = validateLongRunsV657(value.longRunFinal,
    value.longRunDesktop, build);
  check(longRuns.ok, "longrun-invalid", longRuns.issues);
  const http = value.http;
  check(http.schema === "mainline-a-r70-web-http-v657"
    && http.status === "passed-local-http-current-build"
    && http.buildId === build.buildId
    && http.sourceSha256 === source.sha256
    && http.home?.status === 200 && http.health?.status === 200
    && http.sky?.status === 200
    && http.counts?.servedCandidateVariants === 36
    && http.counts?.servedCandidateShaMatches === 36
    && http.negative?.defaultDisabledStatus === 404
    && http.negative?.foreignOriginStatus === 404
    && http.claims?.copyrightApproval === false,
  "http-evidence-invalid");
  const runtime = {
    sourceSha256: source.sha256,
    buildSourceSha256: build.inputAfterSha256,
    buildStatus: build.status,
    homeStatus: http.home.status, healthStatus: http.health.status,
    skyMetadataStatus: http.sky.status,
    servedCandidateVariants: http.counts.servedCandidateVariants,
    servedCandidateShaMatches: http.counts.servedCandidateShaMatches,
    canonicalSelections: pointers.reduce((sum, item) =>
      sum + item.observed, 0),
    candidateDetailsOpened: value.reviewMatrix.totals.selections,
    browserPageErrors: value.reviewMatrix.totals.pageErrors
      + value.skyBrowser.totals.pageErrors
      + value.stageBrowser.totals.pageErrors
      + value.pointerDesktop.errors.length
      + value.pointerMobile.errors.length,
    objectUrlsAfterClose: value.reviewMatrix.totals.leakedReviewBlobUrls,
    longRuns: longRuns.observations,
  };
  const decision = evaluateWebStageRuntimeEvidenceV657(stage, runtime);
  check(decision.status === "technical-candidate-ready",
  "technical-evidence-incomplete", decision.reasons);
  const candidateArtifacts = await pinCandidateArtifactsV657(
    value.reviewManifest);
  const browserScreenshots = [];
  for (const matrix of [value.pointerDesktop, value.pointerMobile]) {
    for (const item of matrix.items) {
      browserScreenshots.push(await pinR70FileV657(
        item.screenshot.path, "visual", item.screenshot.sha256));
    }
  }
  check(browserScreenshots.length === 72,
  "canonical-screenshot-pin-count");
  const stageScreenshots = [];
  for (const device of [value.stageBrowser.desktop,
    value.stageBrowser.mobileViewport]) {
    for (const shot of Object.values(device.screenshots)) {
      stageScreenshots.push(await pinR70FileV657(
        shot.path, "visual", shot.sha256));
    }
  }
  check(stageScreenshots.length === 4, "stage-screenshot-pin-count");
  const buildArtifacts = [];
  for (const relative of ["BUILD_ID", "build-manifest.json",
    "routes-manifest.json"]) {
    buildArtifacts.push(await pinR70FileV657(
      `${build.distDir}/${relative}`, "static"));
  }
  check((await readFile(path.join(ROOT, build.distDir, "BUILD_ID"),
    "utf8")).trim() === build.buildId, "build-id-artifact-drift");
  const evidence = Object.fromEntries(Object.entries(loaded).map(
    ([role, item]) => [role, item.pin]));
  const inputs = Object.values(value.reviewManifest.generatedFrom);
  const sourceInputs = [];
  for (const item of inputs) {
    sourceInputs.push(await pinR70FileV657(item.path,
      "external-source", item.sha256));
  }
  const v616Source = value.v616Closure.source;
  check(v616Source?.snapshotSha256
    === "be5e2956350d7d81f19e29d6f98529702b4cf018cd1c3b6d47b392be82db5061"
    && v616Source?.snapshotContentSha256
      === "706be4e043fce25df4cd0e01522dd6ef5863c5cdf902c3e08ab6563e6c7a863b"
    && v616Source?.projectionContentSha256
      === "8fbb31166d5b96890236da6842ce9f53a4ace3133ffbaabccd9811e8005e0dce",
  "immutable-v616-digest-drift");
  const immutableScienceInputs = [
    await pinR70FileV657(v616Source.snapshotPath,
      "external-source", v616Source.snapshotContentSha256),
    await pinR70FileV657(v616Source.projectionPath,
      "external-source", v616Source.projectionContentSha256),
  ];
  return Object.freeze({ schema: "mainline-a-r70-web-freeze-candidate-v657",
    status: "technical-candidate-evidence-complete-release-blocked",
    generatedAt: new Date().toISOString(),
    repository: { root: ROOT.replaceAll("\\", "/"), branch: build.branch,
      head: build.head, parentGitOperated: false,
      physicsKernelEditedByR70: false },
    sourceSha256: source.sha256, buildId: build.buildId,
    runtimeBuildId: build.runtimeBuildId, preservedBuild: build.distDir,
    counts: { canonicalSelections: 72, candidateDetailsOpened: 24,
      candidateImageHttpShaMatches: 36, localCandidateArtifacts: 60,
      canonicalScreenshotsPinned: 72, independentLongRuns: 2,
      rightsSigned: 0, componentIdentitySigned: 0 },
    stageData: { schema: stage.schema, counts: stage.counts,
      gates: stage.gates, boundary: stage.boundary },
    technicalDecision: decision,
    evidence, sourceInputs, immutableScienceInputs, candidateArtifacts,
    browserScreenshots, stageScreenshots, buildArtifacts,
    longRuns: longRuns.observations,
    rollback: { action: "select retained prior web build and revalidate locally",
      priorBuildReceipt:
        "docs/release/v607/mainline-a-r69-build-20261012v656web03.json",
      priorBuildId: "W2vufVrwt524JR3jvfKhn",
      currentBuildReceipt: BUILD, currentBuildId: build.buildId,
      deploymentChanged: false },
    gates: { rights: "pending-0-of-12",
      stellarPhysicalComponentIdentity: "pending-0-of-4",
      rootAlignment: "out-of-scope-web-only",
      physicalMobile: "not-run", publicWebRelease: "blocked" },
    claims: { releaseApproved: false, copyrightApproval: false,
      scientificValidity: false, productionPerformance: false,
      realUserValidation: false, physicalMobile: false,
      scientificPayloadWriteback: false } });
}

export function replayR70FreezeCandidateV657(saved, fresh) {
  const projection = (item) => ({ ...item, generatedAt: null });
  check(saved?.schema === fresh.schema
    && saved?.status === fresh.status
    && same(projection(saved), projection(fresh))
    && saved.gates?.publicWebRelease === "blocked"
    && saved.claims?.releaseApproved === false
    && saved.claims?.scientificPayloadWriteback === false,
  "saved-candidate-replay-mismatch");
  return Object.freeze({ status: "replayed-current-source-candidate",
    sourceSha256: fresh.sourceSha256, buildId: fresh.buildId,
    candidateArtifacts: fresh.candidateArtifacts.length,
    publicWebRelease: "blocked" });
}

if (process.argv[1] && path.resolve(process.argv[1]) ===
    fileURLToPath(import.meta.url)) {
  const outputAt = process.argv.indexOf("--output");
  const replayAt = process.argv.indexOf("--replay");
  check(!(outputAt >= 0 && replayAt >= 0), "choose-output-or-replay");
  const fresh = await buildR70FreezeCandidateV657();
  if (outputAt >= 0) {
    check(process.argv[outputAt + 1] === OUTPUT, "output-path-invalid");
    await writeFile(path.join(ROOT, OUTPUT),
      `${JSON.stringify(fresh, null, 2)}\n`, { flag: "wx" });
  }
  if (replayAt >= 0) {
    check(process.argv[replayAt + 1] === OUTPUT, "replay-path-invalid");
    const saved = JSON.parse(await readFile(path.join(ROOT, OUTPUT), "utf8"));
    console.log(JSON.stringify(replayR70FreezeCandidateV657(saved, fresh)));
  } else console.log(JSON.stringify({ status: fresh.status,
    sourceSha256: fresh.sourceSha256,
    buildId: fresh.buildId,
    candidateArtifacts: fresh.candidateArtifacts.length,
    publicWebRelease: fresh.gates.publicWebRelease }, null, 2));
}
