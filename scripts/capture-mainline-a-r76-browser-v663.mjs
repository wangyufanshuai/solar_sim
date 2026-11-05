import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { R76_OUTPUT_V663, safePathR76V663 } from
  "./build-mainline-a-r76-readiness-v663.mjs";
import { inspectR76ReadinessShapeV663 } from
  "./verify-mainline-a-r76-readiness-v663.mjs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const VIEWPORTS = { desktop: { width: 1280, height: 720 },
  "mobile-viewport": { width: 390, height: 844 } };
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
function check(value, code, detail) {
  if (!value) throw new Error(`r76-browser:${code}${detail
    ? `:${JSON.stringify(detail)}` : ""}`);
}
export function parseR76BrowserOptionsV663(argv) {
  check([4, 6].includes(argv.length) && argv[0] === "--run-id"
    && argv[2] === "--port"
    && (argv.length === 4 || argv[4] === "--build-run-id"), "usage");
  const port = Number(argv[3]);
  const runId = argv[1];
  const buildRunId = argv[5] ?? runId;
  check(/^20261013v663r76web0[1-9]$/.test(runId)
    && /^20261013v663r76web0[1-9]$/.test(buildRunId)
    && Number.isInteger(port) && port >= 1024 && port <= 65535,
  "run-id-or-port");
  return { runId, buildRunId, origin: `http://127.0.0.1:${port}` };
}
async function screenshot(page, device, variant, runId) {
  const relative =
    `docs/release/v607/mainline-a-r76-v663-${device}-${variant}-${runId}.png`;
  const bytes = await page.screenshot({ fullPage: false });
  await writeFile(safePathR76V663(relative), bytes, { flag: "wx" });
  return { path: relative, bytes: bytes.length, sha256: sha(bytes) };
}
async function layout(page, selector) {
  return page.evaluate((name) => {
    const panel = document.querySelector(name);
    const rect = panel?.getBoundingClientRect();
    return { viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelWidth: panel?.clientWidth ?? 0,
      panelScrollWidth: panel?.scrollWidth ?? 0,
      panelLeft: rect?.left ?? null,
      panelRight: rect?.right ?? null };
  }, selector);
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
function expectedItems(snapshot) {
  return [
    ...snapshot.stars.map((row) => ({ key: `star:${row.id}`,
      title: row.id,
      sourceUrl: "https://simbad.cds.unistra.fr/simbad/" })),
    ...snapshot.nebulae.map((row) => ({ key: `nebula:${row.id}`,
      title: row.id, sourceUrl: row.officialPageUrl })),
  ];
}
async function inspectReadiness(page, device, config, snapshot) {
  const shell = page.locator("[data-atlas-app-shell]");
  const sceneBefore = await shell.getAttribute(
    "data-celestial-catalog-selected-id");
  await page.getByRole("button", { name: /^工具/ }).click();
  await page.getByRole("button", { name: "清权审查" }).click();
  const panel = page.locator('[data-mainline-a-r76-readiness="v663"]');
  await panel.waitFor({ state: "visible", timeout: 15_000 });
  check(await panel.getAttribute("data-mainline-a-r76-state")
    === "valid-candidate-hold"
    && await panel.getAttribute("data-mainline-a-r76-release")
      === "blocked"
    && await panel.getAttribute("data-scientific-payload-writeback")
      === "false"
    && await panel.locator("[data-mainline-a-r76-gate]").count() === 6,
  `${device}:readiness-boundary`);
  await panel.getByRole("button", { name: "查看待审事项" }).click();
  check(await panel.locator("[data-mainline-a-r76-item]").count() === 9,
    `${device}:item-count`);
  const panelLayout = await layout(page,
    '[data-mainline-a-r76-readiness="v663"]');
  check(panelLayout.documentWidth <= panelLayout.viewportWidth
    && panelLayout.panelScrollWidth <= panelLayout.panelWidth
    && panelLayout.panelLeft >= 0
    && panelLayout.panelRight <= panelLayout.viewportWidth,
  `${device}:readiness-overflow`, panelLayout);
  const overview = await screenshot(page, device, "readiness",
    config.runId);
  const selections = [];
  for (const item of expectedItems(snapshot)) {
    const card = panel.locator(
      `[data-mainline-a-r76-item="${item.key}"]`);
    await card.click();
    const detail = panel.locator(
      `[data-mainline-a-r76-detail="${item.key}"]`);
    await detail.waitFor({ state: "visible" });
    const body = await detail.textContent();
    const href = await detail.getByRole("link", {
      name: "查看官方来源" }).getAttribute("href");
    const group = item.key.startsWith("star:")
      ? "stellar-component" : "nebula-image";
    check(body.includes(group === "stellar-component"
      ? "组件审核：pending" : "版权签署：pending")
      && body.includes("运行时准入：candidate-only")
      && body.includes(group === "stellar-component"
        ? "结构化响应 1/1" : "原图响应 0/1")
      && href === item.sourceUrl,
    `${device}:item-source-or-admission:${item.key}`,
    { href, expected: item.sourceUrl });
    selections.push({ key: item.key, sourceMatched: true,
      componentConfirmed: false, rightsSigned: false,
      rawImageCaptured: false });
  }
  await panel.locator(
    '[data-mainline-a-r76-item="nebula:dumbbell-nebula"]').click();
  const conflictDetail = panel.locator(
    '[data-mainline-a-r76-detail="nebula:dumbbell-nebula"]');
  await conflictDetail.scrollIntoViewIfNeeded();
  const detailScreenshot = await screenshot(page, device,
    "held-nebula-detail", config.runId);
  await panel.getByRole("button", { name: "恒星组件 4" }).click();
  check(await panel.locator("[data-mainline-a-r76-item]").count() === 4,
    `${device}:star-filter`);
  await panel.getByRole("button", { name: "星云原图 5" }).click();
  check(await panel.locator("[data-mainline-a-r76-item]").count() === 5,
    `${device}:nebula-filter`);
  await panel.getByRole("button", { name: "全部 9 项" }).click();
  const search = panel.getByRole("textbox", { name: "搜索待审事项" });
  await search.fill("definitely-not-present");
  check(await panel.locator("[data-mainline-a-r76-item]").count() === 0,
    `${device}:empty-state`);
  await search.fill("");
  check(await panel.locator("[data-mainline-a-r76-item]").count() === 9,
    `${device}:search-reset`);
  const diagnostic = await frameSample(page);
  await panel.getByRole("button", { name: "收起待审事项" }).click();
  check(await panel.locator("[data-mainline-a-r76-item]").count() === 0,
    `${device}:closed-row-lifecycle`);
  await page.getByRole("button", { name: "关闭星云清权审查台" }).click();
  await panel.waitFor({ state: "detached" });
  check(await shell.getAttribute("data-celestial-catalog-selected-id")
    === sceneBefore, `${device}:review-changed-scene`);
  return { panelLayout, selections, overview,
    detailScreenshot,
    emptySearchState: true, reviewChangedScene: false,
    performanceDiagnostic: diagnostic };
}
async function inspectScene(page, device, config) {
  await page.getByRole("button", { name: "恒星图集" }).click();
  await page.locator('[data-mainline-a-atlas-star="vega"]').click();
  await page.getByRole("button", { name: "在星空中定位" }).click();
  const passport = page.locator(
    '#atlas-celestial-object-passport[data-celestial-object-passport-open="true"]');
  await passport.waitFor({ state: "visible", timeout: 15_000 });
  const isMobile = device === "mobile-viewport";
  await page.waitForFunction((mobile) => {
    const element = document.querySelector(
      '#atlas-celestial-object-passport[data-celestial-object-passport-open="true"]');
    return element?.getAttribute("data-mainline-a-mobile-scene-peek")
      === (mobile ? "true" : "false");
  }, isMobile);
  const peek = await layout(page,
    '#atlas-celestial-object-passport[data-celestial-object-passport-open="true"]');
  check(peek.documentWidth <= peek.viewportWidth
    && peek.panelLeft >= 0 && peek.panelRight <= peek.viewportWidth,
  `${device}:scene-peek-overflow`, peek);
  const content = passport.locator(
    "#atlas-celestial-object-passport-content");
  const summary = passport.locator(
    '[data-mainline-a-mobile-scene-peek-summary="true"]');
  const toggle = passport.locator(
    '[data-mainline-a-mobile-peek-toggle="true"]');
  let expanded = null;
  if (isMobile) {
    check(await summary.isVisible()
      && !(await content.isVisible())
      && await toggle.isVisible()
      && await toggle.getAttribute("aria-expanded") === "false",
    "mobile:scene-peek-initial");
  } else {
    check(await content.isVisible()
      && !(await toggle.isVisible()), "desktop:passport-visible");
  }
  const initial = await screenshot(page, device,
    isMobile ? "scene-peek" : "scene-passport", config.runId);
  if (isMobile) {
    await toggle.click();
    check(await passport.getAttribute(
      "data-mainline-a-mobile-scene-peek") === "false"
      && await content.isVisible()
      && !(await summary.count())
      && await toggle.getAttribute("aria-expanded") === "true",
    "mobile:scene-detail-expansion");
    expanded = await screenshot(page, device,
      "scene-details", config.runId);
    await toggle.click();
    check(await passport.getAttribute(
      "data-mainline-a-mobile-scene-peek") === "true"
      && !(await content.isVisible()),
    "mobile:scene-peek-restored");
  }
  return { objectId: await passport.getAttribute(
    "data-celestial-object-passport-id"),
  initialMode: isMobile ? "peek" : "details",
  mobileDetailsCanExpand: isMobile ? Boolean(expanded) : null,
  layout: peek, screenshots: { initial, expanded } };
}
async function inspect(browser, device, config, build, snapshot) {
  const mobile = device === "mobile-viewport";
  const context = await browser.newContext({
    viewport: VIEWPORTS[device], deviceScaleFactor: 1,
    isMobile: mobile, hasTouch: mobile });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(12_000);
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
    await page.goto(config.origin, { waitUntil: "domcontentloaded",
      timeout: 25_000 });
    const shell = page.locator("[data-atlas-app-shell]");
    await shell.waitFor({ state: "visible", timeout: 25_000 });
    check(await shell.getAttribute("data-mainline-build-id")
      === build.runtimeBuildId, `${device}:runtime-build-id`);
    const readiness = await inspectReadiness(page, device,
      config, snapshot);
    const scene = await inspectScene(page, device, config);
    check(pageErrors.length === 0 && consoleErrors.length === 0
      && externalImageRequests.length === 0,
    `${device}:browser-errors-or-external-images`,
    { pageErrors, consoleErrors, externalImageRequests });
    return { device, viewport: [VIEWPORTS[device].width,
      VIEWPORTS[device].height], readiness, scene,
    pageErrors, consoleErrors, externalImageRequests };
  } finally { await context.close(); }
}
export async function runR76BrowserV663(config) {
  const buildPath =
    `docs/release/v607/mainline-a-r76-build-${config.buildRunId}.json`;
  const [build, snapshot, source] = await Promise.all([
    readFile(safePathR76V663(buildPath), "utf8").then(JSON.parse),
    readFile(safePathR76V663(R76_OUTPUT_V663), "utf8")
      .then(JSON.parse), captureBuildInputs(),
  ]);
  check(build.status === "passed" && build.sourceStable
    && build.inputAfterSha256 === source.sha256
    && inspectR76ReadinessShapeV663(snapshot).issues.length === 0,
  "build-or-snapshot-source-drift");
  const startedAt = new Date().toISOString();
  let stage = "launch";
  const browser = await chromium.launch({ headless: true,
    executablePath: CHROME });
  try {
    stage = "desktop";
    const desktop = await inspect(browser, "desktop",
      config, build, snapshot);
    stage = "mobile-viewport";
    const mobileViewport = await inspect(browser,
      "mobile-viewport", config, build, snapshot);
    stage = "source-check";
    check((await captureBuildInputs()).sha256 === source.sha256,
      "source-changed-during-browser");
    const receipt = {
      schema: "mainline-a-r76-web-browser-v663",
      status: "passed-local-desktop-and-simulated-mobile-candidate-hold",
      startedAt, endedAt: new Date().toISOString(),
      origin: config.origin, buildReceipt: buildPath,
      buildId: build.buildId,
      runtimeBuildId: build.runtimeBuildId,
      appSourceSha256: source.sha256,
      snapshotFingerprint: snapshot.fingerprint,
      desktop, mobileViewport, physicalMobile: "not-run",
      boundary: { candidateOnly: true, hold: true,
        notAdmitted: true, scientificPayloadWriteback: false,
        publicWebReleaseApproved: false },
      claims: { copyrightApproval: false,
        scientificValidity: false, productionPerformance: false,
        realUserValidation: false, physicalMobile: false,
        publicWebReleaseApproved: false },
    };
    const output =
      `docs/release/v607/mainline-a-r76-v663-browser-${config.runId}.json`;
    await writeFile(safePathR76V663(output),
      `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
    return { status: receipt.status, output,
      selectedItems: desktop.readiness.selections.length
        + mobileViewport.readiness.selections.length,
      mobileDetailsCanExpand:
        mobileViewport.scene.mobileDetailsCanExpand };
  } catch (error) {
    const output =
      `docs/release/v607/mainline-a-r76-v663-browser-attempt-${config.runId}.json`;
    await writeFile(safePathR76V663(output),
      `${JSON.stringify({ schema: "mainline-a-r76-browser-attempt-v663",
        status: "failed-preserved",
        stage, startedAt, endedAt: new Date().toISOString(),
        buildReceipt: buildPath,
        appSourceSha256: source.sha256,
        error: error.message }, null, 2)}\n`,
    { flag: "wx" });
    throw error;
  } finally { await browser.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runR76BrowserV663(
    parseR76BrowserOptionsV663(process.argv.slice(2)))));
}
