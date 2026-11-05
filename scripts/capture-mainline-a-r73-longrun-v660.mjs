import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { observe, captureResourceCycle, waitForObservation,
  browserReceipt, verifyLongRunLaunchV650, verifyLongRunRawV650,
  verifyRawClockAgreementV650 } from
  "./capture-mainline-a-web-r65-longrun-v650.mjs";
import longRunModule from "../app/lib/mainlineAR65LongRunV643.ts";

const { verifyMainlineAR65LongRunReceiptV643,
  replayMainlineAR65LongRunReceiptV643 } =
  longRunModule.default ?? longRunModule;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const R75_PROFILE = process.env.MAINLINE_A_R75_PROFILE === "1";
const VIEWPORTS = { desktop: { width: 1280, height: 720 },
  mobile: { width: 390, height: 844 } };

function fail(code, detail) {
  throw new Error(`r73-longrun-v660:${code}${detail === undefined
    ? "" : `:${JSON.stringify(detail)}`}`);
}
function check(condition, code, detail) {
  if (!condition) fail(code, detail);
}
function log(stage, detail = {}) {
  console.log(JSON.stringify({ at: new Date().toISOString(), stage,
    ...detail }));
}
function options(argv) {
  check((argv[0] === "--probe" && argv.length === 3)
    || (argv[0] === "--run" && argv.length === 4), "usage-invalid");
  const runId = argv[1];
  const port = Number(argv[2]);
  check((R75_PROFILE ? /^20261013v662r75web0[1-9]$/
    : /^20261013v660r73web0[1-9]$/).test(runId)
    && Number.isInteger(port) && port >= 1024 && port <= 65535,
  "run-id-or-port-invalid");
  const observationId = argv[0] === "--run" ? argv[3] : null;
  if (observationId) check((R75_PROFILE
    ? /^20261013v662r75long0[1-9]$/
    : /^20261013v660r73long0[1-9]$/).test(
    observationId), "observation-id-invalid");
  return { mode: argv[0].slice(2), runId, port, observationId };
}
function paths(config) {
  const prefix = `docs/release/v607/mainline-a-${R75_PROFILE
    ? "r75-v662" : "r73-v660"}-browser`;
  return {
    build: `docs/release/v607/mainline-a-${R75_PROFILE
      ? "r75" : "r73"}-build-${config.runId}.json`,
    desktop: `${prefix}-desktop-raw-${config.observationId}.json`,
    final: `${prefix}-final-raw-${config.observationId}.json`,
    audit: `docs/release/v607/mainline-a-${R75_PROFILE
      ? "r75-v662" : "r73-v660"}-longrun-audit-${config.observationId}.json`,
    attempt: `${prefix}-attempt-${config.observationId}.json`,
  };
}
async function save(relative, value) {
  await writeFile(path.join(ROOT, relative),
    `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
}
async function sourceSha() {
  return (await captureBuildInputs()).sha256;
}

export function verifyR73LongRunV660(raw, desktop, build, source) {
  const issues = [];
  const basic = verifyMainlineAR65LongRunReceiptV643(raw);
  const replay = replayMainlineAR65LongRunReceiptV643(raw);
  const driver = verifyLongRunRawV650(raw, 2, "mobile", build);
  const clock = verifyRawClockAgreementV650(raw);
  if (!basic.ok || basic.completeLongRuns !== 2
    || !driver.ok || !clock.ok
    || replay.status !== "verified" || replay.failures.length !== 0
    || raw.status !== "qualified"
    || raw.claims?.productionPerformance !== false
    || raw.claims?.physicalMobile !== false
    || raw.claims?.copyrightApproval !== false
    || raw.boundary?.scientificPayloadWriteback !== false
    || raw.build?.buildId !== build.runtimeBuildId
    || build.inputAfterSha256 !== source) {
    issues.push("raw-longrun-invalid");
  }
  if (desktop?.observations?.length !== 1
    || raw?.observations?.length !== 2
    || desktop.observations[0]?.digest !== raw.observations[0]?.digest) {
    issues.push("desktop-checkpoint-drift");
  }
  const rows = raw?.observations ?? [];
  if (rows[0]?.device !== "desktop" || rows[1]?.device !== "mobile"
    || rows.some((row) => row.observedDurationMs < 30 * 60 * 1000
      || Date.parse(row.endedAt) - Date.parse(row.startedAt)
        < 30 * 60 * 1000
      || row.visibility?.interruptions !== 0
      || row.consoleErrors !== 0 || row.pageErrors !== 0
      || row.resources?.active?.total <= row.resources?.baseline?.total
      || row.resources?.final?.identityDigest
        !== row.resources?.baseline?.identityDigest
      || row.resources?.final?.total !== row.resources?.baseline?.total)
    || rows[0]?.independenceKey === rows[1]?.independenceKey
    || Date.parse(rows[0]?.endedAt) >= Date.parse(rows[1]?.startedAt)) {
    issues.push("independent-duration-resource-or-errors-invalid");
  }
  return { ok: issues.length === 0, issues,
    completeLongRuns: basic.completeLongRuns,
    devices: rows.map((row) => row.device),
    durationsMs: rows.map((row) => row.observedDurationMs),
    frameP95Ms: rows.map((row) => row.frameSummary?.p95Ms),
    heapDeltasBytes: rows.map((row) => row.memorySummary?.deltaBytes),
    resourceTotals: rows.map((row) => [row.resources?.baseline?.total,
      row.resources?.active?.total, row.resources?.final?.total]),
    replayStatus: replay.status, replayFailures: replay.failures,
    basicIssues: basic.issues, driverIssues: driver.issues,
    clockIssues: clock.issues };
}

async function openPanel(page, origin, build, currentSha) {
  await page.goto(origin, { waitUntil: "domcontentloaded",
    timeout: 30_000 });
  await page.locator("[data-atlas-app-shell]").waitFor({
    state: "visible", timeout: 30_000 });
  await page.locator("[data-mainline-a-tools-toggle]").click();
  await page.getByRole("button", { name: "性能生命周期" }).click();
  const panel = page.locator("[data-mainline-a-r65-longrun]");
  await panel.waitFor({ state: "attached", timeout: 15_000 });
  await page.waitForFunction(() => {
    const archive = document.querySelector(
      "[data-mainline-a-r65-archive]");
    const state = archive?.getAttribute("data-mainline-a-r65-archive");
    return state && state !== "loading" && state !== "saving";
  }, null, { timeout: 20_000 });
  const runtime = await observe(page);
  const checkLaunch = verifyLongRunLaunchV650(build, currentSha, runtime);
  check(checkLaunch.ok, "runtime-build-or-boundary-invalid",
    { issues: checkLaunch.issues, runtime });
  check(runtime.observationCount === 0
    && runtime.viewport[0] === VIEWPORTS.desktop.width
    && runtime.viewport[1] === VIEWPORTS.desktop.height,
  "prior-observations-or-viewport-invalid", runtime);
  return runtime;
}

async function run(config) {
  const location = paths(config);
  const build = JSON.parse(await readFile(path.join(ROOT, location.build),
    "utf8"));
  const before = await sourceSha();
  const checkLaunch = verifyLongRunLaunchV650(build, before, null);
  check(checkLaunch.ok, "saved-build-or-source-invalid",
    checkLaunch.issues);
  const origin = `http://127.0.0.1:${config.port}`;
  const startedAt = new Date().toISOString();
  let stage = "browser-launch";
  let lastState = null;
  const browser = await chromium.launch({
    headless: process.env.MAINLINE_A_R73_HEADLESS !== "0",
    executablePath: CHROME,
  });
  try {
    const context = await browser.newContext({
      viewport: VIEWPORTS.desktop, deviceScaleFactor: 1,
    });
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(12_000);
      stage = "panel-open";
      lastState = await openPanel(page, origin, build, before);
      log("panel-ready", { mode: config.mode,
        buildId: build.buildId, resourceTotal: lastState.resourceTotal,
        visibility: lastState.visibility });
      if (config.mode === "probe") return;

      stage = "desktop-resource-cycle";
      const desktopCycle = await captureResourceCycle(page, "desktop");
      stage = "desktop-observation";
      lastState = await waitForObservation(page, "desktop", 1,
        desktopCycle.clockOffsetMs);
      const desktop = await browserReceipt(page);
      const desktopCheck = verifyLongRunRawV650(desktop, 1,
        "desktop", build);
      const desktopClock = verifyRawClockAgreementV650(desktop);
      check(desktopCheck.ok && desktopClock.ok,
        "desktop-observation-invalid",
        [...desktopCheck.issues, ...desktopClock.issues]);
      await save(location.desktop, desktop);
      check((await sourceSha()) === before,
        "source-drift-after-desktop");
      log("desktop-saved", { path: location.desktop,
        durationMs: desktop.observations[0].observedDurationMs });

      stage = "mobile-viewport";
      await page.waitForFunction(() =>
        document.querySelector("[data-mainline-a-r65-archive]")
          ?.getAttribute("data-mainline-a-r65-archive") === "available",
      null, { timeout: 20_000 });
      await page.setViewportSize(VIEWPORTS.mobile);
      lastState = await observe(page);
      check(lastState.viewport[0] === VIEWPORTS.mobile.width
        && lastState.viewport[1] === VIEWPORTS.mobile.height,
      "mobile-viewport-invalid", lastState);
      stage = "mobile-resource-cycle";
      const mobileCycle = await captureResourceCycle(page, "mobile");
      stage = "mobile-observation";
      lastState = await waitForObservation(page, "mobile", 2,
        mobileCycle.clockOffsetMs);
      const final = await browserReceipt(page);
      stage = "final-verification";
      const qualification = verifyR73LongRunV660(final, desktop,
        build, before);
      check(qualification.ok, "final-longrun-invalid",
        qualification.issues);
      check((await sourceSha()) === before,
        "source-drift-after-final");
      await save(location.final, final);
      const audit = {
        schema: R75_PROFILE ? "mainline-a-r75-longrun-audit-v662"
          : "mainline-a-r73-longrun-audit-v660",
        status: "verified-two-independent-current-source-local-browser-runs",
        startedAt, endedAt: new Date().toISOString(),
        buildReceipt: location.build, buildId: build.buildId,
        runtimeBuildId: build.runtimeBuildId,
        sourceSha256: before, origin, qualification,
        rawDesktop: location.desktop, rawFinal: location.final,
        physicalMobile: "not-run",
        evidenceClass: "performance-local-browser-observation",
        claims: { productionPerformance: false, realUserValidation: false,
          physicalMobile: false, scientificValidity: false,
          copyrightApproval: false, publicWebReleaseApproved: false,
          scientificPayloadWriteback: false },
      };
      await save(location.audit, audit);
      log("final-saved", { path: location.final,
        audit: location.audit, durationsMs: qualification.durationsMs,
        resourceTotals: qualification.resourceTotals });
    } finally {
      await context.close();
    }
  } catch (error) {
    if (config.mode === "run") await save(location.attempt, {
      schema: R75_PROFILE ? "mainline-a-r75-longrun-attempt-v662"
        : "mainline-a-r73-longrun-attempt-v660",
      status: "failed-preserved", startedAt,
      endedAt: new Date().toISOString(), stage,
      buildReceipt: location.build, sourceSha256: before,
      lastState, errorClass: error?.name ?? "Error",
      errorMessage: error?.message ?? String(error),
      browserObservationQualified: false,
      productionPerformance: false,
      scientificPayloadWriteback: false,
    });
    throw error;
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  await run(options(process.argv.slice(2)));
}
