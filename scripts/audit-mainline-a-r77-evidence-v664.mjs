import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeWorkspacePathV662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";
import { inspectR77FreezeV664 } from
  "./verify-mainline-a-r77-web-freeze-v664.mjs";
import { verifyR77HttpV664 } from
  "./verify-mainline-a-r77-http-v664.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes)
  .digest("hex");
function check(value, code, detail) {
  if (!value) throw new Error("r77-audit:" + code
    + (detail ? ":" + JSON.stringify(detail) : ""));
}
function equal(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}
export function parseR77AuditOptionsV664(argv) {
  check(argv.length === 10
    && argv[0] === "--build-run-id"
    && argv[2] === "--freeze-run-id"
    && argv[4] === "--browser-run-id"
    && argv[6] === "--desktop-scene-run"
    && argv[8] === "--mobile-scene-run", "usage");
  check(/^20261013v664r77web0[1-9]$/.test(argv[1])
    && /^20261013v664r77freeze0[1-9]$/.test(argv[3])
    && /^20261013v664r77web0[1-9]$/.test(argv[5])
    && /^20261013-v664scene\d{2}$/.test(argv[7])
    && /^20261013-v664scene\d{2}$/.test(argv[9])
    && argv[7] !== argv[9], "run-id");
  return { buildRunId: argv[1], freezeRunId: argv[3],
    browserRunId: argv[5],
    desktopSceneRun: argv[7],
    mobileSceneRun: argv[9] };
}
async function read(relative) {
  return JSON.parse(await readFile(safeWorkspacePathV662(relative),
    "utf8"));
}
function paths(config) {
  const base = "docs/release/v607/";
  return { build: base + "mainline-a-r77-build-"
      + config.buildRunId + ".json",
    freeze: base + "mainline-a-r77-v664-freeze-"
      + config.freezeRunId + ".json",
    replay: base + "mainline-a-r77-v664-freeze-replay-"
      + config.freezeRunId + ".json",
    httpEnabled: base + "mainline-a-r77-v664-http-enabled-"
      + config.buildRunId + ".json",
    httpDefaultOff: base
      + "mainline-a-r77-v664-http-default-off-"
      + config.buildRunId + ".json",
    browser: base + "mainline-a-r77-v664-matrix-browser-"
      + config.browserRunId + ".json",
    desktop: base
      + "mainline-a-r77-web-canonical-scene-desktop-raw-"
      + config.desktopSceneRun + ".json",
    mobile: base
      + "mainline-a-r77-web-canonical-scene-mobile-raw-"
      + config.mobileSceneRun + ".json" };
}
export function verifyR77CanonicalV664(raw, freeze,
  build, device) {
  const issues = [];
  const keys = sorted(freeze.scenes.map((row) => row.key));
  const rows = raw?.items ?? [];
  if (raw?.schema
      !== "mainline-a-r66-web-canonical-scene-raw-v648"
    || raw.device !== device
    || raw.items?.length !== 36
    || raw.counts?.stars !== 12
    || raw.counts?.constellations !== 12
    || raw.counts?.nebulae !== 12
    || raw.build?.buildId !== build?.buildId
    || raw.build?.sourceSha256 !== build?.inputAfterSha256
    || raw.build?.runtimeBuildId !== build?.runtimeBuildId
    || raw.errors?.length !== 0
    || raw.physicalDevice !== false
    || raw.boundary?.scientificPayloadWriteback !== false
    || raw.claims?.publicWebReleaseApproved !== false
    || !equal(sorted(rows.map((row) => row.key)), keys)) {
    issues.push("canonical-" + device + "-identity-or-coverage");
  }
  for (const expected of freeze.scenes) {
    const item = rows.find((row) => row.key === expected.key);
    if (!item
      || item.observed?.selectedCatalogId !== expected.catalogId
      || item.observed?.build?.runtimeBuildId
        !== build.runtimeBuildId
      || item.observed?.boundary?.scientificPayloadWriteback
        !== "false"
      || item.observed?.domWidth
        > (device === "desktop" ? 1280 : 390)
      || item.runtime !== "运行时对象："
        + expected.kind + ":" + expected.id + " · ready"
      || !item.screenshot?.path) {
      issues.push("canonical-item:" + expected.key);
    }
    if (expected.kind === "nebula"
      && (item?.observed?.nebula?.id !== expected.id
        || item.observed.nebula.state !== "ready"
        || item.observed.nebula.sha256 !== expected.assetSha256
        || item.observed.nebula.rights !== "pending"
        || item.observed.nebula.admission
          !== "candidate-only")) {
      issues.push("canonical-nebula:" + expected.id);
    }
    if (expected.kind === "constellation"
      && (item?.observed?.constellation?.id !== expected.id
        || item.observed.constellation.source !== "candidate-only"
        || item.observed.constellation.writeback !== "false")) {
      issues.push("canonical-constellation:" + expected.id);
    }
  }
  return { ok: issues.length === 0, issues,
    scenes: rows.length, device };
}
export function verifyR77MatrixBrowserV664(browser,
  freeze, build) {
  const issues = [];
  if (browser?.schema !== "mainline-a-r77-matrix-browser-v664"
    || browser.status
      !== "passed-local-desktop-and-simulated-mobile-candidate-hold"
    || browser.buildId !== build?.buildId
    || browser.appSourceSha256 !== build?.inputAfterSha256
    || browser.freezeFingerprint !== freeze?.fingerprint
    || browser.totals?.matrixSelections !== 192
    || browser.totals?.readinessSelections !== 18
    || browser.boundary?.scientificPayloadWriteback !== false
    || browser.claims?.publicWebReleaseApproved !== false
    || browser.physicalMobile !== "not-run") {
    issues.push("matrix-browser-identity-or-boundary");
  }
  const expectedKeys = freeze.matrixRows.map((row) => row.key);
  for (const device of ["desktop", "mobileViewport"]) {
    const item = browser?.[device];
    const selected = item?.matrixWalk?.selections ?? [];
    if (selected.length !== 96
      || !equal(selected.map((row) => row.key), expectedKeys)
      || selected.some((row) => !row.sourceMatched
        || row.admission !== "candidate-only"
        || row.rightsSigned !== false)
      || item?.readinessSelections?.length !== 9
      || item.pageErrors?.length !== 0
      || item.consoleErrors?.length !== 0
      || item.externalImageRequests?.length !== 0
      || item.sceneChangedByReview !== false
      || item.layout?.documentWidth
        > item.layout?.viewportWidth
      || item.layout?.dialogScrollWidth
        > item.layout?.dialogWidth
      || item.performanceDiagnostic?.count !== 120) {
      issues.push("matrix-browser-" + device + "-coverage");
    }
  }
  if (!browser?.mobileViewport?.matrixWalk?.lastDetail
    || browser.desktop.matrixWalk.lastDetail !== null) {
    issues.push("mobile-detail-navigation-evidence");
  }
  return { ok: issues.length === 0, issues,
    matrixSelections: 192, readinessSelections: 18 };
}
function screenshotItems(browser, desktop, mobile) {
  const result = [];
  for (const [device, item] of [
    ["desktop", browser.desktop],
    ["mobile", browser.mobileViewport],
  ]) {
    for (const [kind, meta] of [
      ["matrix-overview", item.overview],
      ["matrix-first-detail", item.matrixWalk.firstDetail],
      ["matrix-last-detail", item.matrixWalk.lastDetail],
    ]) {
      if (meta) result.push({ device, kind, meta });
    }
  }
  for (const [device, raw] of [
    ["desktop", desktop], ["mobile", mobile],
  ]) {
    for (const item of raw.items) {
      result.push({ device,
        kind: "canonical-" + item.key,
        meta: item.screenshot });
    }
  }
  return result;
}
export function verifyR77ScreenshotV664(item, bytes) {
  const png = bytes.subarray(0, 8).equals(Buffer.from([
    137, 80, 78, 71, 13, 10, 26, 10]));
  const width = png && bytes.length >= 24
    ? bytes.readUInt32BE(16) : null;
  const height = png && bytes.length >= 24
    ? bytes.readUInt32BE(20) : null;
  const expected = item.device === "desktop"
    ? [1280, 720] : [390, 844];
  const digest = sha256(bytes);
  return { ok: item.meta?.bytes === bytes.length
      && item.meta?.sha256 === digest
      && width === expected[0] && height === expected[1],
    path: item.meta?.path,
    kind: item.kind, device: item.device,
    bytes: bytes.length, sha256: digest,
    width, height, screenshotOnly: true };
}
export async function runR77AuditV664(config) {
  const input = paths(config);
  const [build, freeze, replay, httpEnabled, httpDefaultOff,
    browser, desktop, mobile, current] = await Promise.all([
    read(input.build), read(input.freeze), read(input.replay),
    read(input.httpEnabled), read(input.httpDefaultOff),
    read(input.browser), read(input.desktop), read(input.mobile),
    captureBuildInputs(),
  ]);
  const freezeCheck = inspectR77FreezeV664(freeze);
  const enabledCheck = verifyR77HttpV664(freeze,
    httpEnabled.observations, httpEnabled.origin, "enabled");
  const defaultOffCheck = verifyR77HttpV664(freeze,
    httpDefaultOff.observations,
    httpDefaultOff.origin, "default-off");
  const matrixCheck = verifyR77MatrixBrowserV664(
    browser, freeze, build);
  const desktopCheck = verifyR77CanonicalV664(
    desktop, freeze, build, "desktop");
  const mobileCheck = verifyR77CanonicalV664(
    mobile, freeze, build, "mobile");
  check(build.status === "passed" && build.sourceStable
    && build.inputAfterSha256 === current.sha256
    && freeze.appSourceSha256 === current.sha256
    && replay.status === "verified-candidate-hold"
    && replay.appSourceSha256 === current.sha256
    && replay.pinChecks === 57
    && freezeCheck.ok && enabledCheck.ok && defaultOffCheck.ok
    && matrixCheck.ok && desktopCheck.ok && mobileCheck.ok,
  "cross-evidence-verification-failed",
  { freeze: freezeCheck.issues,
    enabled: enabledCheck.issues,
    defaultOff: defaultOffCheck.issues,
    matrix: matrixCheck.issues,
    desktop: desktopCheck.issues,
    mobile: mobileCheck.issues });
  const screenshots = [];
  for (const item of screenshotItems(
    browser, desktop, mobile)) {
    const bytes = await readFile(
      safeWorkspacePathV662(item.meta.path));
    const result = verifyR77ScreenshotV664(item, bytes);
    check(result.ok, "screenshot-byte-or-size", result);
    screenshots.push(result);
  }
  check(screenshots.length === 77,
    "screenshot-coverage", screenshots.length);
  check((await captureBuildInputs()).sha256 === current.sha256,
    "source-drift-during-audit");
  const base = "docs/release/v607/";
  const suffix = config.browserRunId + ".json";
  const visualPath = base + "mainline-a-r77-v664-visual-" + suffix;
  const performancePath = base
    + "mainline-a-r77-v664-performance-" + suffix;
  const externalPath = base
    + "mainline-a-r77-v664-external-source-" + suffix;
  const auditPath = base
    + "mainline-a-r77-v664-evidence-audit-" + suffix;
  const boundary = { candidateOnly: true, hold: true,
    notAdmitted: true, scientificPayloadWriteback: false,
    publicWebReleaseApproved: false };
  const visual = {
    schema: "mainline-a-r77-visual-v664",
    status: "seventy-seven-current-build-screenshots-rehashed",
    appSourceSha256: current.sha256,
    buildId: build.buildId, references: {
      browser: input.browser,
      desktopCanonical: input.desktop,
      mobileCanonical: input.mobile },
    screenshots,
    perItemHumanVisualSignoff: false,
    realUserValidation: false, boundary };
  const performance = {
    schema: "mainline-a-r77-performance-v664",
    status: "short-local-browser-diagnostic-only",
    appSourceSha256: current.sha256,
    buildId: build.buildId,
    browserReceipt: input.browser,
    measurements: [
      { device: "desktop",
        ...browser.desktop.performanceDiagnostic },
      { device: "simulated-mobile",
        ...browser.mobileViewport.performanceDiagnostic },
    ],
    currentBuildLongRun: "not-run",
    priorBuildLongRunReusable: false,
    physicalMobile: "not-run",
    productionPerformanceEstablished: false, boundary };
  const external = {
    schema: "mainline-a-r77-external-source-v664",
    status: "prior-raw-evidence-replayed-no-new-acquisition",
    freezeReceipt: input.freeze,
    freezeReplay: input.replay,
    verifiedFilePins: replay.pinChecks,
    existingR76RawSourcePinsRecomputedByBuilder: 20,
    newHttpsRequests: 0,
    newNebulaImageResponsesCaptured: 0,
    stellarPhysicalComponentsConfirmed: 0,
    blockedNebulaImageRequests: 5,
    aNebulaRightsSigned: 0,
    betaNebulaRightsSigned: 0,
    scientificValidityApproved: false,
    copyrightApproval: false, boundary };
  const audit = {
    schema: "mainline-a-r77-evidence-audit-v664",
    status: "passed-current-source-local-candidate-release-blocked",
    observedAt: new Date().toISOString(),
    appSourceSha256: current.sha256,
    buildId: build.buildId,
    runtimeBuildId: build.runtimeBuildId,
    freezeFingerprint: freeze.fingerprint,
    references: { ...input, visual: visualPath,
      performance: performancePath,
      externalSource: externalPath },
    verification: { freeze: freezeCheck,
      httpEnabled: enabledCheck,
      httpDefaultOff: defaultOffCheck,
      matrixBrowser: matrixCheck,
      canonicalDesktop: desktopCheck,
      canonicalMobile: mobileCheck },
    screenshotCount: screenshots.length,
    publicDeployment: "not-run",
    physicalMobile: "not-run",
    currentBuildLongRun: "not-run",
    release: "blocked", boundary,
    claims: { scientificValidity: false,
      copyrightApproval: false,
      productionPerformance: false,
      realUserValidation: false,
      publicWebReleaseApproved: false },
  };
  for (const [name, value] of [
    [visualPath, visual], [performancePath, performance],
    [externalPath, external], [auditPath, audit],
  ]) {
    await writeFile(safeWorkspacePathV662(name),
      JSON.stringify(value, null, 2) + "\n",
    { flag: "wx" });
  }
  return { status: audit.status,
    screenshotCount: screenshots.length,
    matrixSelections: matrixCheck.matrixSelections,
    canonicalScenes: desktopCheck.scenes
      + mobileCheck.scenes,
    auditPath, visualPath,
    performancePath, externalPath };
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runR77AuditV664(
    parseR77AuditOptionsV664(process.argv.slice(2)))));
}
