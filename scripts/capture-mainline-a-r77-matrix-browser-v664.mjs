import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeWorkspacePathV662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";
import { inspectR77FreezeV664 } from
  "./verify-mainline-a-r77-web-freeze-v664.mjs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const VIEWPORTS = {
  desktop: { width: 1280, height: 720 },
  "mobile-viewport": { width: 390, height: 844 },
};
const sha256 = (bytes) => createHash("sha256").update(bytes)
  .digest("hex");
function check(value, code, detail) {
  if (!value) throw new Error("r77-browser:" + code
    + (detail ? ":" + JSON.stringify(detail) : ""));
}
export function parseR77BrowserOptionsV664(argv) {
  check(argv.length === 8 && argv[0] === "--run-id"
    && argv[2] === "--port"
    && argv[4] === "--build-run-id"
    && argv[6] === "--freeze-run-id", "usage");
  const port = Number(argv[3]);
  check(/^20261013v664r77web0[1-9]$/.test(argv[1])
    && /^20261013v664r77web0[1-9]$/.test(argv[5])
    && /^20261013v664r77freeze0[1-9]$/.test(argv[7])
    && Number.isInteger(port) && port >= 1024 && port <= 65535,
  "run-id-or-port");
  return { runId: argv[1], buildRunId: argv[5],
    freezeRunId: argv[7],
    origin: "http://127.0.0.1:" + port };
}
async function read(relative) {
  return JSON.parse(await readFile(safeWorkspacePathV662(relative),
    "utf8"));
}
async function screenshot(page, device, variant, runId) {
  const relative = "docs/release/v607/mainline-a-r77-v664-"
    + device + "-" + variant + "-" + runId + ".png";
  const bytes = await page.screenshot({ fullPage: false });
  await writeFile(safeWorkspacePathV662(relative), bytes,
    { flag: "wx" });
  return { path: relative, bytes: bytes.length,
    sha256: sha256(bytes) };
}
async function readLayout(page) {
  return page.evaluate(() => {
    const dialog = document.querySelector(
      '[data-mainline-a-nebula-review="true"]');
    const matrix = document.querySelector(
      '[data-mainline-a-r75-acceptance="v662"]');
    return { viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      dialogWidth: dialog?.clientWidth ?? 0,
      dialogScrollWidth: dialog?.scrollWidth ?? 0,
      matrixWidth: matrix?.clientWidth ?? 0,
      matrixScrollWidth: matrix?.scrollWidth ?? 0 };
  });
}
async function sampleFrames(page) {
  return page.evaluate(async () => {
    const intervals = [];
    let previous = performance.now();
    for (let index = 0; index < 120; index++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const now = performance.now();
      intervals.push(now - previous);
      previous = now;
    }
    intervals.sort((a, b) => a - b);
    return { count: intervals.length,
      p95IntervalMs: intervals[Math.ceil(.95 * intervals.length) - 1],
      maxIntervalMs: intervals.at(-1),
      usedJSHeapBytes: performance.memory?.usedJSHeapSize ?? null,
      evidenceClass: "short-local-browser-diagnostic-only" };
  });
}
async function observeMatrixRow(panel, row, device) {
  const detail = panel.locator(
    '[data-mainline-a-r75-detail="' + row.key + '"]');
  await detail.waitFor({ state: "visible" });
  const body = await detail.textContent();
  const source = await detail.getByRole("link",
    { name: "查看来源" }).getAttribute("href");
  const card = panel.locator(
    '[data-mainline-a-r75-row="' + row.key + '"]');
  check(body.includes(row.sourceSha256)
    && body.includes("版权 pending")
    && body.includes("scientificPayloadWriteback=false")
    && source === row.sourceUrl
    && await card.getAttribute("data-mainline-a-r75-state")
      === row.state,
  device + ":matrix-row:" + row.key,
  { source, expectedSource: row.sourceUrl });
  if (row.state === "identity-hold") {
    check(body.includes("组件身份 hold")
      && body.includes("未开放"),
    device + ":identity-hold:" + row.key);
  }
  if (row.group === "beta-nebula"
    && row.imageRoute === null) {
    check(body.includes("无可请求原图"),
      device + ":image-hold:" + row.key);
  }
  return { key: row.key, state: row.state,
    sourceMatched: true,
    admission: "candidate-only",
    rightsSigned: false };
}
async function walkMatrix(page, panel, rows, device, runId) {
  const mobile = device === "mobile-viewport";
  const selections = [];
  const first = panel.locator(
    '[data-mainline-a-r75-row="' + rows[0].key + '"]');
  await first.click();
  if (mobile) {
    check(await panel.getAttribute(
      "data-mainline-a-r77-mobile-mode") === "detail"
      && !(await first.isVisible()),
    "mobile:matrix-list-not-hidden");
  }
  const firstDetail = await screenshot(page, device,
    "matrix-first-detail", runId);
  for (let index = 0; index < rows.length; index++) {
    if (index > 0) {
      if (mobile) {
        await panel.getByRole("button",
          { name: "下一个跨入口对象" }).click();
      } else {
        await panel.locator(
          '[data-mainline-a-r75-row="' + rows[index].key + '"]')
          .click();
      }
    }
    selections.push(await observeMatrixRow(panel,
      rows[index], device));
  }
  let lastDetail = null;
  if (mobile) {
    const next = panel.getByRole("button",
      { name: "下一个跨入口对象" });
    check(await next.isDisabled(),
      "mobile:matrix-next-should-stop");
    lastDetail = await screenshot(page, device,
      "matrix-last-detail", runId);
    await panel.getByRole("button",
      { name: "返回跨入口对象列表" }).click();
    check(await first.isVisible()
      && await panel.getAttribute(
        "data-mainline-a-r77-mobile-mode") === "list",
    "mobile:matrix-return-list");
  }
  return { selections, firstDetail, lastDetail };
}
async function observeReadiness(panel, device) {
  const mobile = device === "mobile-viewport";
  const keys = ["star:acrux", "star:spica", "star:regulus",
    "star:polaris", "nebula:ring-nebula",
    "nebula:dumbbell-nebula", "nebula:bubble-nebula",
    "nebula:cats-eye-nebula", "nebula:omega-nebula"];
  const selections = [];
  await panel.locator('[data-mainline-a-r76-item="star:acrux"]')
    .click();
  for (let index = 0; index < keys.length; index++) {
    if (index > 0) {
      if (mobile) {
        await panel.getByRole("button",
          { name: "下一个待审对象" }).click();
      } else {
        await panel.locator(
          '[data-mainline-a-r76-item="' + keys[index] + '"]')
          .click();
      }
    }
    const detail = panel.locator(
      '[data-mainline-a-r76-detail="' + keys[index] + '"]');
    await detail.waitFor({ state: "visible" });
    const body = await detail.textContent();
    check(body.includes("candidate-only")
      && body.includes(keys[index].startsWith("star:")
        ? "组件审核：pending" : "版权签署：pending"),
    device + ":readiness:" + keys[index]);
    selections.push(keys[index]);
  }
  if (mobile) {
    check(await panel.getByRole("button",
      { name: "下一个待审对象" }).isDisabled(),
    "mobile:readiness-next-should-stop");
    await panel.getByRole("button",
      { name: "返回待审对象列表" }).click();
    check(await panel.locator(
      '[data-mainline-a-r76-item="star:acrux"]').isVisible(),
    "mobile:readiness-return-list");
  }
  return selections;
}
async function inspect(browser, device, config, build, freeze) {
  const mobile = device === "mobile-viewport";
  const context = await browser.newContext({
    viewport: VIEWPORTS[device], deviceScaleFactor: 1,
    isMobile: mobile, hasTouch: mobile });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(15_000);
    const pageErrors = [];
    const consoleErrors = [];
    const externalImageRequests = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("request", (request) => {
      if (request.resourceType() === "image"
        && /^https?:/.test(request.url())
        && !request.url().startsWith(config.origin)) {
        externalImageRequests.push(request.url());
      }
    });
    await page.goto(config.origin, {
      waitUntil: "domcontentloaded", timeout: 25_000 });
    const shell = page.locator("[data-atlas-app-shell]");
    await shell.waitFor({ state: "visible", timeout: 25_000 });
    check(await shell.getAttribute("data-mainline-build-id")
      === build.runtimeBuildId,
    device + ":runtime-build-identity");
    const selectedBefore = await shell.getAttribute(
      "data-celestial-catalog-selected-id");
    await page.getByRole("button",
      { name: /^工具/ }).click();
    await page.getByRole("button",
      { name: "清权审查" }).click();
    const matrix = page.locator(
      '[data-mainline-a-r75-acceptance="v662"]');
    await matrix.waitFor({ state: "visible" });
    check(await matrix.getAttribute(
      "data-mainline-a-r75-release") === "blocked"
      && await matrix.getAttribute(
        "data-scientific-payload-writeback") === "false",
    device + ":matrix-boundary");
    await matrix.getByRole("button",
      { name: "展开跨入口矩阵" }).click();
    check(await matrix.locator(
      "[data-mainline-a-r75-row]").count() === 96,
    device + ":matrix-row-count");
    const layout = await readLayout(page);
    check(layout.documentWidth <= layout.viewportWidth
      && layout.dialogScrollWidth <= layout.dialogWidth
      && layout.matrixScrollWidth <= layout.matrixWidth,
    device + ":layout-overflow", layout);
    const overview = await screenshot(page, device,
      "matrix-overview", config.runId);
    const matrixWalk = await walkMatrix(page, matrix,
      freeze.matrixRows, device, config.runId);
    await matrix.getByRole("combobox",
      { name: "筛选跨入口审核状态" })
      .selectOption("identity-hold");
    check(await matrix.locator(
      "[data-mainline-a-r75-row]").count() === 4,
    device + ":identity-filter");
    await matrix.getByRole("combobox",
      { name: "筛选跨入口审核状态" })
      .selectOption("all");
    await matrix.getByRole("button",
      { name: "Beta 星云 24" }).click();
    await matrix.getByRole("combobox",
      { name: "筛选跨入口审核状态" })
      .selectOption("source-hold");
    check(await matrix.locator(
      "[data-mainline-a-r75-row]").count() === 5,
    device + ":nebula-hold-filter");
    await matrix.getByRole("combobox",
      { name: "筛选跨入口审核状态" })
      .selectOption("all");
    await matrix.getByRole("button",
      { name: "全部 96" }).click();
    await matrix.getByRole("button",
      { name: "收起跨入口矩阵" }).click();
    const readiness = page.locator(
      '[data-mainline-a-r76-readiness="v663"]');
    await readiness.getByRole("button",
      { name: "查看待审事项" }).click();
    const readinessSelections = await observeReadiness(
      readiness, device);
    await readiness.getByRole("button",
      { name: "收起待审事项" }).click();
    const performanceDiagnostic = await sampleFrames(page);
    await page.getByRole("button",
      { name: "关闭星云清权审查台" }).click();
    await matrix.waitFor({ state: "detached" });
    check(await shell.getAttribute(
      "data-celestial-catalog-selected-id")
      === selectedBefore,
    device + ":review-changed-scene");
    check(pageErrors.length === 0
      && consoleErrors.length === 0
      && externalImageRequests.length === 0,
    device + ":browser-errors-or-external-images",
    { pageErrors, consoleErrors, externalImageRequests });
    return { device, viewport: [
      VIEWPORTS[device].width, VIEWPORTS[device].height],
    layout, overview, matrixWalk,
    readinessSelections, performanceDiagnostic,
    pageErrors, consoleErrors, externalImageRequests,
    sceneChangedByReview: false };
  } finally { await context.close(); }
}
export async function runR77MatrixBrowserV664(config) {
  const buildPath = "docs/release/v607/mainline-a-r77-build-"
    + config.buildRunId + ".json";
  const freezePath = "docs/release/v607/mainline-a-r77-v664-freeze-"
    + config.freezeRunId + ".json";
  const [build, freeze, source] = await Promise.all([
    read(buildPath), read(freezePath), captureBuildInputs(),
  ]);
  check(build.status === "passed" && build.sourceStable
    && build.inputAfterSha256 === source.sha256
    && freeze.appSourceSha256 === source.sha256
    && inspectR77FreezeV664(freeze).ok,
  "build-or-freeze-source-invalid");
  const startedAt = new Date().toISOString();
  let stage = "launch";
  const browser = await chromium.launch({
    headless: true, executablePath: CHROME });
  try {
    stage = "desktop";
    const desktop = await inspect(browser, "desktop",
      config, build, freeze);
    stage = "mobile-viewport";
    const mobileViewport = await inspect(browser,
      "mobile-viewport", config, build, freeze);
    check((await captureBuildInputs()).sha256 === source.sha256,
      "source-changed-during-browser");
    const receipt = {
      schema: "mainline-a-r77-matrix-browser-v664",
      status: "passed-local-desktop-and-simulated-mobile-candidate-hold",
      startedAt, endedAt: new Date().toISOString(),
      origin: config.origin, buildReceipt: buildPath,
      freezeReceipt: freezePath, buildId: build.buildId,
      runtimeBuildId: build.runtimeBuildId,
      appSourceSha256: source.sha256,
      freezeFingerprint: freeze.fingerprint,
      desktop, mobileViewport,
      totals: { matrixSelections: 192,
        readinessSelections: 18,
        pageErrors: 0, consoleErrors: 0,
        externalImageRequests: 0 },
      physicalMobile: "not-run",
      boundary: { candidateOnly: true, hold: true,
        notAdmitted: true, scientificPayloadWriteback: false,
        publicWebReleaseApproved: false },
      claims: { realUserValidation: false,
        productionPerformance: false,
        scientificValidity: false, copyrightApproval: false,
        publicWebReleaseApproved: false },
    };
    const output = "docs/release/v607/mainline-a-r77-v664-matrix-browser-"
      + config.runId + ".json";
    await writeFile(safeWorkspacePathV662(output),
      JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
    return { status: receipt.status, output,
      matrixSelections: 192, readinessSelections: 18 };
  } catch (error) {
    const attempt = "docs/release/v607/mainline-a-r77-v664-matrix-browser-attempt-"
      + config.runId + ".json";
    await writeFile(safeWorkspacePathV662(attempt),
      JSON.stringify({
        schema: "mainline-a-r77-browser-attempt-v664",
        status: "failed-preserved", startedAt,
        endedAt: new Date().toISOString(),
        stage, buildReceipt: buildPath,
        appSourceSha256: source.sha256,
        errorClass: error?.name ?? "Error",
        errorMessage: error?.message ?? String(error),
        browserQualified: false,
        scientificPayloadWriteback: false,
      }, null, 2) + "\n", { flag: "wx" });
    throw error;
  } finally { await browser.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runR77MatrixBrowserV664(
    parseR77BrowserOptionsV664(process.argv.slice(2)))));
}
