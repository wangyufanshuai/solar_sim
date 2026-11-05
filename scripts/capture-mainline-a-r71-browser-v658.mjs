import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "http://127.0.0.1:3113";
const BUILD = "docs/release/v607/mainline-a-r71-build-20261013v658r71web02.json";
const OVERLAY = "app/data/mainlineANebulaR71SourceV658.generated.json";
const OUTPUT = "docs/release/v607/mainline-a-r71-v658-browser-20261013v658r71web02.json";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function check(value, code) {
  if (!value) throw new Error(`r71-browser-v658:${code}`);
}

const [build, overlay, source] = await Promise.all([
  readFile(path.join(ROOT, BUILD), "utf8").then(JSON.parse),
  readFile(path.join(ROOT, OVERLAY), "utf8").then(JSON.parse),
  captureBuildInputs(),
]);
check(build.status === "passed" && build.sourceStable === true
  && build.inputAfterSha256 === source.sha256
  && overlay.rows?.length === 6
  && overlay.counts?.officialImages === 6
  && overlay.counts?.rightsSigned === 0,
"build-or-overlay-identity-invalid");

async function screenshot(page, device, variant) {
  const relative =
    `docs/release/v607/mainline-a-r71-v658-${device}-${variant}-20261013v658r71web02.png`;
  const bytes = await page.screenshot({ fullPage: false });
  await writeFile(path.join(ROOT, relative), bytes, { flag: "wx" });
  return { path: relative, bytes: bytes.length, sha256: sha(bytes) };
}

async function inspect(browser, device) {
  const mobile = device === "mobile-viewport";
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 }
      : { width: 1280, height: 720 },
    deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile,
  });
  try {
    await context.addInitScript(() => {
      const created = URL.createObjectURL.bind(URL);
      const revoked = URL.revokeObjectURL.bind(URL);
      const active = new Set();
      window.__r71ObjectUrlsV658 = active;
      URL.createObjectURL = (blob) => {
        const url = created(blob);
        active.add(url);
        return url;
      };
      URL.revokeObjectURL = (url) => {
        active.delete(url);
        revoked(url);
      };
    });
    const page = await context.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await page.goto(ORIGIN, { waitUntil: "domcontentloaded",
      timeout: 25_000 });
    const shell = page.locator("[data-atlas-app-shell]");
    await shell.waitFor({ state: "visible", timeout: 25_000 });
    check(await shell.getAttribute("data-mainline-build-id")
      === build.runtimeBuildId, `${device}:runtime-build-id`);
    const selectedBefore = await shell.getAttribute(
      "data-celestial-catalog-selected-id");
    await page.getByRole("button", { name: /^工具/ }).click();
    await page.getByRole("button", { name: "清权审查" }).click();
    const panel = page.locator('[data-mainline-a-r71-source-panel="v658"]');
    await panel.waitFor({ state: "visible", timeout: 15_000 });
    await panel.scrollIntoViewIfNeeded();
    check(await panel.getAttribute("data-mainline-a-r71-source-status")
      === "verified", `${device}:source-overlay-status`);
    check(await panel.getAttribute("data-mainline-a-r71-rights")
      === "pending", `${device}:rights-status`);
    check(await panel.getAttribute("data-scientific-payload-writeback")
      === "false", `${device}:science-writeback`);
    check(await panel.locator("[data-mainline-a-r71-source-candidate]")
      .count() === 6, `${device}:six-targets`);
    const layout = await page.evaluate(() => {
      const dialog = document.querySelector(
        '[data-mainline-a-nebula-review="true"]');
      const panel = document.querySelector(
        '[data-mainline-a-r71-source-panel="v658"]');
      const search = panel?.querySelector(
        'input[aria-label="搜索 R71 星云来源"]');
      return { viewportWidth: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        dialogWidth: dialog?.clientWidth ?? 0,
        dialogScrollWidth: dialog?.scrollWidth ?? 0,
        panelWidth: panel?.clientWidth ?? 0,
        panelScrollWidth: panel?.scrollWidth ?? 0,
        searchWidth: search?.getBoundingClientRect().width ?? 0 };
    });
    check(layout.documentWidth <= layout.viewportWidth
      && layout.dialogScrollWidth <= layout.dialogWidth
      && layout.panelScrollWidth <= layout.panelWidth
      && layout.searchWidth >= 200,
    `${device}:horizontal-overflow-or-search-width`);
    const heapBeforeBytes = await page.evaluate(() =>
      performance.memory?.usedJSHeapSize ?? null);
    const overview = await screenshot(page, device, "overview");
    await panel.getByRole("button", { name: "原字节相同" }).click();
    check(await panel.locator("[data-mainline-a-r71-source-candidate]")
      .count() === 2, `${device}:byte-match-filter`);
    await panel.getByRole("button", { name: "原字节不同" }).click();
    check(await panel.locator("[data-mainline-a-r71-source-candidate]")
      .count() === 4, `${device}:byte-variant-filter`);
    await panel.getByRole("button", { name: "全部六图" }).click();
    const query = panel.getByRole("textbox", { name: "搜索 R71 星云来源" });
    await query.fill("PIA20357");
    check(await panel.locator("[data-mainline-a-r71-source-candidate]")
      .count() === 1, `${device}:nasa-id-search`);
    await query.fill("");
    check(await panel.locator("[data-mainline-a-r71-source-candidate]")
      .count() === 6, `${device}:search-reset`);
    const rows = [];
    let detailShot = null;
    for (const [index, row] of overlay.rows.entries()) {
      const started = await page.evaluate(() => performance.now());
      const button = panel.locator(
        `[data-mainline-a-r71-source-candidate="${row.id}"]`);
      await button.click();
      const detail = panel.locator(
        `[data-mainline-a-r71-source-detail="${row.id}"]`);
      await detail.waitFor({ state: "visible", timeout: 15_000 });
      await panel.locator(
        `[data-mainline-a-r71-source-detail="${row.id}"][data-mainline-a-r71-image-state="loaded"]`)
        .waitFor({ state: "visible", timeout: 30_000 });
      const image = detail.locator(
        `[data-mainline-a-r71-loaded-image="${row.id}"]`);
      await image.waitFor({ state: "visible", timeout: 10_000 });
      const observed = await image.evaluate((element) => ({
        width: element.naturalWidth, height: element.naturalHeight,
        src: element.currentSrc,
      }));
      const loadedAt = await page.evaluate(() => performance.now());
      check(observed.width === row.originalWidth
        && observed.height === row.originalHeight
        && observed.src.startsWith("blob:")
        && await detail.locator(`a[href="${row.officialPageUrl}"]`)
          .count() === 1,
      `${device}:${row.id}:decoded-image-or-source-link`);
      const text = await detail.textContent();
      check(text.includes(row.expectedCredit)
        && text.includes(row.imageRaw.sha256)
        && text.includes("版权待签")
        && text.includes("scientificPayloadWriteback=false"),
      `${device}:${row.id}:source-or-boundary-detail`);
      if (index === 5) {
        await detail.scrollIntoViewIfNeeded();
        detailShot = await screenshot(page, device, "detail");
      }
      rows.push({ id: row.id, nasaId: row.nasaId,
        imageState: "loaded", decodedSize: [observed.width, observed.height],
        sourceLinkMatched: true, boundaryTextMatched: true,
        localLoadMs: Math.round((loadedAt - started) * 100) / 100 });
    }
    const frameDiagnostic = await page.evaluate(() => new Promise((resolve) => {
      const intervals = [];
      let previous = null;
      const tick = (now) => {
        if (previous !== null) intervals.push(now - previous);
        previous = now;
        if (intervals.length < 120) requestAnimationFrame(tick);
        else {
          intervals.sort((a, b) => a - b);
          resolve({ sampleCount: intervals.length,
            p95Ms: Math.round(intervals[Math.floor(intervals.length * .95)] * 100) / 100,
            maxMs: Math.round(intervals.at(-1) * 100) / 100 });
        }
      };
      requestAnimationFrame(tick);
    }));
    check(await shell.getAttribute("data-celestial-catalog-selected-id")
      === selectedBefore, `${device}:review-mutated-canonical-selection`);
    await page.getByRole("button", { name: "关闭星云清权审查台" }).click();
    await panel.waitFor({ state: "detached", timeout: 12_000 });
    await page.waitForFunction(() =>
      window.__r71ObjectUrlsV658?.size === 0, null, { timeout: 12_000 });
    const objectUrlsAfterClose = await page.evaluate(() =>
      window.__r71ObjectUrlsV658?.size ?? -1);
    const heapAfterBytes = await page.evaluate(() =>
      performance.memory?.usedJSHeapSize ?? null);
    check(pageErrors.length === 0 && consoleErrors.length === 0
      && objectUrlsAfterClose === 0,
    `${device}:browser-errors-or-object-url-leak`);
    return { device, viewport: mobile ? [390, 844] : [1280, 720],
      layout, rows, filteredRawMatches: 2, filteredVariants: 4,
      nasaSearchMatched: true, selectedCatalogUnchanged: true,
      objectUrlsAfterClose, pageErrors, consoleErrors,
      performanceDiagnostic: { method: "local-browser-current-build-interaction",
        heapBeforeBytes, heapAfterBytes, frameDiagnostic,
        loadTimesMs: rows.map((row) => row.localLoadMs) },
      screenshots: { overview, detail: detailShot } };
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
try {
  const desktop = await inspect(browser, "desktop");
  const mobileViewport = await inspect(browser, "mobile-viewport");
  check((await captureBuildInputs()).sha256 === source.sha256,
    "app-source-changed-during-browser");
  const report = { schema: "mainline-a-r71-source-browser-v658",
    status: "passed-local-desktop-and-mobile-viewport",
    buildReceipt: BUILD, buildId: build.buildId,
    runtimeBuildId: build.runtimeBuildId, sourceSha256: source.sha256,
    desktop, mobileViewport,
    totals: { sixImageSelectionsPerViewport: true,
      loadedImages: desktop.rows.length + mobileViewport.rows.length,
      sourceLinksMatched: desktop.rows.length + mobileViewport.rows.length,
      objectUrlsAfterClose: desktop.objectUrlsAfterClose
        + mobileViewport.objectUrlsAfterClose,
      pageErrors: desktop.pageErrors.length + mobileViewport.pageErrors.length,
      consoleErrors: desktop.consoleErrors.length
        + mobileViewport.consoleErrors.length },
    claims: { physicalMobile: false, realUserValidation: false,
      productionPerformance: false, copyrightApproval: false,
      scientificValidity: false, publicWebReleaseApproved: false,
      scientificPayloadWriteback: false } };
  await writeFile(path.join(ROOT, OUTPUT),
    `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify({ status: report.status,
    totals: report.totals, output: OUTPUT }, null, 2));
} finally {
  await browser.close();
}
