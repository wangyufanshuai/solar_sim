import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { R74_TARGET_IDS_V661 } from "./mainline-a-r74-alternative-contract-v661.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const RUN = "20261013v661r74web03";
const BUILD = "docs/release/v607/mainline-a-r74-build-20261013v661r74web02.json";
const OUTPUT = `docs/release/v607/mainline-a-r74-v661-browser-${RUN}.json`;
const VISUAL = `docs/release/v607/mainline-a-r74-v661-visual-${RUN}.json`;
const PERFORMANCE = `docs/release/v607/mainline-a-r74-v661-performance-${RUN}.json`;
const VIEWPORTS = { desktop: { width: 1280, height: 720 },
  "mobile-viewport": { width: 390, height: 844 } };

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assert(condition, code, detail = null) {
  if (!condition) throw new Error(`r74-browser-v661:${code}:${JSON.stringify(detail)}`);
}

function selectedPort(argv) {
  assert(argv.length === 2 && argv[0] === "--port", "usage-invalid");
  const port = Number(argv[1]);
  assert(Number.isInteger(port) && port >= 1024 && port <= 65535,
    "port-invalid", port);
  return port;
}

async function captureScreenshot(page, device, kind) {
  const relative = `docs/release/v607/mainline-a-r74-v661-${device}-${kind}-${RUN}.png`;
  const bytes = await page.screenshot({ fullPage: false });
  await writeFile(path.join(ROOT, relative), bytes, { flag: "wx" });
  return { path: relative, bytes: bytes.length, sha256: sha256(bytes),
    viewport: VIEWPORTS[device], subject: kind };
}

async function frameDiagnostic(page) {
  return page.evaluate(() => new Promise((resolve) => {
    const samples = [];
    let previous = null;
    const tick = (at) => {
      if (previous !== null) samples.push(at - previous);
      previous = at;
      if (samples.length < 120) requestAnimationFrame(tick);
      else {
        samples.sort((a, b) => a - b);
        resolve({ sampleCount: samples.length,
          intervalP50Ms: samples[Math.floor(samples.length * 0.50)],
          intervalP95Ms: samples[Math.floor(samples.length * 0.95)],
          intervalMaxMs: samples.at(-1) });
      }
    };
    requestAnimationFrame(tick);
  }));
}

async function layout(page) {
  return page.evaluate((selector) => {
    const target = document.querySelector(selector);
    const dialog = document.querySelector('[data-mainline-a-nebula-review="true"]');
    const search = target?.querySelector('input[aria-label="搜索 R74 星云官方来源"]');
    return { viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      dialogWidth: dialog?.clientWidth ?? 0,
      dialogScrollWidth: dialog?.scrollWidth ?? 0,
      panelWidth: target?.clientWidth ?? 0,
      panelScrollWidth: target?.scrollWidth ?? 0,
      searchWidth: search?.getBoundingClientRect().width ?? 0 };
  }, '[data-mainline-a-r74-panel="v661"]');
}

async function inspectViewport(browser, origin, device, build) {
  const mobile = device === "mobile-viewport";
  const context = await browser.newContext({ viewport: VIEWPORTS[device],
    deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(15_000);
    const pageErrors = [];
    const consoleErrors = [];
    const remoteImageRequests = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("request", (request) => {
      if (request.url().startsWith("https://assets.science.nasa.gov/")) {
        remoteImageRequests.push({ url: request.url(), type: request.resourceType() });
      }
    });
    await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 25_000 });
    const shell = page.locator("[data-atlas-app-shell]");
    await shell.waitFor({ state: "visible", timeout: 25_000 });
    assert(await shell.getAttribute("data-mainline-build-id")
      === build.runtimeBuildId, `${device}:runtime-build-id-invalid`);
    const selectedBefore = await shell.getAttribute(
      "data-celestial-catalog-selected-id");
    await page.getByRole("button", { name: /^工具/ }).click();
    await page.getByRole("button", { name: "清权审查" }).click();
    const panel = page.locator('[data-mainline-a-r74-panel="v661"]');
    await panel.waitFor({ state: "visible", timeout: 15_000 });
    assert(await panel.getAttribute("data-mainline-a-r74-status")
      === "verified-candidate-hold", `${device}:overlay-invalid`);
    assert(await panel.getAttribute("data-mainline-a-r74-image-requests")
      === "0", `${device}:image-request-state-invalid`);
    await panel.getByRole("button", { name: "展开来源核对" }).click();
    assert(await panel.locator("[data-mainline-a-r74-target]").count() === 5,
      `${device}:five-targets-missing`);
    assert(await panel.locator("[data-mainline-a-r74-known-conflict]")
      .count() === 1, `${device}:known-conflict-missing`);
    const measurements = await layout(page);
    assert(measurements.documentWidth <= measurements.viewportWidth
      && measurements.dialogScrollWidth <= measurements.dialogWidth
      && measurements.panelScrollWidth <= measurements.panelWidth
      && measurements.searchWidth >= 200,
    `${device}:horizontal-overflow`, measurements);
    const heapBefore = await page.evaluate(() =>
      performance.memory?.usedJSHeapSize ?? null);
    const conflict = panel.locator("[data-mainline-a-r74-known-conflict]");
    await conflict.scrollIntoViewIfNeeded();
    const conflictScreenshot = await captureScreenshot(page, device, "conflict");
    await panel.getByRole("button", { name: "身份冲突" }).click();
    assert(await panel.locator("[data-mainline-a-r74-target]").count() === 1,
      `${device}:conflict-filter-invalid`);
    await panel.getByRole("button", { name: "全部 5 项" }).click();
    const search = panel.getByRole("searchbox", { name: "搜索 R74 星云官方来源" });
    await search.fill("PIA11827");
    assert(await panel.locator("[data-mainline-a-r74-target]").count() === 1,
      `${device}:search-invalid`);
    await search.fill("");
    const rows = [];
    for (const id of R74_TARGET_IDS_V661) {
      const before = await page.evaluate(() => performance.now());
      await panel.locator(`[data-mainline-a-r74-target="${id}"]`).click();
      const detail = panel.locator(`[data-mainline-a-r74-detail="${id}"]`);
      await detail.waitFor({ state: "visible" });
      await page.locator(`[data-nebula-review-r74-detail="${id}"]`)
        .waitFor({ state: "visible" });
      const sourceCount = await detail.locator("[data-mainline-a-r74-source]").count();
      assert(sourceCount === (id === "dumbbell-nebula" ? 2 : 1),
        `${device}:${id}:alternative-count-invalid`, sourceCount);
      assert(await detail.locator("img").count() === 0,
        `${device}:${id}:image-rendered-without-policy`);
      const sourceEntries = await detail.locator("[data-mainline-a-r74-source]")
        .evaluateAll((elements) => elements.map((element) => ({
          key: element.getAttribute("data-mainline-a-r74-source"),
          identity: element.getAttribute("data-mainline-a-r74-identity"),
          responseCaptured: element.getAttribute(
            "data-mainline-a-r74-response-captured"),
          imageRequested: element.getAttribute("data-mainline-a-r74-image-requested"),
        })));
      assert(sourceEntries.every((entry) => entry.responseCaptured === "1"
        && entry.imageRequested === "false"),
      `${device}:${id}:response-or-image-boundary-invalid`, sourceEntries);
      if (id === "dumbbell-nebula") {
        assert(sourceEntries[0].identity === "identity-conflict"
          && sourceEntries[1].identity === "page-identity-confirmed",
        `${device}:dumbbell-conflict-erased`, sourceEntries);
      }
      assert(await detail.locator("a[href^='https://science.nasa.gov/']")
        .count() === sourceCount,
      `${device}:${id}:official-source-links-invalid`);
      const elapsed = await page.evaluate(() => performance.now()) - before;
      rows.push({ id, sourceEntries,
        interactionMs: Math.round(elapsed * 100) / 100 });
    }
    await panel.locator('[data-mainline-a-r74-target="dumbbell-nebula"]').click();
    const detail = panel.locator('[data-mainline-a-r74-detail="dumbbell-nebula"]');
    await detail.scrollIntoViewIfNeeded();
    const detailScreenshot = await captureScreenshot(page, device, "detail");
    const frames = await frameDiagnostic(page);
    const heapAfter = await page.evaluate(() =>
      performance.memory?.usedJSHeapSize ?? null);
    assert(remoteImageRequests.length === 0,
      `${device}:unapproved-remote-image-request`, remoteImageRequests);
    await page.getByRole("button", { name: "关闭星云清权审查台" }).click();
    await panel.waitFor({ state: "detached", timeout: 15_000 });
    assert(await shell.getAttribute("data-celestial-catalog-selected-id")
      === selectedBefore, `${device}:canonical-selection-changed`);
    assert(pageErrors.length === 0 && consoleErrors.length === 0,
      `${device}:browser-errors`, { pageErrors, consoleErrors });
    return { device, viewport: VIEWPORTS[device], measurements,
      selectedCatalogUnchanged: true, rows,
      remoteImageRequests, pageErrors, consoleErrors,
      screenshots: [conflictScreenshot, detailScreenshot],
      shortPerformanceDiagnostic: { heapBeforeBytes: heapBefore,
        heapAfterBytes: heapAfter, frames,
        interactionMs: rows.map((row) => row.interactionMs) } };
  } finally {
    await context.close();
  }
}

export async function runR74BrowserV661(port) {
  const build = JSON.parse(await readFile(path.join(ROOT, BUILD), "utf8"));
  const source = await captureBuildInputs();
  assert(build.status === "passed" && build.sourceStable === true
    && build.inputAfterSha256 === source.sha256,
  "build-source-drift", { build: build.inputAfterSha256, current: source.sha256 });
  const origin = `http://127.0.0.1:${port}`;
  const startedAt = new Date().toISOString();
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  try {
    const desktop = await inspectViewport(browser, origin, "desktop", build);
    const mobileViewport = await inspectViewport(browser, origin,
      "mobile-viewport", build);
    assert((await captureBuildInputs()).sha256 === source.sha256,
      "source-drift-during-browser");
    const browserReceipt = {
      schema: "mainline-a-r74-browser-evidence-v661",
      status: "passed-local-desktop-and-simulated-mobile-viewport",
      startedAt, endedAt: new Date().toISOString(),
      origin, buildId: build.buildId,
      runtimeBuildId: build.runtimeBuildId,
      appSourceSha256: source.sha256,
      desktop: { ...desktop, screenshots: undefined,
        shortPerformanceDiagnostic: undefined },
      mobileViewport: { ...mobileViewport, screenshots: undefined,
        shortPerformanceDiagnostic: undefined },
      totals: { heldTargetSelections: 10,
        pageAlternativesInspected: 12,
        knownIdentityConflicts: 2,
        remoteImageRequests: 0,
        pageErrors: 0, consoleErrors: 0 },
      physicalMobile: "not-run", realUserValidationClaimed: false,
      publicDeployment: "not-run", scientificPayloadWriteback: false,
    };
    const visual = { schema: "mainline-a-r74-visual-evidence-v661",
      status: "local-browser-screenshots-no-human-signoff",
      buildId: build.buildId, appSourceSha256: source.sha256,
      screenshots: [...desktop.screenshots, ...mobileViewport.screenshots],
      humanVisualSignoff: false, copyrightApproval: false };
    const performance = {
      schema: "mainline-a-r74-performance-diagnostic-v661",
      status: "short-local-headless-chrome-diagnostic",
      buildId: build.buildId, appSourceSha256: source.sha256,
      desktop: desktop.shortPerformanceDiagnostic,
      mobileViewport: mobileViewport.shortPerformanceDiagnostic,
      longRunCurrentSource: "not-run-in-r74",
      productionPerformanceClaimed: false,
      physicalMobile: "not-run" };
    await writeFile(path.join(ROOT, OUTPUT),
      `${JSON.stringify(browserReceipt, null, 2)}\n`, { flag: "wx" });
    await writeFile(path.join(ROOT, VISUAL),
      `${JSON.stringify(visual, null, 2)}\n`, { flag: "wx" });
    await writeFile(path.join(ROOT, PERFORMANCE),
      `${JSON.stringify(performance, null, 2)}\n`, { flag: "wx" });
    return { status: browserReceipt.status,
      totals: browserReceipt.totals,
      browserReceipt: OUTPUT, visualReceipt: VISUAL,
      performanceDiagnostic: PERFORMANCE };
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runR74BrowserV661(selectedPort(process.argv.slice(2))).then((result) =>
    console.log(JSON.stringify(result, null, 2))).catch((error) => {
    console.error(String(error?.message ?? error));
    process.exitCode = 1;
  });
}
