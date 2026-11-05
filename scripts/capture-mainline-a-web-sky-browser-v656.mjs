import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const R75_PROFILE = process.env.MAINLINE_A_R75_PROFILE === "1";
const R70_WEB_STAGE = process.env.MAINLINE_A_SKY_R70_WEB_STAGE === "1";
const ORIGIN = R75_PROFILE ? process.env.MAINLINE_A_R75_ORIGIN : R70_WEB_STAGE
  ? "http://127.0.0.1:3101" : "http://127.0.0.1:3100";
const BUILD = R75_PROFILE
  ? `docs/release/v607/mainline-a-r75-build-${process.env.MAINLINE_A_R75_BUILD_RUN_ID}.json`
  : R70_WEB_STAGE
  ? "docs/release/v607/mainline-a-r70-build-20261012v657web02.json"
  : "docs/release/v607/mainline-a-r69-build-20261012v656web03.json";
const MANIFEST = "app/data/mainlineAWebSkyAtlasV656.generated.json";
const OUTPUT = R75_PROFILE
  ? `docs/release/v607/mainline-a-r75-v662-sky-browser-${process.env.MAINLINE_A_R75_BUILD_RUN_ID}.json`
  : R70_WEB_STAGE
  ? "docs/release/v607/mainline-a-r70-v657-sky-browser-20261012v657web02.json"
  : "docs/release/v607/mainline-a-r69-v656-browser-20261012v656web03.json";
if (R75_PROFILE && (!/^http:\/\/127\.0\.0\.1:\d{4,5}$/.test(ORIGIN ?? "")
  || !/^20261013v662r75web0[1-9]$/.test(process.env.MAINLINE_A_R75_BUILD_RUN_ID ?? ""))) {
  throw new Error("web-sky-browser-v656:r75-profile-invalid");
}
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const ensure = (condition, code) => {
  if (!condition) throw new Error(`web-sky-browser-v656:${code}`);
};

const [build, manifest, source] = await Promise.all([
  readFile(path.join(ROOT, BUILD), "utf8").then(JSON.parse),
  readFile(path.join(ROOT, MANIFEST), "utf8").then(JSON.parse),
  captureBuildInputs(),
]);
ensure(build.status === "passed" && build.sourceStable === true
  && build.inputBefore?.sha256 === source.sha256
  && build.inputAfterSha256 === source.sha256,
"build-not-current");
ensure(manifest.stars.length === 24
  && manifest.constellations.length === 12
  && manifest.counts.candidateHold === 4
  && manifest.boundary.scientificPayloadWriteback === false,
"manifest-boundary");

async function openGuide(page) {
  await page.getByRole("button", { name: /^工具/ }).click();
  await page.getByRole("button", { name: "星空导览 · 24+12" }).click();
  const guide = page.locator('[data-mainline-a-web-sky="v656"]');
  await guide.waitFor({ state: "visible", timeout: 15_000 });
  await page.locator('[data-mainline-a-web-sky="v656"][data-mainline-a-web-sky-load="ready"]')
    .waitFor({ state: "visible", timeout: 20_000 });
  return guide;
}

async function captureScreenshot(page, device, kind) {
  const relative = R75_PROFILE
    ? `docs/release/v607/mainline-a-r75-v662-sky-${device}-${kind}-${process.env.MAINLINE_A_R75_BUILD_RUN_ID}.png`
    : R70_WEB_STAGE
    ? `docs/release/v607/mainline-a-r70-v657-sky-${device}-${kind}-20261012v657web02.png`
    : `docs/release/v607/mainline-a-r69-v656-browser-${device}-${kind}-20261012v656web03.png`;
  const bytes = await page.screenshot({ path: path.join(ROOT, relative), fullPage: false });
  return { path: relative, bytes: bytes.byteLength, sha256: sha(bytes) };
}

async function frameSample(page) {
  return page.evaluate(async () => {
    const times = [];
    let previous = performance.now();
    for (let index = 0; index < 120; index++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const now = performance.now();
      times.push(now - previous); previous = now;
    }
    const sorted = [...times].sort((a, b) => a - b);
    return { frames: times.length, p95FrameMs: sorted[Math.ceil(sorted.length * .95) - 1],
      maxFrameMs: sorted.at(-1),
      jsHeapUsedBytes: performance.memory?.usedJSHeapSize ?? null,
      scope: "short-local-browser-diagnostic-only" };
  });
}

async function runDevice(browser, device) {
  const mobile = device === "mobile-viewport";
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 }
      : { width: 1280, height: 720 },
    deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const original = window.fetch.bind(window);
    let started = 0; let completed = 0; let active = 0;
    window.fetch = async (...args) => {
      const url = String(args[0] instanceof Request ? args[0].url : args[0]);
      if (!url.includes("/api/atlas/mainline-a-web-sky")) {
        return original(...args);
      }
      started += 1; active += 1;
      try { return await original(...args); }
      finally { active -= 1; completed += 1; }
    };
    window.__mainlineAWebSkyRequestsV656 = () => ({ started, completed, active });
  });
  try {
    await page.goto(ORIGIN, { waitUntil: "domcontentloaded", timeout: 20_000 });
    const shell = page.locator("[data-atlas-app-shell]");
    await shell.waitFor({ state: "visible", timeout: 20_000 });
    const runtimeBuildId = await shell.getAttribute("data-mainline-build-id");
    ensure(runtimeBuildId === build.runtimeBuildId,
    `${device}:runtime-build-id`);
    let guide = await openGuide(page);
    ensure(await guide.locator("[data-mainline-a-web-sky-star]").count() === 24,
    `${device}:star-card-count`);
    ensure(await guide.locator('[data-mainline-a-web-sky-star-phase="runtime-existing"]').count() === 20,
    `${device}:runtime-card-count`);
    ensure(await guide.locator('[data-mainline-a-web-sky-star-phase="candidate-hold"]').count() === 4,
    `${device}:hold-card-count`);
    ensure(await guide.getAttribute("data-scientific-payload-writeback") === "false",
    `${device}:writeback-boundary`);
    const initialLayout = await page.evaluate(() => {
      const dialog = document.querySelector('[data-mainline-a-web-sky="v656"]');
      return { viewportWidth: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        dialogWidth: dialog?.clientWidth ?? 0,
        dialogScrollWidth: dialog?.scrollWidth ?? 0 };
    });
    ensure(initialLayout.documentWidth <= initialLayout.viewportWidth
      && initialLayout.dialogScrollWidth <= initialLayout.dialogWidth,
    `${device}:horizontal-overflow`);
    const starScreenshot = await captureScreenshot(page, device, "stars");
    let starDetailScreenshot = null;
    let mobileStarDetailVisible = null;
    if (mobile) {
      const detail = guide.locator(
        '[data-mainline-a-web-sky-detail="star:sirius-a"]');
      await detail.scrollIntoViewIfNeeded();
      mobileStarDetailVisible = await detail.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return rect.top < innerHeight - 100 && rect.bottom > 100;
      });
      ensure(mobileStarDetailVisible,
      `${device}:star-detail-not-visually-reachable`);
      starDetailScreenshot = await captureScreenshot(
        page, device, "star-detail");
    }
    const starSelections = [];
    for (const row of manifest.stars) {
      await guide.locator(`[data-mainline-a-web-sky-star="${row.id}"]`)
        .click({ timeout: 10_000 });
      const detail = guide.locator(
        `[data-mainline-a-web-sky-detail="star:${row.id}"]`);
      await detail.waitFor({ state: "attached", timeout: 10_000 });
      const focus = guide.locator(
        `[data-mainline-a-web-sky-focus-star="${row.id}"]`);
      ensure((await focus.isEnabled()) === row.canFocusScene,
      `${device}:${row.id}:focus-hold-mismatch`);
      const portrait = await detail.locator(
        `[data-mainline-a-stellar-portrait="${row.id}"]`).count();
      ensure(portrait === (row.canFocusScene ? 1 : 0),
      `${device}:${row.id}:portrait-phase-mismatch`);
      if (!row.canFocusScene) {
        ensure((await detail.textContent()).includes("组件身份尚未确认"),
        `${device}:${row.id}:hold-state-missing`);
      }
      const sourceLink = detail.locator(`a[href="${row.sourcePageUrl}"]`);
      ensure(await sourceLink.count() === 1,
      `${device}:${row.id}:source-url-mismatch`);
      starSelections.push({ id: row.id, phase: row.phase,
        focusEnabled: await focus.isEnabled(), portrait });
      console.log(JSON.stringify({ stage: "web-sky-star",
        device, id: row.id, focusEnabled: row.canFocusScene }));
    }
    const sirius = guide.locator('[data-mainline-a-web-sky-star="sirius-a"]');
    await sirius.focus();
    await sirius.press("ArrowRight");
    ensure(await guide.locator('[data-mainline-a-web-sky-star="canopus"]')
      .getAttribute("data-mainline-a-web-sky-star-selected") === "true",
    `${device}:keyboard-arrow-navigation`);
    await guide.locator('[data-mainline-a-web-sky-star="canopus"]')
      .press("Home");
    ensure(await sirius.getAttribute("data-mainline-a-web-sky-star-selected") === "true",
    `${device}:keyboard-home-navigation`);
    await guide.locator('[data-mainline-a-web-sky-focus-star="sirius-a"]')
      .click();
    await guide.waitFor({ state: "detached", timeout: 10_000 });
    await page.waitForFunction(() => document.querySelector(
      "[data-atlas-app-shell]")?.getAttribute(
      "data-celestial-catalog-selected-id") === "stellar-hero:sirius-a", null,
    { timeout: 10_000 });
    const runtimeStarRoute = await shell.getAttribute(
      "data-celestial-catalog-selected-id");

    await page.reload({ waitUntil: "domcontentloaded" });
    await shell.waitFor({ state: "visible" });
    guide = await openGuide(page);
    await guide.getByRole("button", { name: "星座 12" }).click();
    ensure(await guide.locator("[data-mainline-a-web-sky-constellation]").count() === 12,
    `${device}:constellation-card-count`);
    const constellationSelections = [];
    for (const row of manifest.constellations) {
      await guide.locator(
        `[data-mainline-a-web-sky-constellation="${row.code}"]`)
        .click({ timeout: 10_000 });
      const detail = guide.locator(
        `[data-mainline-a-web-sky-detail="constellation:${row.code}"]`);
      await detail.waitFor({ state: "attached", timeout: 10_000 });
      const chart = detail.locator(`[data-mainline-a-star-chart="${row.code}"]`);
      ensure(await chart.count() === 1,
      `${device}:${row.code}:chart-missing`);
      const focus = detail.locator(
        `[data-mainline-a-web-sky-focus-constellation="${row.code}"]`);
      ensure(await focus.isEnabled(),
      `${device}:${row.code}:canonical-route-disabled`);
      ensure(await detail.locator(`a[href="${row.sourcePageUrl}"]`).count() === 1,
      `${device}:${row.code}:source-url-mismatch`);
      ensure(await guide.locator("[data-mainline-a-star-chart]").count() === 1,
      `${device}:${row.code}:chart-resource-not-replaced`);
      constellationSelections.push({ code: row.code,
        catalogId: row.routeCatalogId, chartCount: 1,
        focusEnabled: true });
      console.log(JSON.stringify({ stage: "web-sky-constellation",
        device, code: row.code }));
    }
    await guide.locator('[data-mainline-a-web-sky-constellation="Ori"]')
      .click();
    const constellationScreenshot = await captureScreenshot(
      page, device, "constellations");
    let constellationDetailScreenshot = null;
    let mobileConstellationDetailVisible = null;
    if (mobile) {
      const detail = guide.locator(
        '[data-mainline-a-web-sky-detail="constellation:Ori"]');
      await detail.scrollIntoViewIfNeeded();
      mobileConstellationDetailVisible = await detail.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return rect.top < innerHeight - 100 && rect.bottom > 100;
      });
      ensure(mobileConstellationDetailVisible,
      `${device}:constellation-detail-not-visually-reachable`);
      constellationDetailScreenshot = await captureScreenshot(
        page, device, "constellation-detail");
    }
    const performance = await frameSample(page);
    await guide.locator('[data-mainline-a-web-sky-focus-constellation="Ori"]')
      .click();
    await guide.waitFor({ state: "detached", timeout: 10_000 });
    await page.waitForFunction(() => document.querySelector(
      "[data-atlas-app-shell]")?.getAttribute(
      "data-celestial-catalog-selected-id") === "constellation:Ori", null,
    { timeout: 10_000 });
    const runtimeConstellationRoute = await shell.getAttribute(
      "data-celestial-catalog-selected-id");
    ensure(await page.locator("[data-mainline-a-star-chart]").count() === 0,
    `${device}:chart-not-released-on-close`);

    await page.reload({ waitUntil: "domcontentloaded" });
    await shell.waitFor({ state: "visible" });
    let failedOnce = false;
    await page.route("**/api/atlas/mainline-a-web-sky", async (route) => {
      if (!failedOnce) {
        failedOnce = true;
        await route.fulfill({ status: 503, contentType: "application/json",
          body: JSON.stringify({ status: "intentional-browser-failure" }) });
      } else await route.continue();
    });
    await page.getByRole("button", { name: /^工具/ }).click();
    await page.getByRole("button", { name: "星空导览 · 24+12" }).click();
    guide = page.locator('[data-mainline-a-web-sky="v656"]');
    await page.locator('[data-mainline-a-web-sky="v656"][data-mainline-a-web-sky-load="failed"]')
      .waitFor({ state: "visible", timeout: 10_000 });
    ensure(await guide.locator("[data-mainline-a-web-sky-star]").count() === 0,
    `${device}:failed-load-rendered-uncertified-stars`);
    await guide.getByRole("button", { name: "重试载入" }).click();
    await page.locator('[data-mainline-a-web-sky="v656"][data-mainline-a-web-sky-load="ready"]')
      .waitFor({ state: "visible", timeout: 20_000 });
    ensure(await guide.locator("[data-mainline-a-web-sky-star]").count() === 24,
    `${device}:retry-not-ready`);
    await page.unroute("**/api/atlas/mainline-a-web-sky");
    await guide.getByRole("button", { name: "关闭星空导览" }).click();
    await guide.waitFor({ state: "detached", timeout: 10_000 });
    ensure(await page.locator("[data-mainline-a-star-chart]").count() === 0,
    `${device}:chart-remained-after-retry-close`);
    const requests = await page.evaluate(() =>
      window.__mainlineAWebSkyRequestsV656());
    ensure(requests.active === 0 && requests.started === requests.completed,
    `${device}:request-lifecycle-leak`);
    const selectedBeforeLegacyHold = await shell.getAttribute(
      "data-celestial-catalog-selected-id");
    await page.getByRole("button", { name: /^工具/ }).click();
    await page.getByRole("button", { name: "恒星名录 · 24" }).click();
    const legacyHold = page.locator('[data-post-v593-stellar-target="acrux"]');
    ensure(await legacyHold.getAttribute("data-mainline-a-hero-action")
      === "review-hold", `${device}:legacy-roster-hold-action`);
    await legacyHold.click();
    await page.locator('[data-mainline-a-beta-hero-review="true"]')
      .waitFor({ state: "visible", timeout: 10_000 });
    const selectedAfterLegacyHold = await shell.getAttribute(
      "data-celestial-catalog-selected-id");
    ensure(selectedAfterLegacyHold === selectedBeforeLegacyHold,
    `${device}:legacy-roster-promoted-hold`);
    await page.getByRole("button", { name: "关闭恒星证据审查台" }).click();
    await page.locator('[data-mainline-a-beta-hero-review="true"]')
      .waitFor({ state: "detached", timeout: 10_000 });
    ensure(errors.length === 0, `${device}:page-errors`);
    return { device, viewport: mobile ? [390, 844] : [1280, 720],
      observedAt: new Date().toISOString(),
      runtimeBuildId, initialLayout,
      starSelections, constellationSelections,
      keyboard: { arrowRightSelected: "canopus", homeSelected: "sirius-a" },
      focusRoutes: { star: runtimeStarRoute,
        constellation: runtimeConstellationRoute },
      failureRetry: "intentional-503-then-ready",
      legacyRosterHold: { action: "review-hold",
        selectedCatalogUnchanged: true },
      mobileDetailReachability: mobile ? {
        star: mobileStarDetailVisible,
        constellation: mobileConstellationDetailVisible,
      } : null,
      requests, performance,
      screenshots: { stars: starScreenshot,
        constellations: constellationScreenshot,
        starDetail: starDetailScreenshot,
        constellationDetail: constellationDetailScreenshot },
      pageErrors: errors,
      claims: { realUserValidation: false, physicalMobile: false,
        productionPerformance: false, copyrightApproval: false,
        scientificValidity: false } };
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true,
  executablePath: CHROME });
try {
  const desktop = await runDevice(browser, "desktop");
  const mobileViewport = await runDevice(browser, "mobile-viewport");
  const after = await captureBuildInputs();
  ensure(after.sha256 === source.sha256,
  "app-source-changed-during-browser-observation");
  const report = { schema: R75_PROFILE
    ? "mainline-a-r75-web-sky-browser-v662" : R70_WEB_STAGE
    ? "mainline-a-r70-web-sky-browser-v657"
    : "mainline-a-r69-web-sky-browser-v656",
    status: "passed-local-desktop-and-mobile-viewport",
    buildReceipt: BUILD, buildId: build.buildId,
    runtimeBuildId: build.runtimeBuildId,
    appSourceSha256: source.sha256,
    appSourceStableThroughObservation: true,
    desktop, mobileViewport,
    totals: { starCardSelections: desktop.starSelections.length
      + mobileViewport.starSelections.length,
      constellationChartSelections: desktop.constellationSelections.length
        + mobileViewport.constellationSelections.length,
      holdFocusAttemptsAllowed: 0,
      pageErrors: desktop.pageErrors.length
        + mobileViewport.pageErrors.length },
    claims: { physicalMobile: false, realUserValidation: false,
      productionPerformance: false, copyrightApproval: false,
      scientificValidity: false, publicWebReleaseApproved: false } };
  await writeFile(path.join(ROOT, OUTPUT),
    `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify({ status: report.status,
    buildId: report.buildId, totals: report.totals,
    output: OUTPUT }, null, 2));
} finally {
  await browser.close();
}
