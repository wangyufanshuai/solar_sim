import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const R78_WEB_STAGE = process.env.MAINLINE_A_LONGRUN_R78_WEB_STAGE === "1";
const R70_WEB_STAGE = process.env.MAINLINE_A_LONGRUN_R70_WEB_STAGE === "1";
const BUILD_PATH = R78_WEB_STAGE
  ? "docs/release/v607/mainline-a-r77-build-20261013v664r77web01.json"
  : R70_WEB_STAGE
  ? "docs/release/v607/mainline-a-r70-build-20261012v657web02.json"
  : "docs/release/v607/mainline-a-r66-build-20261011-v649web02.json";
const ORIGIN = R78_WEB_STAGE
  ? "http://127.0.0.1:3132"
  : R70_WEB_STAGE
  ? "http://127.0.0.1:3101" : "http://127.0.0.1:3093";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const MIN_DURATION_MS = 30 * 60 * 1000;
const VIEWPORTS = Object.freeze({ desktop: [1280, 720], mobile: [390, 844] });

function fail(code, detail) {
  throw new Error(`web-longrun-v650:${code}${detail === undefined ? "" : `:${JSON.stringify(detail)}`}`);
}
function check(condition, code, detail) {
  if (!condition) fail(code, detail);
}
function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function log(stage, detail) {
  console.log(JSON.stringify({ at: new Date().toISOString(), stage, ...detail }));
}
function outputPaths(runId) {
  check((R78_WEB_STAGE ? /^20261013-v665long0[1-9]$/
    : R70_WEB_STAGE ? /^20261012-v657long0[1-9]$/
    : /^20261011-v650long0[1-9]$/).test(runId), "run-id-invalid", runId);
  const prefix = R78_WEB_STAGE
    ? "docs/release/v607/mainline-a-r78-v665-browser"
    : R70_WEB_STAGE
    ? "docs/release/v607/mainline-a-r70-v657-browser"
    : "docs/release/v607/mainline-a-r66-web-r65-browser";
  return Object.freeze({
    desktop: `${prefix}-desktop-raw-${runId}.json`,
    final: `${prefix}-final-raw-${runId}.json`,
    desktopUnqualified: `${prefix}-desktop-unqualified-raw-${runId}.json`,
    finalUnqualified: `${prefix}-final-unqualified-raw-${runId}.json`,
    attempt: `${prefix}-attempt-${runId}.json`,
  });
}
async function writeExclusive(relative, value) {
  await writeFile(path.join(ROOT, relative), `${JSON.stringify(value, null, 2)}\n`,
    { encoding: "utf8", flag: "wx" });
}
async function ensureAbsent(relative) {
  try {
    await access(path.join(ROOT, relative));
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  fail("output-exists", relative);
}

export function verifyLongRunLaunchV650(build, currentSourceSha256, runtime) {
  const issues = [];
  if (build?.status !== "passed" || build?.exitCode !== 0
    || build?.sourceStable !== true || !/^[a-f0-9]{64}$/.test(currentSourceSha256)) {
    issues.push("build-not-passed");
  }
  if (build?.inputBefore?.sha256 !== currentSourceSha256
    || build?.inputAfterSha256 !== currentSourceSha256
    || build?.runtimeBuildId !== `mainline-a-${currentSourceSha256.slice(0, 16)}`) {
    issues.push("source-drift");
  }
  if (runtime) {
    if (runtime.buildId !== build?.runtimeBuildId
      || runtime.branch !== build?.branch || runtime.head !== build?.head) {
      issues.push("runtime-build-drift");
    }
    if (runtime.releaseBoundary !== "candidate-only-hold-not-admitted"
      || runtime.visibility !== "visible" || runtime.resourceTotal <= 0) {
      issues.push("runtime-boundary-or-resource-invalid");
    }
  }
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
}

export function verifyLongRunCheckpointV650(baseline, active, restored) {
  const issues = [];
  if (!baseline || baseline.visibility !== "visible"
    || baseline.guidedSelected !== "none" || baseline.resourceTotal <= 0
    || !baseline.resourceIdentityDigest) issues.push("baseline-invalid");
  if (!active || active.visibility !== "visible"
    || active.guidedSelected !== "nebula:m42" || active.guidedRegistry !== "ready"
    || active.imageStatus !== "ready"
    || !(active.resourceTotal > baseline?.resourceTotal)
    || active.resourceIdentityDigest === baseline?.resourceIdentityDigest) {
    issues.push("active-resource-not-observed");
  }
  if (!restored || restored.visibility !== "visible"
    || restored.guidedSelected !== "none" || restored.guidedReturn !== "baseline"
    || restored.resourceTotal !== baseline?.resourceTotal
    || restored.resourceIdentityDigest !== baseline?.resourceIdentityDigest) {
    issues.push("baseline-not-restored");
  }
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues),
    totals: Object.freeze([baseline?.resourceTotal ?? null,
      active?.resourceTotal ?? null, restored?.resourceTotal ?? null]) });
}

export function verifyLongRunRawV650(raw, expectedCount, expectedDevice, build) {
  const issues = [];
  const rows = Array.isArray(raw?.observations) ? raw.observations : [];
  if (raw?.schema !== "mainline-a-r65-long-run-v643"
    || rows.length !== expectedCount || raw?.build?.buildId !== build?.runtimeBuildId
    || raw?.boundary?.candidateOnly !== true || raw?.boundary?.hold !== true
    || raw?.boundary?.notAdmitted !== true
    || raw?.boundary?.scientificPayloadWriteback !== false
    || raw?.claims?.productionPerformance !== false) {
    issues.push("raw-contract-invalid");
  }
  const entry = rows[expectedCount - 1];
  const viewport = VIEWPORTS[expectedDevice];
  if (!entry || entry.device !== expectedDevice || entry.status !== "complete"
    || entry.observedDurationMs < MIN_DURATION_MS
    || Date.parse(entry.endedAt) - Date.parse(entry.startedAt) < MIN_DURATION_MS
    || !same([entry.viewport?.width, entry.viewport?.height], viewport)
    || !same([entry.endedViewport?.width, entry.endedViewport?.height], viewport)
    || entry.source !== "browser-runtime" || entry.physicalDevice !== false
    || entry.build?.buildId !== build?.runtimeBuildId
    || entry.endedBuild?.buildId !== build?.runtimeBuildId
    || entry.visibility?.interruptions !== 0
    || entry.consoleErrors !== 0 || entry.pageErrors !== 0) {
    issues.push("observation-invalid");
  }
  const resources = entry?.resources;
  if (!resources || !(resources.active?.total > resources.baseline?.total)
    || resources.final?.total !== resources.baseline?.total
    || resources.final?.identityDigest !== resources.baseline?.identityDigest
    || resources.active?.identityDigest === resources.baseline?.identityDigest) {
    issues.push("resource-cycle-invalid");
  }
  if (entry && (entry.frameSummary?.sampleCount < 10_000
    || entry.memorySummary?.sampleCount < 1_500)) issues.push("samples-incomplete");
  if (expectedCount === 2 && (raw?.status !== "qualified"
    || rows[0]?.device !== "desktop"
    || Date.parse(rows[0]?.endedAt) >= Date.parse(rows[1]?.startedAt)
    || rows[0]?.independenceKey === rows[1]?.independenceKey)) {
    issues.push("independence-invalid");
  }
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
}

export function verifyRawClockAgreementV650(raw) {
  const issues = [];
  for (const [index, row] of (raw?.observations ?? []).entries()) {
    const started = Date.parse(row.startedAt);
    const ended = Date.parse(row.endedAt);
    if (!Number.isFinite(started) || !Number.isFinite(ended)
      || !Number.isFinite(row.observedDurationMs)
      || Math.abs((ended - started) - row.observedDurationMs) > 1_500) {
      issues.push(`observation-${index}:clock-disagreement`);
    }
    for (const phase of ["baseline", "active", "final"]) {
      const checkpoint = row.resources?.[phase];
      const captured = Date.parse(checkpoint?.capturedAt);
      if (!Number.isFinite(captured)
        || !Number.isFinite(checkpoint?.atMs)
        || Math.abs((captured - started) - checkpoint.atMs) > 1_500) {
        issues.push(`observation-${index}:resource-time-${phase}`);
      }
    }
  }
  return Object.freeze({ ok: issues.length === 0, issues });
}

async function sourceSha256() {
  return (await captureBuildInputs()).sha256;
}
async function assertSourceStable(stage, build) {
  const actual = await sourceSha256();
  check(actual === build.inputBefore.sha256, "source-drift", { stage,
    expected: build.inputBefore.sha256, actual });
  return actual;
}
export async function observe(page) {
  return page.evaluate(() => {
    const shell = document.querySelector("[data-atlas-app-shell]");
    const panel = document.querySelector("[data-mainline-a-r65-longrun]");
    const guided = panel?.querySelector("[data-mainline-a-r65-guided-scene]");
    const receipt = window.__mainlineAR65LongRunReceiptV643;
    return {
      visibility: document.visibilityState,
      clockOffsetMs: Date.now() - performance.now(),
      viewport: [innerWidth, innerHeight],
      buildId: shell?.getAttribute("data-mainline-build-id"),
      branch: shell?.getAttribute("data-mainline-branch"),
      head: shell?.getAttribute("data-mainline-head"),
      releaseBoundary: shell?.getAttribute("data-mainline-a-release-boundary"),
      resourceTotal: Number(shell?.getAttribute("data-atlas-resource-total")),
      resourceIdentityDigest: shell?.getAttribute("data-atlas-resource-identity-digest"),
      panelStatus: panel?.getAttribute("data-mainline-a-r65-longrun-status"),
      archiveState: panel?.querySelector("[data-mainline-a-r65-archive]")
        ?.getAttribute("data-mainline-a-r65-archive"),
      guidedSelected: guided?.getAttribute("data-mainline-a-r65-guided-selected"),
      guidedRegistry: guided?.getAttribute("data-mainline-a-r65-guided-registry"),
      guidedReturn: guided?.getAttribute("data-mainline-a-r65-guided-return"),
      imageStatus: document.querySelector('[data-mainline-a-scene-nebula="m42"]')
        ?.getAttribute("data-mainline-a-scene-image-status") ?? null,
      observationCount: receipt?.observations?.length ?? 0,
      receiptStatus: receipt?.status ?? null,
      notice: panel?.querySelector("[data-mainline-a-r65-longrun-notice]")?.textContent?.trim() ?? null,
    };
  });
}
async function waitFor(page, predicate, code, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await observe(page);
    if (predicate(last)) return last;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  fail(code, last);
}
export async function openPanel(page) {
  await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.locator("[data-atlas-app-shell]").waitFor({ state: "visible", timeout: 15_000 });
  await page.locator("[data-mainline-a-tools-toggle]").click({ timeout: 8_000 });
  await page.getByRole("button", { name: "性能生命周期" }).click({ timeout: 8_000 });
  await page.locator("[data-mainline-a-r65-longrun]").waitFor({ state: "attached", timeout: 8_000 });
  return waitFor(page, (state) => state.archiveState !== "loading"
    && state.archiveState !== "saving" && state.resourceTotal > 0, "panel-not-ready");
}
export async function captureResourceCycle(page, device) {
  const viewport = VIEWPORTS[device];
  check(same((await observe(page)).viewport, viewport), "viewport-drift", device);
  const panel = page.locator("[data-mainline-a-r65-longrun]");
  await panel.locator("select").nth(0).selectOption(device);
  await panel.locator("select").nth(1).selectOption("atlas");
  const baseline = await waitFor(page, (state) => state.visibility === "visible"
    && state.guidedSelected === "none" && state.resourceTotal > 0,
  "baseline-not-stable");
  await panel.getByRole("button", { name: "开始 30 分钟" }).click({ timeout: 8_000 });
  await panel.getByRole("button", { name: "中止并留账" }).waitFor({ state: "visible", timeout: 8_000 });
  await panel.locator("[data-mainline-a-r65-focus-guided]").click({ timeout: 8_000 });
  const active = await waitFor(page, (state) => state.guidedSelected === "nebula:m42"
    && state.guidedRegistry === "ready" && state.imageStatus === "ready"
    && state.resourceTotal > baseline.resourceTotal,
  "real-renderable-resource-not-loaded", 30_000);
  await panel.locator("[data-mainline-a-r65-capture-active]").click({ timeout: 8_000 });
  await waitFor(page, (state) => state.notice?.includes("活动快照 rev"),
    "active-checkpoint-not-captured");
  await panel.locator("[data-mainline-a-r65-return-baseline]").click({ timeout: 8_000 });
  const restored = await waitFor(page, (state) => state.guidedSelected === "none"
    && state.guidedReturn === "baseline"
    && state.resourceTotal === baseline.resourceTotal
    && state.resourceIdentityDigest === baseline.resourceIdentityDigest,
  "baseline-not-restored", 30_000);
  const verified = verifyLongRunCheckpointV650(baseline, active, restored);
  check(verified.ok, "resource-cycle-invalid", verified.issues);
  log("real-resource-cycle-captured", { device, resourceTotals: verified.totals,
    baselineDigest: baseline.resourceIdentityDigest,
    activeDigest: active.resourceIdentityDigest,
    restoredDigest: restored.resourceIdentityDigest });
  return { ...verified, clockOffsetMs: baseline.clockOffsetMs };
}
export async function waitForObservation(page, device, requiredCount,
  clockBaselineMs = null) {
  const deadline = Date.now() + 31 * 60 * 1000;
  let lastLog = 0;
  let last = null;
  while (Date.now() < deadline) {
    last = await observe(page);
    if (clockBaselineMs !== null) {
      check(Number.isFinite(last.clockOffsetMs)
        && Math.abs(last.clockOffsetMs - clockBaselineMs) <= 1_200,
      "browser-clock-drift", { device,
        baseline: clockBaselineMs, observed: last.clockOffsetMs });
    }
    if (last.observationCount >= requiredCount) {
      log("observation-finished", { device, panelStatus: last.panelStatus,
        observationCount: last.observationCount, resourceTotal: last.resourceTotal });
      return last;
    }
    check(last.visibility === "visible", "visibility-interrupted", { device, last });
    if (Date.now() - lastLog >= 55_000) {
      log("observing", { device, count: last.observationCount,
        panelStatus: last.panelStatus, resourceTotal: last.resourceTotal });
      lastLog = Date.now();
    }
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  fail("duration-timeout", { device, last });
}
export async function browserReceipt(page) {
  return page.evaluate(() => window.__mainlineAR65LongRunReceiptV643 ?? null);
}

async function runCapture(mode, runId) {
  const BUILD = JSON.parse(await readFile(path.join(ROOT, BUILD_PATH), "utf8"));
  const paths = outputPaths(runId);
  if (mode === "run") {
    await Promise.all(Object.values(paths).map(ensureAbsent));
  }
  const startedAt = new Date().toISOString();
  let stage = "source-check";
  let lastState = null;
  const currentSha = await sourceSha256();
  const launch = verifyLongRunLaunchV650(BUILD, currentSha, null);
  check(launch.ok, "build-source-invalid", launch.issues);
  const browser = await chromium.launch({ headless: R78_WEB_STAGE,
    executablePath: CHROME });
  try {
    stage = "open-browser";
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1 });
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(10_000);
      const opened = await openPanel(page);
      lastState = opened;
      const runtime = verifyLongRunLaunchV650(BUILD, currentSha, opened);
      check(runtime.ok, "runtime-build-invalid", runtime.issues);
      log("panel-probe", { mode, buildId: BUILD.buildId, state: opened });
      if (mode === "probe") return;
      check(opened.observationCount === 0, "unexpected-prior-observations");

      stage = "desktop-resource-cycle";
      const desktopCycle = await captureResourceCycle(page, "desktop");
      stage = "desktop-observation";
      lastState = await waitForObservation(page, "desktop", 1,
        desktopCycle.clockOffsetMs);
      const desktop = await browserReceipt(page);
      const desktopCheck = verifyLongRunRawV650(desktop, 1, "desktop", BUILD);
      const desktopClock = verifyRawClockAgreementV650(desktop);
      if (!desktopCheck.ok || !desktopClock.ok) {
        await writeExclusive(paths.desktopUnqualified, desktop);
        check(false, "desktop-raw-invalid",
          [...desktopCheck.issues, ...desktopClock.issues]);
      }
      await writeExclusive(paths.desktop, desktop);
      await assertSourceStable("desktop-saved", BUILD);
      log("desktop-raw-saved", { path: paths.desktop,
        durationMs: desktop.observations[0].observedDurationMs });

      stage = "mobile-viewport";
      await waitFor(page, (state) => state.archiveState === "available",
        "desktop-archive-not-available");
      await page.setViewportSize({ width: 390, height: 844 });
      lastState = await waitFor(page, (state) => same(state.viewport, VIEWPORTS.mobile)
        && state.guidedSelected === "none", "mobile-viewport-not-ready");
      stage = "mobile-resource-cycle";
      const mobileCycle = await captureResourceCycle(page, "mobile");
      stage = "mobile-observation";
      lastState = await waitForObservation(page, "mobile", 2,
        mobileCycle.clockOffsetMs);
      const final = await browserReceipt(page);
      const finalCheck = verifyLongRunRawV650(final, 2, "mobile", BUILD);
      const finalClock = verifyRawClockAgreementV650(final);
      if (!finalCheck.ok || !finalClock.ok) {
        await writeExclusive(paths.finalUnqualified, final);
        check(false, "final-raw-invalid",
          [...finalCheck.issues, ...finalClock.issues]);
      }
      await writeExclusive(paths.final, final);
      await assertSourceStable("final-saved", BUILD);
      log("final-raw-saved", { path: paths.final, status: final.status,
        durationMs: final.observations.map((row) => row.observedDurationMs) });
    } finally {
      await context.close();
    }
  } catch (error) {
    if (mode === "run") {
      await writeExclusive(paths.attempt, {
        schema: R78_WEB_STAGE
          ? "mainline-a-r78-web-r65-driver-attempt-v665"
          : R70_WEB_STAGE
          ? "mainline-a-r70-web-r65-driver-attempt-v657"
          : "mainline-a-r66-web-r65-driver-attempt-v650",
        startedAt, endedAt: new Date().toISOString(), stage,
        sourceSha256: currentSha, buildId: BUILD.buildId,
        buildPath: BUILD_PATH, lastState,
        errorClass: error?.name ?? "Error",
        errorMessage: error?.message ?? String(error),
        browserObservationQualified: false,
        productionPerformance: false,
        scientificPayloadWriteback: false,
      });
    }
    throw error;
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, suppliedRunId] = process.argv.slice(2);
  check((mode === "--probe" && process.argv.length === 3)
    || (mode === "--run" && process.argv.length === 4), "usage-invalid");
  await runCapture(mode.slice(2), suppliedRunId
    ?? (R78_WEB_STAGE ? "20261013-v665long01"
      : R70_WEB_STAGE ? "20261012-v657long02" : "20261011-v650long01"));
}
