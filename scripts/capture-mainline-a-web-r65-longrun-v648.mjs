import { readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = "http://127.0.0.1:3091";
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const run = "20261007-v648long01";
const buildPath = "docs/release/v607/mainline-a-r66-build-20261007-v648web01.json";
const desktopPath = `docs/release/v607/mainline-a-r66-web-r65-browser-desktop-raw-${run}.json`;
const finalPath = `docs/release/v607/mainline-a-r66-web-r65-browser-final-raw-${run}.json`;
const attemptPath = `docs/release/v607/mainline-a-r66-web-r65-browser-attempt-${run}.json`;
const build = JSON.parse(await readFile(path.join(root, buildPath), "utf8"));
if (build.status !== "passed" || build.sourceStable !== true || build.exitCode !== 0) {
  throw new Error("longrun-v648:build-not-passed");
}
const command = process.argv[2];
if (!new Set(["--probe", "--run"]).has(command) || process.argv.length !== 3) {
  throw new Error("longrun-v648:specify-exactly---probe-or---run");
}
const startedAt = new Date().toISOString();
let lastState = null;

async function exclusive(relative, data) {
  await writeFile(path.join(root, relative), `${JSON.stringify(data, null, 2)}\n`,
    { encoding: "utf8", flag: "wx" });
}
async function assertAbsent(relative) {
  try { await access(path.join(root, relative)); throw new Error(`longrun-v648:output-exists:${relative}`); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}
function check(value, code) { if (!value) throw new Error(`longrun-v648:${code}`); }
function log(state) { console.log(JSON.stringify({ at: new Date().toISOString(), ...state })); }

async function observe(page) {
  return page.evaluate(() => {
    const shell = document.querySelector("[data-atlas-app-shell]");
    const panel = document.querySelector("[data-mainline-a-r65-longrun]");
    const guided = panel?.querySelector("[data-mainline-a-r65-guided-scene]");
    const receipt = window.__mainlineAR65LongRunReceiptV643;
    return {
      visibility: document.visibilityState,
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
async function waitCondition(page, predicate, code, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await observe(page);
    lastState = state;
    if (predicate(state)) return state;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`longrun-v648:${code}:${JSON.stringify(lastState)}`);
}

async function openPanel(page) {
  await page.goto(`${origin}/`, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.locator("[data-atlas-app-shell]").waitFor({ state: "visible", timeout: 15_000 });
  await page.locator("[data-mainline-a-tools-toggle]").click({ timeout: 8_000 });
  await page.getByRole("button", { name: "性能生命周期" }).click({ timeout: 8_000 });
  await page.locator("[data-mainline-a-r65-longrun]").waitFor({ state: "attached", timeout: 8_000 });
  return waitCondition(page, (state) => state.archiveState !== "loading"
    && state.archiveState !== "saving" && state.resourceTotal > 0, "panel-not-ready");
}

async function startObservation(page, device, viewport) {
  check(JSON.stringify((await observe(page)).viewport) === JSON.stringify(viewport), `${device}:viewport-drift`);
  const panel = page.locator("[data-mainline-a-r65-longrun]");
  await panel.locator("select").nth(0).selectOption(device);
  await panel.locator("select").nth(1).selectOption("atlas");
  const baseline = await waitCondition(page, (state) => state.visibility === "visible"
    && state.guidedSelected === "none" && state.resourceTotal > 0,
  `${device}:baseline-not-stable`);
  await panel.getByRole("button", { name: "开始 30 分钟" }).click({ timeout: 8_000 });
  await panel.getByRole("button", { name: "中止并留账" }).waitFor({ state: "visible", timeout: 8_000 });
  await panel.locator("[data-mainline-a-r65-focus-guided]").click({ timeout: 8_000 });
  const active = await waitCondition(page, (state) => state.guidedSelected === "nebula:m42"
    && state.guidedRegistry === "ready" && state.imageStatus === "ready"
    && state.resourceTotal > baseline.resourceTotal,
  `${device}:real-renderable-resource-not-loaded`, 30_000);
  await panel.locator("[data-mainline-a-r65-capture-active]").click({ timeout: 8_000 });
  await waitCondition(page, (state) => state.notice?.includes("活动快照 rev"),
    `${device}:active-checkpoint-not-captured`);
  await panel.locator("[data-mainline-a-r65-return-baseline]").click({ timeout: 8_000 });
  const restored = await waitCondition(page, (state) => state.guidedSelected === "none"
    && state.guidedReturn === "baseline"
    && state.resourceTotal === baseline.resourceTotal
    && state.resourceIdentityDigest === baseline.resourceIdentityDigest,
  `${device}:baseline-not-restored`, 30_000);
  log({ stage: "real-resource-cycle-captured", device,
    baseline: { total: baseline.resourceTotal, digest: baseline.resourceIdentityDigest },
    active: { total: active.resourceTotal, digest: active.resourceIdentityDigest },
    restored: { total: restored.resourceTotal, digest: restored.resourceIdentityDigest } });
}

async function waitForObservation(page, device, requiredCount) {
  const deadline = Date.now() + 31 * 60 * 1000;
  let lastLog = 0;
  while (Date.now() < deadline) {
    const state = await observe(page);
    lastState = state;
    if (state.observationCount >= requiredCount) {
      log({ stage: "observation-finished", device, state });
      return state;
    }
    if (state.visibility !== "visible") {
      throw new Error(`longrun-v648:${device}:visibility-interrupted:${JSON.stringify(state)}`);
    }
    if (Date.now() - lastLog >= 55_000) {
      log({ stage: "observing", device, count: state.observationCount,
        panelStatus: state.panelStatus, resourceTotal: state.resourceTotal,
        notice: state.notice });
      lastLog = Date.now();
    }
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  throw new Error(`longrun-v648:${device}:duration-timeout:${JSON.stringify(lastState)}`);
}

async function receipt(page) {
  return page.evaluate(() => window.__mainlineAR65LongRunReceiptV643 ?? null);
}

if (command === "--run") {
  await assertAbsent(desktopPath);
  await assertAbsent(finalPath);
  await assertAbsent(attemptPath);
}
const browser = await chromium.launch({ headless: false, executablePath: chrome });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);
    const opened = await openPanel(page);
    check(opened.buildId === build.runtimeBuildId
      && opened.branch === build.branch && opened.head === build.head
      && opened.releaseBoundary === "candidate-only-hold-not-admitted"
      && opened.visibility === "visible", "build-or-boundary-drift");
    log({ stage: "panel-probe", mode: command, state: opened });
    if (command === "--run") {
      check(opened.observationCount === 0, "unexpected-prior-observations");
      await startObservation(page, "desktop", [1280, 720]);
      await waitForObservation(page, "desktop", 1);
      const desktop = await receipt(page);
      await exclusive(desktopPath, desktop);
      check(desktop?.observations?.length === 1
        && desktop.observations[0].device === "desktop"
        && desktop.observations[0].status === "complete", "desktop-receipt-incomplete");
      log({ stage: "desktop-raw-saved", path: desktopPath, bytes: JSON.stringify(desktop).length });
      await waitCondition(page, (state) => state.archiveState === "available", "archive-not-saved");
      await page.setViewportSize({ width: 390, height: 844 });
      await waitCondition(page, (state) => JSON.stringify(state.viewport) === "[390,844]"
        && state.guidedSelected === "none", "mobile-viewport-not-ready");
      await startObservation(page, "mobile", [390, 844]);
      await waitForObservation(page, "mobile", 2);
      const final = await receipt(page);
      await exclusive(finalPath, final);
      check(final?.observations?.length === 2 && final.observations[1].device === "mobile"
        && final.observations[1].status === "complete" && final.status === "qualified",
      "final-receipt-not-qualified");
      log({ stage: "final-raw-saved", path: finalPath, bytes: JSON.stringify(final).length,
        status: final.status, observations: final.observations.length });
    }
  } finally {
    await context.close();
  }
} catch (error) {
  if (command === "--run") {
    await exclusive(attemptPath, { schema: "mainline-a-r66-web-r65-driver-attempt-v648",
      startedAt, endedAt: new Date().toISOString(), buildId: build.buildId,
      sourceSha256: build.inputBefore.sha256, lastState,
      errorClass: error?.name ?? "Error", errorMessage: error?.message ?? String(error),
      browserObservationQualified: false, productionPerformance: false,
      scientificPayloadWriteback: false });
  }
  throw error;
} finally {
  await browser.close();
}
