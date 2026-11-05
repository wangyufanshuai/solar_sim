import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeWorkspacePathV662 } from "./build-mainline-a-r75-matrix-v662.mjs";
import { verifyR75MatrixShapeV662 } from "./verify-mainline-a-r75-matrix-v662.mjs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const VIEWPORTS = { desktop: { width: 1280, height: 720 },
  "mobile-viewport": { width: 390, height: 844 } };
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
function check(value, code, detail) {
  if (!value) throw new Error(`r75-matrix-browser:${code}${detail
    ? `:${JSON.stringify(detail)}` : ""}`);
}
export function parseMatrixBrowserOptionsV662(argv) {
  check([4, 6].includes(argv.length) && argv[0] === "--run-id"
    && argv[2] === "--port"
    && (argv.length === 4 || argv[4] === "--build-run-id"), "usage");
  const runId = argv[1];
  const port = Number(argv[3]);
  const buildRunId = argv[5] ?? runId;
  check(/^20261013v662r75web0[1-9]$/.test(runId)
    && /^20261013v662r75web0[1-9]$/.test(buildRunId)
    && Number.isInteger(port) && port >= 1024 && port <= 65535,
  "run-id-or-port");
  return { runId, buildRunId,
    origin: `http://127.0.0.1:${port}` };
}
async function screenshot(page, device, variant, runId) {
  const relative = `docs/release/v607/mainline-a-r75-v662-matrix-${device}-${variant}-${runId}.png`;
  const bytes = await page.screenshot({ fullPage: false });
  await writeFile(safeWorkspacePathV662(relative), bytes, { flag: "wx" });
  return { path: relative, bytes: bytes.length, sha256: sha(bytes) };
}
async function layout(page) {
  return page.evaluate(() => {
    const dialog = document.querySelector('[data-mainline-a-nebula-review="true"]');
    const panel = document.querySelector('[data-mainline-a-r75-acceptance="v662"]');
    const search = panel?.querySelector(
      'input[aria-label="搜索跨入口验收对象"]');
    return { viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      dialogWidth: dialog?.clientWidth ?? 0,
      dialogScrollWidth: dialog?.scrollWidth ?? 0,
      panelWidth: panel?.clientWidth ?? 0,
      panelScrollWidth: panel?.scrollWidth ?? 0,
      searchWidth: search?.getBoundingClientRect().width ?? 0 };
  });
}
async function frameSample(page) {
  return page.evaluate(async () => {
    const intervals = [];
    let previous = performance.now();
    for (let frame = 0; frame < 120; frame++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const now = performance.now();
      intervals.push(now - previous);
      previous = now;
    }
    intervals.sort((a, b) => a - b);
    return { frames: intervals.length,
      p95IntervalMs: intervals[Math.ceil(intervals.length * .95) - 1],
      maxIntervalMs: intervals.at(-1),
      usedJSHeapBytes: performance.memory?.usedJSHeapSize ?? null,
      scope: "short-local-headless-Chrome-diagnostic-only" };
  });
}
async function inspect(browser, device, config, build, matrix) {
  const mobile = device === "mobile-viewport";
  const context = await browser.newContext({ viewport: VIEWPORTS[device],
    deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(12_000);
    const pageErrors = [];
    const consoleErrors = [];
    const externalImageRequests = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("request", (request) => {
      if (request.resourceType() === "image"
        && /^https?:/.test(request.url())
        && !request.url().startsWith(config.origin)) {
        externalImageRequests.push(request.url());
      }
    });
    await page.goto(config.origin, { waitUntil: "domcontentloaded",
      timeout: 25_000 });
    const shell = page.locator("[data-atlas-app-shell]");
    await shell.waitFor({ state: "visible", timeout: 25_000 });
    check(await shell.getAttribute("data-mainline-build-id")
      === build.runtimeBuildId, `${device}:runtime-build-id`);
    const sceneBefore = await shell.getAttribute(
      "data-celestial-catalog-selected-id");
    await page.getByRole("button", { name: /^工具/ }).click();
    await page.getByRole("button", { name: "清权审查" }).click();
    const panel = page.locator('[data-mainline-a-r75-acceptance="v662"]');
    await panel.waitFor({ state: "visible", timeout: 15_000 });
    check(await panel.getAttribute("data-mainline-a-r75-data") === "valid"
      && await panel.getAttribute("data-mainline-a-r75-release") === "blocked"
      && await panel.getAttribute("data-scientific-payload-writeback")
        === "false", `${device}:matrix-boundary`);
    await panel.getByRole("button", { name: "展开跨入口矩阵" }).click();
    check(await panel.locator("[data-mainline-a-r75-row]").count() === 96,
      `${device}:row-count`);
    const observedLayout = await layout(page);
    check(observedLayout.documentWidth <= observedLayout.viewportWidth
      && observedLayout.dialogScrollWidth <= observedLayout.dialogWidth
      && observedLayout.panelScrollWidth <= observedLayout.panelWidth
      && observedLayout.searchWidth >= 200,
    `${device}:layout-overflow`, observedLayout);
    const overview = await screenshot(page, device, "overview", config.runId);
    const selections = [];
    for (const row of matrix.rows) {
      const card = panel.locator(`[data-mainline-a-r75-row="${row.key}"]`);
      await card.click();
      const detail = panel.locator(
        `[data-mainline-a-r75-detail="${row.key}"]`);
      await detail.waitFor({ state: "visible" });
      const body = await detail.textContent();
      check(body.includes(row.sourceSha256)
        && body.includes("版权 pending")
        && body.includes("scientificPayloadWriteback=false")
        && await detail.locator(`a[href="${row.sourceUrl}"]`).count() === 1,
      `${device}:detail-source:${row.key}`);
      const state = await card.getAttribute("data-mainline-a-r75-state");
      check(state === row.state, `${device}:state:${row.key}`);
      if (row.state === "identity-hold") {
        check(body.includes("组件身份 hold") && body.includes("未开放"),
        `${device}:identity-hold:${row.key}`);
      }
      if (row.group === "beta-nebula" && !row.imageRoute) {
        check(body.includes("无可请求原图"),
        `${device}:held-image:${row.key}`);
      }
      selections.push({ key: row.key, state, sourceLinkMatched: true });
    }
    const dumbbell = panel.locator(
      '[data-mainline-a-r75-row="beta:nebula:dumbbell-nebula"]');
    await dumbbell.click();
    const detail = panel.locator(
      '[data-mainline-a-r75-detail="beta:nebula:dumbbell-nebula"]');
    await detail.scrollIntoViewIfNeeded();
    check(await detail.locator(
      '[data-mainline-a-r75-alternative="dumbbell-spitzer"]')
      .textContent().then((value) => value.includes("conflict")),
    `${device}:dumbbell-conflict`);
    const conflict = await screenshot(page, device, "identity-conflict",
      config.runId);
    const stateSelector = panel.getByRole("combobox", {
      name: "筛选跨入口审核状态" });
    await stateSelector.selectOption("identity-hold");
    check(await panel.locator("[data-mainline-a-r75-row]").count() === 4,
      `${device}:identity-filter`);
    await stateSelector.selectOption("all");
    await panel.getByRole("button", { name: "Beta 星云 24" }).click();
    check(await panel.locator("[data-mainline-a-r75-row]").count() === 24,
      `${device}:beta-nebula-filter`);
    await stateSelector.selectOption("source-hold");
    check(await panel.locator("[data-mainline-a-r75-row]").count() === 5,
      `${device}:held-nebula-filter`);
    await stateSelector.selectOption("all");
    await panel.getByRole("button", { name: "全部 96" }).click();
    const search = panel.getByRole("textbox", {
      name: "搜索跨入口验收对象" });
    await search.fill("definitely-not-a-star-or-nebula");
    check(await panel.locator("[data-mainline-a-r75-row]").count() === 0,
      `${device}:empty-search`);
    await search.fill("");
    check(await panel.locator("[data-mainline-a-r75-row]").count() === 96,
      `${device}:search-reset`);
    const performanceDiagnostic = await frameSample(page);
    await panel.getByRole("button", { name: "收起跨入口矩阵" }).click();
    check(await panel.locator("[data-mainline-a-r75-row]").count() === 0,
      `${device}:closed-row-lifecycle`);
    await page.getByRole("button", { name: "关闭星云清权审查台" }).click();
    await panel.waitFor({ state: "detached" });
    check(await shell.getAttribute("data-celestial-catalog-selected-id")
      === sceneBefore, `${device}:review-changed-scene`);
    check(pageErrors.length === 0 && consoleErrors.length === 0
      && externalImageRequests.length === 0,
    `${device}:errors-or-external-images`, { pageErrors,
      consoleErrors, externalImageRequests });
    return { device, viewport: [VIEWPORTS[device].width,
      VIEWPORTS[device].height], layout: observedLayout,
      selections, conflictSourcePreserved: true,
      identityHolds: 4, heldNebulae: 5,
      emptySearchState: true, reviewChangedScene: false,
      pageErrors, consoleErrors, externalImageRequests,
      performanceDiagnostic, screenshots: { overview, conflict } };
  } finally { await context.close(); }
}
export async function runR75MatrixBrowserV662(config) {
  const buildPath = `docs/release/v607/mainline-a-r75-build-${config.buildRunId}.json`;
  const matrixPath = `docs/release/v607/mainline-a-r75-v662-matrix-${config.buildRunId}.json`;
  const [build, matrix, source] = await Promise.all([
    readFile(safeWorkspacePathV662(buildPath), "utf8").then(JSON.parse),
    readFile(safeWorkspacePathV662(matrixPath), "utf8").then(JSON.parse),
    captureBuildInputs(),
  ]);
  check(build.status === "passed" && build.sourceStable === true
    && build.inputAfterSha256 === source.sha256
    && matrix.appSourceSha256 === source.sha256
    && verifyR75MatrixShapeV662(matrix).ok,
  "build-or-matrix-source-drift");
  const startedAt = new Date().toISOString();
  let stage = "launch";
  const browser = await chromium.launch({ headless: true,
    executablePath: CHROME });
  try {
    stage = "desktop";
    const desktop = await inspect(browser, "desktop", config, build, matrix);
    stage = "mobile-viewport";
    const mobileViewport = await inspect(browser, "mobile-viewport",
      config, build, matrix);
    check((await captureBuildInputs()).sha256 === source.sha256,
      "source-drift-during-browser");
    const output = `docs/release/v607/mainline-a-r75-v662-matrix-browser-${config.runId}.json`;
    const report = { schema: "mainline-a-r75-matrix-browser-v662",
      status: "passed-local-desktop-and-mobile-viewport",
      startedAt, endedAt: new Date().toISOString(),
      origin: config.origin, buildReceipt: buildPath,
      matrixReceipt: matrixPath, buildId: build.buildId,
      runtimeBuildId: build.runtimeBuildId,
      appSourceSha256: source.sha256,
      desktop, mobileViewport,
      totals: { selections: desktop.selections.length
        + mobileViewport.selections.length,
        identityHolds: 4, imageHolds: 5,
        pageErrors: 0, consoleErrors: 0,
        externalImageRequests: 0 },
      physicalMobile: "not-run",
      claims: { realUserValidation: false, productionPerformance: false,
        scientificValidity: false, copyrightApproval: false,
        publicWebReleaseApproved: false,
        scientificPayloadWriteback: false } };
    await writeFile(safeWorkspacePathV662(output),
      `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
    return { output, status: report.status, totals: report.totals };
  } catch (error) {
    const attempt = `docs/release/v607/mainline-a-r75-v662-matrix-browser-attempt-${config.runId}.json`;
    await writeFile(safeWorkspacePathV662(attempt),
      `${JSON.stringify({ schema: "mainline-a-r75-matrix-browser-attempt-v662",
        status: "failed-preserved", startedAt,
        endedAt: new Date().toISOString(), stage,
        buildReceipt: buildPath,
        appSourceSha256: source.sha256,
        errorClass: error?.name ?? "Error",
        errorMessage: error?.message ?? String(error),
        browserQualified: false, scientificPayloadWriteback: false,
      }, null, 2)}\n`, { flag: "wx" });
    throw error;
  } finally { await browser.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runR75MatrixBrowserV662(
    parseMatrixBrowserOptionsV662(process.argv.slice(2)))));
}
