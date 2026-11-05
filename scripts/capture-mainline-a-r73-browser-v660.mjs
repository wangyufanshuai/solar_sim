import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = "app/data/mainlineANebulaR73CatalogV660.generated.json";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const R75_PROFILE = process.env.MAINLINE_A_R75_PROFILE === "1";
const VIEWPORTS = {
  desktop: { width: 1280, height: 720 },
  "mobile-viewport": { width: 390, height: 844 },
};

function fail(code, detail) {
  throw new Error(`r73-browser-v660:${code}${detail === undefined
    ? "" : `:${JSON.stringify(detail)}`}`);
}
function check(value, code, detail) {
  if (!value) fail(code, detail);
}
function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
function options(argv) {
  check(argv.length === 4 && argv[0] === "--run-id"
    && argv[2] === "--port", "usage-invalid");
  const runId = argv[1];
  const port = Number(argv[3]);
  check((R75_PROFILE ? /^20261013v662r75web0[1-9]$/
    : /^20261013v660r73web0[1-9]$/).test(runId)
    && Number.isInteger(port) && port >= 1024 && port <= 65535,
  "run-id-or-port-invalid");
  return { runId, origin: `http://127.0.0.1:${port}` };
}
function paths(runId) {
  const prefix = R75_PROFILE ? "mainline-a-r75-v662"
    : "mainline-a-r73-v660";
  return {
    build: `docs/release/v607/mainline-a-${R75_PROFILE ? "r75" : "r73"}-build-${runId}.json`,
    output: `docs/release/v607/${prefix}-${R75_PROFILE ? "nebula-browser" : "browser"}-${runId}.json`,
    attempt: `docs/release/v607/${prefix}-${R75_PROFILE ? "nebula-browser-attempt" : "browser-attempt"}-${runId}.json`,
  };
}
async function screenshot(page, device, variant, runId) {
  const relative = `docs/release/v607/mainline-a-${R75_PROFILE ? "r75-v662" : "r73-v660"}-${device}-${variant}-${runId}.png`;
  const bytes = await page.screenshot({ fullPage: false });
  await writeFile(path.join(ROOT, relative), bytes, { flag: "wx" });
  return { path: relative, bytes: bytes.length, sha256: sha256(bytes) };
}

async function frameSample(page) {
  return page.evaluate(() => new Promise((resolve) => {
    const frameTimes = [];
    let previous = null;
    const tick = (now) => {
      if (previous !== null) frameTimes.push(now - previous);
      previous = now;
      if (frameTimes.length < 120) requestAnimationFrame(tick);
      else {
        frameTimes.sort((left, right) => left - right);
        resolve({ sampleCount: frameTimes.length,
          p95Ms: Math.round(frameTimes[Math.floor(frameTimes.length * .95)]
            * 100) / 100,
          maxMs: Math.round(frameTimes.at(-1) * 100) / 100 });
      }
    };
    requestAnimationFrame(tick);
  }));
}

async function layout(page) {
  return page.evaluate(() => {
    const dialog = document.querySelector(
      '[data-mainline-a-nebula-review="true"]');
    const panel = document.querySelector(
      '[data-mainline-a-r73-gallery="v660"]');
    const search = panel?.querySelector(
      'input[aria-label="搜索 24 项星云候选"]');
    return { viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      dialogWidth: dialog?.clientWidth ?? 0,
      dialogScrollWidth: dialog?.scrollWidth ?? 0,
      panelWidth: panel?.clientWidth ?? 0,
      panelScrollWidth: panel?.scrollWidth ?? 0,
      searchWidth: search?.getBoundingClientRect().width ?? 0 };
  });
}

async function inspect(browser, device, config, build, catalog) {
  const mobile = device === "mobile-viewport";
  const context = await browser.newContext({ viewport: VIEWPORTS[device],
    deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  try {
    await context.addInitScript(() => {
      const create = URL.createObjectURL.bind(URL);
      const revoke = URL.revokeObjectURL.bind(URL);
      const active = new Set();
      window.__r73ObjectUrlsV660 = active;
      URL.createObjectURL = (blob) => {
        const url = create(blob);
        active.add(url);
        return url;
      };
      URL.revokeObjectURL = (url) => {
        active.delete(url);
        revoke(url);
      };
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12_000);
    const pageErrors = [];
    const consoleErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await page.goto(config.origin, { waitUntil: "domcontentloaded",
      timeout: 25_000 });
    const shell = page.locator("[data-atlas-app-shell]");
    await shell.waitFor({ state: "visible", timeout: 25_000 });
    check(await shell.getAttribute("data-mainline-build-id")
      === build.runtimeBuildId, `${device}:build-id-invalid`);
    const beforeSelection = await shell.getAttribute(
      "data-celestial-catalog-selected-id");
    await page.getByRole("button", { name: /^工具/ }).click();
    await page.getByRole("button", { name: "清权审查" }).click();
    const gallery = page.locator('[data-mainline-a-r73-gallery="v660"]');
    await gallery.waitFor({ state: "visible", timeout: 15_000 });
    check(await gallery.getAttribute("data-mainline-a-r73-status")
      === "verified" && await gallery.getAttribute(
        "data-scientific-payload-writeback") === "false",
    `${device}:catalog-invalid`);
    await gallery.scrollIntoViewIfNeeded();
    await gallery.getByRole("button", { name: "展开 24 项总览" }).click();
    check(await gallery.locator("[data-mainline-a-r73-card]").count() === 24,
      `${device}:cards-incomplete`);
    const observedLayout = await layout(page);
    check(observedLayout.documentWidth <= observedLayout.viewportWidth
      && observedLayout.dialogScrollWidth <= observedLayout.dialogWidth
      && observedLayout.panelScrollWidth <= observedLayout.panelWidth
      && observedLayout.searchWidth >= 200,
    `${device}:layout-overflow`, observedLayout);
    const heapBeforeBytes = await page.evaluate(() =>
      performance.memory?.usedJSHeapSize ?? null);
    const overview = await screenshot(page, device, "overview", config.runId);
    await gallery.getByRole("button", { name: "已存原图链" }).click();
    check(await gallery.locator("[data-mainline-a-r73-card]").count() === 19,
      `${device}:image-filter`);
    await gallery.getByRole("button", { name: "缺图待审" }).click();
    check(await gallery.locator("[data-mainline-a-r73-card]").count() === 5,
      `${device}:hold-filter`);
    await gallery.getByRole("button", { name: "扩展六图" }).click();
    check(await gallery.locator("[data-mainline-a-r73-card]").count() === 6,
      `${device}:cohort-filter`);
    await gallery.getByRole("button", { name: "署名证据有限" }).click();
    check(await gallery.locator("[data-mainline-a-r73-card]").count() === 3,
      `${device}:credit-filter`);
    await gallery.getByRole("button", { name: "全部 24 条" }).click();
    const search = gallery.getByRole("textbox", {
      name: "搜索 24 项星云候选" });
    await search.fill("PIA23650");
    check(await gallery.locator("[data-mainline-a-r73-card]").count() === 1,
      `${device}:search-result`);
    await search.fill("");
    check(await gallery.locator("[data-mainline-a-r73-card]").count() === 24,
      `${device}:search-reset`);
    const rows = [];
    let imageDetail = null;
    let heldDetail = null;
    for (const row of catalog.rows) {
      const began = await page.evaluate(() => performance.now());
      await gallery.locator(`[data-mainline-a-r73-card="${row.id}"]`).click();
      const detail = gallery.locator(
        `[data-mainline-a-r73-detail="${row.id}"]`);
      await detail.waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(
        `[data-nebula-review-unified-detail="v660"][data-nebula-review-detail="${row.id}"]`)
        .waitFor({ state: "visible", timeout: 15_000 });
      const expected = row.delivery ? "loaded" : "policy-hold";
      await gallery.locator(
        `[data-mainline-a-r73-detail="${row.id}"][data-mainline-a-r73-image-state="${expected}"]`)
        .waitFor({ state: "visible", timeout: 30_000 });
      const content = await detail.textContent();
      check(content.includes(row.nasaId)
        && content.includes(row.credit)
        && content.includes(row.sourcePageSha256)
        && content.includes("scientificPayloadWriteback=false")
        && await detail.locator(`a[href="${row.sourcePageUrl}"]`).count() === 1,
      `${device}:${row.id}:detail-boundary`);
      let decodedSize = null;
      if (row.delivery) {
        const image = detail.locator(
          `[data-mainline-a-r73-loaded-image="${row.id}"]`);
        await image.waitFor({ state: "visible", timeout: 10_000 });
        const decoded = await image.evaluate((element) => ({
          width: element.naturalWidth, height: element.naturalHeight,
          src: element.currentSrc,
        }));
        check(decoded.width === row.delivery.width
          && decoded.height === row.delivery.height
          && decoded.src.startsWith("blob:")
          && content.includes(row.sourceRawSha256),
        `${device}:${row.id}:decoded-image-invalid`);
        decodedSize = [decoded.width, decoded.height];
        if (row.id === "california-nebula") {
          await detail.scrollIntoViewIfNeeded();
          imageDetail = await screenshot(page, device, "image-detail",
            config.runId);
        }
      } else {
        check(await detail.locator("[data-mainline-a-r73-loaded-image]")
          .count() === 0 && content.includes("responseCaptured=0"),
        `${device}:${row.id}:held-image-rendered`);
        if (row.id === "omega-nebula") {
          await detail.scrollIntoViewIfNeeded();
          heldDetail = await screenshot(page, device, "held-detail",
            config.runId);
        }
      }
      const ended = await page.evaluate(() => performance.now());
      rows.push({ id: row.id, cohort: row.cohort,
        imageState: expected, decodedSize,
        sourceLinkMatched: true, parentDetailMatched: true,
        localInteractionMs: Math.round((ended - began) * 100) / 100 });
    }
    check(await shell.getAttribute("data-celestial-catalog-selected-id")
      === beforeSelection, `${device}:canonical-selection-mutated`);
    const frameDiagnostic = await frameSample(page);
    await gallery.getByRole("button", { name: "收起 24 项总览" }).click();
    check(await gallery.locator("[data-mainline-a-r73-detail]").count()
      === 0, `${device}:detail-not-unmounted`);
    await page.getByRole("button", { name: "关闭星云清权审查台" }).click();
    await gallery.waitFor({ state: "detached", timeout: 12_000 });
    await page.waitForFunction(() => window.__r73ObjectUrlsV660?.size
      === 0, null, { timeout: 15_000 });
    const objectUrlsAfterClose = await page.evaluate(() =>
      window.__r73ObjectUrlsV660?.size ?? -1);
    const heapAfterBytes = await page.evaluate(() =>
      performance.memory?.usedJSHeapSize ?? null);
    check(pageErrors.length === 0 && consoleErrors.length === 0
      && objectUrlsAfterClose === 0,
    `${device}:browser-errors-or-object-url-leak`, {
      pageErrors, consoleErrors, objectUrlsAfterClose });
    return { device, viewport: [VIEWPORTS[device].width,
      VIEWPORTS[device].height], layout: observedLayout, rows,
    selectedCatalogUnchanged: true, objectUrlsAfterClose,
    pageErrors, consoleErrors,
    performanceDiagnostic: { method: "short-local-interaction-sample",
      heapBeforeBytes, heapAfterBytes, frameDiagnostic,
      interactionTimesMs: rows.map((row) => row.localInteractionMs) },
    screenshots: { overview, imageDetail, heldDetail } };
  } finally {
    await context.close();
  }
}

export function validateR73BrowserV660(receipt, catalog, build) {
  const issues = [];
  const sha = /^[a-f0-9]{64}$/;
  if (receipt?.schema !== "mainline-a-r73-nebula-browser-v660"
    || receipt?.status !== "passed-local-desktop-and-mobile-viewport"
    || receipt?.buildId !== build?.buildId
    || receipt?.sourceSha256 !== build?.inputAfterSha256
    || receipt?.claims?.copyrightApproval !== false
    || receipt?.claims?.productionPerformance !== false
    || receipt?.claims?.publicWebReleaseApproved !== false
    || receipt?.claims?.scientificPayloadWriteback !== false
    || receipt?.totals?.selections !== 48
    || receipt?.totals?.loadedImages !== 38
    || receipt?.totals?.policyHeldDetails !== 10) {
    issues.push("browser-identity-or-boundary-invalid");
  }
  for (const device of ["desktop", "mobileViewport"]) {
    const observed = receipt?.[device];
    const ids = observed?.rows?.map((row) => row.id) ?? [];
    if (ids.length !== 24 || new Set(ids).size !== 24
      || catalog.rows.some((row) => !ids.includes(row.id))
      || observed.rows.filter((row) => row.imageState === "loaded")
        .length !== 19
      || observed.rows.filter((row) => row.imageState === "policy-hold")
        .length !== 5
      || catalog.rows.some((row) => !observed.rows.some((item) =>
        item.id === row.id
        && item.imageState === (row.delivery ? "loaded" : "policy-hold")
        && item.sourceLinkMatched === true
        && item.parentDetailMatched === true
        && JSON.stringify(item.decodedSize) === JSON.stringify(row.delivery
          ? [row.delivery.width, row.delivery.height] : null)))
      || observed.objectUrlsAfterClose !== 0
      || observed.pageErrors?.length !== 0
      || observed.consoleErrors?.length !== 0
      || observed.layout?.searchWidth < 200
      || observed.layout?.documentWidth > observed.layout?.viewportWidth
      || observed.layout?.panelScrollWidth > observed.layout?.panelWidth
      || !["overview", "imageDetail", "heldDetail"].every((kind) =>
        sha.test(observed.screenshots?.[kind]?.sha256 ?? ""))) {
      issues.push(`${device}-coverage-or-release-invalid`);
    }
  }
  return { ok: issues.length === 0, issues };
}

export async function runR73BrowserV660(config) {
  const { build: buildPath, output, attempt } = paths(config.runId);
  const [build, catalog, source] = await Promise.all([
    readFile(path.join(ROOT, buildPath), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, CATALOG), "utf8").then(JSON.parse),
    captureBuildInputs(),
  ]);
  check(build.status === "passed" && build.sourceStable === true
    && build.inputAfterSha256 === source.sha256
    && catalog.counts?.reviewImages === 19
    && catalog.counts?.policyHolds === 5,
  "build-catalog-source-invalid");
  let stage = "launch";
  const startedAt = new Date().toISOString();
  const browser = await chromium.launch({ headless: true,
    executablePath: CHROME });
  try {
    stage = "desktop";
    const desktop = await inspect(browser, "desktop", config, build,
      catalog);
    stage = "mobile-viewport";
    const mobileViewport = await inspect(browser, "mobile-viewport", config,
      build, catalog);
    stage = "source-after-browser";
    check((await captureBuildInputs()).sha256 === source.sha256,
      "source-drift-during-browser");
    const receipt = {
      schema: "mainline-a-r73-nebula-browser-v660",
      status: "passed-local-desktop-and-mobile-viewport",
      startedAt, endedAt: new Date().toISOString(),
      buildReceipt: buildPath, buildId: build.buildId,
      runtimeBuildId: build.runtimeBuildId,
      sourceSha256: source.sha256, desktop, mobileViewport,
      totals: { selections: 48, loadedImages: 38,
        policyHeldDetails: 10, sourceLinksMatched: 48,
        objectUrlsAfterClose: 0, pageErrors: 0, consoleErrors: 0 },
      claims: { physicalMobile: false, realUserValidation: false,
        productionPerformance: false, copyrightApproval: false,
        scientificValidity: false, publicWebReleaseApproved: false,
        scientificPayloadWriteback: false },
    };
    const verified = validateR73BrowserV660(receipt, catalog, build);
    check(verified.ok, "browser-receipt-invalid", verified.issues);
    await writeFile(path.join(ROOT, output),
      `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
    return { status: receipt.status, totals: receipt.totals, output };
  } catch (error) {
    await writeFile(path.join(ROOT, attempt),
      `${JSON.stringify({ schema: "mainline-a-r73-browser-attempt-v660",
        status: "failed-preserved", startedAt, endedAt: new Date().toISOString(),
        stage, buildReceipt: buildPath, sourceSha256: source.sha256,
        errorClass: error?.name ?? "Error",
        errorMessage: error?.message ?? String(error),
        browserQualified: false, productionPerformance: false,
        scientificPayloadWriteback: false }, null, 2)}\n`,
    { flag: "wx" });
    throw error;
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runR73BrowserV660(
    options(process.argv.slice(2)))));
}
