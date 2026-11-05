import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "http://127.0.0.1:3117";
const BUILD =
  "docs/release/v607/mainline-a-r72-build-20261013v659r72web02.json";
const OVERLAY = "app/data/mainlineANebulaR72SourceV659.generated.json";
const OUTPUT =
  "docs/release/v607/mainline-a-r72-v659-browser-20261013v659r72web03.json";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function check(condition, code) {
  if (!condition) throw new Error(`r72-browser-v659:${code}`);
}

const [build, overlay, source] = await Promise.all([
  readFile(path.join(ROOT, BUILD), "utf8").then(JSON.parse),
  readFile(path.join(ROOT, OVERLAY), "utf8").then(JSON.parse),
  captureBuildInputs(),
]);
check(build.status === "passed" && build.sourceStable === true
  && build.inputAfterSha256 === source.sha256
  && overlay.rows?.length === 6
  && overlay.counts?.imagesCaptured === 1
  && overlay.counts?.blockedImageRequestsUnexecuted === 5
  && overlay.counts?.rightsSigned === 0,
"build-or-overlay-identity-invalid");

async function screenshot(page, device, variant) {
  const relative =
    `docs/release/v607/mainline-a-r72-v659-${device}-${variant}-20261013v659r72web03.png`;
  const bytes = await page.screenshot({ fullPage: false });
  await writeFile(path.join(ROOT, relative), bytes, { flag: "wx" });
  return { path: relative, bytes: bytes.length, sha256: sha(bytes) };
}

async function frameDiagnostic(page) {
  return page.evaluate(() => new Promise((resolve) => {
    const intervals = [];
    let previous = null;
    const tick = (now) => {
      if (previous !== null) intervals.push(now - previous);
      previous = now;
      if (intervals.length < 120) requestAnimationFrame(tick);
      else {
        intervals.sort((a, b) => a - b);
        resolve({ sampleCount: intervals.length,
          p95Ms: Math.round(intervals[Math.floor(intervals.length * .95)]
            * 100) / 100,
          maxMs: Math.round(intervals.at(-1) * 100) / 100 });
      }
    };
    requestAnimationFrame(tick);
  }));
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
      window.__r72ObjectUrlsV659 = active;
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
    const panel = page.locator('[data-mainline-a-r72-source-panel="v659"]');
    await panel.waitFor({ state: "visible", timeout: 15_000 });
    await panel.scrollIntoViewIfNeeded();
    check(await panel.getAttribute("data-mainline-a-r72-source-status")
      === "verified", `${device}:overlay-not-verified`);
    check(await panel.getAttribute("data-mainline-a-r72-image-count")
      === "1", `${device}:image-count-not-one`);
    check(await panel.getAttribute("data-scientific-payload-writeback")
      === "false", `${device}:science-writeback`);
    await panel.getByRole("button", { name: "展开六图审查" }).click();
    check(await panel.locator("[data-mainline-a-r72-source-candidate]")
      .count() === 6, `${device}:six-targets`);
    const layout = await page.evaluate(() => {
      const dialog = document.querySelector(
        '[data-mainline-a-nebula-review="true"]');
      const panel = document.querySelector(
        '[data-mainline-a-r72-source-panel="v659"]');
      const search = panel?.querySelector(
        'input[aria-label="搜索 R72 扩展星云"]');
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
    await panel.getByRole("button", { name: "原图已存", exact: true }).click();
    check(await panel.locator("[data-mainline-a-r72-source-candidate]")
      .count() === 1, `${device}:image-filter`);
    await panel.getByRole("button", { name: "采集受阻" }).click();
    check(await panel.locator("[data-mainline-a-r72-source-candidate]")
      .count() === 5, `${device}:policy-filter`);
    await panel.getByRole("button", { name: "当前署名缺失" }).click();
    check(await panel.locator("[data-mainline-a-r72-source-candidate]")
      .count() === 3, `${device}:credit-filter`);
    await panel.getByRole("button", { name: "全部六条" }).click();
    const query = panel.getByRole("textbox", { name: "搜索 R72 扩展星云" });
    await query.fill("PIA23650");
    check(await panel.locator("[data-mainline-a-r72-source-candidate]")
      .count() === 1, `${device}:nasa-id-search`);
    await query.fill("");
    check(await panel.locator("[data-mainline-a-r72-source-candidate]")
      .count() === 6, `${device}:search-reset`);
    const rows = [];
    let imageDetail = null;
    let heldDetail = null;
    for (const row of overlay.rows) {
      const started = await page.evaluate(() => performance.now());
      await panel.locator(
        `[data-mainline-a-r72-source-candidate="${row.id}"]`).click();
      const detail = panel.locator(
        `[data-mainline-a-r72-source-detail="${row.id}"]`);
      await detail.waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(
        `[data-nebula-review-expansion-detail="v659"][data-nebula-review-detail="${row.id}"]`)
        .waitFor({ state: "visible", timeout: 15_000 });
      const expectedState = row.imageRaw ? "loaded" : "policy-hold";
      await panel.locator(
        `[data-mainline-a-r72-source-detail="${row.id}"][data-mainline-a-r72-image-state="${expectedState}"]`)
        .waitFor({ state: "visible", timeout: 30_000 });
      const text = await detail.textContent();
      check(text.includes(row.expectedCredit)
        && text.includes(row.searchRaw.sha256)
        && text.includes("scientificPayloadWriteback=false")
        && await detail.locator(`a[href="${row.pageUrl}"]`).count() === 1,
      `${device}:${row.id}:source-or-boundary-detail`);
      let dimensions = null;
      if (row.imageRaw) {
        const image = detail.locator(
          `[data-mainline-a-r72-loaded-image="${row.id}"]`);
        await image.waitFor({ state: "visible", timeout: 10_000 });
        const observed = await image.evaluate((element) => ({
          width: element.naturalWidth, height: element.naturalHeight,
          src: element.currentSrc,
        }));
        check(observed.width === row.originalWidth
          && observed.height === row.originalHeight
          && observed.src.startsWith("blob:")
          && text.includes(row.imageRaw.sha256),
        `${device}:${row.id}:image-decode-or-sha-detail`);
        dimensions = [observed.width, observed.height];
        await detail.scrollIntoViewIfNeeded();
        imageDetail = await screenshot(page, device, "image-detail");
      } else {
        check(await detail.locator("[data-mainline-a-r72-loaded-image]")
          .count() === 0
          && text.includes("responseCaptured=0")
          && text.includes("未对该条发起原图请求"),
        `${device}:${row.id}:blocked-image-rendered`);
        if (row.id === "omega-nebula") {
          await detail.scrollIntoViewIfNeeded();
          heldDetail = await screenshot(page, device, "held-detail");
        }
      }
      const ended = await page.evaluate(() => performance.now());
      rows.push({ id: row.id, nasaId: row.nasaId,
        imageState: expectedState, decodedSize: dimensions,
        pageIdentityVerified: row.pageIdentityVerified,
        currentStructuredCreditVerified: row.currentStructuredCreditVerified,
        sourceLinkMatched: true, boundaryTextMatched: true,
        localInteractionMs: Math.round((ended - started) * 100) / 100 });
    }
    check(await shell.getAttribute("data-celestial-catalog-selected-id")
      === selectedBefore, `${device}:canonical-selection-mutated`);
    const frames = await frameDiagnostic(page);
    await panel.getByRole("button", { name: "收起六图审查" }).click();
    check(await panel.locator("[data-mainline-a-r72-source-detail]")
      .count() === 0, `${device}:panel-detail-not-unmounted`);
    await page.getByRole("button", { name: "关闭星云清权审查台" }).click();
    await panel.waitFor({ state: "detached", timeout: 12_000 });
    await page.waitForFunction(() =>
      window.__r72ObjectUrlsV659?.size === 0, null, { timeout: 12_000 });
    const objectUrlsAfterClose = await page.evaluate(() =>
      window.__r72ObjectUrlsV659?.size ?? -1);
    const heapAfterBytes = await page.evaluate(() =>
      performance.memory?.usedJSHeapSize ?? null);
    check(pageErrors.length === 0 && consoleErrors.length === 0
      && objectUrlsAfterClose === 0,
    `${device}:browser-errors-or-object-url-leak`);
    return { device, viewport: mobile ? [390, 844] : [1280, 720],
      layout, rows, selectedCatalogUnchanged: true,
      objectUrlsAfterClose, pageErrors, consoleErrors,
      performanceDiagnostic: { method: "local-browser-current-build-interaction",
        heapBeforeBytes, heapAfterBytes, frameDiagnostic: frames,
        interactionTimesMs: rows.map((row) => row.localInteractionMs) },
      screenshots: { overview, imageDetail, heldDetail } };
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
  const report = { schema: "mainline-a-r72-source-browser-v659",
    status: "passed-local-desktop-and-mobile-viewport",
    buildReceipt: BUILD, buildId: build.buildId,
    runtimeBuildId: build.runtimeBuildId, sourceSha256: source.sha256,
    desktop, mobileViewport,
    totals: { candidateSelections: desktop.rows.length
      + mobileViewport.rows.length,
    loadedImages: desktop.rows.filter((row) =>
      row.imageState === "loaded").length
      + mobileViewport.rows.filter((row) =>
        row.imageState === "loaded").length,
    policyHeldDetails: desktop.rows.filter((row) =>
      row.imageState === "policy-hold").length
      + mobileViewport.rows.filter((row) =>
        row.imageState === "policy-hold").length,
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
  process.stdout.write(`${JSON.stringify({ status: report.status,
    totals: report.totals, output: OUTPUT })}\n`);
} finally {
  await browser.close();
}
