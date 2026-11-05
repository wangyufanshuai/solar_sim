import { createHash } from "node:crypto";
import { lstat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from
  "./build-mainline-a-preserved.mjs";
import { runR77HttpV664 } from
  "./verify-mainline-a-r77-http-v664.mjs";
import { runR77MatrixBrowserV664 } from
  "./capture-mainline-a-r77-matrix-browser-v664.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "docs/release/v607/";
const RUN = /^20261013v665r78web0[1-8]$/;
const BUILD_ID = "20261013v664r77web01";
const FREEZE_ID = "20261013v664r77freeze01";
function underlyingRunId(runId) {
  const sequence = Number(runId.at(-1)) + 1;
  check(sequence <= 9, "underlying-run-range", runId);
  return `20261013v664r77web0${sequence}`;
}

function check(valid, code, detail) {
  if (!valid) throw new Error("r78-web-evidence:" + code
    + (detail === undefined ? "" : ":" + JSON.stringify(detail)));
}
function sha256(bytes) {
  return createHash("sha256").update(bytes)
    .digest("hex");
}
function safe(relative) {
  check(/^(docs\/release\/v607\/|output\/playwright\/)[a-z0-9-]+\.(json|png)$/i
    .test(relative), "path-invalid", relative);
  const absolute = path.resolve(ROOT, relative);
  check(absolute.toLowerCase().startsWith(
    (ROOT + path.sep).toLowerCase()),
  "path-outside-worktree", relative);
  return absolute;
}
async function pinnedJson(relative) {
  const absolute = safe(relative);
  const stat = await lstat(absolute);
  check(stat.isFile() && !stat.isSymbolicLink()
    && stat.size > 0 && stat.size < 4 * 1024 * 1024,
  "receipt-not-small-regular-file", relative);
  const bytes = await readFile(absolute);
  check(bytes.length === stat.size,
    "receipt-changed-during-read", relative);
  return { value: JSON.parse(bytes.toString("utf8")),
    pin: { path: relative, bytes: bytes.length,
      sha256: sha256(bytes) } };
}
export function verifyR78ScreenshotBytesV665(meta,
  device, bytes) {
  const width = bytes.length >= 24
    ? bytes.readUInt32BE(16) : null;
  const height = bytes.length >= 24
    ? bytes.readUInt32BE(20) : null;
  const expected = device === "desktop"
    ? [1280, 720] : [390, 844];
  const ok = bytes.subarray(0, 8).equals(Buffer.from([
    137, 80, 78, 71, 13, 10, 26, 10]))
    && meta.bytes === bytes.length
    && meta.sha256 === sha256(bytes)
    && width === expected[0]
    && height === expected[1];
  return { ok, width, height,
    bytes: bytes.length, sha256: sha256(bytes) };
}
async function screenshot(meta, device, kind) {
  const bytes = await readFile(safe(meta.path));
  const verified = verifyR78ScreenshotBytesV665(
    meta, device, bytes);
  check(verified.ok, "screenshot-byte-or-size-invalid",
    meta.path);
  return { path: meta.path,
    bytes: verified.bytes, sha256: verified.sha256,
    width: verified.width, height: verified.height,
    device, kind,
    screenshotOnly: true };
}
export function parseR78WebEvidenceOptionsV665(argv) {
  check(argv.length === 6 && argv[0] === "--run-id"
    && argv[2] === "--enabled-port"
    && argv[4] === "--default-off-port",
  "usage");
  const enabledPort = Number(argv[3]);
  const defaultOffPort = Number(argv[5]);
  check(RUN.test(argv[1])
    && Number.isInteger(enabledPort)
    && Number.isInteger(defaultOffPort)
    && enabledPort >= 1024 && enabledPort < 65536
    && defaultOffPort >= 1024 && defaultOffPort < 65536
    && enabledPort !== defaultOffPort,
  "run-id-or-port-invalid");
  return { runId: argv[1], enabledPort,
    defaultOffPort };
}
function outputPaths(runId) {
  return { http: BASE
      + `mainline-a-r78-v665-http-${runId}.json`,
    browser: BASE
      + `mainline-a-r78-v665-browser-${runId}.json`,
    visual: BASE
      + `mainline-a-r78-v665-visual-${runId}.json`,
    attempt: BASE
      + `mainline-a-r78-v665-web-attempt-${runId}.json` };
}
async function exclusive(relative, value) {
  await writeFile(safe(relative),
    JSON.stringify(value, null, 2) + "\n",
  { flag: "wx" });
}
async function visualScreenshots(browser, canonicalDesktop,
  canonicalMobile) {
  const requests = [];
  for (const [device, item] of [
    ["desktop", browser.desktop],
    ["mobile", browser.mobileViewport],
  ]) {
    for (const [kind, meta] of [
      ["matrix-overview", item.overview],
      ["matrix-first-detail", item.matrixWalk.firstDetail],
      ["matrix-last-detail", item.matrixWalk.lastDetail],
    ]) {
      if (meta) requests.push({ device, kind, meta });
    }
  }
  for (const [device, raw] of [
    ["desktop", canonicalDesktop],
    ["mobile", canonicalMobile],
  ]) {
    for (const item of raw.items) {
      requests.push({ device,
        kind: "canonical-" + item.key,
        meta: item.screenshot });
    }
  }
  check(requests.length === 77,
    "screenshot-coverage-invalid", requests.length);
  const result = [];
  for (const request of requests) {
    result.push(await screenshot(request.meta,
      request.device, request.kind));
  }
  return result;
}

export async function runR78WebEvidenceV665(config) {
  const paths = outputPaths(config.runId);
  const underlying = underlyingRunId(config.runId);
  const startedAt = new Date().toISOString();
  let stage = "preflight";
  const source = await captureBuildInputs();
  try {
    const build = await pinnedJson(BASE
      + `mainline-a-r77-build-${BUILD_ID}.json`);
    const freeze = await pinnedJson(BASE
      + `mainline-a-r77-v664-freeze-${FREEZE_ID}.json`);
    check(build.value.status === "passed"
      && build.value.inputAfterSha256 === source.sha256
      && freeze.value.appSourceSha256 === source.sha256,
    "source-or-build-drift");
    const enabledOrigin = `http://127.0.0.1:${config.enabledPort}`;
    const defaultOffOrigin =
      `http://127.0.0.1:${config.defaultOffPort}`;
    stage = "http-enabled";
    await runR77HttpV664({ runId: underlying,
      buildRunId: BUILD_ID, freezeRunId: FREEZE_ID,
      mode: "enabled", origin: enabledOrigin });
    stage = "http-default-off";
    await runR77HttpV664({ runId: underlying,
      buildRunId: BUILD_ID, freezeRunId: FREEZE_ID,
      mode: "default-off", origin: defaultOffOrigin });
    stage = "browser-matrix";
    await runR77MatrixBrowserV664({ runId: underlying,
      buildRunId: BUILD_ID, freezeRunId: FREEZE_ID,
      origin: enabledOrigin });
    stage = "receipt-replay";
    const [enabled, defaultOff, browser,
      canonicalDesktop, canonicalMobile] = await Promise.all([
      pinnedJson(BASE
        + `mainline-a-r77-v664-http-enabled-${underlying}.json`),
      pinnedJson(BASE
        + `mainline-a-r77-v664-http-default-off-${underlying}.json`),
      pinnedJson(BASE
        + `mainline-a-r77-v664-matrix-browser-${underlying}.json`),
      pinnedJson(BASE
        + "mainline-a-r77-web-canonical-scene-desktop-raw-20261013-v664scene01.json"),
      pinnedJson(BASE
        + "mainline-a-r77-web-canonical-scene-mobile-raw-20261013-v664scene02.json"),
    ]);
    check(enabled.value.mode === "enabled"
      && defaultOff.value.mode === "default-off"
      && enabled.value.appSourceSha256 === source.sha256
      && defaultOff.value.appSourceSha256 === source.sha256
      && browser.value.appSourceSha256 === source.sha256
      && browser.value.totals?.matrixSelections === 192
      && browser.value.totals?.readinessSelections === 18
      && canonicalDesktop.value.items?.length === 36
      && canonicalMobile.value.items?.length === 36,
    "same-source-http-browser-coverage-invalid");
    const screenshots = await visualScreenshots(browser.value,
      canonicalDesktop.value, canonicalMobile.value);
    check((await captureBuildInputs()).sha256
      === source.sha256,
    "source-drift-during-web-capture");
    const boundary = { candidateOnly: true, hold: true,
      notAdmitted: true, scientificPayloadWriteback: false,
      publicWebReleaseApproved: false };
    const http = {
      schema: "mainline-a-r78-http-v665",
      status: "passed-same-build-local-two-preview-modes",
      runId: config.runId, startedAt,
      endedAt: new Date().toISOString(),
      appSourceSha256: source.sha256,
      buildId: build.value.buildId,
      sources: [enabled.pin, defaultOff.pin],
      enabled: enabled.value.verification,
      defaultOff: defaultOff.value.verification,
      publicDeployment: "not-run", boundary,
    };
    const browserReceipt = {
      schema: "mainline-a-r78-browser-v665",
      status: "passed-local-desktop-and-simulated-mobile",
      runId: config.runId,
      appSourceSha256: source.sha256,
      buildId: build.value.buildId,
      source: browser.pin,
      desktop: { matrixSelections:
          browser.value.desktop.matrixWalk.selections.length,
        readinessSelections:
          browser.value.desktop.readinessSelections.length,
        errors: browser.value.desktop.pageErrors.length
          + browser.value.desktop.consoleErrors.length },
      mobileViewport: { matrixSelections:
          browser.value.mobileViewport.matrixWalk.selections.length,
        readinessSelections:
          browser.value.mobileViewport.readinessSelections.length,
        errors: browser.value.mobileViewport.pageErrors.length
          + browser.value.mobileViewport.consoleErrors.length },
      canonicalSceneSources: [canonicalDesktop.pin,
        canonicalMobile.pin],
      physicalMobile: "not-run", boundary,
    };
    const visual = {
      schema: "mainline-a-r78-visual-v665",
      status: "77-current-build-screenshots-rehashed",
      appSourceSha256: source.sha256,
      buildId: build.value.buildId,
      source: browser.pin,
      canonicalSources: [canonicalDesktop.pin,
        canonicalMobile.pin],
      screenshots,
      humanPerItemSignoff: false,
      realUserValidation: false, boundary,
    };
    await exclusive(paths.http, http);
    await exclusive(paths.browser, browserReceipt);
    await exclusive(paths.visual, visual);
    return { status: "passed-local-web-evidence",
      outputs: paths, screenshotCount: screenshots.length,
      matrixSelections: 192,
      canonicalScenes: 72,
      appSourceSha256: source.sha256 };
  } catch (error) {
    const attempt = { schema: "mainline-a-r78-web-attempt-v665",
      status: "failed-preserved",
      runId: config.runId, stage,
      startedAt, endedAt: new Date().toISOString(),
      appSourceSha256: source.sha256,
      errorClass: error?.name ?? "Error",
      errorMessage: error?.message ?? String(error),
      evidencePromoted: false,
      scientificPayloadWriteback: false };
    try { await exclusive(paths.attempt, attempt); }
    catch { /* Keep a prior attempt and the original failure. */ }
    throw error;
  }
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runR78WebEvidenceV665(
    parseR78WebEvidenceOptionsV665(process.argv.slice(2)))));
}
